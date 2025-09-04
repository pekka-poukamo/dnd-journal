#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (rel) => fs.readFileSync(path.resolve(repoRoot, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.resolve(repoRoot, rel));

const fail = (msg) => { console.error(msg); process.exit(1); };

// 1) No inline styles in top-level HTML
['index.html','settings.html','chronicle.html','character.html','part.html']
  .filter(exists)
  .forEach((rel) => {
    const html = read(rel);
    if (/style\s*=\s*"/i.test(html)) fail(`Inline style attribute found in ${rel}`);
  });

// 2) Forbid `class` declarations and `this` usage in JS (per style guide)
// Strip strings and comments to avoid false positives.
const stripStringsAndComments = (code) => {
  return code
    // Block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Line comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    // Template strings
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    // Double-quoted strings
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    // Single-quoted strings
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
};
const walkJs = (dirRel, files=[]) => {
  const dir = path.resolve(repoRoot, dirRel);
  fs.readdirSync(dir).forEach((name) => {
    const full = path.join(dir, name);
    const rel = path.relative(repoRoot, full);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'server') return;
      walkJs(rel, files);
    } else if (name.endsWith('.js')) {
      files.push(rel);
    }
  });
  return files;
};

walkJs('js').forEach((rel) => {
  const raw = read(rel);
  const src = stripStringsAndComments(raw);
  // class declarations: start of line (allow whitespace) then 'class' + name
  if (/^[\t ]*class\s+[_$A-Za-z][_$0-9A-Za-z]*/m.test(src)) fail(`Forbidden class declaration in ${rel}`);
  // 'this' keyword usage (word boundary)
  if (/\bthis\b/.test(src)) fail(`Forbidden 'this' usage in ${rel}`);
  if (/localStorage\s*\./i.test(src)) fail(`Forbidden localStorage usage in ${rel}`);
});

console.log('Guard checks passed');
