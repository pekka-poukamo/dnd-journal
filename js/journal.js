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
  onJournalChange
} from './yjs.js';

import { saveNavigationCache, getCachedJournalEntries, preWarmCache, isCacheRecentAndValid } from './navigation-cache.js';

import {
  renderCharacterSummary,
  renderEntries,
  createEntryForm,
  createEntryEditForm,
  showNotification,
  renderAIPrompt,
  renderCachedJournalContent
} from './journal-views.js';

import { generateId, isValidEntry, formatDate, getFormData } from './utils.js';

import { generateQuestions } from './ai.js';
import { hasContext as hasGoodContext } from './context.js';
import { clearSummary } from './summarization.js';
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
      renderAIPromptWithLogic(state);
    });

    onCharacterChange(state, () => {
      renderCharacterInfo(state);
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
    const charInfoElement = characterInfoContainer || document.getElementById('character-info-container');
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
const renderAIPromptWithLogic = async (stateParam = null) => {
  if (!aiPromptText) return;
  
  try {
    const state = stateParam || getYjsState();
    const character = getCharacterData(state);
    const entries = getEntries(state);
    
    // Check API availability first
    if (!isAIEnabled()) {
      renderAIPrompt(aiPromptText, { type: 'api-not-available' }, regenerateBtn);
      return;
    }
    
    // Check if we have good context for generating questions
    if (!hasGoodContext(character, entries)) {
      renderAIPrompt(aiPromptText, { type: 'no-context' }, regenerateBtn);
      return;
    }
    
    // Show loading and generate questions
    renderAIPrompt(aiPromptText, { type: 'loading' }, regenerateBtn);
    const questions = await generateQuestions(character, entries);
    
    if (questions) {
      renderAIPrompt(aiPromptText, { type: 'questions', questions }, regenerateBtn);
    } else {
      renderAIPrompt(aiPromptText, { type: 'error' }, regenerateBtn);
    }
    
  } catch (error) {
    console.error('Failed to render AI prompt:', error);
    renderAIPrompt(aiPromptText, { type: 'error' }, regenerateBtn);
  }
};

// Handle regenerate button click
const handleRegeneratePrompt = async (stateParam = null) => {
  const state = stateParam || getYjsState();
  await renderAIPromptWithLogic(state);
};

// Helper function to check if entries are equivalent (avoid unnecessary re-renders)
const areEntriesEquivalent = (entries1, entries2) => {
  if (entries1.length !== entries2.length) return false;
  
  // Simple comparison - if lengths match and basic properties are same, consider equivalent
  for (let i = 0; i < entries1.length; i++) {
    const entry1 = entries1[i];
    const entry2 = entries2[i];
    
    if (entry1.id !== entry2.id || 
        entry1.content !== entry2.content ||
        entry1.timestamp !== entry2.timestamp) {
      return false;
    }
  }
  
  return true;
};


// Initialize the journal page when the script loads
// Module scripts load after HTML parsing, so DOMContentLoaded might have already fired
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initJournalPage();
  });
} else {
  // DOM is already ready
  initJournalPage();
}