#!/usr/bin/env node

// D&D Journal Yjs Sync Server
// Production-ready server for Raspberry Pi deployment

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(chalk.blue(`📁 Created data directory: ${DATA_DIR}`));
}

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'dnd-journal-sync',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    dataDir: DATA_DIR
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  const stats = {
    activeConnections: wss.clients.size,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    dataDirectory: DATA_DIR,
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'D&D Journal Sync Server',
    description: 'Yjs WebSocket sync server for cross-device synchronization',
    endpoints: {
      'GET /health': 'Health check',
      'GET /status': 'Server statistics',
      'GET /api': 'This endpoint',
      'WS /': 'Yjs WebSocket sync endpoint'
    },
    documentation: 'See SYNC_SETUP.md for configuration details'
  });
});

// Root endpoint with helpful info
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>D&D Journal Sync Server</title>
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
          .status { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
          code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>🎲 D&D Journal Sync Server</h1>
        <div class="status">
          <strong>✅ Server Running</strong><br>
          Port: ${PORT}<br>
          Uptime: ${Math.floor(process.uptime())} seconds<br>
          Data Directory: ${DATA_DIR}
        </div>
        
        <h3>WebSocket Endpoint</h3>
        <div class="endpoint">
          <code>ws://${req.get('host')}/</code> - Yjs sync endpoint
        </div>
        
        <h3>API Endpoints</h3>
        <div class="endpoint"><code>GET /health</code> - Health check</div>
        <div class="endpoint"><code>GET /status</code> - Server statistics</div>
        <div class="endpoint"><code>GET /api</code> - API documentation</div>
        
        <h3>Configuration</h3>
        <p>To connect your D&D Journal app:</p>
        <ol>
          <li>Open your app with: <code>?pi=${req.get('host').split(':')[0]}</code></li>
          <li>Or configure manually: <code>yjsSync.configurePiServer('ws://${req.get('host')}')</code></li>
        </ol>
        
        <p><a href="/status">View detailed status →</a></p>
      </body>
    </html>
  `);
});

// Create HTTP server
const server = createServer(app);

// WebSocket setup for Yjs
const WebSocket = require('ws');
const wss = new WebSocket.Server({ 
  server,
  path: '/',
  perMessageDeflate: false 
});

// Enhanced connection handling with logging
wss.on('connection', (ws, req) => {
  const clientInfo = {
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  };
  
  if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
    console.log(chalk.green(`🔗 Client connected from ${clientInfo.ip}`));
    console.log(chalk.gray(`   Total connections: ${wss.clients.size}`));
  }
  
  // Setup Yjs WebSocket connection
  setupWSConnection(ws, req, {
    docName: req.url.slice(1) || 'dnd-journal', // Default doc name
    gc: true // Enable garbage collection
  });
  
  ws.on('close', () => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
      console.log(chalk.yellow(`🔌 Client disconnected from ${clientInfo.ip}`));
      console.log(chalk.gray(`   Total connections: ${wss.clients.size}`));
    }
  });
  
  ws.on('error', (error) => {
    console.error(chalk.red(`❌ WebSocket error from ${clientInfo.ip}:`), error.message);
  });
});

// Enhanced error handling
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(chalk.red(`❌ Port ${PORT} is already in use`));
    console.log(chalk.yellow(`💡 Try: PORT=1235 npm run start`));
  } else {
    console.error(chalk.red('❌ Server error:'), error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
  server.close(() => {
    console.log(chalk.green('✅ Server closed'));
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
  server.close(() => {
    console.log(chalk.green('✅ Server closed'));
    process.exit(0);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(chalk.bold.green('\n🎲 D&D Journal Sync Server Started!'));
  console.log(chalk.cyan(`📡 WebSocket: ws://${HOST}:${PORT}/`));
  console.log(chalk.cyan(`🌐 HTTP: http://${HOST}:${PORT}/`));
  console.log(chalk.gray(`📁 Data: ${DATA_DIR}`));
  console.log(chalk.gray(`📊 Monitoring: http://${HOST}:${PORT}/status`));
  
  // Network discovery hints
  console.log(chalk.yellow('\n💡 Configuration:'));
  console.log(chalk.gray(`   App URL parameter: ?pi=${getLocalIP()}:${PORT}`));
  console.log(chalk.gray(`   Manual config: yjsSync.configurePiServer('ws://${getLocalIP()}:${PORT}')`));
  
  console.log(chalk.green('\n✅ Ready for connections!\n'));
});

// Helper function to get local IP
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}

// Export for testing
module.exports = { app, server };