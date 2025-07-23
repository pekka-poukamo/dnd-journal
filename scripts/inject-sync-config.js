#!/usr/bin/env node

/**
 * Build-time sync configuration injection
 * 
 * This script demonstrates how to inject sync server configuration
 * into static HTML files during the build process.
 * 
 * Usage:
 *   SYNC_SERVER_URL=ws://pi.local:1234 node scripts/inject-sync-config.js
 *   node scripts/inject-sync-config.js ws://192.168.1.100:1234
 */

const fs = require('fs');
const path = require('path');

// Get sync server URL from environment or command line
const syncServerUrl = process.env.SYNC_SERVER_URL || process.argv[2];

if (!syncServerUrl) {
  console.log('ℹ️  No sync server specified - using auto-detection only');
  process.exit(0);
}

console.log(`🔧 Injecting sync server: ${syncServerUrl}`);

// Files to process
const htmlFiles = [
  'index.html',
  'character.html'
];

let injected = 0;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  Skipping ${file} (not found)`);
    return;
  }

  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove any existing sync-server meta tag
    content = content.replace(/<meta\s+name="sync-server"[^>]*>/gi, '');
    
    // Inject new meta tag before closing head
    const metaTag = `  <meta name="sync-server" content="${syncServerUrl}">`;
    content = content.replace('</head>', `${metaTag}\n  </head>`);
    
    fs.writeFileSync(file, content);
    console.log(`✅ Injected into ${file}`);
    injected++;
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n📦 Build injection complete: ${injected} files processed`);
console.log(`🌐 Sync server: ${syncServerUrl}`);
console.log(`🚀 Your D&D Journal will use this server for sync`);