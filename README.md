# 🌐 IAM-VPN - Web-Based VPN, Proxy & Tunnel

A complete web-based VPN, proxy, and encrypted tunnel solution that runs in your browser. Access blocked websites, protect your privacy, and secure your internet traffic.

## 🏗️ Architecture Overview

```
User Browser
     ↓
Web Application (Frontend)
     ↓
Backend Server (Node.js + Express)
     ↓
Proxy / VPN Gateway
     ↓
Internet (Target Websites)
```

## ✨ Features

- ✅ **Web-based Proxy** - Access any website through our secure proxy
- ✅ **Encrypted Tunnel** - WebSocket-based encrypted tunnels (HTTPS/WSS)
- ✅ **Admin Dashboard** - Real-time monitoring and statistics
- ✅ **User Authentication** - Secure JWT-based authentication
- ✅ **Docker Deployment** - Easy deployment with Docker & Docker Compose
- ✅ **Rate Limiting** - Built-in DDoS protection
- ✅ **SSL/TLS Support** - Production-ready HTTPS configuration
- ✅ **Modern UI** - Responsive, dark-themed web interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Docker
- npm or yarn

### Option 1: Local Installation

1. **Clone the repository**
```bash
git clone https://github.com/iganga360/Iam-VPN.git
cd Iam-VPN
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env and change default credentials
```

4. **Start the server**
```bash
npm start
```

5. **Access the application**
```
Open browser: http://localhost:3000
Default login: admin / admin123
```

### Option 2: Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

2. **Check status**
```bash
docker-compose ps
docker-compose logs -f
```

3. **Access the application**
```
Open browser: http://localhost:3000
```

## 📖 Usage Guide

### For Users

1. **Login** - Use your credentials to access the dashboard
2. **Web Proxy** - Enter target URL to browse through proxy
3. **Encrypted Tunnel** - Connect to WebSocket tunnel for real-time communication
4. **Monitor** - View connection statistics and logs

### For Administrators

1. **Admin Dashboard** - Access system statistics and configuration
2. **Monitor Performance** - View memory usage, uptime, and active connections
3. **Manage Settings** - Configure rate limits, timeouts, and SSL

## 🔧 Configuration

### Environment Variables

