// Part Page - renders a single Part with title, summary, and entries list
import { initYjs, getYjsState, getEntries, ensureChronicleStructure, getChroniclePartsMap } from './yjs.js';
import { onJournalChange, onSummariesChange } from './yjs.js';
import { onChronicleChange } from './yjs.js';
import { backfillPartsIfMissing, PART_SIZE_DEFAULT } from './parts.js';
import { createEntryItem } from './components/entry-item.js';

const getQueryParam = (name) => {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch {
    return null;
  }
};

const render = (state, partIndex) => {
  const titleEl = document.getElementById('part-title');
  const summaryEl = document.getElementById('part-summary-content');
  const listEl = document.getElementById('part-entries-list');
  if (!titleEl || !summaryEl || !listEl) return;

  const parts = getChroniclePartsMap(state);
  const partObj = parts.get(String(partIndex));
  console.debug('[Part] render: partIndex=', partIndex, 'hasPart=', !!partObj);
  if (!partObj) {
    titleEl.textContent = `Part ${partIndex}`;
    summaryEl.textContent = 'No summary available.';
    listEl.textContent = 'No entries for this part.';
    return;
  }
  const title = (partObj && partObj.get('title')) || `Part ${partIndex}`;
  const summary = (partObj && partObj.get('summary')) || '';
  titleEl.textContent = title;
  summaryEl.textContent = summary || 'No summary available.';

  const ids = (partObj && partObj.get('entries') && partObj.get('entries').toArray()) || [];
  console.debug('[Part] entries ids =', ids);
  const allEntries = getEntries(state);
  const idToEntry = new Map(allEntries.map(e => [e.id, e]));
  listEl.innerHTML = '';
  ids.forEach((id) => {
    const entry = idToEntry.get(id);
    if (entry) {
      const el = createEntryItem(entry, null, null);
      listEl.appendChild(el);
    }
  });
};

const init = async () => {
  await initYjs();
  const state = getYjsState();
  const part = parseInt(getQueryParam('part') || '0', 10);
  if (!Number.isFinite(part) || part <= 0) return;
  console.debug('[Part] init: entries before backfill =', getEntries(state).length);
  // Lazy backfill on Part page to ensure missing summaries/titles are generated
  await backfillPartsIfMissing(state, PART_SIZE_DEFAULT);
  console.debug('[Part] after backfill: latestPartIndex =', ensureChronicleStructure(state).get('latestPartIndex'));
  render(state, part);

  // React to data arriving later via IndexedDB or sync
  onJournalChange(state, () => {
    const s = getYjsState();
    console.debug('[Part] journal changed: entries =', getEntries(s).length);
    backfillPartsIfMissing(s, PART_SIZE_DEFAULT).then(() => {
      render(s, part);
    }).catch(() => {});
  });

  onSummariesChange(state, () => {
    const s = getYjsState();
    console.debug('[Part] summaries changed');
    render(s, part);
  });

  onChronicleChange(state, () => {
    const s = getYjsState();
    console.debug('[Part] chronicle changed');
    render(s, part);
  });

  // Observe changes within the parts map (e.g., when part data loads from persistence)
  const partsMap = getChroniclePartsMap(state);
  partsMap.observe(() => {
    const s = getYjsState();
    console.debug('[Part] parts map changed');
    render(s, part);
  });
};

init();

