// Entry UI - DOM rendering and editing for journal entries
// Direct YJS data binding

import { formatDate, sortEntriesByDate } from './utils.js';
import { createElement, createElementWithAttributes } from './dom-utils.js';
import { updateEntry, deleteEntry } from './yjs-direct.js';

// Simple markdown parsing
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>') // Code
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // H3
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // H2
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // H1
    // Handle unordered lists
    .replace(/^- (.+)(\n- .+)*/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^- /, '').trim()).join('</li><li>');
      return `<ul><li>${items}</li></ul>`;
    })
    // Handle ordered lists
    .replace(/^\d+\. (.+)(\n\d+\. .+)*/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\d+\. /, '').trim()).join('</li><li>');
      return `<ol><li>${items}</li></ol>`;
    })
    .replace(/\n\n/g, '__PARAGRAPH__') // Paragraph breaks
    .replace(/\n/g, '__LINE_BREAK__') // Line breaks
    .replace(/__PARAGRAPH__/g, '</p><p>') // Convert paragraph breaks
    .replace(/^/, '<p>') // Start with paragraph
    .replace(/$/, '</p>') // End with paragraph
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/__LINE_BREAK__/g, '<br>'); // Single line breaks
};

// Create delete button
export const createDeleteButton = (entry) => {
  const deleteBtn = createElement('button', 'delete-btn', '🗑️');
  deleteBtn.onclick = () => handleDeleteEntry(entry.id, entry.title);
  deleteBtn.title = 'Delete entry';
  return deleteBtn;
};

// Create edit button
export const createEditButton = (entry, entryDiv) => {
  const editBtn = createElement('button', 'edit-btn', '✏️');
  editBtn.onclick = () => enableEditMode(entryDiv, entry);
  editBtn.title = 'Edit entry';
  return editBtn;
};

// Create entry element
export const createEntryElement = (entry) => {
  const entryDiv = createElement('article', 'entry');
  entryDiv.dataset.entryId = entry.id;

  // Create header with title and meta info
  const header = createElement('header', 'entry-header');
  
  const title = createElement('h3', 'entry-title', entry.title);
  const meta = createElement('div', 'entry-meta');
  
  const timestamp = createElement('span', 'entry-timestamp', formatDate(entry.timestamp));
  
  // Create action buttons
  const deleteBtn = createDeleteButton(entry);
  const editBtn = createEditButton(entry, entryDiv);
  
  meta.appendChild(timestamp);
  meta.appendChild(editBtn);
  meta.appendChild(deleteBtn);
  
  header.appendChild(title);
  header.appendChild(meta);

  // Create content
  const content = createElement('div', 'entry-content');
  content.innerHTML = parseMarkdown(entry.content);

  entryDiv.appendChild(header);
  entryDiv.appendChild(content);

  return entryDiv;
};

// Create empty state element
export const createEmptyStateElement = () => {
  const emptyDiv = createElement('div', 'empty-state');
  const message = createElement('p', '', 'No entries yet. Start writing your adventure!');
  emptyDiv.appendChild(message);
  return emptyDiv;
};

// Render entries list
export const renderEntries = (entries = []) => {
  const container = document.getElementById('entries-list') || document.getElementById('entries-container');
  if (!container) {
    console.warn('Entries container not found');
    return;
  }

  // Clear existing content
  container.innerHTML = '';

  if (entries.length === 0) {
    const emptyState = createEmptyStateElement();
    container.appendChild(emptyState);
    return;
  }

  // Sort entries by date (newest first)
  const sortedEntries = sortEntriesByDate(entries);

  // Create and append entry elements
  sortedEntries.forEach(entry => {
    const entryElement = createEntryElement(entry);
    container.appendChild(entryElement);
  });
};

// Create edit form elements
export const createEditForm = (entry) => {
  const editForm = createElement('div', 'edit-form');
  
  const titleInput = createElementWithAttributes('input', {
    type: 'text',
    value: entry.title,
    className: 'edit-title-input'
  });
  
  const contentTextarea = createElementWithAttributes('textarea', {
    textContent: entry.content,
    className: 'edit-content-textarea'
  });
  
  const saveBtn = createElement('button', '', 'Save');
  const cancelBtn = createElement('button', '', 'Cancel');
  
  editForm.appendChild(titleInput);
  editForm.appendChild(contentTextarea);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);
  
  return {
    editForm,
    titleInput,
    contentTextarea,
    saveBtn,
    cancelBtn
  };
};

// Enable edit mode for an entry
export const enableEditMode = (entryDiv, entry) => {
  try {
    const title = entryDiv.querySelector('.entry-title');
    const content = entryDiv.querySelector('.entry-content');
    const headerActions = entryDiv.querySelector('.entry-meta');
    
    if (!title || !content || !headerActions) {
      console.error('Entry elements not found');
      return;
    }
    
    // Create edit form
    const { editForm, titleInput, contentTextarea, saveBtn, cancelBtn } = createEditForm(entry);
    
    // Set up event handlers
    saveBtn.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
    cancelBtn.onclick = () => cancelEdit(entryDiv, entry);
    
    // Hide original content and show edit form
    title.style.display = 'none';
    content.style.display = 'none';
    headerActions.style.display = 'none';
    
    entryDiv.appendChild(editForm);
    titleInput.focus();
  } catch (error) {
    console.error('Error enabling edit mode:', error);
  }
};

// Save edit changes
export const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  try {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Title and content cannot be empty');
      return;
    }

    // Update entry directly in YJS
    updateEntry(entry.id, newTitle.trim(), newContent.trim());

    // Update the entry object for local display
    entry.title = newTitle.trim();
    entry.content = newContent.trim();
    entry.timestamp = Date.now();

    // Remove edit form and restore display
    const editForm = entryDiv.querySelector('.edit-form');
    if (editForm) {
      editForm.remove();
    }
    
    const title = entryDiv.querySelector('.entry-title');
    const content = entryDiv.querySelector('.entry-content');
    const headerActions = entryDiv.querySelector('.entry-meta');
    
    if (title && content && headerActions) {
      title.textContent = newTitle.trim();
      title.style.display = '';
      content.innerHTML = parseMarkdown(newContent.trim());
      content.style.display = '';
      headerActions.style.display = '';
    }
  } catch (error) {
    console.error('Error saving edit:', error);
    alert('Failed to save changes');
  }
};

// Cancel edit mode
export const cancelEdit = (entryDiv, entry) => {
  try {
    const editForm = entryDiv.querySelector('.edit-form');
    if (editForm) {
      editForm.remove();
    }
    
    const title = entryDiv.querySelector('.entry-title');
    const content = entryDiv.querySelector('.entry-content');
    const headerActions = entryDiv.querySelector('.entry-meta');
    
    if (title && content && headerActions) {
      title.style.display = '';
      content.style.display = '';
      headerActions.style.display = '';
    }
  } catch (error) {
    console.error('Error cancelling edit:', error);
  }
};

// Handle entry deletion
export const handleDeleteEntry = (entryId, entryTitle) => {
  try {
    const confirmed = confirm(`Are you sure you want to delete "${entryTitle}"?`);
    if (!confirmed) return;

    // Delete directly from YJS
    deleteEntry(entryId);
  } catch (error) {
    console.error('Error deleting entry:', error);
    alert('Failed to delete entry');
  }
};

// Focus entry title input
export const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) titleInput.focus();
};