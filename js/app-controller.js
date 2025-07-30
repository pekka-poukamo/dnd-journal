// Application Controller - Coordinates Data and Views
import { 
  initData, 
  onStateChange, 
  getState,
  updateCharacter,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry 
} from './data.js';

import {
  renderCharacter,
  renderEntries,
  createEntryEditForm,
  showNotification,
  getFormData,
  clearForm
} from './views.js';

import { generateId } from './utils.js';

// Application state
let currentEditingEntryId = null;

// Initialize the application
export const initApp = async () => {
  // Initialize data layer
  await initData();
  
  // Set up reactive rendering
  onStateChange(handleStateChange);
  
  // Set up event listeners
  setupEventListeners();
  
  // Initial render
  renderApplication();
};

// Handle state changes from Y.js
const handleStateChange = (state) => {
  renderApplication();
};

// Render the entire application
const renderApplication = () => {
  const state = getState();
  
  // Render character info
  const characterContainer = document.querySelector('.character-info-container');
  if (characterContainer) {
    renderCharacter(characterContainer, state.character);
  }
  
  // Render journal entries
  const entriesContainer = document.getElementById('entries-list');
  if (entriesContainer) {
    renderEntries(entriesContainer, state.entries, handleEditEntry, handleDeleteEntry);
  }
};

// Set up all event listeners
const setupEventListeners = () => {
  // Character form submission
  const characterForm = document.getElementById('character-form');
  if (characterForm) {
    characterForm.addEventListener('submit', handleCharacterFormSubmit);
  }
  
  // Journal entry form submission
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', handleEntryFormSubmit);
  }
  
  // Character form field changes (for reactive updates)
  const characterInputs = document.querySelectorAll('#character-form input, #character-form textarea');
  characterInputs.forEach(input => {
    input.addEventListener('blur', handleCharacterFieldChange);
  });
};

// Handle character form submission
const handleCharacterFormSubmit = (event) => {
  event.preventDefault();
  const formData = getFormData(event.target);
  
  // Update each field in Y.js
  Object.entries(formData).forEach(([field, value]) => {
    updateCharacter(field, value.trim());
  });
  
  showNotification('Character information saved!', 'success');
};

// Handle character field changes (for real-time updates)
const handleCharacterFieldChange = (event) => {
  const field = event.target.name;
  const value = event.target.value.trim();
  
  if (field) {
    updateCharacter(field, value);
  }
};

// Handle journal entry form submission
const handleEntryFormSubmit = (event) => {
  event.preventDefault();
  const formData = getFormData(event.target);
  
  if (!formData.title || !formData.content) {
    showNotification('Please fill in both title and content.', 'error');
    return;
  }
  
  const entry = {
    id: generateId(),
    title: formData.title.trim(),
    content: formData.content.trim(),
    timestamp: Date.now()
  };
  
  addJournalEntry(entry);
  clearForm(event.target);
  showNotification('Journal entry added!', 'success');
};

// Handle editing an entry
const handleEditEntry = (entryId) => {
  const state = getState();
  const entry = state.entries.find(e => e.id === entryId);
  
  if (!entry) return;
  
  // Find the entry element in the DOM
  const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
  if (!entryElement) return;
  
  // Create edit form
  const editForm = createEntryEditForm(
    entry,
    (updates) => handleSaveEdit(entryId, updates),
    () => handleCancelEdit(entryId)
  );
  
  // Hide the entry content and show edit form
  const entryContent = entryElement.querySelector('.entry-content');
  const entryHeader = entryElement.querySelector('.entry-header');
  
  if (entryContent && entryHeader) {
    entryContent.style.display = 'none';
    entryHeader.style.display = 'none';
    entryElement.appendChild(editForm);
    
    currentEditingEntryId = entryId;
  }
};

// Handle saving entry edit
const handleSaveEdit = (entryId, updates) => {
  if (!updates.title || !updates.content) {
    showNotification('Please fill in both title and content.', 'error');
    return;
  }
  
  updateJournalEntry(entryId, {
    title: updates.title,
    content: updates.content
  });
  
  handleCancelEdit(entryId);
  showNotification('Entry updated!', 'success');
};

// Handle canceling entry edit
const handleCancelEdit = (entryId) => {
  const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
  if (!entryElement) return;
  
  // Remove edit form
  const editForm = entryElement.querySelector('.entry-edit-form');
  if (editForm) {
    editForm.remove();
  }
  
  // Show the entry content again
  const entryContent = entryElement.querySelector('.entry-content');
  const entryHeader = entryElement.querySelector('.entry-header');
  
  if (entryContent && entryHeader) {
    entryContent.style.display = '';
    entryHeader.style.display = '';
  }
  
  currentEditingEntryId = null;
};

// Handle deleting an entry
const handleDeleteEntry = (entryId) => {
  if (confirm('Are you sure you want to delete this entry?')) {
    deleteJournalEntry(entryId);
    showNotification('Entry deleted!', 'success');
  }
};

// Export for testing
export const getCurrentEditingEntryId = () => currentEditingEntryId;