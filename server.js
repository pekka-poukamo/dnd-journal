#!/usr/bin/env node

// D&D Journal - Simple Yjs Server with LevelDB Persistence
// Usage: node server.js [port] [host]

import { Level } from 'level';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import * as Y from 'yjs';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || 'localhost';

// LevelDB instance
const db = new Level('./data', { valueEncoding: 'buffer' });

// Document storage
const docs = new Map();

// Load document from LevelDB
const loadDoc = async (docName) => {
  try {
    const data = await db.get(docName);
    const doc = new Y.Doc();
    Y.applyUpdate(doc, data);
    return doc;
  } catch (err) {
    if (err.notFound) {
      return new Y.Doc();
    }
    throw err;
  }
};

// Save document to LevelDB
const saveDoc = async (docName, doc) => {
  const update = Y.encodeStateAsUpdate(doc);
  await db.put(docName, update);
};

// Get or create document
const getDoc = async (docName) => {
  if (!docs.has(docName)) {
    const doc = await loadDoc(docName);
    docs.set(docName, doc);
    
    // Auto-save on updates (debounced)
    let saveTimeout;
    doc.on('update', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveDoc(docName, doc).catch(console.error);
      }, 1000); // Save after 1 second of inactivity
    });
    
    console.log(`📄 Loaded document: ${docName}`);
  }
  return docs.get(docName);
};

const wss = new WebSocketServer({ port: PORT, host: HOST });

console.log(`🚀 D&D Journal Server: ws://${HOST}:${PORT}`);
console.log(`💾 LevelDB: ./data`);

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, { getYDoc: getDoc });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n💾 Saving all documents...');
  await Promise.all(
    Array.from(docs.entries()).map(([name, doc]) => saveDoc(name, doc))
  );
  await db.close();
  console.log('👋 Server stopped');
  process.exit(0);
});