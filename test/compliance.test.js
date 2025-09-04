import { expect } from 'chai';
import './setup.js';
import * as Utils from '../js/utils.js';
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

describe('Phase 3 — Tests and Guardrails', function() {
  describe('Security tests for markdown (ADR-0005, README note, Phase 3)', function() {
    it('escapes raw HTML tags so they render inert', function() {
      const input = '<b>hello</b> & <i>world</i>';
      const html = Utils.parseMarkdown(input);
      expect(html).to.include('&lt;b&gt;hello&lt;/b&gt;');
      expect(html).to.include('&lt;i&gt;world&lt;/i&gt;');
      expect(html).to.not.match(/<\s*b\s*>/i);
      expect(html).to.not.match(/<\s*i\s*>/i);
    });

    it('neutralizes script tags and event handler attributes', function() {
      const input = 'Click <img src=x onerror="alert(1)"> then <script>alert(1)</script>';
      const html = Utils.parseMarkdown(input);
      expect(html).to.include('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
      expect(html).to.include('&lt;script&gt;alert(1)&lt;/script&gt;');
      expect(html).to.not.match(/<\s*script/i);
      expect(html).to.not.match(/<\s*img/i);
    });

    it('keeps sanitization inside formatted markdown (e.g., strong/em/code)', function() {
      const input = '**bold <img onerror=1>** and *italic <script>x</script>* with `code <b>x</b>`';
      const html = Utils.parseMarkdown(input);
      expect(html).to.include('<strong>bold &lt;img onerror=1&gt;</strong>');
      expect(html).to.include('<em>italic &lt;script&gt;x&lt;/script&gt;</em>');
      expect(html).to.include('<code>code &lt;b&gt;x&lt;/b&gt;</code>');
      expect(html).to.not.match(/<\s*img/i);
      expect(html).to.not.match(/<\s*script/i);
    });
  });

  describe('ADR-0015 enforcement tests (view purity and boundaries)', function() {
    const gatherViewFiles = () => {
      const files = [];
      // Top-level explicit view modules
      ['js/journal-views.js', 'js/character-views.js', 'js/settings-views.js']
        .forEach(function(p) { if (fs.existsSync(path.resolve(repoRoot, p))) files.push(p); });

      // Components considered view-only
      const componentsDir = path.resolve(repoRoot, 'js/components');
      if (fs.existsSync(componentsDir)) {
        fs.readdirSync(componentsDir).forEach(function(name) {
          if (name.endsWith('.js')) {
            files.push(path.join('js/components', name));
          }
        });
      }

      // Any additional *-views.js under js/
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

  describe('HTML must not contain inline styles (Phase 1 acceptance, guardrail)', function() {
    const htmlFiles = ['index.html', 'settings.html', 'chronicle.html', 'character.html', 'part.html'];
    htmlFiles.forEach(function(rel) {
      if (!fs.existsSync(path.resolve(repoRoot, rel))) return;
      it(`${rel} contains no inline style attributes`, function() {
        const html = readTextFile(rel);
        expect(/style\s*=\s*"/i.test(html), `Inline style attribute found in ${rel}`).to.be.false;
      });
    });
  });
});

