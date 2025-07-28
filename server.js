#!/usr/bin/env node

// D&D Journal - Simple Yjs Server with File Persistence
// Usage: node server.js [port] [host]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import * as Y from 'yjs';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || 'localhost';
const PERSIST_DIR = './data';

// Ensure data directory exists
if (!existsSync(PERSIST_DIR)) {
  mkdirSync(PERSIST_DIR, { recursive: true });
}

// Document storage
const docs = new Map();

// Load document from disk
const loadDoc = (docName) => {
  const filePath = `${PERSIST_DIR}/${docName}.yjs`;
  if (existsSync(filePath)) {
    const data = readFileSync(filePath);
    return Y.applyUpdate(new Y.Doc(), data);
  }
  return new Y.Doc();
};

// Save document to disk
const saveDoc = (docName, doc) => {
  const filePath = `${PERSIST_DIR}/${docName}.yjs`;
  const update = Y.encodeStateAsUpdate(doc);
  writeFileSync(filePath, update);
};

// Get or create document
const getDoc = (docName) => {
  if (!docs.has(docName)) {
    const doc = loadDoc(docName);
    docs.set(docName, doc);
    
    // Auto-save on updates
    doc.on('update', () => {
      saveDoc(docName, doc);
    });
    
    console.log(`📄 Loaded document: ${docName}`);
  }
  return docs.get(docName);
};

const wss = new WebSocketServer({ port: PORT, host: HOST });

console.log(`🚀 D&D Journal Server: ws://${HOST}:${PORT}`);
console.log(`💾 Data directory: ${PERSIST_DIR}`);

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, { getYDoc: getDoc });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n💾 Saving all documents...');
  docs.forEach((doc, name) => saveDoc(name, doc));
  console.log('👋 Server stopped');
  process.exit(0);
});