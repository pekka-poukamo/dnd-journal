// Chronicle Views - Pure rendering functions
import { createCollapsible } from './components/collapsible.js';
import { formatDate, parseMarkdown } from './utils.js';

export const renderSoFar = (container, text) => {
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(createCollapsible('Show summary', 'Hide summary', text));
};

export const renderRecent = (container, text) => {
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(createCollapsible('Show summary', 'Hide summary', text));
};

export const renderPartsList = (container, parts, idToEntry) => {
  if (!container) return;
  if (!parts || parts.length === 0) {
    container.textContent = 'No parts yet.';
    return;
  }
  const list = document.createElement('div');
  parts.forEach((p) => {
    const partDiv = document.createElement('div');
    partDiv.className = 'part-list-item';
    const title = p.title || `Part ${p.index}`;
    const ids = Array.isArray(p.entries) ? p.entries : [];
    let firstTs = '';
    let lastTs = '';
    if (ids.length > 0) {
      const first = idToEntry.get(ids[0]);
      const last = idToEntry.get(ids[ids.length - 1]);
      firstTs = first ? formatDate(first.timestamp) : '';
      lastTs = last ? formatDate(last.timestamp) : '';
    }
    partDiv.innerHTML = `<div class="part-list-item__header"><strong>${title}</strong>${firstTs && lastTs ? ` — ${firstTs} to ${lastTs}` : ''}</div>`;
    const viewLink = document.createElement('a');
    viewLink.href = `/part.html?part=${p.index}`;
    viewLink.textContent = 'View Part';
    viewLink.className = 'btn btn-secondary';
    partDiv.appendChild(viewLink);
    list.appendChild(partDiv);
  });
  container.innerHTML = '';
  container.appendChild(list);
};

