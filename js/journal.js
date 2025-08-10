// Journal Page - Pure Functional Y.js Integration
import { 
  initYjs,
  getYjsState,
  getCharacterData,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  onCharacterChange,
  onJournalChange,
  onQuestionsChange,
  clearSessionQuestions,
  onSettingsChange,
  getSetting
} from './yjs.js';

import { saveNavigationCache, getCachedJournalEntries, preWarmCache, isCacheRecentAndValid } from './navigation-cache.js';

import {
  renderCharacterSummary,
  renderEntries,
  createEntryForm,
  createEntryEditForm,
  renderAIPrompt,
  renderCachedJournalContent
} from './journal-views.js';

import { generateId, isValidEntry, formatDate, getFormData, showNotification, PAGE_SIZE, computeNextSeq, didClosePage, getPageIndexForSeq, getEntriesForPage } from './utils.js';

import { generateQuestions } from './ai.js';
import { hasContext as hasGoodContext } from './context.js';
import { clearSummary } from './summarization.js';
import { isAIEnabled } from './ai.js';
import { summarize } from './summarization.js';
import { onSettingsChange, getSetting } from './yjs.js';

// Paging configuration centralized in utils

// State management
let entriesContainer = null;
let characterInfoContainer = null;
let entryFormContainer = null;
let currentState = null;
let aiPromptText = null;
let regenerateBtn = null;

// Initialize Journal page with optimized loading strategy
export const initJournalPage = async (stateParam = null) => {
  try {
    // Get DOM elements
    entriesContainer = document.getElementById('entries-container');
    characterInfoContainer = document.getElementById('character-info-container');
    entryFormContainer = document.getElementById('entry-form-container');
    aiPromptText = document.getElementById('ai-prompt-text');
    regenerateBtn = document.getElementById('regenerate-prompt-btn');
    
    if (!entriesContainer || !entryFormContainer) {
      console.warn('Required journal containers not found');
      return;
    }
    
    // Only show cached content if it's recent and valid (performance optimization)
    if (isCacheRecentAndValid()) {
      renderCachedJournalContent({
        entriesContainer,
        characterInfoContainer,
        aiPromptText
      });
    }
    
    // Set up form handling early (improves responsiveness)
    setupEntryForm();
    
    // Initialize Yjs asynchronously (non-blocking)
    const state = stateParam || (await initYjs());
    currentState = state;
    
    // Check if we have real data different from cache
    const entries = getEntries(state);
    const cachedEntries = getCachedJournalEntries();
    
    // Always render at least once, or if data is different from cache
    if (!areEntriesEquivalent(entries, cachedEntries) || entries.length > 0 || cachedEntries.length === 0) {
      renderJournalPage(state);
    }
    
    // Pre-warm cache with fresh data for next load (performance optimization)
    preWarmCache(state);
    
    // Set up reactive updates for future changes
    onJournalChange(state, () => {
      renderJournalPage(state);
      renderAIPromptWithLogic(state);
    });

    onCharacterChange(state, () => {
      renderCharacterInfo(state);
      renderAIPromptWithLogic(state);
    });

    // When settings change, if AI just became enabled, process pending summaries in order
    onSettingsChange(state, () => {
      const enabled = getSetting(state, 'ai-enabled', false) && getSetting(state, 'openai-api-key', '');
      if (enabled) {
        processAnchorsAscending(state);
      }
    });

    onQuestionsChange(state, () => {
      renderAIPromptWithLogic(state);
    });
    
    // Set up AI prompt (can be async)
    setupAIPrompt(state);
    
    // Save cache on page unload
    window.addEventListener('beforeunload', () => {
      saveNavigationCache(state);
    });
    
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
  }
};

// Render journal page
export const renderJournalPage = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const entries = getEntries(state);
    
    // Render entries - use module-level element if available, otherwise find it
    const entriesElement = entriesContainer || document.getElementById('entries-container');
    
    if (entriesElement) {
      renderEntries(entriesElement, entries, {
        onEdit: handleEditEntry,
        onDelete: handleDeleteEntry
      });
    }
    
    // Render character info
    renderCharacterInfo(state);
    
  } catch (error) {
    console.error('Failed to render journal page:', error);
  }
};

// Render character information
export const renderCharacterInfo = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const character = getCharacterData(state);
    
    // Use module-level element if available, otherwise find it
    const charInfoElement = characterInfoContainer || document.getElementById('character-summary');
    if (!charInfoElement) return;
    
    renderCharacterSummary(charInfoElement, character);
  } catch (error) {
    console.error('Failed to render character info:', error);
  }
};

