const express = require('express');
const router = express.Router();
const httpProxy = require('http-proxy');
const url = require('url');

// Create proxy server
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: parseInt(process.env.PROXY_TIMEOUT) || 30000,
});

// Proxy statistics
const proxyStats = {
  totalRequests: 0,
  activeConnections: 0,
  bytesTransferred: 0,
  errors: 0
};

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  proxyStats.errors++;
  
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
  }
  res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
});

// Proxy endpoint
router.post('/forward', (req, res) => {
  try {
    const { targetUrl, method = 'GET', headers = {}, body } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid target URL' });
    }

    // Security: Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS protocols are allowed' });
    }

    proxyStats.totalRequests++;
    proxyStats.activeConnections++;

    // Create a proxy request
    const proxyReq = require(parsedUrl.protocol.replace(':', '')).request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        headers: {
          ...headers,
          'Host': parsedUrl.hostname,
          'User-Agent': 'IAM-VPN-Proxy/1.0'
        }
      },
      (proxyRes) => {
        // Set response headers
        res.status(proxyRes.statusCode);
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });

        // Stream the response
        proxyRes.pipe(res);

        proxyRes.on('end', () => {
          proxyStats.activeConnections--;
        });
      }
    );

    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      proxyStats.errors++;
      proxyStats.activeConnections--;
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy request failed', details: error.message });
      }
    });

    // Send body if present
    if (body) {
      proxyReq.write(JSON.stringify(body));
    }

    proxyReq.end();
  } catch (error) {
    console.error('Proxy error:', error);
    proxyStats.activeConnections--;
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
});

// Get proxy statistics
router.get('/stats', (req, res) => {
  res.json(proxyStats);
});

module.exports = router;
