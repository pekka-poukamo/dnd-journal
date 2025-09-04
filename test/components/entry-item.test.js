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

  it('renders placeholder when no stored title/subtitle', function() {
    const entry = { id: 'x1', content: 'foo', timestamp: Date.now() };
    const el = createEntryItem(entry, null, null);
    expect(el.className).to.include('entry--placeholder');
    expect(el.querySelector('.entry-title h3').textContent).to.be.a('string');
    expect(el.querySelector('.entry-subtitle p').textContent).to.be.a('string');
  });

  it('renders stored structured title/subtitle when available', function() {
    const entry = { id: 'x2', content: 'bar', timestamp: Date.now() };
    const summary = { title: 'T', subtitle: 'S' };
    const el = createEntryItem(entry, null, null, JSON.stringify(summary));
    expect(el.className).to.not.include('entry--placeholder');
    expect(el.querySelector('.entry-title h3').textContent).to.equal('T');
    expect(el.querySelector('.entry-subtitle p').textContent).to.equal('S');
  });
});