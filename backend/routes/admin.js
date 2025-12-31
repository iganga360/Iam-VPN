const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');

// System statistics
const systemStats = {
  startTime: new Date().toISOString(),
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development'
};

// Get system statistics (admin only)
router.get('/stats', requireAdmin, (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    ...systemStats,
    uptime: {
      seconds: Math.floor(uptime),
      formatted: formatUptime(uptime)
    },
    memory: {
      rss: formatBytes(memoryUsage.rss),
      heapTotal: formatBytes(memoryUsage.heapTotal),
      heapUsed: formatBytes(memoryUsage.heapUsed),
      external: formatBytes(memoryUsage.external)
    },
    platform: process.platform,
    nodeVersion: process.version
  });
});

// Get server configuration (admin only)
router.get('/config', requireAdmin, (req, res) => {
  res.json({
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    sslEnabled: process.env.SSL_ENABLED === 'true',
    maxConnections: process.env.MAX_CONNECTIONS || 100,
    proxyTimeout: process.env.PROXY_TIMEOUT || 30000,
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || 900000,
    rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS || 100
  });
});

// Server health check (admin only)
router.get('/health', requireAdmin, (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = router;