Edit `.env` file to configure:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security (CHANGE THESE!)
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Proxy Configuration
PROXY_TIMEOUT=30000
MAX_CONNECTIONS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SSL/TLS (Production)
SSL_ENABLED=false
SSL_KEY_PATH=./certs/server.key
SSL_CERT_PATH=./certs/server.crt
```

### SSL/TLS Setup

For production deployment with HTTPS:

1. **Generate SSL certificates**
```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes
```

2. **Update .env**
```env
SSL_ENABLED=true
SSL_KEY_PATH=./certs/server.key
SSL_CERT_PATH=./certs/server.crt
```

3. **Restart server**
```bash
npm start
```

## ☁️ Cloudflare + CDN Setup

### Step 1: DNS Configuration

1. Add your domain to Cloudflare
2. Point your domain to your server IP:
   - Type: A
   - Name: @ (or subdomain)
   - IPv4 address: YOUR_SERVER_IP
   - Proxy status: Proxied (orange cloud)

### Step 2: SSL/TLS Settings

1. In Cloudflare dashboard → SSL/TLS
2. Set encryption mode to "Full" or "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

### Step 3: Optimize Performance

1. **Enable Caching**
   - Page Rules → Create rule
   - URL: `yourdomain.com/css/*` → Cache Level: Cache Everything
   - URL: `yourdomain.com/js/*` → Cache Level: Cache Everything

2. **Enable Compression**
   - Speed → Optimization
   - Enable Auto Minify (JS, CSS, HTML)
   - Enable Brotli

3. **DDoS Protection**
   - Security → Settings
   - Set Security Level to "Medium" or "High"
   - Enable Bot Fight Mode

### Step 4: WebSocket Support

1. Network → WebSockets → ON
2. This enables WebSocket connections for encrypted tunnels

### Step 5: Page Rules for Performance

Create these page rules (in order):

1. `yourdomain.com/api/*`
   - Cache Level: Bypass
   - Disable Performance features

2. `yourdomain.com/*`
   - Browser Cache TTL: 4 hours
   - Cache Level: Standard

## 💰 Monetization Guide

### Legal Monetization Strategies

#### 1. **Freemium Model**
- Free tier: Limited bandwidth (e.g., 1GB/month)
- Premium tier: Unlimited bandwidth ($5-10/month)
- Business tier: Multiple accounts + API access ($20-50/month)

#### 2. **Advertising** (Free Tier Only)
- Display non-intrusive ads on the web interface
- Use ethical ad networks (no tracking)
- Respect user privacy

#### 3. **Enterprise Licensing**
- Self-hosted license for companies
- White-label solutions
- Custom branding and features
- Price: $500-5000/year depending on scale

#### 4. **API Access**
- Sell API credits for developers
- REST API for proxy requests
- WebSocket tunnel API
- Price: $0.01-0.05 per request

#### 5. **Affiliate Marketing**
- Partner with privacy-focused services
- VPN providers, security tools
- Earn commission on referrals

### Legal Considerations

⚠️ **IMPORTANT**: Always comply with local laws

1. **Terms of Service** - Clearly state acceptable use
2. **Privacy Policy** - Explain data handling
3. **DMCA Compliance** - Implement takedown procedure
4. **Data Protection** - Comply with GDPR/CCPA
5. **Age Restrictions** - 18+ or parental consent
6. **Prohibited Uses** - List illegal activities
7. **User Logging** - Minimal logs for abuse prevention

### Payment Integration

Popular options:
- Stripe (Credit cards, worldwide)
- PayPal (Easy integration)
- Cryptocurrency (Privacy-focused users)
- Paddle (Handles VAT/tax)

## 📡 API Documentation

### Authentication

**POST** `/api/auth/login`
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**POST** `/api/auth/register`
```json
{
  "username": "newuser",
  "password": "password123"
}
```

### Proxy

**POST** `/api/proxy/forward`
```json
{
  "targetUrl": "https://example.com",
  "method": "GET",
  "headers": {},
  "body": {}
}
```

**GET** `/api/proxy/stats`
Returns proxy statistics

### Admin (Requires Admin Role)

**GET** `/api/admin/stats` - System statistics
**GET** `/api/admin/config` - Server configuration
**GET** `/api/admin/health` - Health check

### WebSocket Tunnel

**Connect**: `ws://localhost:3000/ws` or `wss://yourdomain.com/ws`

**Messages**:
```json
// Ping
{ "type": "ping", "timestamp": 1234567890 }

// Tunnel Request
{ "type": "tunnel_request", "target": "example.com" }
```

## 🔒 Security Best Practices

1. **Change Default Credentials** immediately
2. **Use Strong JWT Secret** (64+ random characters)
3. **Enable HTTPS** in production
4. **Use Cloudflare** for DDoS protection
5. **Regular Updates** - Keep dependencies updated
6. **Rate Limiting** - Prevent abuse
7. **Input Validation** - All user inputs sanitized
8. **Secure Headers** - Helmet.js configured
9. **No Logging** - Don't log user traffic
10. **Regular Audits** - Security reviews

## 🛠️ Development

### Project Structure

```
Iam-VPN/
├── backend/
│   ├── server.js           # Main server file
│   ├── routes/
│   │   ├── auth.js         # Authentication routes
│   │   ├── proxy.js        # Proxy routes
│   │   └── admin.js        # Admin routes
│   └── middleware/
│       └── auth.js         # Auth middleware
├── frontend/
│   └── public/
│       ├── index.html      # Main HTML
│       ├── css/
│       │   └── style.css   # Styles
│       └── js/
│           └── app.js      # Frontend logic
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose
├── package.json           # Dependencies
└── .env.example           # Environment template
```

### Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run build          # Build frontend (if applicable)
npm run docker:build   # Build Docker image
npm run docker:up      # Start Docker containers
npm run docker:down    # Stop Docker containers
```

## 📊 Performance Optimization

1. **CDN** - Use Cloudflare for static assets
2. **Compression** - Gzip/Brotli enabled
3. **Caching** - HTTP caching headers
4. **Connection Pooling** - Reuse HTTP connections
5. **Load Balancing** - Multiple instances with nginx
6. **Database** - Add Redis for session storage (optional)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Commit your changes
4. Push to the branch
5. Create Pull Request

## 📄 License

MIT License - See LICENSE file for details

## ⚠️ Disclaimer

This software is provided for educational and legitimate purposes only. Users are responsible for ensuring their use complies with all applicable laws and regulations. The developers assume no liability for misuse.

## 🆘 Support

- Issues: [GitHub Issues](https://github.com/iganga360/Iam-VPN/issues)
- Documentation: This README
- Email: support@yourdomain.com (update this)

## 🎯 Roadmap

- [ ] User management system
- [ ] Traffic analytics dashboard
- [ ] Multiple server locations
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] WireGuard VPN integration
- [ ] Payment integration
- [ ] Multi-language support

## 🙏 Acknowledgments

Built with:
- Express.js
- WebSocket (ws)
- http-proxy
- bcryptjs
- jsonwebtoken
- Docker

---

**Made with ❤️ for internet freedom and privacy**
