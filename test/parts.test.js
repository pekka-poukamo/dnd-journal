import { describe, it } from 'mocha';
import { expect } from 'chai';

import { partitionEntries, PART_SIZE_DEFAULT, getPartSummaryKey, getPartEntriesKey, PARTS_LATEST_KEY, SO_FAR_LATEST_KEY, RECENT_SUMMARY_KEY, persistPartMembership, getLatestClosedPartIndex, setLatestClosedPartIndex, recomputeRecentSummary, maybeCloseOpenPart } from '../js/parts.js';
import { initYjs, getYjsState, getSummary, addEntry, setSetting } from '../js/yjs.js';
import { summarize, clearAllSummaries } from '../js/summarization.js';

describe('parts helpers', function() {
  it('should partition entries into closed parts of default size and an open remainder', function() {
    const makeEntries = (n) => Array.from({ length: n }, (_, i) => ({ id: String(i + 1), content: `entry ${i + 1}` }));

    const { closedParts, openPart } = partitionEntries(makeEntries(0), PART_SIZE_DEFAULT);
    expect(closedParts).to.deep.equal([]);
    expect(openPart).to.deep.equal([]);

    const res1 = partitionEntries(makeEntries(5), PART_SIZE_DEFAULT);
    expect(res1.closedParts.length).to.equal(0);
    expect(res1.openPart.length).to.equal(5);

    const res2 = partitionEntries(makeEntries(PART_SIZE_DEFAULT), PART_SIZE_DEFAULT);
    expect(res2.closedParts.length).to.equal(1);
    expect(res2.closedParts[0].length).to.equal(PART_SIZE_DEFAULT);
    expect(res2.openPart.length).to.equal(0);

    const res3 = partitionEntries(makeEntries(PART_SIZE_DEFAULT + 7), PART_SIZE_DEFAULT);
    expect(res3.closedParts.length).to.equal(1);
    expect(res3.closedParts[0][0].id).to.equal('1');
    expect(res3.closedParts[0][PART_SIZE_DEFAULT - 1].id).to.equal(String(PART_SIZE_DEFAULT));
    expect(res3.openPart.length).to.equal(7);
    expect(res3.openPart[0].id).to.equal(String(PART_SIZE_DEFAULT + 1));
  });

  it('should provide consistent key helpers', function() {
    expect(getPartSummaryKey(1)).to.equal('journal:part:1');
    expect(getPartEntriesKey(2)).to.equal('journal:part:2:entries');
    expect(PARTS_LATEST_KEY).to.equal('journal:parts:latest');
    expect(SO_FAR_LATEST_KEY).to.equal('journal:parts:so-far:latest');
    expect(RECENT_SUMMARY_KEY).to.equal('journal:recent-summary');
  });

  it('should persist part membership only once and track latest index', async function() {
    await initYjs();
    const state = getYjsState();
    setLatestClosedPartIndex(state, 0);
    expect(getLatestClosedPartIndex(state)).to.equal(0);
    persistPartMembership(state, 1, ['a','b','c']);
    persistPartMembership(state, 1, ['x']);
    const stored = getSummary(state, getPartEntriesKey(1));
    expect(stored).to.equal(JSON.stringify(['a','b','c']));
    setLatestClosedPartIndex(state, 3);
    expect(getLatestClosedPartIndex(state)).to.equal(3);
  });

  it('should recompute recent summary for open part', async function() {
    await initYjs();
    const state = getYjsState();
    // enable AI for summarize to proceed in tests
    setSetting(state, 'ai-enabled', true);
    setSetting(state, 'openai-api-key', 'test');
    // add a few entries under the open part
    addEntry(state, { id: 'e1', content: 'First open entry', timestamp: Date.now() });
    addEntry(state, { id: 'e2', content: 'Second open entry', timestamp: Date.now() });
    await recomputeRecentSummary(state, 5);
    const recent = getSummary(state, RECENT_SUMMARY_KEY);
    expect(recent).to.be.a('string');
    expect(recent.length).to.be.greaterThan(0);
  });

  it('should close part at threshold and compute so-far latest', async function() {
    await initYjs();
    const state = getYjsState();
    setSetting(state, 'ai-enabled', true);
    setSetting(state, 'openai-api-key', 'test');
    // reset part index and summaries to avoid cross-test contamination
    await clearAllSummaries();
    setLatestClosedPartIndex(state, 0);
    // create 5 entries and set partSize=5
    for (let i = 1; i <= 5; i++) {
      addEntry(state, { id: `p1-${i}`, content: `content ${i}`, timestamp: Date.now() });
    }
    const closed = await maybeCloseOpenPart(state, 5);
    expect(closed).to.equal(true);
    expect(getLatestClosedPartIndex(state)).to.equal(1);
    const part1 = getSummary(state, getPartSummaryKey(1));
    expect(part1).to.be.a('string');
    const sofar = getSummary(state, SO_FAR_LATEST_KEY);
    expect(sofar).to.be.a('string');
  });
});

