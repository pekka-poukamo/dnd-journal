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
import { existsSync } from 'fs';

const PORT = process.env.PORT || process.argv[2] || 1234;
const HOST = process.env.HOST || process.argv[3] || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';

// Log startup information
console.log(`🚀 D&D Journal Server: ws://${HOST}:${PORT}`);
console.log(`💾 LevelDB: ${DATA_DIR}`);
console.log(`📁 Data directory exists: ${existsSync(DATA_DIR)}`);
console.log(`🕐 Server started at: ${new Date().toISOString()}`);

const wss = new WebSocketServer({ port: PORT, host: HOST });

// Track active connections and documents
const activeConnections = new Map();
const activeDocuments = new Map();

// Log WebSocket server events
wss.on('connection', (ws, req) => {
  const connectionId = Math.random().toString(36).substr(2, 9);
  const clientIP = req.socket.remoteAddress;
  const url = req.url;
  
  console.log(`🔗 New connection [${connectionId}] from ${clientIP} - URL: ${url}`);
  activeConnections.set(connectionId, { ip: clientIP, url, connectedAt: new Date().toISOString() });
  
  // Log connection count
  console.log(`📊 Active connections: ${activeConnections.size}`);

  // Enhanced setupWSConnection with document tracking
  setupWSConnection(ws, req, {
    getYDoc: (docName) => {
      console.log(`📄 Document requested: "${docName}" by connection [${connectionId}]`);
      
      const docPath = DATA_DIR + '/' + docName;
      console.log(`💾 LevelDB path: ${docPath}`);
      
      // Check if this is a new document
      if (!activeDocuments.has(docName)) {
        console.log(`✨ Creating new document persistence for: "${docName}"`);
        activeDocuments.set(docName, {
          createdAt: new Date().toISOString(),
          connections: new Set([connectionId])
        });
      } else {
        console.log(`🔄 Reusing existing document: "${docName}"`);
        activeDocuments.get(docName).connections.add(connectionId);
      }
      
      console.log(`📊 Active documents: ${activeDocuments.size}`);
      console.log(`📊 Connections to "${docName}": ${activeDocuments.get(docName).connections.size}`);
      
      // Check data directory before and after persistence creation
      console.log(`📁 Data directory exists before persistence: ${existsSync(DATA_DIR)}`);
      
      const persistence = new LeveldbPersistence(docPath);
      
      console.log(`📁 Data directory exists after persistence: ${existsSync(DATA_DIR)}`);
      console.log(`📁 Document path exists: ${existsSync(docPath)}`);
      
      return persistence.doc;
    }
  });

  // Track connection close
  ws.on('close', () => {
    console.log(`❌ Connection closed [${connectionId}] from ${clientIP}`);
    activeConnections.delete(connectionId);
    
    // Remove connection from documents
    for (const [docName, docInfo] of activeDocuments.entries()) {
      if (docInfo.connections.has(connectionId)) {
        docInfo.connections.delete(connectionId);
        if (docInfo.connections.size === 0) {
          console.log(`📄 No more connections to document: "${docName}"`);
        }
      }
    }
    
    console.log(`📊 Active connections: ${activeConnections.size}`);
  });

  // Track connection errors
  ws.on('error', (error) => {
    console.error(`🚨 Connection error [${connectionId}]:`, error.message);
  });
});

// Log server errors
wss.on('error', (error) => {
  console.error('🚨 WebSocket server error:', error.message);
});

// Periodic status logging (every 30 seconds if there are active connections)
const statusInterval = setInterval(() => {
  if (activeConnections.size > 0 || activeDocuments.size > 0) {
    console.log(`📊 Status - Connections: ${activeConnections.size}, Documents: ${activeDocuments.size}, Data dir: ${existsSync(DATA_DIR)}`);
  }
}, 30000);

process.on('SIGINT', () => {
  console.log('\n👋 Server stopping...');
  console.log(`📊 Final stats - Connections: ${activeConnections.size}, Documents: ${activeDocuments.size}`);
  console.log(`📁 Data directory exists: ${existsSync(DATA_DIR)}`);
  clearInterval(statusInterval);
  console.log('👋 Server stopped');
  process.exit(0);
});