# 🛡️ Iam-VPN - Free Web-Based VPN & Proxy Service

A comprehensive, production-ready VPN solution featuring web-based proxy, encrypted WebSocket tunneling, and optional WireGuard VPN support.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)

## 🌟 Features

### ✅ PART 1: Web-Based Proxy (Core Feature)
- **HTTP/HTTPS Proxy**: Access blocked websites through your server
- **User-Friendly Interface**: Simple web UI for entering URLs
- **Anonymous Browsing**: Hide your IP address behind the proxy
- **Rate Limiting**: Prevent abuse with built-in rate limiting

### 🔒 PART 2: Secure Tunnel (Encrypted Traffic)
- **WebSocket Tunneling**: Persistent, low-latency encrypted connections
- **Real-Time Communication**: Bi-directional encrypted data flow
- **Connection Management**: Auto-reconnect and heartbeat monitoring

### ⚙️ PART 3: Reverse Proxy (Production Ready)
- **NGINX Configuration**: Professional reverse proxy setup
- **SSL/TLS Termination**: HTTPS encryption with Let's Encrypt
- **Load Balancing**: Distribute traffic efficiently
- **Security Headers**: DNS leak protection, HSTS, CSP

### 🛡️ PART 4: WireGuard VPN (Optional)
- **Industry Standard**: Modern VPN protocol used by Netflix, Cloudflare
- **Cross-Platform**: Windows, Mac, Linux, iOS, Android
- **Configuration Management**: Server and client templates included
- **QR Code Generation**: Easy mobile setup

### 🔐 PART 5: Authentication & Security
- **JWT Authentication**: Secure token-based auth (optional)
- **Rate Limiting**: Prevent abuse and DDoS
- **Helmet.js**: Security headers middleware
- **Logging**: Minimal, abuse-focused logging
- **CORS Support**: Cross-origin resource sharing

### 🚀 PART 6: Deployment Ready
- **PM2 Process Manager**: Production process management
- **Systemd Integration**: Auto-start on boot
- **Docker Support**: Containerized deployment (coming soon)
- **Monitoring**: Built-in health checks

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **NGINX** (for production)
- **Ubuntu 22.04 LTS** (recommended for deployment)
- **Domain name** (for SSL/production)

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/iganga360/Iam-VPN.git
cd Iam-VPN/web-proxy

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start proxy server
npm start

# In another terminal, start tunnel server
npm run tunnel
```

Access the web interface at: `http://localhost:3000`

### Testing the Proxy

```bash
# Via browser
Open http://localhost:3000 and enter a URL

# Via curl
curl "http://localhost:3000/proxy?url=https://example.com"
```

## 📁 Project Structure

```
Iam-VPN/
├── web-proxy/
│   ├── server.js           # Main proxy server
│   ├── tunnel.js           # WebSocket tunnel server
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   └── public/
│       └── index.html      # Web interface
├── nginx.conf              # NGINX reverse proxy config
├── wireguard-server.conf   # WireGuard server template
├── wireguard-client.conf   # WireGuard client template
├── DEPLOYMENT.md           # Detailed deployment guide
├── TERMS_OF_SERVICE.md     # Terms of service template
├── PRIVACY_POLICY.md       # Privacy policy template
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

Edit `web-proxy/.env`:

```env
PORT=3000                    # Proxy server port
TUNNEL_PORT=8080            # WebSocket tunnel port
JWT_SECRET=your-secret-key  # JWT signing key (change in production!)
REQUIRE_AUTH=false          # Enable/disable authentication
NODE_ENV=development        # Environment (development/production)
```

### Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🌐 Production Deployment

### Complete Setup Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production deployment instructions including:

- VPS setup and configuration
- Firewall configuration (UFW)
- SSL certificate installation (Let's Encrypt)
- NGINX reverse proxy setup
- PM2 process management
- WireGuard VPN installation
- Security best practices
- Monitoring and maintenance

### Quick Production Steps

```bash
# 1. Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# 2. Clone and setup
git clone https://github.com/iganga360/Iam-VPN.git /var/www/iam-vpn
cd /var/www/iam-vpn/web-proxy
npm install --production

# 3. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 4. Setup SSL
sudo certbot --nginx -d yourdomain.com

