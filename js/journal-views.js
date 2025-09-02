// Journal Views - Pure Rendering Functions for Journal Page
import { parseMarkdown, formatDate, sortEntriesByDate, getFormData, formatAIPromptText, showNotification } from './utils.js';
import {
  getCachedJournalEntries,
  getCachedCharacterData,
  getCachedSessionQuestions,
  getFormDataForPage
} from './navigation-cache.js';
import { summarize } from './summarization.js';
import { getYjsState, getSummary } from './yjs.js';
import { getWordCount } from './utils.js';
import { isAIEnabled } from './ai.js';

// Create journal entry form
export const createEntryForm = (options = {}) => {
  const form = document.createElement('form');
  form.id = 'entry-form';
  form.className = 'entry-form';
  
  form.innerHTML = `
    <div class="form-group">
      <label for="entry-content">Notes</label>
      <textarea id="entry-content" name="content" class="form-textarea" rows="4" placeholder="Write your journal entry here..." required></textarea>
    </div>
    <div class="form-group">
      <button type="submit" class="btn btn-primary">Add Entry</button>
    </div>
  `;
  
  // Set up form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const entryData = {
      content: formData.get('content')
    };
    
    if (options.onSubmit) {
      options.onSubmit(entryData);
    }
  });
  
  return form;
};

