#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Production dependencies needed for the frontend
const PRODUCTION_DEPS = [
  'yjs',
  'y-indexeddb', 
  'y-websocket'
];

console.log('🏗️  Building production deployment...');

// Clean and create lib directory
const libDir = join(projectRoot, 'lib');
try {
  rmSync(libDir, { recursive: true, force: true });
} catch (e) {
  // Directory doesn't exist, that's fine
}
mkdirSync(libDir, { recursive: true });

// Copy only production dependencies
PRODUCTION_DEPS.forEach(dep => {
  const srcPath = join(projectRoot, 'node_modules', dep);
  const destPath = join(libDir, dep);
  
  console.log(`📦 Copying ${dep}...`);
  cpSync(srcPath, destPath, { recursive: true });
});

// Update import paths in yjs.js to use the lib directory
const yjsFile = join(projectRoot, 'js', 'yjs.js');
const content = readFileSync(yjsFile, 'utf8');

const updatedContent = content
  .replace(/import \* as Y from 'yjs';/, "import * as Y from '../lib/yjs/dist/yjs.mjs';")
  .replace(/import { IndexeddbPersistence } from 'y-indexeddb';/, "import { IndexeddbPersistence } from '../lib/y-indexeddb/src/y-indexeddb.js';")
  .replace(/import { WebsocketProvider } from 'y-websocket';/, "import { WebsocketProvider } from '../lib/y-websocket/src/y-websocket.js';");

writeFileSync(join(projectRoot, 'js', 'yjs.production.js'), updatedContent);

// Update JS files that import from yjs.js to use production version
const jsFiles = [
  'js/settings.js',
  'js/summarization.js', 
  'js/character.js',
  'js/journal.js',
  'js/ai.js',
  'js/journal-views.js',
  'js/context.js'
];

jsFiles.forEach(jsFile => {
  const jsPath = join(projectRoot, jsFile);
  const jsContent = readFileSync(jsPath, 'utf8');
  
  const updatedJs = jsContent.replace(
    /from ['"]\.\/yjs\.js['"]/g,
    "from './yjs.production.js'"
  );
  
  if (updatedJs !== jsContent) {
    writeFileSync(join(projectRoot, jsFile.replace('.js', '.production.js')), updatedJs);
    console.log(`📄 Created ${jsFile.replace('.js', '.production.js')}`);
  }
});

// Update test_sync.html to use production version
const testSyncPath = join(projectRoot, 'test_sync.html');
const testSyncContent = readFileSync(testSyncPath, 'utf8');
const updatedTestSync = testSyncContent.replace(
  /import\(['"]\.\/js\/yjs\.js['"]\)/g,
  "import('./js/yjs.production.js')"
);
if (updatedTestSync !== testSyncContent) {
  writeFileSync(join(projectRoot, 'test_sync.production.html'), updatedTestSync);
  console.log('📄 Created test_sync.production.html');
}

// Update main HTML files to use production JS files
const htmlFiles = [
  { file: 'index.html', js: 'js/journal.js' },
  { file: 'character.html', js: 'js/character.js' },
  { file: 'settings.html', js: 'js/settings.js' }
];

htmlFiles.forEach(({ file, js }) => {
  const htmlPath = join(projectRoot, file);
  const htmlContent = readFileSync(htmlPath, 'utf8');
  
  const updatedHtml = htmlContent.replace(
    new RegExp(`src="${js}"`, 'g'),
    `src="${js.replace('.js', '.production.js')}"`
  );
  
  if (updatedHtml !== htmlContent) {
    writeFileSync(join(projectRoot, file.replace('.html', '.production.html')), updatedHtml);
    console.log(`📄 Created ${file.replace('.html', '.production.html')}`);
  }
});

console.log('✅ Production build complete!');
console.log(`📊 Production dependencies size: ~4MB (vs 85MB full node_modules)`);
console.log('🚀 Ready for deployment with lib/ directory and production HTML files');