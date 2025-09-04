import './setup.js';
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

import * as YjsModule from '../js/yjs.js';
import * as Y from 'yjs';
import { initPartPage } from '../js/part.js';

const workspaceRoot = process.cwd();

const loadHtmlIntoDom = (absoluteHtmlPath, url) => {
  const html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  const dom = new JSDOM(html, { url, pretendToBeVisual: true, resources: 'usable' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  return dom;
};

describe('UI Contracts - Part Page (part.html)', function() {
  beforeEach(async function() {
    // Load with part=1 to target a concrete part
    loadHtmlIntoDom(path.join(workspaceRoot, 'part.html'), 'http://localhost/part.html?part=1');
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  it('should render title, summary, and entries list using shared entry list component', async function() {
    const state = YjsModule.getYjsState();
    // Create entries and a simple part map structure
    const ids = [];
    for (let i = 0; i < 3; i++) {
      const id = `p1e${i}`;
      ids.push(id);
      YjsModule.addEntry(state, { id, content: `Part content ${i}`, timestamp: Date.now() + i });
    }

    // Ensure chronicle structure and set part 1 data
    const partsMap = YjsModule.getChroniclePartsMap(state);
    const part1 = new Y.Map();
    part1.set('title', 'The Road to Bree');
    part1.set('summary', 'The company travels through the wilds.');
    const yIds = new Y.Array();
    yIds.push(ids);
    part1.set('entries', yIds);
    partsMap.set('1', part1);

    // Initialize page logic explicitly (no side effects on import)
    await initPartPage(state, 1);

    // Allow microtasks to run
    await new Promise(r => setTimeout(r, 10));

    const titleEl = document.getElementById('part-title');
    const summaryEl = document.getElementById('part-summary-content');
    const listEl = document.getElementById('part-entries-list');

    expect(titleEl.textContent).to.include('The Road to Bree');
    expect(summaryEl.textContent).to.include('travels');
    const entries = listEl.querySelectorAll('.entry');
    expect(entries.length).to.equal(3);
  });
});

