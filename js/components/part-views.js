import { renderEntries } from './entry-list.js';

export const renderPart = (elements, data) => {
  const { titleElement, summaryElement, listElement } = elements;
  const { title, summary, entries } = data;

  if (!titleElement || !summaryElement || !listElement) return;

  titleElement.textContent = title || '';
  summaryElement.textContent = summary || 'No summary available.';
  renderEntries(listElement, entries || [], { onEdit: null, onDelete: null });
};

