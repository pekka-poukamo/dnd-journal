import { renderEntries } from './entry-list.js';

export const renderPart = (containerIds, data) => {
  const { titleId, summaryId, listId } = containerIds;
  const { title, summary, entries } = data;

  const titleEl = document.getElementById(titleId);
  const summaryEl = document.getElementById(summaryId);
  const listEl = document.getElementById(listId);
  if (!titleEl || !summaryEl || !listEl) return;

  titleEl.textContent = title || '';
  summaryEl.textContent = summary || 'No summary available.';
  renderEntries(listEl, entries || [], { onEdit: null, onDelete: null });
};