# 5. Configure NGINX
sudo cp ../nginx.conf /etc/nginx/sites-available/iam-vpn
# Edit domain name in config
sudo ln -s /etc/nginx/sites-available/iam-vpn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Start with PM2
npm install -g pm2
pm2 start server.js --name iam-vpn-proxy
pm2 start tunnel.js --name iam-vpn-tunnel
pm2 save
pm2 startup
```

## 🔐 Security Features

- ✅ **HTTPS Encryption**: All traffic encrypted with SSL/TLS
- ✅ **Rate Limiting**: Prevents abuse and DDoS attacks
- ✅ **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- ✅ **JWT Authentication**: Optional token-based authentication
- ✅ **Minimal Logging**: Privacy-focused, abuse detection only
- ✅ **Input Validation**: URL and request validation
- ✅ **DNS Leak Protection**: Configured in NGINX
- ✅ **Firewall Rules**: UFW configuration included

## 📊 API Endpoints

### Proxy Endpoint
```
GET /proxy?url=<target-url>
```

**Parameters:**
- `url` (required): Target URL to proxy

**Headers (optional):**
- `Authorization: Bearer <jwt-token>`

**Response:** Content from target URL

### Authentication
```
POST /auth/token
Content-Type: application/json

{
  "userId": "123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-31T17:00:00.000Z"
}
```

### WebSocket Tunnel
```
ws://localhost:8080?token=<jwt-token>
wss://yourdomain.com/tunnel?token=<jwt-token>
```

**Message Format:**
```json
{
  "type": "data|ping",
  "data": "payload"
}
```

## 🧪 Testing

### Test Proxy Locally
```bash
# Simple test
curl "http://localhost:3000/proxy?url=https://example.com"

# With authentication
TOKEN=$(curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}' | jq -r '.token')

curl "http://localhost:3000/proxy?url=https://example.com" \
  -H "Authorization: Bearer $TOKEN"
```

### Test WebSocket
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => {
  console.log('Connected!');
  ws.send(JSON.stringify({ type: 'ping' }));
};
ws.onmessage = (e) => console.log('Response:', JSON.parse(e.data));
```

## 🛡️ WireGuard VPN Setup

### Server Setup
```bash
# Install WireGuard
sudo apt install wireguard

# Generate keys
wg genkey | tee server_private.key | wg pubkey > server_public.key

# Configure (use template)
sudo cp wireguard-server.conf /etc/wireguard/wg0.conf
sudo nano /etc/wireguard/wg0.conf  # Add your private key

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Start VPN
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### Client Setup
```bash
# Generate client config
cp wireguard-client.conf client.conf
# Edit with server public key and IP

# Generate QR code for mobile
qrencode -t ansiutf8 < client.conf
```

## ⚠️ Legal & Compliance

### Terms of Service
See [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) for complete terms.

**Key Points:**
- No illegal activities
- No copyright infringement
- No malware distribution
- No DDoS attacks
- Respect others' rights

### Privacy Policy
See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for complete policy.

**Data Collection:**
- IP addresses (abuse detection)
- Timestamps
- Requested URLs (minimal logging)
- No content inspection
- No user tracking

### Responsibilities

As a service provider, you **must**:
1. Monitor and prevent abuse
2. Respond to DMCA/legal requests
3. Maintain security logs
4. Comply with local laws
5. Implement abuse detection

## 📈 Monitoring & Logs

### PM2 Monitoring
```bash
pm2 status                          # Check status
pm2 logs iam-vpn-proxy --lines 100  # View logs
pm2 monit                           # Real-time monitoring
```

### NGINX Logs
```bash
sudo tail -f /var/log/nginx/vpn-access.log
sudo tail -f /var/log/nginx/vpn-error.log
```

### WireGuard Status
```bash
sudo wg show                        # Current connections
sudo systemctl status wg-quick@wg0  # Service status
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Proxy returns 500 error:**
- Check target URL is accessible
- Verify network connectivity
- Check server logs: `pm2 logs iam-vpn-proxy`

**WebSocket connection fails:**
- Ensure tunnel server is running: `pm2 status`
- Check firewall allows port 8080
- Verify WebSocket upgrade in NGINX config

**SSL certificate errors:**
- Renew certificate: `sudo certbot renew`
- Check certificate path in NGINX config
- Verify domain DNS points to server

**WireGuard not connecting:**
- Check firewall: `sudo ufw allow 51820/udp`
- Verify keys match in client/server configs
- Check service status: `sudo systemctl status wg-quick@wg0`

### Get Help

- **Issues**: [GitHub Issues](https://github.com/iganga360/Iam-VPN/issues)
- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security**: Report security issues privately

## 🎯 Roadmap

- [ ] Docker and Docker Compose support
- [ ] Web-based admin panel
- [ ] User management system
- [ ] Bandwidth monitoring
- [ ] Multi-server load balancing
- [ ] Automatic WireGuard config generation UI
- [ ] Mobile app integration
- [ ] IPv6 support

## ⭐ Star History

If you find this project useful, please consider giving it a star!

## 📚 Resources

- [WireGuard Official Site](https://www.wireguard.com/)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

**⚖️ Disclaimer:** This software is provided for educational and legitimate purposes only. Users are responsible for complying with all applicable laws and regulations. The authors are not responsible for misuse of this software.

**Made with ❤️ for internet freedom**
