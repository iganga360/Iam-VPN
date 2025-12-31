# 🚀 Deployment Guide for Iam-VPN

This guide covers deploying the Iam-VPN web proxy system on a production VPS.

## 📋 Prerequisites

- Ubuntu 22.04 LTS VPS (DigitalOcean, AWS, Hetzner, etc.)
- Root or sudo access
- Domain name pointed to your server IP
- Basic Linux command line knowledge

## 🔧 Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version
npm --version
nginx -v
```

### 2. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow WireGuard (optional, for Part 4)
sudo ufw allow 51820/udp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 3. Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/iam-vpn
sudo chown $USER:$USER /var/www/iam-vpn

# Clone repository (or upload files)
cd /var/www/iam-vpn
git clone https://github.com/iganga360/Iam-VPN.git .

# Navigate to web-proxy directory
cd web-proxy

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Important**: Change the following in `.env`:
```env
PORT=3000
TUNNEL_PORT=8080
JWT_SECRET=<generate-random-string-here>
REQUIRE_AUTH=false  # Set to true for production if using auth
NODE_ENV=production
```

Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. SSL Certificate Setup

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain SSL certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Start nginx
sudo systemctl start nginx
```

### 5. NGINX Configuration

```bash
# Copy NGINX config
sudo cp /var/www/iam-vpn/nginx.conf /etc/nginx/sites-available/iam-vpn

# Edit the config file
sudo nano /etc/nginx/sites-available/iam-vpn
```

**Replace in the config:**
- `yourdomain.com` with your actual domain
- Verify SSL certificate paths match certbot output

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/iam-vpn /etc/nginx/sites-enabled/

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 6. PM2 Process Manager (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start proxy server
cd /var/www/iam-vpn/web-proxy
pm2 start server.js --name iam-vpn-proxy

# Start tunnel server
pm2 start tunnel.js --name iam-vpn-tunnel

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs

# Monitor processes
pm2 status
pm2 logs
```

### 7. Auto-Renewal for SSL Certificates

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job
# Verify it exists:
sudo systemctl status certbot.timer
```

## 🛡️ WireGuard VPN Setup (Optional - Part 4)

### 1. Install WireGuard

```bash
# Install WireGuard
sudo apt install -y wireguard qrencode

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. Generate Server Keys

```bash
# Create keys directory
sudo mkdir -p /etc/wireguard
cd /etc/wireguard

# Generate server keys
wg genkey | sudo tee server_private.key | wg pubkey | sudo tee server_public.key

# Secure private key
sudo chmod 600 server_private.key
```

### 3. Configure WireGuard Server

```bash
# Copy template
sudo cp /var/www/iam-vpn/wireguard-server.conf /etc/wireguard/wg0.conf

# Edit configuration
sudo nano /etc/wireguard/wg0.conf
```

Replace `SERVER_PRIVATE_KEY_HERE` with content from `server_private.key`.

Check your network interface (usually `eth0` or `ens3`):
```bash
ip route | grep default
```

Update `PostUp` and `PostDown` if your interface isn't `eth0`.

### 4. Start WireGuard

```bash
# Start WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Check status
sudo wg show
sudo systemctl status wg-quick@wg0
```

### 5. Create Client Configuration

```bash
# Generate client keys
cd /etc/wireguard
wg genkey | sudo tee client1_private.key | wg pubkey | sudo tee client1_public.key

# Copy client template
sudo cp /var/www/iam-vpn/wireguard-client.conf client1.conf

# Edit client config
sudo nano client1.conf
```

Replace:
- `CLIENT_PRIVATE_KEY_HERE` with content from `client1_private.key`
- `SERVER_PUBLIC_KEY_HERE` with content from `server_public.key`
- `YOUR_SERVER_IP` with your VPS IP address

### 6. Add Client to Server Config

```bash
# Edit server config
sudo nano /etc/wireguard/wg0.conf
```

Add at the end:
```ini
[Peer]
PublicKey = <content-of-client1_public.key>
AllowedIPs = 10.0.0.2/32
PersistentKeepalive = 25
```

Reload WireGuard:
```bash
sudo systemctl restart wg-quick@wg0
```

### 7. Generate QR Code for Mobile

```bash
sudo qrencode -t ansiutf8 < /etc/wireguard/client1.conf
# Or save as image:
sudo qrencode -o /tmp/client1-qr.png < /etc/wireguard/client1.conf
```

## 📊 Monitoring & Maintenance

### Check Service Status

```bash
# PM2 processes
pm2 status
pm2 logs iam-vpn-proxy --lines 50
pm2 logs iam-vpn-tunnel --lines 50

# NGINX
sudo systemctl status nginx
sudo tail -f /var/log/nginx/vpn-access.log
sudo tail -f /var/log/nginx/vpn-error.log

# WireGuard
sudo wg show
sudo systemctl status wg-quick@wg0
```

### Restart Services

```bash
# Restart proxy
pm2 restart iam-vpn-proxy

# Restart tunnel
pm2 restart iam-vpn-tunnel

# Restart NGINX
sudo systemctl restart nginx

# Restart WireGuard
sudo systemctl restart wg-quick@wg0
```

### Update Application

```bash
cd /var/www/iam-vpn
git pull
cd web-proxy
npm install --production
pm2 restart all
```

## 🔒 Security Best Practices

1. **Change default SSH port**:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to something else
   sudo systemctl restart sshd
   sudo ufw allow <new-port>/tcp
   ```

2. **Disable root login**:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

3. **Install fail2ban**:
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Monitor logs regularly** for abuse

6. **Implement rate limiting** (already configured in NGINX)

## ⚠️ Legal & Compliance

1. **Create Terms of Service** - Define acceptable use
2. **Privacy Policy** - Explain data handling
3. **Abuse Monitoring** - Log suspicious activity
4. **DMCA Compliance** - Handle copyright claims
5. **Local Laws** - Comply with jurisdiction requirements

## 🎯 Testing

### Test Proxy Endpoint

```bash
# From your local machine
curl "https://yourdomain.com/proxy?url=https://example.com"
```

### Test WebSocket Tunnel

Open browser console on `https://yourdomain.com`:
```javascript
const ws = new WebSocket('wss://yourdomain.com/tunnel');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Test WireGuard

1. Import client config to WireGuard app
2. Connect
3. Check IP: `curl https://ifconfig.me`
4. Should show VPS IP, not your real IP

## 📞 Troubleshooting

### Proxy not working
- Check PM2: `pm2 logs iam-vpn-proxy`
- Check NGINX: `sudo nginx -t && sudo systemctl status nginx`
- Check firewall: `sudo ufw status`

### SSL errors
- Verify certificates: `sudo certbot certificates`
- Check NGINX config: paths must match certbot output
- Renew if expired: `sudo certbot renew`

### WireGuard connection fails
- Check firewall: `sudo ufw allow 51820/udp`
- Check service: `sudo systemctl status wg-quick@wg0`
- View logs: `sudo journalctl -u wg-quick@wg0 -f`
- Verify keys are correct in both client and server configs

## ✅ Success!

Your VPN service should now be running at:
- **Web Interface**: https://yourdomain.com
- **Proxy API**: https://yourdomain.com/proxy?url=
- **WebSocket Tunnel**: wss://yourdomain.com/tunnel
- **WireGuard**: Server running on port 51820

---

**Need help?** Check server logs and open an issue on GitHub.
