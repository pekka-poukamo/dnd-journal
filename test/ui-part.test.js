import './setup.js';
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

import * as YjsModule from '../js/yjs.js';
import * as Y from 'yjs';
import * as PartPage from '../js/part.js';

// Ensure module side effect in sw-register does not break in tests
// (window is defined in setup.js and serviceWorker API is not present)

const workspaceRoot = process.cwd();

const loadPartHtmlIntoDom = (partIndex = 1) => {
  const absoluteHtmlPath = path.join(workspaceRoot, 'part.html');
  let html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  // Inject a URL with query parameter ?part=partIndex
  const dom = new JSDOM(html, {
    url: `http://localhost/part.html?part=${partIndex}`,
    pretendToBeVisual: true,
    resources: 'usable'
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  return dom;
};

describe('UI Contracts - Part Page (part.html)', function() {
  beforeEach(async function() {
    loadPartHtmlIntoDom(1);
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  it('should render placeholders when part data missing', async function() {
    await PartPage.initForTest?.();
    // When no part exists, title defaults to "Part <index>"
    expect(document.getElementById('part-title').textContent).to.match(/Part\s+1/);
    expect(document.getElementById('part-summary-content').textContent).to.contain('No summary');
    expect(document.getElementById('part-entries-list').textContent).to.contain('No entries');
  });

  it('should render title, summary and entries when part exists', async function() {
    const state = YjsModule.getYjsState();
    // Ensure chronicle structure exists
    const partsMap = YjsModule.getChroniclePartsMap(state);
    // create a fake part 1
    const part = new Y.Map();
    part.set('title', 'Part 1: The Beginning');
    part.set('summary', 'A short summary');
    part.set('entries', new Y.Array());
    partsMap.set('1', part);

    // Also create an entry to render
    const entry = { id: 'e1', content: 'First entry', timestamp: Date.now() };
    YjsModule.addEntry(state, entry);
    part.get('entries').push([entry.id]);

    // Initialize page logic explicitly
    await PartPage.initForTest?.();

    expect(document.getElementById('part-title').textContent).to.contain('Part 1: The Beginning');
    expect(document.getElementById('part-summary-content').textContent).to.contain('A short summary');
    const list = document.getElementById('part-entries-list');
    expect(list.children.length).to.be.greaterThan(0);
  });
});

