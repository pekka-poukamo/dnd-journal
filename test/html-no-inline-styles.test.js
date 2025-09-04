import { expect } from 'chai';
import './setup.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const readTextFile = (relativePath) => {
  const fullPath = path.resolve(repoRoot, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
};

describe('Top-level HTML has no inline styles', function() {
  const htmlFiles = ['index.html', 'settings.html', 'chronicle.html', 'character.html', 'part.html'];
  htmlFiles.forEach(function(rel) {
    if (!fs.existsSync(path.resolve(repoRoot, rel))) return;
    it(`${rel} contains no inline style attributes`, function() {
      const html = readTextFile(rel);
      expect(/style\s*=\s*"/i.test(html), `Inline style attribute found in ${rel}`).to.be.false;
    });
  });
});

