const express = require("express");
const axios = require("axios");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

app.use("/proxy", limiter);

// Authentication middleware (optional for free tier)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token && process.env.REQUIRE_AUTH === "true") {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  } else {
    next();
  }
};

// Generate JWT token (for demo purposes)
app.post("/auth/token", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "1h"
  });

  res.json({ token });
});

// Main proxy endpoint
app.get("/proxy", authenticateToken, async (req, res) => {
  const target = req.query.url;
  
  if (!target) {
    return res.status(400).json({ error: "URL required" });
  }

  // Validate URL
  try {
    new URL(target);
  } catch (err) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  // Log request (minimal, for abuse detection)
  console.log(`[PROXY] ${new Date().toISOString()} - ${req.ip} - ${target}`);

  try {
    const response = await axios.get(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });

    // Set appropriate headers
    res.set("X-Proxied-By", "Iam-VPN");
    res.set("Content-Type", response.headers["content-type"] || "text/html");
    
    res.send(response.data);
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request timeout" });
    }
    
    res.status(500).json({ 
      error: "Failed to fetch URL. Site may be blocked or unreachable.",
      details: err.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/proxy?url=<target>`);
  console.log(`🔐 JWT Auth: ${process.env.REQUIRE_AUTH === "true" ? "Enabled" : "Optional"}`);
});
