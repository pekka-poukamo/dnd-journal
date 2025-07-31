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
  showNotification
} from './journal-views.js';

import { generateId, isValidEntry, formatDate } from './utils.js';

// State management
let entriesContainer = null;
let characterInfoContainer = null;
let entryFormContainer = null;

// Initialize Journal page
export const initJournalPage = async () => {
  try {
    await initYjs();
    const state = getYjsState();
    
    // Get DOM elements
    entriesContainer = document.getElementById('entries-container');
    characterInfoContainer = document.getElementById('character-info-container');
    entryFormContainer = document.getElementById('entry-form-container');
    
    if (!entriesContainer || !entryFormContainer) {
      console.warn('Required journal containers not found');
      return;
    }
    
    // Render initial state
    renderJournalPage();
    
    // Set up reactive updates
    onJournalChange(state, () => {
      renderJournalPage();
    });
    
    onCharacterChange(state, () => {
      renderCharacterInfo();
    });
    
    // Set up form
    setupEntryForm();
    
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
  }
};

// Render journal page
export const renderJournalPage = () => {
  try {
    const state = getYjsState();
    const entries = getEntries(state);
    
    // Render entries
    if (entriesContainer) {
      renderEntries(entriesContainer, entries, {
        onEdit: handleEditEntry,
        onDelete: handleDeleteEntry
      });
    }
    
    // Render character info
    renderCharacterInfo();
    
  } catch (error) {
    console.error('Failed to render journal page:', error);
  }
};

// Render character information
const renderCharacterInfo = () => {
  try {
    if (!characterInfoContainer) return;
    
    const state = getYjsState();
    const character = getCharacterData(state);
    
    renderCharacterSummary(characterInfoContainer, character);
  } catch (error) {
    console.error('Failed to render character info:', error);
  }
};

// Set up entry form
const setupEntryForm = () => {
  if (!entryFormContainer) return;
  
  const form = createEntryForm({
    onSubmit: handleAddEntry,
    onCancel: clearEntryForm
  });
  
  entryFormContainer.appendChild(form);
};

// Handle adding new entry
const handleAddEntry = (entryData) => {
  try {
    const state = getYjsState();
    
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
const handleEditEntry = (entryId) => {
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
const saveEntryEdit = (entryId, updatedData) => {
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
const handleDeleteEntry = (entryId) => {
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
const clearEntryForm = () => {
  const form = entryFormContainer?.querySelector('form');
  if (form) {
    form.reset();
  }
};