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
let aiPromptText = null;
let regenerateBtn = null;

// Initialize Journal page
export const initJournalPage = async (stateParam = null) => {
  try {
    const state = stateParam || (await initYjs(), getYjsState());
    
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
    
    // Render initial state
    renderJournalPage(state);
    
    // Set up reactive updates
    onJournalChange(state, async () => {
      renderJournalPage(state);
      await renderAIPromptWithLogic(state);
    });
    
    onCharacterChange(state, async () => {
      renderCharacterInfo(state);
      await renderAIPromptWithLogic(state);
    });
    
    // Set up form
    setupEntryForm();
    
    // Set up AI prompt
    await setupAIPrompt(state);
    
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
    if (!isValidEntry(entryData)) {
      showNotification('Please fill in both title and content', 'warning');
      return;
    }
    
    // Create new entry
    const newEntry = {
      id: generateId(),
      title: entryData.title.trim(),
      content: entryData.content.trim(),
      timestamp: Date.now()
    };
    
    // Add to Y.js
    addEntry(state, newEntry);
    
    // Clear form
    clearEntryForm();
    
    showNotification('Entry added!', 'success');
    
  } catch (error) {
    console.error('Failed to add entry:', error);
    showNotification('Failed to add entry', 'error');
  }
};

// Handle editing entry
export const handleEditEntry = (entryId) => {
  try {
    const state = getYjsState();
    const entries = getEntries(state);
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      showNotification('Entry not found', 'error');
      return;
    }
    
    // Create edit form
    const editForm = createEntryEditForm(entry, {
      onSave: (updatedData) => {
        saveEntryEdit(entryId, updatedData);
      },
      onCancel: () => {
        renderJournalPage(); // Re-render to remove edit form
      }
    });
    
    // Replace entry with edit form
    const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (entryElement && entryElement.parentNode) {
      entryElement.parentNode.replaceChild(editForm, entryElement);
    }
    
  } catch (error) {
    console.error('Failed to edit entry:', error);
    showNotification('Failed to edit entry', 'error');
  }
};

// Save entry edit
export const saveEntryEdit = (entryId, updatedData) => {
  try {
    const state = getYjsState();
    
    // Validate updated data
    if (!isValidEntry(updatedData)) {
      showNotification('Please fill in both title and content', 'warning');
      return;
    }
    
    // Update entry
    updateEntry(state, entryId, {
      title: updatedData.title.trim(),
      content: updatedData.content.trim()
    });
    
    showNotification('Entry updated!', 'success');
    
  } catch (error) {
    console.error('Failed to save entry edit:', error);
    showNotification('Failed to save entry', 'error');
  }
};

// Handle deleting entry
export const handleDeleteEntry = (entryId) => {
  try {
    const state = getYjsState();
    
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteEntry(state, entryId);
      showNotification('Entry deleted', 'success');
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
const setupAIPrompt = async (state) => {
  if (!aiPromptText) return;
  
  // Set up regenerate button if available
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => handleRegeneratePrompt(state));
  }
  
  // Initial render
  await renderAIPromptWithLogic(state);
};

// Handle regenerate button click
const handleRegeneratePrompt = async (stateParam = null) => {
  const state = stateParam || getYjsState();
  await renderAIPromptWithLogic(state);
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



// Initialize the journal page when the script loads
document.addEventListener('DOMContentLoaded', () => {
  initJournalPage();
});