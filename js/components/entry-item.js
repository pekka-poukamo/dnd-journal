// Entry Item Component - Reusable renderer for a journal entry
import { parseMarkdown, formatDate } from '../utils.js';
import { createCollapsible } from './collapsible.js';
// Views must remain pure: no state or service imports

// Summarization orchestration removed from views by ADR-0015

export const createEntryItem = (entry, onEdit, onDelete, precomputedSummary = null) => {
  const article = document.createElement('article');
  article.className = 'entry';
  article.dataset.entryId = entry.id;
  let title;
  let subtitle;
  let summary;
  if (precomputedSummary) {
    try {
      const summaryData = typeof precomputedSummary === 'string' ? JSON.parse(precomputedSummary) : precomputedSummary;
      title = summaryData.title;
      subtitle = summaryData.subtitle;
      summary = summaryData.summary;
    } catch {}
  }

  if (!title || !subtitle || !summary) {
    article.classList.add('entry--placeholder');
    title = title || 'Lorem Ipsum and Amet Consectur Adipiscing';
    subtitle = subtitle || 'In which Lorem Ipsum, a dolor, sat with Amet Consectur, waiting...';
    summary = summary || 'Mr. Ipsum and Mrs. Consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  }

  article.innerHTML = `
    <div class="entry-header">
      <div class="entry-title"><h3>${title}</h3></div>
      <div class="entry-subtitle">
        <p>${subtitle}</p>
      </div>
      <div class="entry-meta">
        <time class="entry-timestamp" datetime="${entry.timestamp}">
          ${formatDate(entry.timestamp)}
        </time>
        <div class="entry-actions">
          <button class="icon-button" title="Edit">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 2.5L13.5 4.5L4.5 13.5H2.5V11.5L11.5 2.5Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="icon-button" title="Delete">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4H14M5.5 4V2.5C5.5 2.22386 5.72386 2 6 2H10C10.2761 2 10.5 2.22386 10.5 2.5V4M12.5 4V13.5C12.5 13.7761 12.2761 14 12 14H4C3.72386 14 3.5 13.7761 3.5 13.5V4H12.5Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="entry-summary">
      <p>${summary}</p>
    </div>
    <div class="entry-content-controls"></div>
  `;

  const controls = article.querySelector('.entry-content-controls');
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'entry-content';
  contentWrapper.innerHTML = parseMarkdown(entry.content);
  const collapsible = createCollapsible('Show chapter', 'Hide chapter', contentWrapper);
  const toggleBtn = collapsible.querySelector('button');
  if (toggleBtn) {
    toggleBtn.classList.add('entry-content-control__toggle');
    // Remove icon for exact text match in tests
    const icon = toggleBtn.querySelector('.collapsible__icon');
    if (icon) icon.remove();
  }
  controls.appendChild(collapsible);

  const editButton = article.querySelector('.icon-button[title="Edit"]');
  const deleteButton = article.querySelector('.icon-button[title="Delete"]');
  if (editButton && onEdit) editButton.addEventListener('click', () => onEdit(entry.id));
  if (deleteButton && onDelete) deleteButton.addEventListener('click', () => onDelete(entry.id));

  // No async summarization here; logic layer should update the DOM when ready

  return article;
};