// Create single journal entry element with summary display by default
export const createEntryElement = (entry, onEdit, onDelete) => {
  const article = document.createElement('article');
  article.className = 'entry';
  article.dataset.entryId = entry.id;

  // Check if we have structured content from AI
  // Get summary from the summaries map, not from the entry object
  const state = getYjsState();
  const summaryKey = `entry:${entry.id}`;
  const storedSummary = getSummary(state, summaryKey);
  
  let title, subtitle, summary;
  if (storedSummary) {
    try {
      const summaryData = JSON.parse(storedSummary);
      title = summaryData.title;
      subtitle = summaryData.subtitle;
      summary = summaryData.summary;
    } catch (e) {
      console.error('Failed to parse stored summary:', e);
    }
  }
  
  // If no structured content, use placeholders
  if (!title || !subtitle || !summary) {
    article.classList.add('entry--placeholder');
    title = title || `Lorem Ipsum and Amet Consectur Adipiscing`;
    subtitle = subtitle || `In which Lorem Ipsum, a dolor, sat with Amet Consectur, waiting...`;
    summary = summary || `Mr. Ipsum and Mrs. Consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;
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
  
  // Add event listener to the toggle button
  const toggleButton = article.querySelector('.entry-content-control__toggle');
  const entryContent = article.querySelector('.entry-content');
  
  toggleButton.addEventListener('click', () => {
    entryContent.classList.toggle('entry-content--hidden');
    
    // Update button text based on current state
    if (entryContent.classList.contains('entry-content--hidden')) {
      toggleButton.textContent = 'Show chapter';
    } else {
      toggleButton.textContent = 'Hide chapter';
    }
  });
  
  // Set up edit and delete handlers
  const editButton = article.querySelector('.icon-button[title="Edit"]');
  const deleteButton = article.querySelector('.icon-button[title="Delete"]');
  
  if (editButton && onEdit) {
    editButton.addEventListener('click', () => onEdit(entry.id));
  }
  
  if (deleteButton && onDelete) {
    deleteButton.addEventListener('click', () => onDelete(entry.id));
  }
  
  // If AI is enabled and we don't have a summary yet, generate one
  if (isAIEnabled() && !storedSummary) {
    // Generate summary asynchronously and update the display
    generateSummaryAsync(entry, article);
  }
  
  return article;
};

// Create entry summary section with collapsible full content
export const createEntrySummarySection = (entry) => {
  const summarySection = document.createElement('div');
  summarySection.className = 'entry-summary-section';
  
  // Always start with full content display and let summarize() handle cache checking
  summarySection.appendChild(createSummaryDisplay(null, entry));
  generateSummaryAsync(entry, summarySection);
  
  return summarySection;
};

// Create summary display with collapsible full content
const createSummaryDisplay = (summary, entry) => {
  const container = document.createElement('div');
  container.className = 'entry-content-container';
  
  if (summary) {
    // Show summary by default
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'entry-summary-text';
    summaryDiv.innerHTML = parseMarkdown(summary);
    container.appendChild(summaryDiv);
    
    // Add collapsible full content section
    const collapsibleSection = createCollapsibleFullContent(entry);
    container.appendChild(collapsibleSection);
  } else {
    // Show full content while summary is being generated
    const fullContentDiv = document.createElement('div');
    fullContentDiv.className = 'entry-content';
    fullContentDiv.innerHTML = parseMarkdown(entry.content);
    container.appendChild(fullContentDiv);
    
    // Add loading indicator for summary
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'entry-summary-loading';
    loadingDiv.textContent = 'Generating summary...';
    container.appendChild(loadingDiv);
  }
  
  return container;
};

// Create collapsible section for full content
const createCollapsibleFullContent = (entry) => {
  const collapsibleDiv = document.createElement('div');
  collapsibleDiv.className = 'entry-collapsible';
  
  const toggleButton = document.createElement('button');
  toggleButton.className = 'entry-summary__toggle';
  toggleButton.type = 'button';
  
  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'entry-summary__label';
  toggleLabel.textContent = 'Full Entry';
  
  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'entry-summary__icon';
  toggleIcon.textContent = '▼';
  
  toggleButton.appendChild(toggleLabel);
  toggleButton.appendChild(toggleIcon);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-summary__content';
  contentDiv.style.display = 'none';
  contentDiv.innerHTML = parseMarkdown(entry.content);
  
  // Toggle functionality
  toggleButton.addEventListener('click', () => {
    const isExpanded = contentDiv.style.display !== 'none';
    contentDiv.style.display = isExpanded ? 'none' : 'block';
    toggleButton.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
  });
  
  collapsibleDiv.appendChild(toggleButton);
  collapsibleDiv.appendChild(contentDiv);
  
  return collapsibleDiv;
};

// Generate summary asynchronously and update display
const generateSummaryAsync = (entry, targetElement) => {
  const summaryKey = `entry:${entry.id}`;
  
  return summarize(summaryKey, entry.content)
    .then(result => {
      // Check if we got structured content or just a summary
      if (result && typeof result === 'object' && result.title && result.subtitle && result.summary) {
        // We have structured content - update the entry display
        const entryElement = targetElement.closest('.entry') || targetElement;
        if (entryElement) {
          // Update title, subtitle, and summary
          const titleElement = entryElement.querySelector('.entry-title h3');
          const subtitleElement = entryElement.querySelector('.entry-subtitle p');
          const summaryElement = entryElement.querySelector('.entry-summary p');
          
          if (titleElement) titleElement.textContent = result.title;
          if (subtitleElement) subtitleElement.textContent = result.subtitle;
          if (summaryElement) summaryElement.textContent = result.summary;
          
          // Remove placeholder class since we now have real content
          entryElement.classList.remove('entry--placeholder');
        }
        
        return result.summary;
      } else {
        // Fallback to old behavior - just a summary string
        return result;
      }
    })
    .catch(error => {
      console.error('Failed to generate summary:', error);
      throw error;
    });
};

// Create edit form for an entry
export const createEntryEditForm = (entry, options = {}) => {
  const form = document.createElement('form');
  form.className = 'entry-edit-form';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'form-field';
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Content';
  const contentTextarea = document.createElement('textarea');
  contentTextarea.value = entry.content;
  contentTextarea.required = true;
  
  contentDiv.appendChild(contentLabel);
  contentDiv.appendChild(contentTextarea);
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'form-actions';
  
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.textContent = 'Save';
  
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = () => {
    if (options.onCancel) {
      options.onCancel();
    }
  };
  
  actionsDiv.appendChild(saveButton);
  actionsDiv.appendChild(cancelButton);
  
  form.onsubmit = (e) => {
    e.preventDefault();
    if (options.onSave) {
      options.onSave({
        content: contentTextarea.value.trim()
      });
    }
  };
  
  form.appendChild(contentDiv);
  form.appendChild(actionsDiv);
  
  return form;
};

// Create empty state element
export const createEmptyState = (message) => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  const p = document.createElement('p');
  p.textContent = message;
  emptyDiv.appendChild(p);
  return emptyDiv;
};

// Render character summary (simplified for journal page)
export const renderCharacterSummary = (container, character) => {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!character.name && !character.race && !character.class) {
    container.appendChild(createEmptyState('No character information yet.'));
    return;
  }
  
  const characterInfo = document.createElement('div');
  characterInfo.className = 'character-info';
  
  const heading = document.createElement('h2')
  heading.textContent = character.name
  characterInfo.appendChild(heading)

  const subheading = document.createElement('h5')
  subheading.textContent = character.race + ' • ' + character.class
  characterInfo.appendChild(subheading)
  
  container.appendChild(characterInfo);
};

// Render journal entries list with intelligent DOM updates (performance optimized)
export const renderEntries = (container, entries, options = {}) => {
  if (!container) return;
  
  if (entries.length === 0) {
    container.innerHTML = '';
    container.appendChild(createEmptyState('No journal entries yet. Start writing your adventure!'));
    return;
  }
  
  const sortedEntries = sortEntriesByDate(entries);

  // If many entries, reflect summarization logic:
  // - Show latest 5 entries individually (these are included directly in prompts)
  // - Group the rest under a collapsible section with the meta summary visible
  if (sortedEntries.length > 10) {
    // Recent detailed entries: latest 5
    const recentEntries = sortedEntries.slice(0, 5);
    // Older entries: the rest
    const olderEntries = sortedEntries.slice(5);

    const fragment = document.createDocumentFragment();

    // Section: Recent Adventures
    const recentSection = document.createElement('section');
    recentSection.className = 'entries-section entries-section--recent';
    const recentHeader = document.createElement('h3');
    recentHeader.textContent = 'Recent Adventures';
    recentSection.appendChild(recentHeader);

    recentEntries.forEach(entry => {
      const entryElement = createEntryElement(entry, options.onEdit, options.onDelete);
      recentSection.appendChild(entryElement);
    });
    fragment.appendChild(recentSection);

    // Section: Older Adventures (collapsible with meta summary)
    const olderSection = document.createElement('section');
    olderSection.className = 'entries-section entries-section--older';

    const olderHeader = document.createElement('h3');
    olderHeader.textContent = 'Older Adventures';
    olderSection.appendChild(olderHeader);

    const metaSummaryContainer = document.createElement('div');
    metaSummaryContainer.className = 'meta-summary-container';

    const metaSummaryTitle = document.createElement('div');
    metaSummaryTitle.className = 'meta-summary__title';
    metaSummaryTitle.textContent = 'Campaign Chronicle (Adventure Summary)';
    metaSummaryContainer.appendChild(metaSummaryTitle);

    const metaSummaryText = document.createElement('div');
    metaSummaryText.className = 'meta-summary__text';
    metaSummaryText.textContent = 'Generating overall summary...';
    metaSummaryContainer.appendChild(metaSummaryText);

    olderSection.appendChild(metaSummaryContainer);

    // Collapsible list of older entries
    const collapsible = document.createElement('div');
    collapsible.className = 'entry-collapsible meta-summary-collapsible';

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
    olderContentDiv.className = 'entry-summary__content meta-summary__entries';
    olderContentDiv.style.display = 'none';

    toggleButton.addEventListener('click', () => {
      const isExpanded = olderContentDiv.style.display !== 'none';
      olderContentDiv.style.display = isExpanded ? 'none' : 'block';
      toggleButton.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
      toggleLabel.textContent = isExpanded ? 'Show Older Entries' : 'Hide Older Entries';
    });

    // Populate older entries inside collapsible
    olderEntries.forEach(entry => {
      const entryElement = createEntryElement(entry, options.onEdit, options.onDelete);
      olderContentDiv.appendChild(entryElement);
    });

    collapsible.appendChild(toggleButton);
    collapsible.appendChild(olderContentDiv);
    olderSection.appendChild(collapsible);

    fragment.appendChild(olderSection);

    // Replace container content
    container.innerHTML = '';
    container.appendChild(fragment);

    // After render, ensure meta summary is shown (use cached or generate)
    ensureAndRenderMetaSummary(sortedEntries, metaSummaryText);
    return;
  }
  
  // Get existing entry elements for efficient updates
  const existingEntries = new Map();
  const existingElements = container.querySelectorAll('[data-entry-id]');
  existingElements.forEach(element => {
    const entryId = element.dataset.entryId;
    if (entryId) {
      existingEntries.set(entryId, element);
    }
  });
  
  // Use DocumentFragment for efficient DOM manipulation
  const fragment = document.createDocumentFragment();
  const updatedIds = new Set();
  
  sortedEntries.forEach(entry => {
    updatedIds.add(entry.id);
    
    const existingElement = existingEntries.get(entry.id);
    if (existingElement) {
      // Update existing element in place (more efficient than recreation)
      updateEntryElement(existingElement, entry, options.onEdit, options.onDelete);
      fragment.appendChild(existingElement);
    } else {
      // Create new element only if it doesn't exist
      const entryElement = createEntryElement(entry, options.onEdit, options.onDelete);
      fragment.appendChild(entryElement);
    }
  });
  
  // Remove elements for entries that no longer exist
  existingElements.forEach(element => {
    const entryId = element.dataset.entryId;
    if (entryId && !updatedIds.has(entryId)) {
      element.remove();
    }
  });
  
  // Clear container and append optimized fragment
  container.innerHTML = '';
  container.appendChild(fragment);
};

// Ensure meta summary is available and render it into the provided element
const ensureAndRenderMetaSummary = (allEntries, targetElement) => {
  const state = getYjsState();
  const existing = getStoredSummary(state, 'journal:adventure-summary');
  if (existing) {
    targetElement.innerHTML = parseMarkdown(existing);
    return;
  }

  // Build summary source text similar to context.js logic
  const config = { entryWords: 200, metaWords: 1000 };

  const entryPromises = allEntries.map(entry => {
    // Remove dates; include only content or summary
    if (getWordCount(entry.content) > config.entryWords) {
      const key = `entry:${entry.id}`;
      return summarize(key, entry.content, config.entryWords)
        .then(s => `${s}`)
        .catch(() => `${entry.content}`);
    }
    return Promise.resolve(`${entry.content}`);
  });

  return Promise.all(entryPromises)
    .then(parts => parts.join('\n\n'))
    .then(summaryText => summarize('journal:adventure-summary', summaryText, config.metaWords))
    .then(meta => {
      targetElement.innerHTML = parseMarkdown(meta || '');
      return meta;
    })
    .catch(() => {
      // Local-first graceful fallback: concise overview without AI
      const fallback = buildLocalMetaSummary(allEntries, 60);
      targetElement.innerHTML = parseMarkdown(fallback);
      return null;
    });
};

// Build a concise local-only meta summary (no AI). Keeps it readable and short.
const buildLocalMetaSummary = (entries, maxWordsPerEntry = 50) => {
  const lines = entries.map(e => {
    const words = (e.content || '').trim().split(/\s+/).filter(Boolean);
    const snippet = words.slice(0, Math.max(1, maxWordsPerEntry)).join(' ');
    return `- ${snippet}${words.length > maxWordsPerEntry ? '…' : ''}`;
  });
  return `Unable to generate an online campaign chronicle. Local overview:\n\n${lines.join('\n')}`;
};

// Helper function to update existing entry element (performance optimization)
const updateEntryElement = (element, entry, onEdit, onDelete) => {
  // Update summary section - recreate if content changed
  const summarySection = element.querySelector('.entry-summary-section');
  if (summarySection) {
    const newSummarySection = createEntrySummarySection(entry);
    summarySection.replaceWith(newSummarySection);
  }
  
  // Update timestamp
  const timestampElement = element.querySelector('.entry-timestamp');
  if (timestampElement) {
    const formattedDate = formatDate(entry.timestamp);
    if (timestampElement.textContent !== formattedDate) {
      timestampElement.textContent = formattedDate;
      timestampElement.dateTime = new Date(entry.timestamp).toISOString();
    }
  }

  // Update initial word count to original only; summary will update asynchronously
  const wordCountElement = element.querySelector('.entry-word-count');
  if (wordCountElement) {
    const originalCount = getWordCount(entry.content || '');
    // If it already has a full "x (y)" keep it; otherwise set to (original)
    if (!/\d+ \(\d+\)/.test(wordCountElement.textContent || '')) {
      wordCountElement.textContent = `(${originalCount})`;
    }
  }
  
  // Update event handlers
  const editButton = element.querySelector('.entry-actions button:first-child');
  const deleteButton = element.querySelector('.entry-actions button:last-child');
  
  if (editButton) editButton.onclick = () => onEdit(entry.id);
  if (deleteButton) deleteButton.onclick = () => onDelete(entry.id);
};

// showNotification function moved to utils.js for shared use across all view modules



// Clear form inputs
export const clearForm = (form) => {
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
};

// =============================================================================
// AI PROMPT RENDERING FUNCTIONS
// =============================================================================

// Render AI prompt based on provided state data - pure function
export const renderAIPrompt = (aiPromptElement, aiPromptState, regenerateBtn = null) => {
  if (!aiPromptElement) return;
  
  const { type, message, questions } = aiPromptState;
  
  switch (type) {
    case 'api-not-available':
      showAIPromptAPINotAvailable(aiPromptElement, regenerateBtn);
      break;
    case 'no-context':
      showAIPromptNoContext(aiPromptElement, regenerateBtn);
      break;
    case 'loading':
      showAIPromptLoading(aiPromptElement, regenerateBtn);
      break;
    case 'questions':
      showAIPromptQuestions(aiPromptElement, questions, regenerateBtn);
      break;
    case 'error':
      showAIPromptError(aiPromptElement, regenerateBtn);
      break;
    default:
      showAIPromptError(aiPromptElement, regenerateBtn);
  }
};

// Show API not available state
export const showAIPromptAPINotAvailable = (aiPromptElement, regenerateBtn = null) => {
  if (!aiPromptElement) return;
  
  aiPromptElement.className = 'ai-prompt__empty-state';
  aiPromptElement.innerHTML = formatAIPromptText('AI features require an API key to be configured in Settings.');
  
  // Disable regenerate button
  if (regenerateBtn) {
    regenerateBtn.disabled = true;
  }
};

// Show no context state
export const showAIPromptNoContext = (aiPromptElement, regenerateBtn = null) => {
  if (!aiPromptElement) return;
  
  aiPromptElement.className = 'ai-prompt__empty-state';
  aiPromptElement.innerHTML = formatAIPromptText('Add some character details or journal entries to get personalized reflection questions.');
  
  // Disable regenerate button
  if (regenerateBtn) {
    regenerateBtn.disabled = true;
  }
};

// Show loading state
export const showAIPromptLoading = (aiPromptElement, regenerateBtn = null) => {
  if (!aiPromptElement) return;
  
  aiPromptElement.className = 'ai-prompt__text loading';
  aiPromptElement.innerHTML = formatAIPromptText('Generating your personalized reflection questions...');
  
  // Disable regenerate button while loading
  if (regenerateBtn) {
    regenerateBtn.disabled = true;
  }
};

// Show questions state
export const showAIPromptQuestions = (aiPromptElement, questions, regenerateBtn = null) => {
  if (!aiPromptElement) return;
  
  aiPromptElement.className = 'ai-prompt__text';
  aiPromptElement.innerHTML = formatAIPromptText(questions);
  
  // Enable regenerate button
  if (regenerateBtn) {
    regenerateBtn.disabled = false;
  }
};

// Show error state
export const showAIPromptError = (aiPromptElement, regenerateBtn = null) => {
  if (!aiPromptElement) return;
  
  aiPromptElement.className = 'ai-prompt__error-state';
  aiPromptElement.innerHTML = formatAIPromptText('Unable to generate reflection questions. Please try again.');
  
  // Enable regenerate button to allow retry
  if (regenerateBtn) {
    regenerateBtn.disabled = false;
  }
};

// Pure function to render cached content immediately (eliminates blank page)
export const renderCachedJournalContent = (elements) => {
  const { entriesContainer, characterInfoContainer, aiPromptText } = elements;
  
  // Render cached journal entries
  const cachedEntries = getCachedJournalEntries();
  if (cachedEntries.length > 0 && entriesContainer) {
    renderEntries(entriesContainer, cachedEntries, {
      onEdit: () => {}, // Disabled during cache phase
      onDelete: () => {}, // Disabled during cache phase
      onSave: () => {}  // Disabled during cache phase
    });
  }
  
  // Render cached character info
  const cachedCharacter = getCachedCharacterData();
  if (Object.keys(cachedCharacter).length > 0 && characterInfoContainer) {
    renderCharacterSummary(characterInfoContainer, cachedCharacter);
  }
  
  // Show cached session questions if available, otherwise loading indicator
  if (aiPromptText) {
    const cachedQuestions = getCachedSessionQuestions();
    if (cachedQuestions) {
      showAIPromptQuestions(aiPromptText, cachedQuestions);
    } else {
      aiPromptText.innerHTML = formatAIPromptText('Loading writing prompt...');
    }
  }
};

