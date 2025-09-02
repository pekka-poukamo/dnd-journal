import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';

import { initYjs, resetYjs, getYjsState, setSummary, addEntry, setSetting } from '../js/yjs.js';
import { SO_FAR_LATEST_KEY, RECENT_SUMMARY_KEY, getPartEntriesKey, setLatestClosedPartIndex, setRecomputeRecentSummaryImpl } from '../js/parts.js';

const waitFor = (fn, timeoutMs = 250) => new Promise((resolve, reject) => {
  const start = Date.now();
  const tick = () => {
    try {
      if (fn()) return resolve();
    } catch {}
    if (Date.now() - start > timeoutMs) return reject(new Error('timeout'));
    setTimeout(tick, 10);
  };
  tick();
});

describe('Chronicle Page', function() {
  beforeEach(async function() {
    resetYjs();
    await initYjs();
    // Minimal DOM scaffold matching chronicle.html
    document.body.innerHTML = `
      <main>
        <div class="container-narrow">
          <section id="so-far-section">
            <h2>Adventure So Far</h2>
            <div id="so-far-content">Loading...</div>
          </section>
          <section id="recent-section">
            <div class="section-header">
              <h2>Recent Adventures</h2>
              <button id="regenerate-recent" class="btn btn-secondary">Regenerate Recent</button>
            </div>
            <div id="recent-content">Loading...</div>
          </section>
          <section id="parts-list-section">
            <h2>Parts</h2>
            <div id="parts-list">Loading...</div>
          </section>
        </div>
      </main>
    `;
  });

  afterEach(function() {
    resetYjs();
    document.body.innerHTML = '';
  });

  it('should render So Far and Parts list from summaries', async function() {
    const state = getYjsState();
    // Enable AI so backfill can run safely
    setSetting(state, 'ai-enabled', true);
    setSetting(state, 'openai-api-key', 'test');
    // Set so-far summary
    setSummary(state, SO_FAR_LATEST_KEY, 'Combined tale across parts.');
    // Create entries for part 1 and set membership and title
    const t = Date.now();
    addEntry(state, { id: 'e1', content: 'first content', timestamp: t - 10000 });
    addEntry(state, { id: 'e2', content: 'second content', timestamp: t });
    setSummary(state, getPartEntriesKey(1), JSON.stringify(['e1','e2']));
    setSummary(state, 'journal:part:1:title', 'Part 1: Beginnings');
    setLatestClosedPartIndex(state, 1);

    await import('../js/chronicle.js');

    await waitFor(() => {
      const soFar = document.getElementById('so-far-content');
      return soFar && soFar.textContent.includes('Combined tale');
    }, 1000);

    const partsList = document.getElementById('parts-list');
    expect(partsList.textContent).to.include('Part 1');
    expect(partsList.textContent).to.include('View Part');
  });

  it('should regenerate Recent summary when clicking the button', async function() {
    const state = getYjsState();
    // Enable AI so recompute can run and seed initial recent to detect change
    setSetting(state, 'ai-enabled', true);
    setSetting(state, 'openai-api-key', 'test');
    setSummary(state, RECENT_SUMMARY_KEY, 'old recent');
    // Add open part entries to summarize
    addEntry(state, { id: 'r1', content: 'open one', timestamp: Date.now() });
    addEntry(state, { id: 'r2', content: 'open two', timestamp: Date.now() });

    // Stub recompute to update chronicle recent immediately
    setRecomputeRecentSummaryImpl(async (s, size) => {
      const el = document.getElementById('recent-content');
      if (el) el.textContent = 'stubbed recent';
    });
    await import('../js/chronicle.js');

    // Ensure initial render populated
    await waitFor(() => {
      const el = document.getElementById('recent-content');
      return el && el.textContent && el.textContent !== 'Loading...';
    }, 5000);
    const before = document.getElementById('recent-content').textContent;

    // Click regenerate and ensure immediate DOM update via stub
    const btn = document.getElementById('regenerate-recent');
    expect(() => btn.click()).to.not.throw;
    const afterEl = document.getElementById('recent-content');
    expect(afterEl.textContent).to.include('stubbed recent');
  });
});

