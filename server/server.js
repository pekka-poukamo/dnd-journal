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
import { existsSync, readdirSync, mkdirSync, writeFileSync, unlinkSync, createReadStream } from 'fs';
import { resolve, dirname, extname } from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import * as Y from 'yjs';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';
const HTTP_PORT = Number(process.env.HTTP_PORT || 80);
const HTTP_HOST = process.env.HTTP_HOST || '0.0.0.0';

// Resolve static root to project root (parent of this server directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const STATIC_ROOT = resolve(__dirname, '..');

// Log startup information
console.log(`🚀 D&D Journal Server: ws://${HOST}:${PORT}`);
console.log(`💾 LevelDB: ${DATA_DIR}`);
console.log(`📁 Data directory exists: ${existsSync(DATA_DIR)}`);
console.log(`🕐 Server started at: ${new Date().toISOString()}`);

// Simple startup check
console.log(`📁 Data directory: ${existsSync(DATA_DIR) ? 'exists' : 'will be created on first document'}`);



const wss = new WebSocketServer({ port: PORT, host: HOST });

// Track active connections and documents
const activeConnections = new Map();
const activeDocuments = new Map();

// Log WebSocket server events
wss.on('connection', (ws, req) => {
  const connectionId = Math.random().toString(36).substr(2, 9);
  const clientIP = req.socket.remoteAddress;
  const url = req.url;
  
  console.log(`🔗 New connection from ${clientIP}`);
  activeConnections.set(connectionId, { ip: clientIP, url, connectedAt: new Date().toISOString() });

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

// Minimal static file server (no frameworks)
const contentTypeByExt = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
};

const sendNotFound = (res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not Found');
};

const sendServerError = (res) => {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Internal Server Error');
};

const httpServer = http.createServer((req, res) => {
  try {
    const url = req.url || '/';
    const rawPath = decodeURIComponent(url.split('?')[0]);
    const requestedPath = rawPath.endsWith('/') ? rawPath + 'index.html' : rawPath;
    const absolutePath = resolve(STATIC_ROOT, '.' + requestedPath);

    // Prevent path traversal outside STATIC_ROOT
    if (!absolutePath.startsWith(STATIC_ROOT)) {
      return sendNotFound(res);
    }

    // Basic existence check and stream response
    if (!existsSync(absolutePath)) {
      return sendNotFound(res);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', contentTypeByExt(absolutePath));
    const stream = createReadStream(absolutePath);
    stream.on('error', () => sendServerError(res));
    stream.pipe(res);
  } catch (_e) {
    return sendServerError(res);
  }
});

const startHttpServer = (portToUse) => {
  httpServer.listen(portToUse, HTTP_HOST, () => {
    console.log(`🌐 HTTP static server: http://${HTTP_HOST}:${portToUse} (root: ${STATIC_ROOT})`);
  });

  httpServer.on('error', (err) => {
    if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && portToUse !== 8080) {
      console.warn(`⚠️  HTTP server on port ${portToUse} failed (${err.code}). Falling back to 8080.`);
      startHttpServer(8080);
    } else {
      console.error('🚨 HTTP server error:', err.message);
    }
  });
};

startHttpServer(HTTP_PORT);


process.on('SIGINT', () => {
  console.log('\n👋 Server stopped');
  process.exit(0);
});