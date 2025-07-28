#!/usr/bin/env node

// D&D Journal - Yjs WebSocket Server
// Simple server for local development and self-hosting
// Usage: node server.js [port] [host]

import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import * as Y from 'yjs';

// Configuration
const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || 'localhost';

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT, host: HOST });

// Connection tracking
let connections = 0;
let documents = new Map();

console.log(`🚀 D&D Journal Sync Server starting...`);
console.log(`📡 Host: ${HOST}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🌐 WebSocket URL: ws://${HOST}:${PORT}`);
console.log(`📄 Document rooms: dnd-journal (and others)`);

wss.on('connection', (ws, req) => {
  connections++;
  console.log(`✅ Client connected (${connections} active)`);
  
  // Extract room name from URL path or use default
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomname = url.searchParams.get('room') || 'dnd-journal';
  
  console.log(`📂 Room: ${roomname}`);
  
  // Track document for this room
  if (!documents.has(roomname)) {
    documents.set(roomname, new Y.Doc());
    console.log(`📝 Created new document for room: ${roomname}`);
  }
  
  // Setup Yjs WebSocket connection
  setupWSConnection(ws, req, { 
    docName: roomname,
    gc: true // Enable garbage collection
  });
  
  ws.on('close', () => {
    connections--;
    console.log(`❌ Client disconnected (${connections} active)`);
  });
  
  ws.on('error', (error) => {
    console.error(`⚠️  WebSocket error:`, error.message);
  });
});

wss.on('error', (error) => {
  console.error(`🔥 Server error:`, error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n🛑 Shutting down server...`);
  wss.close(() => {
    console.log(`👋 Server stopped`);
    process.exit(0);
  });
});

// Health monitoring
setInterval(() => {
  if (connections > 0) {
    console.log(`💓 Health check: ${connections} connections, ${documents.size} documents`);
  }
}, 60000); // Every minute

console.log(`✨ Server ready and listening!`);
console.log(`📖 To connect your D&D Journal:`);
console.log(`   1. Open Settings in your journal`);
console.log(`   2. Set sync server to: ws://${HOST}:${PORT}`);
console.log(`   3. Save settings`);
console.log(`\n🔄 Server will keep documents in sync across all connected clients.`);