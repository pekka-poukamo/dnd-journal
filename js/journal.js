// Journal Page - Simplified Direct Y.js Integration
import { 
  initYjs,
  getCharacterData,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  onCharacterChange,
  onJournalChange
} from './simple-yjs.js';

import {
  renderCharacterSummary,
  renderEntries,
  createEntryEditForm,
  showNotification,
  getFormData,
  clearForm
} from './journal-views.js';

import { generateId } from './utils.js';

// Current editing state
let currentEditingEntryId = null;

// Initialize the journal page
const initJournalPage = async () => {
  try {
    // Initialize Y.js
    await initYjs();
    
    // Set up reactive rendering - direct Y.js observers
    onCharacterChange(renderJournalPage);
    onJournalChange(renderJournalPage);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderJournalPage();
    
  } catch (error) {
    console.error('Failed to initialize journal page:', error);
    showNotification('Failed to load journal page. Please refresh.', 'error');
  }
};

// Render the journal page
const renderJournalPage = () => {
  // Render character summary - direct from Y.js
  const characterContainer = document.querySelector('.character-info-container');
  if (characterContainer) {
    const character = getCharacterData();
    renderCharacterSummary(characterContainer, character);
  }
  
  // Render journal entries - direct from Y.js
  const entriesContainer = document.getElementById('entries-list');
  if (entriesContainer) {
    const entries = getEntries();
    renderEntries(entriesContainer, entries, handleEditEntry, handleDeleteEntry);
  }
};

// Set up event listeners
const setupEventListeners = () => {
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
  
  // Direct Y.js operation
  addEntry(entry);
  clearForm(event.target);
  showNotification('Journal entry added!', 'success');
};

// Handle editing an entry
const handleEditEntry = (entryId) => {
  const entries = getEntries();
  const entry = entries.find(e => e.id === entryId);
  
  if (!entry) return;
  
  const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
  if (!entryElement) return;
  
  const editForm = createEntryEditForm(
    entry,
    (updates) => handleSaveEdit(entryId, updates),
    () => handleCancelEdit(entryId)
  );
  
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
  
  // Direct Y.js operation
  updateEntry(entryId, {
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
  
  const editForm = entryElement.querySelector('.entry-edit-form');
  if (editForm) editForm.remove();
  
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
    // Direct Y.js operation
    deleteEntry(entryId);
    showNotification('Entry deleted!', 'success');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initJournalPage);

// Export for testing
export { 
  initJournalPage,
  renderJournalPage 
};