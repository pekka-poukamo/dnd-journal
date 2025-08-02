#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from 'fs';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

console.log('🚀 Preparing production deployment...');

// Create deployment directory
const deployDir = join(projectRoot, 'deploy');
try {
  rmSync(deployDir, { recursive: true, force: true });
} catch (e) {
  // Directory doesn't exist, that's fine
}
mkdirSync(deployDir, { recursive: true });

// Files and directories to include in production deployment
const INCLUDE_FILES = [
  // Main HTML files (production versions)
  'index.production.html',
  'character.production.html', 
  'settings.production.html',
  'test_sync.production.html',
  
  // Static assets
  'favicon.svg',
  'manifest.json',
  
  // CSS directory
  'css/',
  
  // Production lib directory (contains only needed dependencies)
  'lib/',
];

// JS files to include (production versions only)
const INCLUDE_JS_FILES = [
  'js/yjs.production.js',
  'js/settings.production.js',
  'js/summarization.production.js',
  'js/character.production.js', 
  'js/journal.production.js',
  'js/ai.production.js',
  'js/journal-views.production.js',
  'js/context.production.js',
  // Non-yjs dependent files
  'js/utils.js',
  'js/prompts.js',
  'js/navigation-cache.js',
  'js/character-views.js',
  'js/settings-views.js'
];

// Copy included files and directories
INCLUDE_FILES.forEach(item => {
  const srcPath = join(projectRoot, item);
  const destPath = join(deployDir, item);
  
  try {
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      console.log(`📁 Copying directory ${item}...`);
      cpSync(srcPath, destPath, { recursive: true });
    } else {
      console.log(`📄 Copying file ${item}...`);
      mkdirSync(dirname(destPath), { recursive: true });
      cpSync(srcPath, destPath);
    }
  } catch (e) {
    console.warn(`⚠️  Warning: Could not copy ${item} - ${e.message}`);
  }
});

// Copy JS files
mkdirSync(join(deployDir, 'js'), { recursive: true });
INCLUDE_JS_FILES.forEach(jsFile => {
  const srcPath = join(projectRoot, jsFile);
  const destPath = join(deployDir, jsFile);
  
  try {
    console.log(`📄 Copying ${jsFile}...`);
    cpSync(srcPath, destPath);
  } catch (e) {
    console.warn(`⚠️  Warning: Could not copy ${jsFile} - ${e.message}`);
  }
});

// Rename HTML files to remove .production suffix
const htmlFiles = ['index.production.html', 'character.production.html', 'settings.production.html'];
htmlFiles.forEach(file => {
  const srcPath = join(deployDir, file);
  const destPath = join(deployDir, file.replace('.production.html', '.html'));
  try {
    cpSync(srcPath, destPath);
    rmSync(srcPath);
    console.log(`📄 Renamed ${file} to ${file.replace('.production.html', '.html')}`);
  } catch (e) {
    console.warn(`⚠️  Warning: Could not rename ${file} - ${e.message}`);
  }
});

// Check deployment size
const checkSize = (dirPath) => {
  return new Promise((resolve) => {
    const du = spawn('du', ['-sh', dirPath]);
    du.stdout.on('data', (data) => {
      const size = data.toString().split('\t')[0];
      resolve(size.trim());
    });
    du.on('error', () => resolve('unknown'));
  });
};

const deploySize = await checkSize(deployDir);
console.log(`📊 Production deployment size: ${deploySize}`);

// Deploy to Surge
console.log('🌊 Deploying to Surge...');
const surge = spawn('npx', ['surge', deployDir, 'http://dnd-journal.surge.sh'], {
  stdio: 'inherit',
  env: { ...process.env }
});

surge.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Deployment successful!');
    console.log(`🔗 Site available at: http://dnd-journal.surge.sh`);
    console.log(`📊 Deployed ${deploySize} (vs ~85MB with full node_modules)`);
  } else {
    console.error('❌ Deployment failed');
    process.exit(code);
  }
});

surge.on('error', (error) => {
  console.error('❌ Error running surge:', error.message);
  process.exit(1);
});