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
import { existsSync, readdirSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import * as Y from 'yjs';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';

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
  
  // Get real client IP, handling proxy headers
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] || // Cloudflare
                   req.socket.remoteAddress;
  
  const url = req.url;
  
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