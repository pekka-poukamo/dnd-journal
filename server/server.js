#!/usr/bin/env node

// D&D Journal - Simple Yjs Server with y-leveldb
// Usage: node server.js [port] [host]
//
// NOTE: You may see a warning "Yjs was already imported" on startup.
// This is expected and harmless - it occurs because y-leveldb and y-websocket
// both have internal Yjs imports. Server functionality is not affected.

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import { existsSync, readdirSync, statSync } from 'fs';
import { createServer } from 'http';
import { parse } from 'url';
import * as Y from 'yjs';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';

// Log startup information
console.log(`🚀 D&D Journal Server: http/ws://${HOST}:${PORT}`);
console.log(`💾 LevelDB: ${DATA_DIR}`);
console.log(`📁 Data directory exists: ${existsSync(DATA_DIR)}`);
console.log(`🕐 Server started at: ${new Date().toISOString()}`);

// Simple startup check
console.log(`📁 Data directory: ${existsSync(DATA_DIR) ? 'exists' : 'will be created on first document'}`);

// HTTP server for minimal API endpoints
const httpServer = createServer((req, res) => {
  try {
    const { pathname } = parse(req.url || '', true);
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // AI status endpoint: GET /ai/status
    if (req.method === 'GET' && pathname === '/ai/status') {
      const enabled = Boolean(process.env.OPENAI_API_KEY);
      const model = process.env.OPENAI_MODEL || 'gpt-4.1';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ enabled, model }));
      return;
    }

    // AI chat proxy: POST /ai/chat
    if (req.method === 'POST' && pathname === '/ai/chat') {
      const enabled = Boolean(process.env.OPENAI_API_KEY);
      if (!enabled) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'AI not configured', enabled: false }));
        return;
      }

      let raw = '';
      req.on('data', (chunk) => { raw += chunk; });
      req.on('end', async () => {
        try {
          const body = raw ? JSON.parse(raw) : {};
          const messages = Array.isArray(body.messages) ? body.messages : [];
          if (!messages.length) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'messages[] required' }));
            return;
          }

          const model = body.model || process.env.OPENAI_MODEL || 'gpt-4.1';
          const temperature = typeof body.temperature === 'number' ? Math.max(0, Math.min(2, body.temperature)) : 0.8;
          const max_tokens = typeof body.max_tokens === 'number' ? body.max_tokens : 2500;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, messages, temperature, max_tokens })
          });

          if (!response.ok) {
            let errMsg = `HTTP ${response.status}`;
            try {
              const errData = await response.json();
              errMsg = errData.error?.message || errMsg;
            } catch {}
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errMsg }));
            return;
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content?.trim() || '';
          const usage = data.usage || null;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ content, model, usage }));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'AI proxy error' }));
        }
      });
      return;
    }

    // Room status endpoint: GET /sync/room/:name/status
    if (req.method === 'GET' && pathname && pathname.startsWith('/sync/room/') && pathname.endsWith('/status')) {
      const parts = pathname.split('/').filter(Boolean); // ['sync','room',':name','status']
      const roomName = decodeURIComponent(parts[2] || '');
      const roomPath = DATA_DIR + '/' + roomName;
      let exists = false;
      try {
        if (existsSync(roomPath)) {
          const contents = readdirSync(roomPath);
          exists = Array.isArray(contents) && contents.length > 0;
        }
      } catch (e) {
        exists = false;
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ exists }));
      return;
    }

    // Default 404
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server error' }));
  }
});

httpServer.listen(Number(PORT), HOST);

// Accept WebSocket connections (all paths). We normalize '/ws/<room>' to '/<room>' below
const wss = new WebSocketServer({ server: httpServer });

// Track active connections and documents
const activeConnections = new Map();
const activeDocuments = new Map();

// Log WebSocket server events
wss.on('connection', (ws, req) => {
  const connectionId = Math.random().toString(36).substr(2, 9);
  
  // Get real client IP, handling proxy headers
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] || // Cloudflare
                   req.socket.remoteAddress;
  
  let url = req.url;
  // Normalize URL so that connections made to '/ws/<room>' are treated as '/<room>'
  // This keeps document names consistent regardless of whether the client uses a '/ws' base path
  try {
    if (url && url.startsWith('/ws/')) {
      req.url = url.replace(/^\/ws\//, '/');
      url = req.url;
    }
  } catch {}
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  console.log(`🔗 New connection from ${clientIP} (${req.socket.remoteAddress}) - ${userAgent.substring(0, 50)}...`);
  activeConnections.set(connectionId, { ip: clientIP, url, userAgent, connectedAt: new Date().toISOString() });

  setupWSConnection(ws, req, {
    getYDoc: (docName) => {
      if (!activeDocuments.has(docName)) {
        console.log(`📄 New document: "${docName}"`);
        activeDocuments.set(docName, {
          createdAt: new Date().toISOString(),
          connections: new Set([connectionId])
        });
      }
      activeDocuments.get(docName).connections.add(connectionId);
      
      const persistence = new LeveldbPersistence(DATA_DIR + '/' + docName);
      return persistence.doc;
    }
  });

  ws.on('close', () => {
    activeConnections.delete(connectionId);
    
    // Remove connection from documents
    for (const [docName, docInfo] of activeDocuments.entries()) {
      if (docInfo.connections.has(connectionId)) {
        docInfo.connections.delete(connectionId);
      }
    }
  });
});

// Log server errors
wss.on('error', (error) => {
  console.error('🚨 WebSocket server error:', error.message);
});



process.on('SIGINT', () => {
  console.log('\n👋 Server stopped');
  process.exit(0);
});