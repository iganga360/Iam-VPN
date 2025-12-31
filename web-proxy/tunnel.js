const WebSocket = require("ws");
const http = require("http");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const PORT = process.env.TUNNEL_PORT || 8080;

// Require JWT_SECRET in production
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is required in production environment");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Create HTTP server for WebSocket
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Track active connections
let activeConnections = 0;

// WebSocket connection handler
wss.on("connection", (socket, req) => {
  activeConnections++;
  const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  
  console.log(`[TUNNEL] New connection from ${clientIP} (Total: ${activeConnections})`);

  // Authentication check (optional)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  
  if (process.env.REQUIRE_AUTH === "true" && !token) {
    socket.close(1008, "Authentication required");
    activeConnections--;
    return;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`[AUTH] Authenticated user: ${decoded.userId}`);
    } catch (err) {
      socket.close(1008, "Invalid token");
      activeConnections--;
      return;
    }
  }

  // Handle incoming messages
  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      console.log(`[TUNNEL] Received: ${message.type || 'unknown'}`);

      // Echo encrypted data back (in production, forward to target)
      if (message.type === "data") {
        socket.send(JSON.stringify({
          type: "response",
          status: "ok",
          data: message.data,
          timestamp: new Date().toISOString()
        }));
      } else if (message.type === "ping") {
        socket.send(JSON.stringify({
          type: "pong",
          timestamp: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error(`[ERROR] Invalid message format: ${err.message}`);
      socket.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
    }
  });

  // Handle connection close
  socket.on("close", (code, reason) => {
    activeConnections--;
    console.log(`[TUNNEL] Connection closed (${code}): ${reason || 'No reason'} (Total: ${activeConnections})`);
  });

  // Handle errors
  socket.on("error", (err) => {
    console.error(`[ERROR] WebSocket error: ${err.message}`);
  });

  // Send welcome message
  socket.send(JSON.stringify({
    type: "connected",
    message: "Tunnel established successfully",
    timestamp: new Date().toISOString()
  }));
});

// Start server
server.listen(PORT, () => {
  console.log(`🔒 WebSocket Tunnel running on port ${PORT}`);
  console.log(`🌐 Connect via: ws://localhost:${PORT}?token=<jwt-token>`);
  console.log(`📊 Active connections: ${activeConnections}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing connections...");
  wss.clients.forEach((client) => {
    client.close(1001, "Server shutting down");
  });
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
