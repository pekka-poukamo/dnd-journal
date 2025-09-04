// Chronicle Page Scaffold - renders placeholders for So Far and Parts list
import { initYjs, getYjsState } from './yjs.js';
import { getEntries } from './yjs.js';
import { ensureChronicleStructure, getChroniclePartsMap } from './chronicle-state.js';
import { onJournalChange, onSummariesChange } from './yjs.js';
import { onChronicleChange } from './yjs.js';
import { PART_SIZE_DEFAULT, backfillPartsIfMissing, recomputeRecentSummary, recomputePartSummary, recomputeSoFarSummary } from './parts.js';
import { formatDate } from './utils.js';
import { renderSoFar as viewRenderSoFar, renderRecent as viewRenderRecent, renderPartsList as viewRenderPartsList } from './chronicle-views.js';

const renderSoFar = (state) => {
  const el = document.getElementById('so-far-content');
  if (!el) return;
  const soFar = ensureChronicleStructure(state).get('soFarSummary');
  viewRenderSoFar(el, soFar);
};

const renderRecent = (state) => {
  const el = document.getElementById('recent-content');
  if (!el) return;
  const recent = ensureChronicleStructure(state).get('recentSummary');
  viewRenderRecent(el, recent);
};

const renderPartsList = (state) => {
  const el = document.getElementById('parts-list');
  if (!el) return;
  const latest = ensureChronicleStructure(state).get('latestPartIndex') || 0;
  const entries = getEntries(state);
  const idToEntry = new Map(entries.map(e => [e.id, e]));
  const parts = getChroniclePartsMap(state);
  const items = [];
  for (let i = 1; i <= latest; i++) {
    const partObj = parts.get(String(i));
    items.push({ index: i, title: partObj && partObj.get('title'), entries: partObj && partObj.get('entries') ? partObj.get('entries').toArray() : [] });
  }
  viewRenderPartsList(el, items, idToEntry);
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

  // React to direct chronicle structure updates (e.g., titles, latestPartIndex)
  onChronicleChange(state, () => {
    const s = getYjsState();
    console.debug('[Chronicle] chronicle changed: latestPartIndex =', ensureChronicleStructure(s).get('latestPartIndex'));
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

  // Optional debug actions via URL flag ?debug=1
  const debugEnabled = (() => {
    try { return new URL(window.location.href).searchParams.get('debug') === '1' || localStorage.getItem('debug-mode') === '1'; } catch { return false; }
  })();
  if (debugEnabled) {
    injectDebugControls();
  }
};

init();

const injectDebugControls = () => {
  const container = document.querySelector('.container-narrow');
  if (!container) return;
  const debugBar = document.createElement('div');
  debugBar.className = 'flex-row gap-8 mt-8';

  const btnSoFar = document.createElement('button');
  btnSoFar.className = 'btn btn-secondary';
  btnSoFar.textContent = 'Regenerate So Far';
  btnSoFar.addEventListener('click', async () => {
    const s = getYjsState();
    await recomputeSoFarSummary(s);
    renderSoFar(s);
  });

  const inputPart = document.createElement('input');
  inputPart.type = 'number';
  inputPart.min = '1';
  inputPart.placeholder = 'Part #';
  inputPart.style.width = '6rem';

  const btnPart = document.createElement('button');
  btnPart.className = 'btn btn-secondary';
  btnPart.textContent = 'Regenerate Part';
  btnPart.addEventListener('click', async () => {
    const s = getYjsState();
    const idx = parseInt(inputPart.value || '0', 10);
    if (Number.isFinite(idx) && idx > 0) {
      await recomputePartSummary(s, idx);
      renderPartsList(s);
    }
  });

  debugBar.appendChild(btnSoFar);
  debugBar.appendChild(inputPart);
  debugBar.appendChild(btnPart);
  container.insertBefore(debugBar, container.firstChild);
};
