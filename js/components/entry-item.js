// Entry Item Component - Reusable renderer for a journal entry
import { parseMarkdown, formatDate } from '../utils.js';
import { getYjsState, getSummary } from '../yjs.js';
import { summarize } from '../summarization.js';
import { isAIEnabled } from '../ai.js';

// Internal: async summary generation mirroring journal-views behavior
const generateSummaryAsync = (entry, targetElement) => {
  const summaryKey = `entry:${entry.id}`;
  return summarize(summaryKey, entry.content)
    .then((result) => {
      if (result && typeof result === 'object' && result.title && result.subtitle && result.summary) {
        const entryElement = targetElement.closest('.entry') || targetElement;
        if (entryElement) {
          const titleElement = entryElement.querySelector('.entry-title h3');
          const subtitleElement = entryElement.querySelector('.entry-subtitle p');
          const summaryElement = entryElement.querySelector('.entry-summary p');
          if (titleElement) titleElement.textContent = result.title;
          if (subtitleElement) subtitleElement.textContent = result.subtitle;
          if (summaryElement) summaryElement.textContent = result.summary;
          entryElement.classList.remove('entry--placeholder');
        }
        return result.summary;
      }
      return result;
    });
};

export const createEntryItem = (entry, onEdit, onDelete) => {
  const article = document.createElement('article');
  article.className = 'entry';
  article.dataset.entryId = entry.id;

  const state = getYjsState();
  const summaryKey = `entry:${entry.id}`;
  const storedSummary = getSummary(state, summaryKey);

  let title;
  let subtitle;
  let summary;
  if (storedSummary) {
    try {
      const summaryData = JSON.parse(storedSummary);
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
    <div class="entry-content entry-content--hidden">
      ${parseMarkdown(entry.content)}
    </div>
    <div class="entry-content-controls">
      <button class="entry-content-control__toggle">Show chapter</button>
    </div>
  `;

  const toggleButton = article.querySelector('.entry-content-control__toggle');
  const entryContent = article.querySelector('.entry-content');
  toggleButton.addEventListener('click', () => {
    entryContent.classList.toggle('entry-content--hidden');
    toggleButton.textContent = entryContent.classList.contains('entry-content--hidden') ? 'Show chapter' : 'Hide chapter';
  });

  const editButton = article.querySelector('.icon-button[title="Edit"]');
  const deleteButton = article.querySelector('.icon-button[title="Delete"]');
  if (editButton && onEdit) editButton.addEventListener('click', () => onEdit(entry.id));
  if (deleteButton && onDelete) deleteButton.addEventListener('click', () => onDelete(entry.id));

  if (isAIEnabled() && !storedSummary) {
    generateSummaryAsync(entry, article).catch(() => {});
  }

  return article;
};

