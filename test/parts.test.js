import { describe, it } from 'mocha';
import { expect } from 'chai';

import { partitionEntries, PART_SIZE_DEFAULT, getPartSummaryKey, getPartEntriesKey, PARTS_LATEST_KEY, SO_FAR_LATEST_KEY, RECENT_SUMMARY_KEY } from '../js/parts.js';

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
});

