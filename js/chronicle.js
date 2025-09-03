// Chronicle Page Scaffold - renders placeholders for So Far and Parts list
import { initYjs, getYjsState } from './yjs.js';
import { getEntries } from './yjs.js';
import { ensureChronicleStructure, getChroniclePartsMap } from './yjs.js';
import { onJournalChange, onSummariesChange } from './yjs.js';
import { PART_SIZE_DEFAULT, backfillPartsIfMissing, recomputeRecentSummary } from './parts.js';
import { formatDate } from './utils.js';

const renderSoFar = (state) => {
  const el = document.getElementById('so-far-content');
  if (!el) return;
  const soFar = ensureChronicleStructure(state).get('soFarSummary');
  el.textContent = soFar || 'No summary yet.';
};

const renderRecent = (state) => {
  const el = document.getElementById('recent-content');
  if (!el) return;
  const recent = ensureChronicleStructure(state).get('recentSummary');
  el.textContent = recent || 'No recent summary yet.';
};

const renderPartsList = (state) => {
  const el = document.getElementById('parts-list');
  if (!el) return;
  const latest = ensureChronicleStructure(state).get('latestPartIndex') || 0;
  if (latest <= 0) {
    el.textContent = 'No parts yet.';
    return;
  }
  const entries = getEntries(state);
  const idToEntry = new Map(entries.map(e => [e.id, e]));
  const list = document.createElement('div');
  for (let i = 1; i <= latest; i++) {
    const partDiv = document.createElement('div');
    partDiv.className = 'part-list-item';

    const parts = getChroniclePartsMap(state);
    const partObj = parts.get(String(i));
    const title = (partObj && partObj.get('title')) || `Part ${i}`;
    const idsJson = JSON.stringify((partObj && partObj.get('entries') && partObj.get('entries').toArray()) || []);
    let firstTs = '';
    let lastTs = '';
    try {
      const ids = JSON.parse(idsJson || '[]');
      if (ids.length > 0) {
        const first = idToEntry.get(ids[0]);
        const last = idToEntry.get(ids[ids.length - 1]);
        firstTs = first ? formatDate(first.timestamp) : '';
        lastTs = last ? formatDate(last.timestamp) : '';
      }
    } catch {}

    partDiv.innerHTML = `<div class="part-list-item__header"><strong>${title}</strong>${firstTs && lastTs ? ` — ${firstTs} to ${lastTs}` : ''}</div>`;
    const viewLink = document.createElement('a');
    viewLink.href = `/part.html?part=${i}`;
    viewLink.textContent = 'View Part';
    viewLink.className = 'btn btn-secondary';
    partDiv.appendChild(viewLink);
    list.appendChild(partDiv);
  }
  el.innerHTML = '';
  el.appendChild(list);
};

const init = async () => {
  await initYjs();
  const state = getYjsState();

  console.debug('[Chronicle] init: entries count before backfill =', getEntries(state).length);
  await backfillPartsIfMissing(state, PART_SIZE_DEFAULT);
  console.debug('[Chronicle] after backfill: latestPartIndex =', ensureChronicleStructure(state).get('latestPartIndex'));
  renderSoFar(state);
  renderRecent(state);
  renderPartsList(state);

  // React to journal changes (e.g., when persistence/ws sync loads entries later)
  onJournalChange(state, () => {
    const s = getYjsState();
    console.debug('[Chronicle] journal changed: entries =', getEntries(s).length);
    backfillPartsIfMissing(s, PART_SIZE_DEFAULT).then(() => {
      renderSoFar(s);
      renderRecent(s);
      renderPartsList(s);
    }).catch(() => {});
  });

  // React to summaries changes which may set soFar/recent or part summaries
  onSummariesChange(state, () => {
    const s = getYjsState();
    console.debug('[Chronicle] summaries changed');
    renderSoFar(s);
    renderRecent(s);
    renderPartsList(s);
  });

  const regenBtn = document.getElementById('regenerate-recent');
  if (regenBtn) {
    regenBtn.addEventListener('click', async () => {
      const s = getYjsState();
      console.debug('[Chronicle] regenerate recent clicked');
      await recomputeRecentSummary(s, PART_SIZE_DEFAULT);
      renderRecent(s);
    });
  }
};

init();

