// Entry UI - Simple re-render approach
// Just render everything fresh on changes

import { formatDate, sortEntriesByDate, parseMarkdown } from './utils.js';
import { updateEntry, deleteEntry } from './yjs.js';

// Simple state for edit mode
let editingEntryId = null;
let editData = { title: '', content: '' };

// Callback for triggering UI updates
let uiUpdateCallback = null;

// Set the UI update callback (called by app.js)
export const setUIUpdateCallback = (callback) => {
  uiUpdateCallback = callback;
};

// Trigger UI update if callback is available
const triggerUIUpdate = () => {
  if (uiUpdateCallback) {
    uiUpdateCallback();
  }
};

// Create entry HTML (view mode)
const createEntryViewHTML = (entry) => `
  <article class="entry" data-entry-id="${entry.id}">
    <header class="entry-header">
      <h3 class="entry-title">${entry.title}</h3>
      <div class="entry-meta">
        <span class="entry-timestamp">${formatDate(entry.timestamp)}</span>
        <button class="edit-btn" data-action="edit" data-entry-id="${entry.id}" title="Edit entry">✏️</button>
        <button class="delete-btn" data-action="delete" data-entry-id="${entry.id}" data-entry-title="${entry.title}" title="Delete entry">🗑️</button>
      </div>
    </header>
    <div class="entry-content">${parseMarkdown(entry.content)}</div>
  </article>
`;

// Create entry HTML (edit mode)
const createEntryEditHTML = (entry) => `
  <article class="entry entry-editing" data-entry-id="${entry.id}">
    <div class="edit-form">
      <input type="text" class="edit-title-input" value="${entry.title}" placeholder="Entry title">
      <textarea class="edit-content-textarea" placeholder="Entry content">${entry.content}</textarea>
      <div class="edit-actions">
        <button data-action="save" data-entry-id="${entry.id}">Save</button>
        <button data-action="cancel">Cancel</button>
      </div>
    </div>
  </article>
`;

// Render all entries (simple approach)
export const renderEntries = (entries = []) => {
  const container = document.getElementById('entries-list') || document.getElementById('entries-container');
  if (!container) {
    console.warn('Entries container not found');
    return;
  }

  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No entries yet. Start writing your adventure!</p></div>';
    return;
  }

  // Sort entries and render
  const sortedEntries = sortEntriesByDate(entries);
  
  container.innerHTML = sortedEntries.map(entry => {
    // If this entry is being edited, render edit form
    if (editingEntryId === entry.id) {
      // Use current edit data or entry data
      const entryToEdit = {
        ...entry,
        title: editData.title || entry.title,
        content: editData.content || entry.content
      };
      return createEntryEditHTML(entryToEdit);
    }
    // Otherwise render normal view
    return createEntryViewHTML(entry);
  }).join('');
  
  // Set up event listeners for buttons using event delegation
  container.removeEventListener('click', handleEntryAction);
  container.addEventListener('click', handleEntryAction);
  
  // Set up input listeners for edit mode
  if (editingEntryId) {
    const titleInput = container.querySelector('.edit-title-input');
    if (titleInput) {
      titleInput.focus();
      // Update edit data when inputs change
      titleInput.oninput = (e) => editData.title = e.target.value;
      const contentInput = container.querySelector('.edit-content-textarea');
      if (contentInput) {
        contentInput.oninput = (e) => editData.content = e.target.value;
      }
    }
  }
};

// Handle entry actions via event delegation
const handleEntryAction = (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  
  event.preventDefault();
  
  switch (action) {
    case 'edit':
      startEdit(event.target.dataset.entryId);
      break;
    case 'delete':
      deleteEntryAction(event.target.dataset.entryId, event.target.dataset.entryTitle);
      break;
    case 'save':
      saveEdit(event.target.dataset.entryId);
      break;
    case 'cancel':
      cancelEdit();
      break;
  }
};

// Start editing an entry
export const startEdit = (entryId) => {
  editingEntryId = entryId;
  editData = { title: '', content: '' }; // Reset edit data
  triggerUIUpdate();
};

// Save edit
export const saveEdit = (entryId) => {
  const titleInput = document.querySelector('.edit-title-input');
  const contentInput = document.querySelector('.edit-content-textarea');
  
  if (!titleInput || !contentInput) return;
  
  const newTitle = titleInput.value.trim();
  const newContent = contentInput.value.trim();
  
  if (!newTitle || !newContent) {
    alert('Title and content cannot be empty');
    return;
  }

  // Update in YJS (this will trigger re-render)
  updateEntry(entryId, newTitle, newContent);
  
  // Exit edit mode
  editingEntryId = null;
  editData = { title: '', content: '' };
};

// Cancel edit
export const cancelEdit = () => {
  editingEntryId = null;
  editData = { title: '', content: '' };
  triggerUIUpdate();
};

// Delete entry
export const deleteEntryAction = (entryId, entryTitle) => {
  const confirmed = confirm(`Are you sure you want to delete "${entryTitle}"?`);
  if (!confirmed) return;
  
  // Delete from YJS (this will trigger re-render)
  deleteEntry(entryId);
};

// Focus entry title input (for main form)
export const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) titleInput.focus();
};

// Export for compatibility
export { startEdit as enableEditMode, saveEdit, cancelEdit, deleteEntryAction as handleDeleteEntry };