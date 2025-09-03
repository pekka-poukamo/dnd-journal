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
  // Lazy backfill on Part page to ensure missing summaries/titles are generated
  await backfillPartsIfMissing(state, PART_SIZE_DEFAULT);
  render(state, part);

  // React to data arriving later via IndexedDB or sync
  onJournalChange(state, () => {
    const s = getYjsState();
    backfillPartsIfMissing(s, PART_SIZE_DEFAULT).then(() => {
      render(s, part);
    }).catch(() => {});
  });

  onSummariesChange(state, () => {
    const s = getYjsState();
    render(s, part);
  });

  onChronicleChange(state, () => {
    const s = getYjsState();
    render(s, part);
  });
};

init();

