#!/usr/bin/env node

// Simple script to create browser bundles from node_modules
const fs = require('fs');
const path = require('path');

function wrapForBrowser(name, cjsContent, globalName) {
  return `// ${name} - Browser build
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else {
    factory((global.${globalName} = {}));
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (exports) {
  'use strict';
  
  // Create module system shim
  var module = { exports: {} };
  var require = function(name) {
    if (name === 'yjs') return window.Y || {};
    if (name === 'y-protocols/awareness') return window.awarenessProtocol || {};
    if (name === 'lib0/observable') return { Observable: function() {} };
    if (name === 'lib0/logging') return { createModuleLogger: function() { return { warn: console.warn, error: console.error }; } };
    return {};
  };
  
  ${cjsContent}
  
  // Export to global
  if (module.exports) {
    Object.assign(global.${globalName} || {}, module.exports);
    Object.assign(exports, module.exports);
  }
});
`;
}

// Bundle configurations
const bundles = [
  {
    name: 'yjs',
    inputFile: 'node_modules/yjs/dist/yjs.cjs',
    outputFile: 'vendor/yjs.js',
    globalName: 'Y'
  },
  {
    name: 'y-websocket',
    inputFile: 'node_modules/y-websocket/dist/y-websocket.cjs',
    outputFile: 'vendor/y-websocket.js',
    globalName: 'WebsocketProvider'
  },
  {
    name: 'y-indexeddb',
    inputFile: 'node_modules/y-indexeddb/dist/y-indexeddb.cjs',
    outputFile: 'vendor/y-indexeddb.js',
    globalName: 'IndexeddbPersistence'
  }
];

function createBundle(config) {
  try {
    console.log(`Creating bundle for ${config.name}...`);
    
    if (!fs.existsSync(config.inputFile)) {
      throw new Error(`Input file not found: ${config.inputFile}`);
    }
    
    const cjsContent = fs.readFileSync(config.inputFile, 'utf8');
    const browserContent = wrapForBrowser(config.name, cjsContent, config.globalName);
    
    fs.writeFileSync(config.outputFile, browserContent);
    console.log(`✅ Created ${config.outputFile}`);
    
  } catch (error) {
    console.error(`❌ Failed to create bundle for ${config.name}:`, error.message);
  }
}

function main() {
  console.log('Creating vendor bundles...');
  
  // Ensure vendor directory exists
  if (!fs.existsSync('vendor')) {
    fs.mkdirSync('vendor');
  }
  
  bundles.forEach(createBundle);
  
  console.log('✅ All bundles created!');
}

if (require.main === module) {
  main();
}

module.exports = { createBundle, bundles };