// Part Page - renders a single Part with title, summary, and entries list
import { initYjs, getYjsState, getEntries } from './yjs.js';
import { getSummary } from './yjs.js';
import { getPartEntriesKey } from './parts.js';
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

  const title = getSummary(state, `journal:part:${partIndex}:title`) || `Part ${partIndex}`;
  const summary = getSummary(state, `journal:part:${partIndex}`) || '';
  titleEl.textContent = title;
  summaryEl.textContent = summary || 'No summary available.';

  const idsJson = getSummary(state, getPartEntriesKey(partIndex));
  let ids = [];
  try { ids = JSON.parse(idsJson || '[]'); } catch {}
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
  render(state, part);
};

init();

