// Part Page - logic only (no side effects on import)
import { initYjs, getYjsState, getEntries, ensureChronicleStructure, getChroniclePartsMap } from './yjs.js';
import { onJournalChange, onSummariesChange } from './yjs.js';
import { onChronicleChange } from './yjs.js';
import { backfillPartsIfMissing, PART_SIZE_DEFAULT } from './parts.js';
import { renderPart } from './components/part-views.js';

const getQueryParam = (name) => {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch {
    return null;
  }
};

const computePartData = (state, partIndex, providedEntries = null) => {
  const parts = getChroniclePartsMap(state);
  const partObj = parts.get(String(partIndex));
  const fallback = {
    title: `Part ${partIndex}`,
    summary: 'No summary available.',
    entries: []
  };
  if (!partObj) return fallback;
  const title = partObj.get('title') || `Part ${partIndex}`;
  const summary = partObj.get('summary') || 'No summary available.';
  const ids = (partObj.get('entries') && partObj.get('entries').toArray()) || [];
  const allEntries = Array.isArray(providedEntries) ? providedEntries : getEntries(state);
  const idToEntry = new Map(allEntries.map(e => [e.id, e]));
  const entries = ids.map((id) => idToEntry.get(id)).filter(Boolean);
  return { title, summary, entries };
};

export const renderPartPage = (state, partIndex, providedEntries = null) => {
  const data = computePartData(state, partIndex, providedEntries);
  const titleElement = document.getElementById('part-title');
  const summaryElement = document.getElementById('part-summary-content');
  const listElement = document.getElementById('part-entries-list');
  renderPart({ titleElement, summaryElement, listElement }, data);
};

export const initPartPage = async (stateParam = null, partIndexParam = null) => {
  const state = stateParam || (await initYjs(), getYjsState());
  const part = partIndexParam != null ? partIndexParam : parseInt(getQueryParam('part') || '0', 10);
  if (!Number.isFinite(part) || part <= 0) return { unsubscribe: () => {} };

  await backfillPartsIfMissing(state, PART_SIZE_DEFAULT);
  renderPartPage(state, part, getEntries(state));

  const offFns = [];
  offFns.push(onJournalChange(state, () => {
    const s = getYjsState();
    const entries = getEntries(s);
    backfillPartsIfMissing(s, PART_SIZE_DEFAULT).then(() => {
      renderPartPage(s, part, entries);
    }).catch(() => {});
  }));
  offFns.push(onSummariesChange(state, () => {
    const s = getYjsState();
    renderPartPage(s, part, getEntries(s));
  }));
  offFns.push(onChronicleChange(state, () => {
    const s = getYjsState();
    renderPartPage(s, part, getEntries(s));
  }));
  const partsMap = getChroniclePartsMap(state);
  const observer = () => {
    const s = getYjsState();
    renderPartPage(s, part, getEntries(s));
  };
  partsMap.observe(observer);
  offFns.push(() => partsMap.unobserve(observer));

  const unsubscribe = () => {
    while (offFns.length) {
      const off = offFns.pop();
      try { off && off(); } catch {}
    }
  };
  return { unsubscribe };
};

// Initialize when DOM is ready (align with other pages)
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initPartPage();
  });
}

