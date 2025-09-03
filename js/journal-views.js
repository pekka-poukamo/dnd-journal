// Journal Views - Pure Rendering Functions for Journal Page
import { parseMarkdown, formatDate, sortEntriesByDate, getFormData, formatAIPromptText, showNotification } from './utils.js';
import {
  getCachedJournalEntries,
  getCachedCharacterData,
  getCachedSessionQuestions,
  getFormDataForPage
} from './navigation-cache.js';
// Views must remain pure: no state or service imports
import { getWordCount } from './utils.js';
import { isAIEnabled } from './ai.js';
import { createEntryItem } from './components/entry-item.js';

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
export const createEntryElement = (entry, onEdit, onDelete) => createEntryItem(entry, onEdit, onDelete);

// Create entry summary section with collapsible full content
// Accept optional precomputed summary to avoid orchestrating in views
export const createEntrySummarySection = (entry, precomputedSummary = null) => {
  const summarySection = document.createElement('div');
  summarySection.className = 'entry-summary-section';
  if (precomputedSummary) {
    summarySection.appendChild(createSummaryDisplay(precomputedSummary, entry));
  } else {
    summarySection.appendChild(createSummaryDisplay(null, entry));
  }
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

// Summarization orchestration removed from views by ADR-0015

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
      const pre = typeof options.getPrecomputedSummary === 'function' ? options.getPrecomputedSummary(entry) : null;
      const entryElement = createEntryElement(entry, options.onEdit, options.onDelete, pre);
      recentSection.appendChild(entryElement);
    });
    fragment.appendChild(recentSection);

    // Section: Older Adventures (collapsible with meta summary)
    const olderSection = document.createElement('section');
    olderSection.className = 'entries-section entries-section--older';

    const olderHeader = document.createElement('h3');
    olderHeader.textContent = 'Older Adventures';
    olderSection.appendChild(olderHeader);

    // Phase 7: Remove legacy meta summary UI from Journal

    // Collapsible list of older entries
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

    // Populate older entries inside collapsible
    olderEntries.forEach(entry => {
      const pre = typeof options.getPrecomputedSummary === 'function' ? options.getPrecomputedSummary(entry) : null;
      const entryElement = createEntryElement(entry, options.onEdit, options.onDelete, pre);
      olderContentDiv.appendChild(entryElement);
    });

    collapsible.appendChild(toggleButton);
    collapsible.appendChild(olderContentDiv);
    olderSection.appendChild(collapsible);

    fragment.appendChild(olderSection);

    // Replace container content
    container.innerHTML = '';
    container.appendChild(fragment);

    // Phase 7: No meta summary rendering in Journal
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
      const pre = typeof options.getPrecomputedSummary === 'function' ? options.getPrecomputedSummary(entry) : null;
      const entryElement = createEntryElement(entry, options.onEdit, options.onDelete, pre);
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
  // Phase I cleanup: Journal no longer renders or stores overall meta summary
  targetElement.innerHTML = '';
  return Promise.resolve(null);
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
    const pre = null;
    const newSummarySection = createEntrySummarySection(entry, pre);
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

