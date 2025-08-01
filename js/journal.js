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
export const initJournalPage = async (stateParam = null) => {
  try {
    console.log('🚀 Starting journal page initialization...');
    
    const state = stateParam || (await initYjs(), getYjsState());
    console.log('✅ Y.js state initialized:', state);
    
    // Get DOM elements
    entriesContainer = document.getElementById('entries-container');
    characterInfoContainer = document.getElementById('character-info-container');
    entryFormContainer = document.getElementById('entry-form-container');
    
    console.log('📋 DOM elements found:', {
      entriesContainer: !!entriesContainer,
      characterInfoContainer: !!characterInfoContainer,
      entryFormContainer: !!entryFormContainer
    });
    
    if (!entriesContainer || !entryFormContainer) {
      console.warn('⚠️ Required journal containers not found');
      return;
    }
    
    // Render initial state
    console.log('🎨 Rendering initial journal page...');
    renderJournalPage(state);
    
    // Set up reactive updates
    console.log('🔄 Setting up reactive updates...');
    onJournalChange(state, () => {
      console.log('📝 Journal data changed, re-rendering...');
      renderJournalPage(state);
    });
    
    onCharacterChange(state, () => {
      console.log('👤 Character data changed, updating info...');
      renderCharacterInfo(state);
    });
    
    // Set up form
    console.log('📝 Setting up entry form...');
    setupEntryForm();
    
    console.log('✅ Journal page initialization complete!');
    
  } catch (error) {
    console.error('❌ Failed to initialize journal page:', error);
    console.error('Full error stack:', error.stack);
  }
};

// Render journal page
export const renderJournalPage = (stateParam = null) => {
  try {
    console.log('🎨 Rendering journal page...');
    const state = stateParam || getYjsState();
    const entries = getEntries(state);
    
    console.log('📊 Current entries:', entries.length, entries);
    
    // Render entries - use module-level element if available, otherwise find it
    const entriesElement = entriesContainer || document.getElementById('entries-container');
    if (entriesElement) {
      console.log('📝 Rendering entries to container...');
      renderEntries(entriesElement, entries, {
        onEdit: handleEditEntry,
        onDelete: handleDeleteEntry
      });
    } else {
      console.warn('⚠️ Entries container not found for rendering');
    }
    
    // Render character info
    console.log('👤 Rendering character info...');
    renderCharacterInfo(state);
    
  } catch (error) {
    console.error('❌ Failed to render journal page:', error);
    console.error('Full error stack:', error.stack);
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
    console.log('➕ Adding new entry:', entryData);
    const state = stateParam || getYjsState();
    
    // Validate entry
    if (!isValidEntry(entryData)) {
      console.warn('⚠️ Invalid entry data:', entryData);
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
    
    console.log('📝 Created entry object:', newEntry);
    
    // Add to Y.js
    addEntry(state, newEntry);
    console.log('💾 Entry added to Y.js');
    
    // Clear form
    clearEntryForm();
    console.log('🧹 Form cleared');
    
    showNotification('Entry added!', 'success');
    
  } catch (error) {
    console.error('❌ Failed to add entry:', error);
    console.error('Full error stack:', error.stack);
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

// Initialize the journal page when the script loads
document.addEventListener('DOMContentLoaded', () => {
  initJournalPage();
});