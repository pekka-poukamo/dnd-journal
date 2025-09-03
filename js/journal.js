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
  clearSessionQuestions
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

import { generateId, isValidEntry, formatDate, getFormData, showNotification } from './utils.js';
import { PART_SIZE_DEFAULT, recomputeRecentSummary, maybeCloseOpenPart } from './parts.js';

import { generateQuestions } from './ai.js';
import { hasContext as hasGoodContext } from './context.js';
import { clearSummary, summarize } from './summarization.js';
import { isAIEnabled } from './ai.js';

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
      // Trigger background summarization for any entries lacking summary
      summarizeMissingEntrySummaries(state).catch(() => {});
      renderAIPromptWithLogic(state);
    });

    onCharacterChange(state, () => {
      renderCharacterInfo(state);
      renderAIPromptWithLogic(state);
    });

    onQuestionsChange(state, () => {
      renderAIPromptWithLogic(state);
    });
    
    // Set up AI prompt (can be async)
    setupAIPrompt(state);
    // Kick off background summarization for current entries
    summarizeMissingEntrySummaries(state).catch(() => {});
    
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
    const summariesIndex = buildPrecomputedSummariesIndex(state, entries);
    
    // Render entries - use module-level element if available, otherwise find it
    const entriesElement = entriesContainer || document.getElementById('entries-container');
    
    if (entriesElement) {
      renderEntries(entriesElement, entries, {
        onEdit: handleEditEntry,
        onDelete: handleDeleteEntry,
        getPrecomputedSummary: (entry) => summariesIndex.get(entry.id) || null
      });
    }
    
    // Render character info
    renderCharacterInfo(state);
    
  } catch (error) {
    console.error('Failed to render journal page:', error);
  }
};

// Summarize entries that do not yet have a structured summary and update DOM inline
const summarizeMissingEntrySummaries = async (stateParam = null) => {
  const state = stateParam || getYjsState();
  const entries = getEntries(state);
  for (const entry of entries) {
    const key = `entry:${entry.id}`;
    const have = state.summariesMap.get(key);
    if (have) continue;
    if (!isAIEnabled()) break;
    try {
      const result = await summarize(key, entry.content);
      // Update any rendered entry element if present
      const element = document.querySelector(`[data-entry-id="${entry.id}"]`);
      if (element && result && result.title && result.subtitle && result.summary) {
        const titleElement = element.querySelector('.entry-title h3');
        const subtitleElement = element.querySelector('.entry-subtitle p');
        const summaryElement = element.querySelector('.entry-summary p');
        if (titleElement) titleElement.textContent = result.title;
        if (subtitleElement) subtitleElement.textContent = result.subtitle;
        if (summaryElement) summaryElement.textContent = result.summary;
        element.classList.remove('entry--placeholder');
      }
    } catch {}
  }
};

// Build a map of entry.id -> precomputed structured summary object or serialized string
const buildPrecomputedSummariesIndex = (state, entries) => {
  const index = new Map();
  try {
    entries.forEach((entry) => {
      const key = `entry:${entry.id}`;
      const existing = state.summariesMap.get(key);
      if (existing) {
        index.set(entry.id, existing);
      }
    });
  } catch {}
  return index;
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
    const entry = {
      id: generateId(),
      content: trimmedData.content,
      timestamp: Date.now()
    };

    addEntry(state, entry);
    // Summaries: try closing part if threshold reached, otherwise update recent summary
    maybeCloseOpenPart(state, PART_SIZE_DEFAULT).then((closed) => {
      if (!closed) {
        return recomputeRecentSummary(state, PART_SIZE_DEFAULT);
      }
    }).catch(() => {});
    clearSessionQuestions(state); // Clear questions when journal data changes
    clearEntryForm();
    showNotification('Entry added successfully!', 'success');
    
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
    // Clear recent (open part) summary so it can refresh; keep stable parts intact
    clearSummary('journal:recent-summary');
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
      deleteEntry(state, entryId);
      
      // Clear cache when entry is deleted
      clearSummary(`entry:${entryId}`);
      clearSummary('journal:recent-summary');
      clearSessionQuestions(state); // Clear questions when journal data changes
      
      showNotification('Entry deleted successfully!', 'success');
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