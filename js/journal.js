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
let currentState = null;

// Initialize Journal page
export const initJournalPage = async (stateParam = null) => {
  try {
    let state;
    if (stateParam) {
      state = stateParam;
      currentState = state;
    } else {
      // Initialize Y.js and wait for it to be ready
      state = await initYjs();
      currentState = state;
      
      // Wait a bit more to ensure IndexedDB has fully loaded existing data
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Get DOM elements
    entriesContainer = document.getElementById('entries-container');
    characterInfoContainer = document.getElementById('character-info-container');
    entryFormContainer = document.getElementById('entry-form-container');
    
    if (!entriesContainer || !entryFormContainer) {
      console.warn('Required journal containers not found');
      return;
    }
    
    // Set up reactive updates with explicit state tracking BEFORE initial render
    onJournalChange(state, () => {
      console.log('=== Journal observer fired ===');
      const currentEntries = getEntries(state);
      console.log('Observer - current entries count:', currentEntries.length);
      console.log('Observer - current entries:', currentEntries);
      console.log('Journal change detected, re-rendering...');
      renderJournalPage(state);
    });
    
    onCharacterChange(state, () => {
      console.log('Character change detected, re-rendering character info...');
      renderCharacterInfo(state);
    });
    
    // Render initial state AFTER observers are set up
    renderJournalPage(state);
    
    // Set up form
    setupEntryForm();
    
    console.log('Journal page initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
  }
};

// Render journal page
export const renderJournalPage = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const entries = getEntries(state);
    
    console.log('=== renderJournalPage called ===');
    console.log('Rendering journal page with', entries.length, 'entries');
    console.log('Entries to render:', entries);
    
    // Render entries - use module-level element if available, otherwise find it
    const entriesElement = entriesContainer || document.getElementById('entries-container');
    console.log('Entries container element:', entriesElement);
    
    if (entriesElement) {
      console.log('Calling renderEntries...');
      renderEntries(entriesElement, entries, {
        onEdit: handleEditEntry,
        onDelete: handleDeleteEntry
      });
      
      // Check what actually got rendered
      console.log('Container after rendering:', entriesElement.innerHTML.length, 'chars');
      console.log('Container children count:', entriesElement.children.length);
    } else {
      console.log('No entries element found!');
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
const setupEntryForm = () => {
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
    
    console.log('=== handleAddEntry called ===');
    console.log('Entry data:', entryData);
    console.log('Current state:', state);
    
    // Validate entry
    if (!isValidEntry(entryData)) {
      console.log('Invalid entry data');
      showNotification('Please fill in both title and content', 'warning');
      return;
    }
    
    // Check existing entries before adding
    const entriesBefore = getEntries(state);
    console.log('Entries before add:', entriesBefore.length, entriesBefore);
    
    // Create new entry
    const newEntry = {
      id: generateId(),
      title: entryData.title.trim(),
      content: entryData.content.trim(),
      timestamp: Date.now()
    };
    
    console.log('Adding new entry:', newEntry);
    
    // Add to Y.js
    addEntry(state, newEntry);
    
    // Check entries after adding
    const entriesAfter = getEntries(state);
    console.log('Entries after add:', entriesAfter.length, entriesAfter);
    
    // Check the raw Y.js map
    const rawMapData = state.journalMap.get('entries');
    console.log('Raw Y.js map data:', rawMapData);
    
    // Clear form
    clearEntryForm();
    
    showNotification('Entry added!', 'success');
    
    // Force re-render to ensure entry appears immediately
    // This helps in case the Y.js observer doesn't fire immediately
    console.log('Forcing re-render...');
    setTimeout(() => {
      renderJournalPage(state);
    }, 50);
    
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
    
    // Force re-render
    setTimeout(() => {
      renderJournalPage(state);
    }, 50);
    
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
      
      // Force re-render
      setTimeout(() => {
        renderJournalPage(state);
      }, 50);
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

// Initialize the journal page when the script loads
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initJournalPage();
  });
}