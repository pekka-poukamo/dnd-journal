import { sortEntriesByDate, formatDate } from '../utils.js';
import { createEntryItem } from './entry-item.js';

export const renderEntries = (container, entries, options = {}) => {
  if (!container) return;

  if (entries.length === 0) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('No journal entries yet. Start writing your adventure!'));
    return;
  }

  const sortedEntries = options.sortOrder === 'asc'
    ? [...entries].sort((a, b) => a.timestamp - b.timestamp)
    : sortEntriesByDate(entries);

  if (sortedEntries.length > 10) {
    const recentEntries = sortedEntries.slice(0, 5);
    const olderEntries = sortedEntries.slice(5);

    const fragment = document.createDocumentFragment();

    const recentSection = document.createElement('section');
    recentSection.className = 'entries-section entries-section--recent';
    const recentHeader = document.createElement('h3');
    recentHeader.textContent = 'Recent Adventures';
    recentSection.appendChild(recentHeader);

    recentEntries.forEach((entry) => {
      const pre = typeof options.getPrecomputedSummary === 'function' ? options.getPrecomputedSummary(entry) : null;
      const entryElement = createEntryItem(entry, options.onEdit, options.onDelete, pre);
      recentSection.appendChild(entryElement);
    });
    fragment.appendChild(recentSection);

    const olderSection = document.createElement('section');
    olderSection.className = 'entries-section entries-section--older';
    const olderHeader = document.createElement('h3');
    olderHeader.textContent = 'Older Adventures';
    olderSection.appendChild(olderHeader);

    const collapsible = document.createElement('div');
    collapsible.className = 'entry-collapsible';

    const toggleButton = document.createElement('button');
    toggleButton.className = 'entry-summary__toggle';
    toggleButton.type = 'button';
    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'entry-summary__label';
    toggleLabel.textContent = 'Show Older Entries';
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'entry-summary__icon';
    toggleIcon.textContent = '▼';
    toggleButton.appendChild(toggleLabel);
    toggleButton.appendChild(toggleIcon);

    const olderContentDiv = document.createElement('div');
    olderContentDiv.className = 'entry-summary__content';
    olderContentDiv.style.display = 'none';

    toggleButton.addEventListener('click', () => {
      const isExpanded = olderContentDiv.style.display !== 'none';
      olderContentDiv.style.display = isExpanded ? 'none' : 'block';
      toggleButton.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
      toggleLabel.textContent = isExpanded ? 'Show Older Entries' : 'Hide Older Entries';
    });

    olderEntries.forEach((entry) => {
      const pre = typeof options.getPrecomputedSummary === 'function' ? options.getPrecomputedSummary(entry) : null;
      const entryElement = createEntryItem(entry, options.onEdit, options.onDelete, pre);
      olderContentDiv.appendChild(entryElement);
    });

    collapsible.appendChild(toggleButton);
    collapsible.appendChild(olderContentDiv);
    olderSection.appendChild(collapsible);

    fragment.appendChild(olderSection);

    container.innerHTML = '';
    container.appendChild(fragment);
    return;
  }

  const existingEntries = new Map();
  const existingElements = container.querySelectorAll('[data-entry-id]');
  existingElements.forEach((element) => {
    const entryId = element.dataset.entryId;
    if (entryId) existingEntries.set(entryId, element);
  });

  const fragment = document.createDocumentFragment();
  const updatedIds = new Set();

  sortedEntries.forEach((entry) => {
    updatedIds.add(entry.id);
    const existingElement = existingEntries.get(entry.id);
    if (existingElement) {
      updateEntryElement(existingElement, entry, options.onEdit, options.onDelete);
      fragment.appendChild(existingElement);
    } else {
      const pre = typeof options.getPrecomputedSummary === 'function' ? options.getPrecomputedSummary(entry) : null;
      const entryElement = createEntryItem(entry, options.onEdit, options.onDelete, pre);
      fragment.appendChild(entryElement);
    }
  });

  existingElements.forEach((element) => {
    const entryId = element.dataset.entryId;
    if (entryId && !updatedIds.has(entryId)) element.remove();
  });

  container.innerHTML = '';
  container.appendChild(fragment);
};

const createEmptyState = (message) => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  const p = document.createElement('p');
  p.textContent = message;
  emptyDiv.appendChild(p);
  return emptyDiv;
};

const updateEntryElement = (element, entry, onEdit, onDelete) => {
  const timestampElement = element.querySelector('.entry-timestamp');
  if (timestampElement) {
    const formattedDate = formatDate(entry.timestamp);
    if (timestampElement.textContent !== formattedDate) {
      timestampElement.textContent = formattedDate;
      timestampElement.dateTime = new Date(entry.timestamp).toISOString();
    }
  }

  const editButton = element.querySelector('.entry-actions button:first-child');
  const deleteButton = element.querySelector('.entry-actions button:last-child');
  if (editButton) editButton.onclick = () => onEdit(entry.id);
  if (deleteButton) deleteButton.onclick = () => onDelete(entry.id);
};

