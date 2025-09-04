import { renderEntries } from './entry-list.js';

const createCollapsibleSummary = (text) => {
  const wrapper = document.createElement('div');
  const toggleButton = document.createElement('button');
  toggleButton.className = 'entry-summary__toggle';
  toggleButton.type = 'button';
  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'entry-summary__label';
  toggleLabel.textContent = 'Show summary';
  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'entry-summary__icon';
  toggleIcon.textContent = '▼';
  toggleButton.appendChild(toggleLabel);
  toggleButton.appendChild(toggleIcon);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-summary__content';
  contentDiv.style.display = 'none';
  contentDiv.innerHTML = text;

  toggleButton.addEventListener('click', () => {
    const isExpanded = contentDiv.style.display !== 'none';
    contentDiv.style.display = isExpanded ? 'none' : 'block';
    toggleButton.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
    toggleLabel.textContent = isExpanded ? 'Show summary' : 'Hide summary';
  });

  wrapper.appendChild(toggleButton);
  wrapper.appendChild(contentDiv);
  return wrapper;
};

export const renderPart = (elements, data, options = {}) => {
  const { titleElement, summaryElement, listElement } = elements;
  const { title, summary, entries } = data;

  if (!titleElement || !summaryElement || !listElement) return;

  titleElement.textContent = title || '';
  summaryElement.innerHTML = '';
  const summaryText = (summary || 'No summary available.').trim();
  const summaryHtml = options.formatText ? options.formatText(summaryText) : summaryText;
  summaryElement.appendChild(createCollapsibleSummary(summaryHtml));

  renderEntries(listElement, entries || [], {
    onEdit: null,
    onDelete: null,
    getPrecomputedSummary: options.getPrecomputedSummary || null,
    sortOrder: options.sortOrder || 'asc'
  });
};

