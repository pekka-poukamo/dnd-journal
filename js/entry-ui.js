// Entry UI - Simple re-render approach
// Just render everything fresh on changes

import { formatDate, sortEntriesByDate } from './utils.js';
import { updateEntry, deleteEntry } from './yjs-direct.js';

// Simple state for edit mode
let editingEntryId = null;
let editData = { title: '', content: '' };

// Simple markdown parsing
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^- (.+)(\n- .+)*/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^- /, '').trim()).join('</li><li>');
      return `<ul><li>${items}</li></ul>`;
    })
    .replace(/^\d+\. (.+)(\n\d+\. .+)*/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\d+\. /, '').trim()).join('</li><li>');
      return `<ol><li>${items}</li></ol>`;
    })
    .replace(/\n\n/g, '__PARAGRAPH__')
    .replace(/\n/g, '__LINE_BREAK__')
    .replace(/__PARAGRAPH__/g, '</p><p>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/__LINE_BREAK__/g, '<br>');
};

// Create entry HTML (view mode)
const createEntryViewHTML = (entry) => `
  <article class="entry" data-entry-id="${entry.id}">
    <header class="entry-header">
      <h3 class="entry-title">${entry.title}</h3>
      <div class="entry-meta">
        <span class="entry-timestamp">${formatDate(entry.timestamp)}</span>
        <button class="edit-btn" onclick="startEdit('${entry.id}')" title="Edit entry">✏️</button>
        <button class="delete-btn" onclick="deleteEntryAction('${entry.id}', '${entry.title.replace(/'/g, '\\\'')}')" title="Delete entry">🗑️</button>
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
        <button onclick="saveEdit('${entry.id}')">Save</button>
        <button onclick="cancelEdit()">Cancel</button>
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
  
  // Focus edit field if we're editing
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

// Start editing an entry
export const startEdit = (entryId) => {
  editingEntryId = entryId;
  editData = { title: '', content: '' }; // Reset edit data
  // Trigger re-render (this will be called by the app's update cycle)
  if (window.triggerUIUpdate) window.triggerUIUpdate();
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
  // Trigger re-render
  if (window.triggerUIUpdate) window.triggerUIUpdate();
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

// Make functions globally available (for onclick handlers)
if (typeof window !== 'undefined') {
  window.startEdit = startEdit;
  window.saveEdit = saveEdit;
  window.cancelEdit = cancelEdit;
  window.deleteEntryAction = deleteEntryAction;
}

// Export for compatibility
export { startEdit as enableEditMode, saveEdit, cancelEdit, deleteEntryAction as handleDeleteEntry };