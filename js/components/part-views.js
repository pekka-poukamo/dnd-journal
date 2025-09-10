import { renderEntries } from './entry-list.js';
import { createCollapsible } from './collapsible.js';

const createCollapsibleSummary = (html) => createCollapsible('Show summary', 'Hide summary', html);

export const renderPart = (elements, data, options = {}) => {
  const { titleElement, summaryElement, listElement } = elements;
  const { title, summary, entries } = data;

  if (!titleElement || !summaryElement || !listElement) return;

  titleElement.textContent = title || '';
  summaryElement.innerHTML = '';
  const summaryText = (summary || 'No summary available.').trim();
  summaryElement.appendChild(createCollapsibleSummary(summaryText));

  renderEntries(listElement, entries || [], {
    onEdit: null,
    onDelete: null,
    getPrecomputedSummary: options.getPrecomputedSummary || null,
    sortOrder: options.sortOrder || 'asc'
  });
};

