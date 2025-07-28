#!/usr/bin/env node

// Simple D&D Journal Sync Server with Persistence
// Follows ADR-0013 (Radical Simplicity) and ADR-0003 (Yjs Sync Enhancement)
// Uses the simple y-websocket server with LevelDB persistence

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple configuration - follows radical simplicity principle
const CONFIG = {
  HOST: process.env.HOST || '0.0.0.0',
  PORT: process.env.PORT || 1234,
  PERSISTENCE_DIR: process.env.YPERSISTENCE || resolve(__dirname, './y-leveldb-data')
};

console.log('🚀 Starting D&D Journal Sync Server...');
console.log(`📍 Host: ${CONFIG.HOST}`);
console.log(`🔌 Port: ${CONFIG.PORT}`);
console.log(`💾 Persistence: ${CONFIG.PERSISTENCE_DIR}`);
console.log(`🔗 Configure clients to: ws://${CONFIG.HOST}:${CONFIG.PORT}`);
console.log('');

// Use the simple y-websocket server with persistence
// This follows radical simplicity by using existing, battle-tested code
const serverCommand = `YPERSISTENCE="${CONFIG.PERSISTENCE_DIR}" HOST="${CONFIG.HOST}" PORT="${CONFIG.PORT}" npx y-websocket`;

const serverProcess = exec(serverCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Server error:', error);
    return;
  }
  if (stderr) {
    console.error('Server stderr:', stderr);
  }
  console.log(stdout);
});

// Handle output
serverProcess.stdout?.on('data', (data) => {
  console.log(data.toString().trim());
});

serverProcess.stderr?.on('data', (data) => {
  console.error(data.toString().trim());
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
  setTimeout(() => {
    serverProcess.kill('SIGKILL');
    process.exit(0);
  }, 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('✅ Server started! Press Ctrl+C to stop.');