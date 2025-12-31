# 🚀 Deployment Guide

This guide covers various deployment options for IAM-VPN.

## Table of Contents
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Production Checklist](#production-checklist)

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

1. **Install dependencies**
```bash
npm install
```

2. **Copy environment file**
```bash
cp .env.example .env
```

3. **Configure environment variables**
Edit `.env` and update:
- `JWT_SECRET` - Use a strong random string
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` - Your admin credentials

4. **Start development server**
```bash
npm run dev
```

5. **Access application**
```
http://localhost:3000
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start**
```bash
docker-compose up -d
```

2. **View logs**
```bash
docker-compose logs -f
```

3. **Stop containers**
```bash
docker-compose down
```

### Using Docker only

1. **Build image**
```bash
docker build -t iam-vpn:latest .
```

2. **Run container**
```bash
docker run -d \
  --name iam-vpn \
  -p 3000:3000 \
  --env-file .env \
  iam-vpn:latest
```

## Cloud Deployment

### AWS EC2

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.small or larger
   - Security group: Allow ports 22, 80, 443, 3000

2. **Install Docker**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

3. **Clone and deploy**
```bash
git clone https://github.com/iganga360/Iam-VPN.git
cd Iam-VPN
cp .env.example .env
nano .env  # Edit configuration
sudo docker-compose up -d
```

4. **Setup nginx reverse proxy**
```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/iam-vpn
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/iam-vpn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Install SSL certificate**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### DigitalOcean Droplet

1. **Create Droplet**
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month or higher)
   - Add SSH key

2. **Follow AWS EC2 steps** (same process)

### Google Cloud Platform

1. **Create VM Instance**
   - Machine type: e2-small or larger
   - Boot disk: Ubuntu 22.04 LTS
   - Firewall: Allow HTTP, HTTPS

2. **Follow AWS EC2 steps** (same process)

### Heroku

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Create app**
```bash
heroku create your-app-name
```

3. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-password
```

4. **Deploy**
```bash
git push heroku main
```

### Railway

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Initialize and deploy**
```bash
railway login
railway init
railway up
```

3. **Add environment variables** in Railway dashboard

### Render

1. **Create account** at render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add environment variables** in settings
5. **Deploy**

## Production Checklist

### Security
- [ ] Change default admin credentials
- [ ] Use strong JWT_SECRET (64+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW or cloud firewall)
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Implement logging (optional)

### Performance
- [ ] Use reverse proxy (nginx)
- [ ] Enable compression (gzip/brotli)
- [ ] Setup CDN (Cloudflare)
- [ ] Configure caching
- [ ] Monitor resource usage
- [ ] Setup auto-scaling (if needed)

### Monitoring
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Setup log aggregation (optional)
- [ ] Monitor disk space
- [ ] Setup alerts

### Backup
- [ ] Regular database backups (if using DB)
- [ ] Configuration backups
- [ ] Automated backup scripts
- [ ] Test restore procedures

### Documentation
- [ ] Update README with your domain
- [ ] Document custom configurations
- [ ] Create runbooks for common issues
- [ ] Document deployment process

## Scaling

### Horizontal Scaling

1. **Setup load balancer** (nginx, HAProxy, or cloud LB)

```nginx
upstream iam_vpn_backend {
    least_conn;
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://iam_vpn_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. **Deploy multiple instances**
3. **Share session state** (use Redis)

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize Node.js memory usage
- Use PM2 for process management

```bash
npm install -g pm2
pm2 start backend/server.js -i max
pm2 save
pm2 startup
```

## Troubleshooting

### Container won't start
```bash
docker-compose logs
docker-compose down
docker-compose up -d
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :3000
# Kill process
sudo kill -9 <PID>
```

### WebSocket connection fails
- Check reverse proxy WebSocket configuration
- Verify firewall allows WebSocket connections
- Check SSL/TLS configuration for WSS

### High memory usage
- Check for memory leaks in logs
- Restart containers: `docker-compose restart`
- Increase container memory limit

## Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Review documentation
- Open GitHub issue
- Contact support

---

**Next**: See [MONETIZATION.md](MONETIZATION.md) for monetization strategies