// Set up entry form
export const setupEntryForm = () => {
  if (!entryFormContainer) return;
  
  const form = createEntryForm({
    onSubmit: handleAddEntry,
    onCancel: clearEntryForm
  });
  
  entryFormContainer.appendChild(form);
};

// Handle adding new entry
export const handleAddEntry = (entryData, stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    
    // Validate entry
    if (!entryData || !isValidEntry(entryData)) {
      showNotification('Please fill in content', 'warning');
      return;
    }

    // Trim whitespace
    const trimmedData = {
      content: entryData.content?.trim()
    };

    if (!trimmedData.content) {
      showNotification('Please fill in content', 'warning');
      return;
    }

    // Create entry with ID and timestamp
    const existing = getEntries(state);
    const nextSeq = computeNextSeq(existing);
    const entry = {
      id: generateId(),
      seq: nextSeq,
      type: 'user',
      content: trimmedData.content,
      timestamp: Date.now()
    };

    addEntry(state, entry);
    clearSessionQuestions(state); // Clear questions when journal data changes
    clearEntryForm();
    showNotification('Entry added successfully!', 'success');
    
    // If we reached an anchor boundary (every 10 entries), optionally process anchors
    const afterAdd = getEntries(state);
    if (afterAdd.length % PAGE_SIZE === 0) {
      // Create/refresh anchors only when AI is enabled; otherwise defer
      processAnchorsAscending(state);
    }
    
  } catch (error) {
    console.error('Failed to add entry:', error);
    showNotification('Failed to add entry', 'error');
  }
};

// Handle editing entry
export const handleEditEntry = (entryId, stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const entries = getEntries(state);
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      showNotification('Entry not found', 'error');
      return;
    }
    
    // Find the entry element
    const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (!entryElement) return;
    
    // Create edit form
    const editForm = createEntryEditForm(entry, {
      onSave: (updatedData) => saveEntryEdit(entryId, updatedData, state),
      onCancel: () => renderJournalPage(state)
    });
    
    // Replace entry with edit form
    entryElement.replaceWith(editForm);
    
  } catch (error) {
    console.error('Failed to edit entry:', error);
    showNotification('Failed to edit entry', 'error');
  }
};

// Save entry edit
export const saveEntryEdit = (entryId, entryData, stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    
    if (!entryData || !isValidEntry(entryData)) {
      showNotification('Please fill in content', 'warning');
      return;
    }

    // Trim whitespace
    const trimmedData = {
      content: entryData.content?.trim()
    };

    if (!trimmedData.content) {
      showNotification('Please fill in content', 'warning');
      return;
    }

    updateEntry(state, entryId, trimmedData);
    
    // Clear cache when entry content changes
    clearSummary(`entry:${entryId}`);
    clearSessionQuestions(state); // Clear questions when journal data changes
    
    showNotification('Entry updated successfully!', 'success');
    
  } catch (error) {
    console.error('Failed to save entry edit:', error);
    showNotification('Failed to save entry', 'error');
  }
};

// Handle deleting entry
export const handleDeleteEntry = (entryId, stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    
    if (confirm('Are you sure you want to delete this entry?')) {
      // Soft-delete to preserve paging; keep seq stable
      const entries = getEntries(state);
      const target = entries.find(e => e.id === entryId);
      if (target) {
        const placeholder = '[Deleted entry]';
        updateEntry(state, entryId, { deleted: true, content: placeholder });
        clearSummary(`entry:${entryId}`);
        clearSessionQuestions(state); // Clear questions when journal data changes
        showNotification('Entry deleted successfully!', 'success');
      }
    }
    
  } catch (error) {
    console.error('Failed to delete entry:', error);
    showNotification('Failed to delete entry', 'error');
  }
};

// Clear entry form
export const clearEntryForm = () => {
  const form = entryFormContainer?.querySelector('form');
  if (form) {
    form.reset();
  }
};

// =============================================================================
// ANCHOR HELPERS (pure calculations + orchestrators)
// =============================================================================

// computeNextSeq imported from utils

