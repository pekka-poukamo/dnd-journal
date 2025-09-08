#!/usr/bin/env node

// D&D Journal - Simple Yjs Server
// Usage: node server.js [port] [host]

import express from 'express';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import { existsSync, readdirSync } from 'fs';

const isValidRoomName = (input) => /^[\p{Ll}\p{Nd}-]+$/u.test((input || '').toString());

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';

console.log(`🚀 D&D Journal Server starting on ${HOST}:${PORT}`);
console.log(`📁 Data directory: ${DATA_DIR}`);

// Express app for HTTP API
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Room status endpoint
app.get('/sync/room/:roomName/status', (req, res) => {
  const roomName = req.params.roomName.toLowerCase();
  
  if (!isValidRoomName(roomName)) {
    return res.status(400).json({ error: 'Invalid room name' });
  }
  
  const roomPath = `${DATA_DIR}/${roomName}`;
  const exists = existsSync(roomPath) && readdirSync(roomPath).length > 0;
  
  console.log(`📊 Room status check: ${roomName} - exists: ${exists}`);
  res.json({ exists });
});

// Start HTTP server
const server = app.listen(Number(PORT), HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});

// WebSocket server for Yjs sync
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Strip /ws prefix to get clean room name
  if (req.url?.startsWith('/ws/')) {
    req.url = req.url.replace('/ws/', '/');
  }

  console.log(`🔌 WebSocket connection: ${req.url}`);

  setupWSConnection(ws, req, {
    getYDoc: (docName) => {
      const roomName = (docName || '').toString().toLowerCase();
      
      if (!isValidRoomName(roomName)) {
        console.log(`❌ Invalid room name: ${roomName}`);
        throw new Error('Invalid room name');
      }
      
      console.log(`📄 Opening document: ${roomName}`);
      const persistence = new LeveldbPersistence(`${DATA_DIR}/${roomName}`);
      return persistence.doc;
    }
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down');
  process.exit(0);
});