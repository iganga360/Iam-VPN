# ☁️ Cloudflare + CDN Setup Guide

Complete guide to setting up Cloudflare CDN and optimization for IAM-VPN.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [DNS Configuration](#dns-configuration)
- [SSL/TLS Configuration](#ssl-tlsconfiguration)
- [Performance Optimization](#performance-optimization)
- [Security Settings](#security-settings)
- [WebSocket Configuration](#websocket-configuration)
- [Page Rules](#page-rules)
- [Workers (Advanced)](#workers-advanced)
- [Analytics](#analytics)

## Prerequisites

- [ ] Domain name
- [ ] Cloudflare account (free tier works)
- [ ] Server with public IP address
- [ ] IAM-VPN deployed and running

## Initial Setup

### Step 1: Add Your Domain

1. **Log in to Cloudflare**
   - Go to https://dash.cloudflare.com
   - Click "Add a Site"

2. **Enter your domain**
   - Example: `yourdomain.com`
   - Click "Add Site"

3. **Choose a plan**
   - Free plan is sufficient to start
   - Pro plan ($20/mo) for advanced features
   - Click "Continue"

4. **Review DNS records**
   - Cloudflare auto-detects existing DNS records
   - Verify they're correct
   - Click "Continue"

5. **Update nameservers**
   - Copy the Cloudflare nameservers (e.g., `ns1.cloudflare.com`)
   - Log in to your domain registrar
   - Replace existing nameservers with Cloudflare's
   - Wait for propagation (can take up to 24 hours)

6. **Verify activation**
   - Check email from Cloudflare
   - Or check dashboard for "Active" status

## DNS Configuration

### Basic DNS Records

Add these DNS records in Cloudflare dashboard:

1. **Root domain (A record)**
```
Type: A
Name: @ (or yourdomain.com)
IPv4 address: YOUR_SERVER_IP
Proxy status: Proxied (orange cloud icon)
TTL: Auto
```

2. **WWW subdomain (CNAME)**
```
Type: CNAME
Name: www
Target: yourdomain.com
Proxy status: Proxied
TTL: Auto
```

3. **API subdomain (optional)**
```
Type: CNAME
Name: api
Target: yourdomain.com
Proxy status: Proxied
TTL: Auto
```

### Proxy Status

**Proxied (Orange Cloud):**
- ✅ Traffic goes through Cloudflare
- ✅ DDoS protection enabled
- ✅ CDN caching enabled
- ✅ SSL/TLS encryption
- ❌ Shows Cloudflare IP (not your server)

**DNS Only (Gray Cloud):**
- ✅ Shows your server IP
- ❌ No Cloudflare protection
- ❌ No caching

**Recommendation:** Use Proxied (orange) for production

## SSL/TLS Configuration

### Step 1: Choose Encryption Mode

Navigate to **SSL/TLS** → **Overview**

**Choose encryption mode:**

1. **Off** - ❌ Not recommended
   - No encryption
   - Insecure

2. **Flexible** - ⚠️ Not recommended
   - Encrypts: Visitor → Cloudflare
   - Not encrypted: Cloudflare → Server
   - Vulnerable to attacks

3. **Full** - ✅ Good
   - Encrypts end-to-end
   - Uses self-signed cert on server
   - Recommended for development

4. **Full (Strict)** - ✅✅ Best
   - Encrypts end-to-end
   - Requires valid SSL cert on server
   - Recommended for production

**Select:** Full (Strict) for production

### Step 2: Enable Additional SSL Features

Navigate to **SSL/TLS** → **Edge Certificates**

Enable these features:

```
☑ Always Use HTTPS
  → Redirects all HTTP to HTTPS

☑ Automatic HTTPS Rewrites
  → Fixes mixed content issues

☑ Certificate Transparency Monitoring
  → Monitors SSL certificates

☑ Disable Universal SSL (optional)
  → Only if using custom certificates
```

**Minimum TLS Version:** TLS 1.2 or higher

### Step 3: Setup Origin Certificates (Recommended)

1. Go to **SSL/TLS** → **Origin Server**
2. Click "Create Certificate"
3. Choose:
   - Let Cloudflare generate private key
   - Hostnames: `yourdomain.com`, `*.yourdomain.com`
   - Certificate Validity: 15 years
4. Click "Create"
5. **Save the certificate and private key**

On your server:
```bash
# Create certs directory
mkdir -p /home/runner/work/Iam-VPN/Iam-VPN/certs

# Save certificate
nano /home/runner/work/Iam-VPN/Iam-VPN/certs/server.crt
# Paste Origin Certificate

# Save private key
nano /home/runner/work/Iam-VPN/Iam-VPN/certs/server.key
# Paste Private Key

# Set permissions
chmod 600 /home/runner/work/Iam-VPN/Iam-VPN/certs/server.key
```

Update `.env`:
```env
SSL_ENABLED=true
SSL_KEY_PATH=./certs/server.key
SSL_CERT_PATH=./certs/server.crt
```

Restart server:
```bash
docker-compose restart
```

## Performance Optimization

### Step 1: Enable Caching

Navigate to **Caching** → **Configuration**

**Caching Level:** Standard or Aggressive

**Browser Cache TTL:**
```
Respect Existing Headers (recommended)
or
4 hours
```

### Step 2: Auto Minify

Navigate to **Speed** → **Optimization**

Enable Auto Minify:
```
☑ JavaScript
☑ CSS
☑ HTML
```

### Step 3: Brotli Compression

Navigate to **Speed** → **Optimization**

```
☑ Brotli
```

Brotli provides better compression than gzip.

### Step 4: Rocket Loader (Optional)

Navigate to **Speed** → **Optimization**

```
☑ Rocket Loader
```

**Warning:** May break some JavaScript. Test thoroughly.

### Step 5: HTTP/3 (QUIC)

Navigate to **Network**

```
☑ HTTP/3 (with QUIC)
```

Faster connection establishment.

### Step 6: Early Hints

Navigate to **Network**

```
☑ Early Hints
```

Faster page loads by sending headers early.

## Security Settings

### Step 1: Security Level

Navigate to **Security** → **Settings**

**Security Level:** Medium (recommended)

Options:
- Low: Minimal challenges
- Medium: Balanced
- High: Aggressive (may affect legitimate users)
- I'm Under Attack: Maximum protection

### Step 2: Bot Fight Mode

Navigate to **Security** → **Bots**

```
☑ Bot Fight Mode (Free plan)
or
☑ Super Bot Fight Mode (Paid plans)
```

Blocks malicious bots automatically.

### Step 3: Challenge Passage

Navigate to **Security** → **Settings**

**Challenge Passage:** 30 minutes

How long to remember a passed challenge.

### Step 4: Privacy Pass Support

```
☑ Privacy Pass Support
```

Allows users to prove humanity without CAPTCHA.

### Step 5: Firewall Rules

Navigate to **Security** → **WAF**

Create rules to block:

**Block specific countries:**
```
(ip.geoip.country in {"CN" "RU" "KP"})
Action: Block
```

**Block specific user agents:**
```
(http.user_agent contains "bot")
Action: Challenge
```

**Rate limiting (Pro plan):**
```
(http.request.uri.path eq "/api/proxy/forward")
Rate: 100 requests per minute
Action: Block
```

## WebSocket Configuration

### Enable WebSockets

Navigate to **Network**

```
☑ WebSockets
```

**IMPORTANT:** Required for the tunnel feature!

### Test WebSocket Connection

```javascript
// In browser console
const ws = new WebSocket('wss://yourdomain.com/ws');
ws.onopen = () => console.log('Connected!');
ws.onerror = (err) => console.error('Error:', err);
```

## Page Rules

Navigate to **Rules** → **Page Rules**

### Rule 1: Cache Static Assets

**URL:** `yourdomain.com/css/*`, `yourdomain.com/js/*`

Settings:
```
Cache Level: Cache Everything
Edge Cache TTL: 1 month
Browser Cache TTL: 4 hours
```

### Rule 2: Bypass API Caching

**URL:** `yourdomain.com/api/*`

Settings:
```
Cache Level: Bypass
Disable Performance features
Disable Apps
```

### Rule 3: Forward WWW to Root

**URL:** `www.yourdomain.com/*`

Settings:
```
Forwarding URL: 301 Permanent Redirect
Destination URL: https://yourdomain.com/$1
```

### Rule 4: Force HTTPS

**URL:** `http://yourdomain.com/*`

Settings:
```
Always Use HTTPS: On
```

### Example Page Rules Order

Free plan: 3 page rules
Priority order (top to bottom):

1. `yourdomain.com/api/*` - Bypass caching
2. `yourdomain.com/css/*` - Cache Everything
3. `*yourdomain.com/*` - Always Use HTTPS

## Workers (Advanced)

Cloudflare Workers allow custom logic at the edge.

### Example: Add Security Headers

Navigate to **Workers** → **Manage Workers**

Create a new worker:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newHeaders = new Headers(response.headers)
  
  // Add security headers
  newHeaders.set('X-Frame-Options', 'DENY')
  newHeaders.set('X-Content-Type-Options', 'nosniff')
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
```

Deploy and add route:
```
Route: yourdomain.com/*
Worker: security-headers
```

### Example: API Rate Limiting

```javascript
const RATE_LIMIT = 100 // requests per minute

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const ip = request.headers.get('CF-Connecting-IP')
  const key = `ratelimit:${ip}`
  
  // Check rate limit (requires Workers KV)
  const count = await RATE_LIMIT_KV.get(key)
  
  if (count && parseInt(count) > RATE_LIMIT) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  
  // Increment counter
  const newCount = (parseInt(count) || 0) + 1
  await RATE_LIMIT_KV.put(key, newCount.toString(), { expirationTtl: 60 })
  
  return fetch(request)
}
```

## Analytics

### Cloudflare Analytics

Navigate to **Analytics** → **Traffic**

Monitor:
- Total requests
- Bandwidth saved
- Cache hit ratio
- Status codes
- Top countries
- Top content

### Web Analytics (Free)

Navigate to **Analytics** → **Web Analytics**

Enable Cloudflare Web Analytics:
```
☑ Enable Analytics
```

Add tracking script to your HTML:
```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

Privacy-friendly analytics without cookies!

## Advanced Configuration

### Transform Rules

Navigate to **Rules** → **Transform Rules**

**Modify Request Headers:**
```
Rule: Add X-Forwarded-Proto header
If: All incoming requests
Then: Set header - X-Forwarded-Proto: https
```

**Modify Response Headers:**
```
Rule: Add security headers
If: All incoming requests
Then: Set header - Content-Security-Policy: default-src 'self'
```

### Origin Rules

Navigate to **Rules** → **Origin Rules**

Override origin settings based on URL patterns.

### Custom Error Pages

Navigate to **Custom Pages**

Customize error pages:
- 500 errors
- 1000 errors (DNS resolution)
- Always Online

## Testing

### 1. SSL Test

```bash
# Test SSL
curl -I https://yourdomain.com

# Check certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 2. Speed Test

Use tools:
- GTmetrix: https://gtmetrix.com
- WebPageTest: https://webpagetest.org
- Pingdom: https://tools.pingdom.com

### 3. Security Test

- SSL Labs: https://ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com
- Mozilla Observatory: https://observatory.mozilla.org

### 4. WebSocket Test

```javascript
const ws = new WebSocket('wss://yourdomain.com/ws');
ws.onopen = () => console.log('✅ WebSocket working!');
ws.onerror = (e) => console.error('❌ WebSocket failed:', e);
```

## Troubleshooting

### Issue: Too Many Redirects

**Solution:**
1. Check SSL/TLS encryption mode
2. Ensure server isn't forcing HTTPS redirect
3. Disable "Always Use HTTPS" temporarily

### Issue: WebSocket Connection Failed

**Solution:**
1. Enable WebSockets in Network settings
2. Check server WebSocket configuration
3. Verify no firewall blocking port

### Issue: Slow Performance

**Solution:**
1. Enable caching for static assets
2. Enable Brotli compression
3. Use Page Rules for optimization
4. Check cache hit ratio in Analytics

### Issue: 520 Error

**Solution:**
1. Check if origin server is running
2. Verify firewall allows Cloudflare IPs
3. Check origin server logs

### Issue: 522 Error (Connection Timed Out)

**Solution:**
1. Verify origin server is accessible
2. Check firewall settings
3. Increase timeout on origin server

## Monitoring

### Set Up Notifications

Navigate to **Notifications**

Create alerts for:
- [ ] SSL/TLS certificate expiration
- [ ] Origin server downtime
- [ ] Traffic anomalies
- [ ] DDoS attacks

### Cloudflare IPs

Allow these IP ranges in your firewall:

**IPv4:**
```
173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22
```

Get latest list: https://cloudflare.com/ips/

## Best Practices

1. ✅ Always use "Full (Strict)" SSL mode
2. ✅ Enable HTTP/3 and Brotli
3. ✅ Set up Page Rules for caching
4. ✅ Enable Bot Fight Mode
5. ✅ Use Origin Certificates
6. ✅ Monitor analytics regularly
7. ✅ Set up notifications
8. ✅ Test WebSocket connections
9. ✅ Use Workers for advanced logic
10. ✅ Keep Cloudflare features updated

## Cost Optimization

**Free Plan Includes:**
- Unlimited DDoS protection
- Global CDN
- Free SSL certificate
- 3 Page Rules
- Basic analytics
- Firewall rules

**When to Upgrade:**

**Pro Plan ($20/month):**
- 20 Page Rules
- Advanced DDoS
- Image optimization
- Mobile optimization

**Business Plan ($200/month):**
- 50 Page Rules
- Custom SSL
- Advanced rate limiting
- 100% uptime SLA

## Resources

- Cloudflare Docs: https://developers.cloudflare.com
- Community Forum: https://community.cloudflare.com
- Status Page: https://cloudflarestatus.com
- Support: https://support.cloudflare.com

---

**Next Steps:**
1. Complete this Cloudflare setup
2. Test all features thoroughly
3. Monitor performance and security
4. Optimize based on analytics

**Questions?** Check the Cloudflare community forum or open a GitHub issue.
