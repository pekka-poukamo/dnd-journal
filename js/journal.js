// Journal Page Controller - Coordinates Data and Views for Journal
import { 
  initData, 
  onStateChange, 
  getState,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry 
} from './data.js';

import {
  renderCharacterSummary,
  renderEntries,
  createEntryEditForm,
  showNotification,
  getFormData,
  clearForm
} from './journal-views.js';

import { generateId } from './utils.js';

// Application state
let currentEditingEntryId = null;

// Initialize the journal page
const initJournalPage = async () => {
  try {
    // Initialize data layer
    await initData();
    
    // Set up reactive rendering
    onStateChange(handleStateChange);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderJournalPage();
    
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
    showNotification('Failed to load journal page. Please refresh.', 'error');
  }
};

// Handle state changes from Y.js
const handleStateChange = (state) => {
  renderJournalPage();
};

// Render the journal page
const renderJournalPage = () => {
  const state = getState();
  
  // Render character summary
  const characterContainer = document.querySelector('.character-info-container');
  if (characterContainer) {
    renderCharacterSummary(characterContainer, state.character);
  }
  
  // Render journal entries
  const entriesContainer = document.getElementById('entries-list');
  if (entriesContainer) {
    renderEntries(entriesContainer, state.entries, handleEditEntry, handleDeleteEntry);
  }
};

// Set up event listeners
const setupEventListeners = () => {
  // Journal entry form submission
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', handleEntryFormSubmit);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initJournalPage);

// Export for testing
export { 
  initJournalPage,
  handleEntryFormSubmit,
  handleEditEntry,
  handleDeleteEntry,
  renderJournalPage 
};