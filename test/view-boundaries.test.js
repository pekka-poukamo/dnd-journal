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

const gatherViewFiles = () => {
  const files = [];
  ['js/journal-views.js', 'js/character-views.js', 'js/settings-views.js']
    .forEach(function(p) { if (fs.existsSync(path.resolve(repoRoot, p))) files.push(p); });

  const componentsDir = path.resolve(repoRoot, 'js/components');
  if (fs.existsSync(componentsDir)) {
    fs.readdirSync(componentsDir).forEach(function(name) {
      if (name.endsWith('.js')) {
        files.push(path.join('js/components', name));
      }
    });
  }

  const jsDir = path.resolve(repoRoot, 'js');
  if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).forEach(function(name) {
      if (name.endsWith('-views.js')) {
        const rel = path.join('js', name);
        if (!files.includes(rel)) files.push(rel);
      }
    });
  }
  return files;
};

describe('View module boundary rules', function() {
  it('view files must not import yjs, ai, ai-request, or summarization modules', function() {
    const viewFiles = gatherViewFiles();
    const forbiddenImportRegexes = [
      /import\s+[^;]*from\s+['\"][^'\"]*yjs(\.js)?['\"]/i,
      /import\s+[^;]*from\s+['\"][^'\"]*ai(\-request)?(\.js)?['\"]/i,
      /import\s+[^;]*from\s+['\"][^'\"]*summarization(\.js)?['\"]/i
    ];
    viewFiles.forEach(function(rel) {
      const src = readTextFile(rel);
      forbiddenImportRegexes.forEach(function(rx) {
        expect(src, `Forbidden import in ${rel}`).to.not.match(rx);
      });
    });
  });

  it('view files must not perform network calls (fetch)', function() {
    const viewFiles = gatherViewFiles();
    viewFiles.forEach(function(rel) {
      const src = readTextFile(rel);
      expect(src.includes('fetch('), `Network call found in ${rel}`).to.be.false;
    });
  });
});