// Build anchor text source for index i: previous anchor + entries (i-1)*10..i*10-1
const buildAnchorSource = (state, index) => {
  const entries = getEntries(state);
  const start = (index - 1) * PAGE_SIZE;
  const end = Math.min(index * PAGE_SIZE, entries.length);
  const chunk = entries.slice(start, end).map(e => e.content || '').join('\n\n');
  if (index <= 1) return chunk;
  const prevKey = `journal:anchor:index:${index - 1}`;
  const prev = getSummary(state, prevKey) || '';
  return prev ? `${prev}\n\n${chunk}` : chunk;
};

const processAnchorsAscending = (state) => {
  try {
    if (!isAIEnabled()) return;
    const total = getEntries(state).length;
    const lastIndex = Math.floor(total / PAGE_SIZE);
    if (lastIndex <= 0) return;
    const buildNext = (i) => {
      if (i > lastIndex) return Promise.resolve();
      const key = `journal:anchor:index:${i}`;
      if (getSummary(state, key)) {
        return buildNext(i + 1);
      }
      const source = buildAnchorSource(state, i);
      return summarize(key, source, 800).then(() => buildNext(i + 1)).catch(() => buildNext(i + 1));
    };
    buildNext(1);
  } catch (err) {
    console.warn('Failed to process anchors:', err);
  }
};
// =============================================================================
// AI PROMPT FUNCTIONALITY
// =============================================================================

// Set up AI prompt section
const setupAIPrompt = (state) => {
  if (!aiPromptText) return;
  
  // Set up regenerate button if available
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => handleRegeneratePrompt(state));
  }
  
  // Initial render
  renderAIPromptWithLogic(state);
};

// Render AI prompt with business logic - determines state and calls pure view function
const renderAIPromptWithLogic = (stateParam = null) => {
  if (!aiPromptText) return Promise.resolve();
  
  const state = stateParam || getYjsState();
  const character = getCharacterData(state);
  const entries = getEntries(state);
  
  // Check API availability first
  if (!isAIEnabled()) {
    renderAIPrompt(aiPromptText, { type: 'api-not-available' }, regenerateBtn);
    return Promise.resolve();
  }
  
  // Check if we have good context for generating questions
  if (!hasGoodContext(character, entries)) {
    renderAIPrompt(aiPromptText, { type: 'no-context' }, regenerateBtn);
    return Promise.resolve();
  }
  
  // When AI is enabled and context is good, ensure regenerate is enabled
  if (regenerateBtn) {
    regenerateBtn.disabled = false;
  }
  
  // Show loading and generate questions
  renderAIPrompt(aiPromptText, { type: 'loading' }, regenerateBtn);
  
  return generateQuestions(character, entries)
    .then(questions => {
      if (questions) {
        renderAIPrompt(aiPromptText, { type: 'questions', questions }, regenerateBtn);
      } else {
        renderAIPrompt(aiPromptText, { type: 'error' }, regenerateBtn);
      }
      return questions;
    })
    .catch(error => {
      console.error('Failed to render AI prompt:', error);
      renderAIPrompt(aiPromptText, { type: 'error' }, regenerateBtn);
      throw error;
    });
};

// Handle regenerate button click
const handleRegeneratePrompt = (stateParam = null) => {
  const state = stateParam || getYjsState();
  const character = getCharacterData(state);
  const entries = getEntries(state);
  
  // Force regeneration when user clicks regenerate
  if (isAIEnabled() && hasGoodContext(character, entries)) {
    renderAIPrompt(aiPromptText, { type: 'loading' }, regenerateBtn);
    
    // Ensure button remains interactive for consecutive retries
    if (regenerateBtn) {
      regenerateBtn.disabled = false;
    }
    
    return generateQuestions(character, entries, true) // Force regenerate
      .then(questions => {
        if (questions) {
          renderAIPrompt(aiPromptText, { type: 'questions', questions }, regenerateBtn);
        } else {
          renderAIPrompt(aiPromptText, { type: 'error' }, regenerateBtn);
        }
        return questions;
      });
  } else {
    return renderAIPromptWithLogic(state);
  }
};

// Helper function to check if entries are equivalent (avoid unnecessary re-renders)
const areEntriesEquivalent = (entries1, entries2) => {
  if (entries1.length !== entries2.length) return false;
  
  // Simple comparison - if lengths match and basic properties are same, consider equivalent
  return entries1.every((entry1, i) => {
    const entry2 = entries2[i];
    return entry1.id === entry2.id && 
           entry1.content === entry2.content &&
           entry1.timestamp === entry2.timestamp;
  });
};


// Initialize the journal page when the script loads
document.addEventListener('DOMContentLoaded', () => {
  initJournalPage();
});