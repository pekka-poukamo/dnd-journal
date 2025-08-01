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

import {
  getCachedJournalEntries,
  getCachedCharacterData,
  getCachedFormData,
  saveNavigationCache,
  saveCurrentFormData
} from './navigation-cache.js';

import {
  renderCharacterSummary,
  renderEntries,
  createEntryForm,
  createEntryEditForm,
  showNotification,
  renderAIPrompt
} from './journal-views.js';

import { generateId, isValidEntry, formatDate } from './utils.js';

import { generateQuestions, hasGoodContext } from './storytelling.js';
import { isAPIAvailable } from './openai-wrapper.js';

// State management
let entriesContainer = null;
let characterInfoContainer = null;
let entryFormContainer = null;
let currentState = null;
let aiPromptText = null;
let regenerateBtn = null;

// Initialize Journal page
export const initJournalPage = async (stateParam = null) => {
  try {
    // Get DOM elements first
    entriesContainer = document.getElementById('entries-container');
    characterInfoContainer = document.getElementById('character-info-container');
    entryFormContainer = document.getElementById('entry-form-container');
    aiPromptText = document.getElementById('ai-prompt-text');
    regenerateBtn = document.getElementById('regenerate-prompt-btn');
    
    if (!entriesContainer || !entryFormContainer) {
      console.warn('Required journal containers not found');
      return;
    }
    
    // 1. Show cached content immediately (eliminates blank page)
    renderCachedContent();
    
    // 2. Initialize Yjs in background
    const state = stateParam || (await initYjs());
    currentState = state;
    
    // 3. Set up reactive updates with explicit state tracking
    onJournalChange(state, () => {
      renderJournalPage(state);
      renderAIPromptWithLogic(state);
      // Save to cache when data changes
      saveNavigationCache(state);
    });

    onCharacterChange(state, () => {
      renderCharacterInfo(state);
      renderAIPromptWithLogic(state);
      // Save to cache when data changes
      saveNavigationCache(state);
    });
    
    // 4. Replace cached content with fresh Yjs data
    renderJournalPage(state);
    
    // 5. Set up form with cached data
    setupEntryForm();
    
    // 6. Set up AI prompt
    setupAIPrompt(state);
    
    // 7. Set up navigation cache saving on page unload
    setupNavigationCaching(state);
    
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
      showNotification('Please fill in both title and content', 'warning');
      return;
    }

    // Trim whitespace
    const trimmedData = {
      title: entryData.title?.trim(),
      content: entryData.content?.trim()
    };

    if (!trimmedData.title || !trimmedData.content) {
      showNotification('Please fill in both title and content', 'warning');
      return;
    }

    // Create entry with ID and timestamp
    const entry = {
      id: generateId(),
      title: trimmedData.title,
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
      showNotification('Please fill in both title and content', 'warning');
      return;
    }

    // Trim whitespace
    const trimmedData = {
      title: entryData.title?.trim(),
      content: entryData.content?.trim()
    };

    if (!trimmedData.title || !trimmedData.content) {
      showNotification('Please fill in both title and content', 'warning');
      return;
    }

    updateEntry(state, entryId, trimmedData);
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
    if (!isAPIAvailable()) {
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

// Pure function to render cached content immediately
const renderCachedContent = () => {
  // Render cached journal entries
  const cachedEntries = getCachedJournalEntries();
  if (cachedEntries.length > 0) {
    renderEntries(entriesContainer, cachedEntries, {
      onEdit: () => {}, // Disabled during cache phase
      onDelete: () => {}, // Disabled during cache phase
      onSave: () => {}  // Disabled during cache phase
    });
  }
  
  // Render cached character info
  const cachedCharacter = getCachedCharacterData();
  if (Object.keys(cachedCharacter).length > 0) {
    renderCharacterSummary(characterInfoContainer, cachedCharacter);
  }
  
  // Show loading indicator for real-time content
  if (aiPromptText) {
    aiPromptText.textContent = 'Loading writing prompt...';
  }
};

// Pure function to set up navigation caching
const setupNavigationCaching = (state) => {
  // Save cache before page unload
  const handleBeforeUnload = () => {
    saveNavigationCache(state);
    
    // Save any current form data
    const formData = getCurrentFormData();
    if (formData) {
      saveCurrentFormData('journal', formData);
    }
  };
  
  // Set up event listener
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Also save cache periodically during user activity
  const handleActivity = () => {
    saveNavigationCache(state);
  };
  
  // Save on user activity (debounced)
  let activityTimeout;
  const debouncedActivity = () => {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(handleActivity, 2000); // 2 second delay
  };
  
  document.addEventListener('input', debouncedActivity);
  document.addEventListener('change', debouncedActivity);
};

// Pure function to get current form data
const getCurrentFormData = () => {
  const form = entryFormContainer?.querySelector('form');
  if (!form) return null;
  
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return Object.keys(data).length > 0 ? data : null;
};

// Initialize the journal page when the script loads
document.addEventListener('DOMContentLoaded', () => {
  initJournalPage();
});