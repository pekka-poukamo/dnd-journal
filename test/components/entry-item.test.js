import { expect } from 'chai';
import '../setup.js';
import * as YjsModule from '../../js/yjs.js';
import { createEntryItem } from '../../js/components/entry-item.js';
import { setSummary } from '../../js/yjs.js';

describe('Entry Item Component', function() {
  let state;

  beforeEach(async function() {
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  it('renders placeholder when no stored summary', function() {
    const entry = { id: 'x1', content: 'foo', timestamp: Date.now() };
    const el = createEntryItem(entry, null, null);
    expect(el.className).to.include('entry--placeholder');
    expect(el.querySelector('.entry-summary p').textContent).to.be.a('string');
  });

  it('renders stored structured summary when available', function() {
    const entry = { id: 'x2', content: 'bar', timestamp: Date.now() };
    const summary = { title: 'T', subtitle: 'S', summary: 'SUM' };
    setSummary(state, `entry:${entry.id}`, JSON.stringify(summary));
    const el = createEntryItem(entry, null, null);
    expect(el.className).to.not.include('entry--placeholder');
    expect(el.querySelector('.entry-summary p').textContent).to.equal('SUM');
  });
});