#!/usr/bin/env node

// D&D Journal - Simple Yjs Server
// Usage: node server.js [port] [host]

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import { existsSync, readdirSync } from 'fs';
import { createServer } from 'http';
import { parse } from 'url';

const isValidRoomName = (input) => /^[\p{Ll}\p{Nd}-]+$/u.test((input || '').toString());

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';

console.log(`D&D Journal Server: http/ws://${HOST}:${PORT}`);

// HTTP server for room status endpoint
const httpServer = createServer((req, res) => {
  const { pathname } = parse(req.url || '', true);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Room status: GET /sync/room/:name/status
  if (req.method === 'GET' && pathname?.startsWith('/sync/room/') && pathname.endsWith('/status')) {
    const roomName = pathname.split('/')[3]?.toLowerCase();
    
    if (!isValidRoomName(roomName)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid room name' }));
      return;
    }
    
    const roomPath = `${DATA_DIR}/${roomName}`;
    const exists = existsSync(roomPath) && readdirSync(roomPath).length > 0;
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ exists }));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(Number(PORT), HOST);

// WebSocket server for Yjs sync
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  // Strip /ws prefix from URL to get clean room name
  if (req.url?.startsWith('/ws/')) {
    req.url = req.url.replace('/ws/', '/');
  }

  setupWSConnection(ws, req, {
    getYDoc: (docName) => {
      const normalizedDocName = (docName || '').toString().toLowerCase();
      
      if (!isValidRoomName(normalizedDocName)) {
        throw new Error('Invalid room name');
      }
      
      const persistence = new LeveldbPersistence(`${DATA_DIR}/${normalizedDocName}`);
      return persistence.doc;
    }
  });
});

process.on('SIGINT', () => {
  console.log('\nServer stopped');
  process.exit(0);
});