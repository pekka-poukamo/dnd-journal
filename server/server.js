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

// Comprehensive file system diagnostics
console.log(`🔍 File system diagnostics:`);
const absoluteDataDir = resolve(DATA_DIR);
console.log(`   📂 Absolute path: ${absoluteDataDir}`);
console.log(`   📂 Working directory: ${process.cwd()}`);

// Test write permissions
try {
  const testFile = resolve('./test-write-permissions.tmp');
  writeFileSync(testFile, 'test');
  unlinkSync(testFile);
  console.log(`   ✅ Write permissions: OK`);
} catch (error) {
  console.log(`   ❌ Write permissions: FAILED - ${error.message}`);
}

// List current directory contents
try {
  const currentDirFiles = readdirSync('./');
  console.log(`   📋 Current directory files: ${currentDirFiles.join(', ')}`);
} catch (error) {
  console.log(`   ❌ Failed to list current directory: ${error.message}`);
}

// Check if we can create the data directory manually
if (!existsSync(DATA_DIR)) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log(`   ✅ Manually created data directory: ${DATA_DIR}`);
    console.log(`   📁 Data directory now exists: ${existsSync(DATA_DIR)}`);
  } catch (error) {
    console.log(`   ❌ Failed to create data directory manually: ${error.message}`);
  }
}

// Test LevelDB functionality
const testLevelDB = async () => {
  try {
    console.log(`🧪 Testing LevelDB functionality...`);
    const testPersistence = new LeveldbPersistence(DATA_DIR + '/test-server-startup');
    console.log(`✅ LevelDB persistence created successfully`);
    console.log(`📁 Data directory after test persistence: ${existsSync(DATA_DIR)}`);
    
    // Try to write some data
    const testDoc = new Y.Doc();
    testDoc.getMap('test').set('server-test', 'startup-test-value');
    const update = Y.encodeStateAsUpdate(testDoc);
    
    await testPersistence.storeUpdate('test-doc', update);
    console.log(`✅ Test update stored successfully`);
    console.log(`📁 Data directory after test store: ${existsSync(DATA_DIR)}`);
    
    // Try to read it back
    const retrievedDoc = await testPersistence.getYDoc('test-doc');
    const value = retrievedDoc.getMap('test').get('server-test');
    console.log(`✅ Test value retrieved: "${value}"`);
    
    // Cleanup
    await testPersistence.clearDocument('test-doc');
    console.log(`✅ Test cleanup completed`);
    
  } catch (error) {
    console.error(`❌ LevelDB test failed:`, error);
  }
};

// Run test after a short delay
setTimeout(testLevelDB, 1000);

// Monitor directory changes every 10 seconds when there are active connections
const monitorDirectory = () => {
  if (activeConnections.size > 0 || activeDocuments.size > 0) {
    try {
      console.log(`\n📂 Directory monitor check:`);
      console.log(`   📁 Data directory exists: ${existsSync(DATA_DIR)}`);
      
      if (existsSync(DATA_DIR)) {
        const files = readdirSync(DATA_DIR);
        console.log(`   📋 Files in data directory: ${files.length > 0 ? files.join(', ') : 'EMPTY'}`);
        
        // Check subdirectories
        files.forEach(file => {
          const fullPath = resolve(DATA_DIR, file);
          try {
            const subFiles = readdirSync(fullPath);
            console.log(`   📁 ${file}/ contains: ${subFiles.length > 0 ? subFiles.join(', ') : 'EMPTY'}`);
          } catch (e) {
            // Not a directory or can't read
            console.log(`   📄 ${file} (file)`);
          }
        });
      }
      
      // Also check current directory for any unexpected files
      const currentFiles = readdirSync('./');
      const dataRelatedFiles = currentFiles.filter(f => f.includes('data') || f.includes('leveldb') || f.includes('level') || f.includes('.db'));
      if (dataRelatedFiles.length > 0) {
        console.log(`   🔍 Data-related files in current dir: ${dataRelatedFiles.join(', ')}`);
      }
    } catch (error) {
      console.error(`   ❌ Directory monitor error: ${error.message}`);
    }
  }
};

setInterval(monitorDirectory, 10000);

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

  // Add WebSocket message debugging
  ws.on('message', (message) => {
    console.log(`📨 WebSocket message received [${connectionId}]:`, {
      messageSize: message.length,
      timestamp: new Date().toISOString(),
      isBuffer: Buffer.isBuffer(message),
      firstBytes: message.slice(0, 10)
    });
  });
  
  const originalSend = ws.send.bind(ws);
  ws.send = function(data) {
    console.log(`📤 WebSocket message sent [${connectionId}]:`, {
      dataSize: data.length,
      timestamp: new Date().toISOString(),
      isBuffer: Buffer.isBuffer(data)
    });
    return originalSend(data);
  };

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
      
      // Add detailed LevelDB debugging
      const doc = persistence.doc;
      
      // Monitor document changes
      doc.on('update', (update) => {
        console.log(`📝 Document "${docName}" update received:`, {
          updateSize: update.length,
          timestamp: new Date().toISOString(),
          connectionId: connectionId
        });
        
        // Check if directory was created after this update
        setTimeout(() => {
          console.log(`📁 Data directory after update: ${existsSync(DATA_DIR)}`);
          console.log(`📁 Document path after update: ${existsSync(docPath)}`);
        }, 100);
      });
      
      // Monitor persistence operations
      const originalStoreUpdate = persistence.storeUpdate.bind(persistence);
      persistence.storeUpdate = function(docName, update) {
        console.log(`💾 LevelDB storeUpdate called:`, {
          docName,
          updateSize: update.length,
          timestamp: new Date().toISOString()
        });
        
        return originalStoreUpdate(docName, update).then(result => {
          console.log(`✅ LevelDB storeUpdate completed for "${docName}"`);
          console.log(`📁 Data directory after store: ${existsSync(DATA_DIR)}`);
          console.log(`📁 Document path after store: ${existsSync(docPath)}`);
          return result;
        }).catch(error => {
          console.error(`❌ LevelDB storeUpdate failed for "${docName}":`, error);
          throw error;
        });
      };
      
      return doc;
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



process.on('SIGINT', () => {
  console.log('\n👋 Server stopping...');
  console.log(`📊 Final stats - Connections: ${activeConnections.size}, Documents: ${activeDocuments.size}`);
  console.log(`📁 Data directory exists: ${existsSync(DATA_DIR)}`);
  console.log('👋 Server stopped');
  process.exit(0);
});