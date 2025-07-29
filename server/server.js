#!/usr/bin/env node

// D&D Journal - Simple Yjs Server with y-leveldb
// Usage: node server.js [port] [host]

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || 'localhost';
const DATA_DIR = process.env.DATA_DIR || './data';

const wss = new WebSocketServer({ port: PORT, host: HOST });

console.log(`🚀 D&D Journal Server: ws://${HOST}:${PORT}`);
console.log(`💾 LevelDB: ${DATA_DIR}`);

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, {
    getYDoc: (docName) => {
      const persistence = new LeveldbPersistence(DATA_DIR + '/' + docName);
      return persistence.doc;
    }
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 Server stopped');
  process.exit(0);
});