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
console.log(`📁 Data directory exists: ${existsSync(DATA_DIR)}`);
console.log(`🕐 Server started at: ${new Date().toISOString()}`);

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
  console.log(`✅ HTTP server running at http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket server ready at ws://${HOST}:${PORT}/ws`);
});

// WebSocket server for Yjs sync
const wss = new WebSocketServer({ server });

wss.on('error', (error) => {
  console.error('🚨 WebSocket server error:', error.message);
});

wss.on('connection', (ws, req) => {
  // Get client info for logging
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.headers['cf-connecting-ip'] ||
                   req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // Strip /ws prefix to get clean room name
  let originalUrl = req.url;
  if (req.url?.startsWith('/ws/')) {
    req.url = req.url.replace('/ws/', '/');
  }
  
  // Extract room name from URL
  const roomName = req.url?.split('/')[1] || 'unknown';
  
  console.log(`🔌 WebSocket connection from ${clientIP}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 80)}${userAgent.length > 80 ? '...' : ''}`);
  console.log(`   Original URL: ${originalUrl} → Normalized: ${req.url}`);
  console.log(`   Target room: "${roomName}"`);

  setupWSConnection(ws, req, {
    getYDoc: (docName) => {
      const normalizedRoomName = (docName || '').toString().toLowerCase();
      
      if (!isValidRoomName(normalizedRoomName)) {
        console.log(`❌ Invalid room name rejected: "${normalizedRoomName}" from ${clientIP}`);
        throw new Error('Invalid room name');
      }
      
      const persistencePath = `${DATA_DIR}/${normalizedRoomName}`;
      console.log(`📄 Creating LevelDB persistence for room: "${normalizedRoomName}"`);
      console.log(`   Client: ${clientIP}`);
      console.log(`   Persistence path: ${persistencePath}`);
      
      const persistence = new LeveldbPersistence(persistencePath);
      
      // Log when document is ready
      persistence.doc.on('update', () => {
        console.log(`💾 Document updated in room: "${normalizedRoomName}"`);
      });
      
      return persistence.doc;
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket disconnected: ${clientIP} from room "${roomName}"`);
    console.log(`   Close code: ${code}, reason: ${reason || 'none'}`);
  });
  
  ws.on('error', (error) => {
    console.error(`🚨 WebSocket error for ${clientIP} in room "${roomName}":`, error.message);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 Server shutting down');
  process.exit(0);
});