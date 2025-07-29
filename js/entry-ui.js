// Entry UI - DOM rendering and editing for journal entries
// Following functional programming principles and style guide

import { formatDate, sortEntriesByDate } from './utils.js';
import { handleError, createSuccess, safeDomOperation } from './error-handling.js';
import { 
  createElement, 
  createElementWithAttributes,
  setElementHTML,
  clearElement,
  appendChild,
  focusElement
} from './dom-utils.js';
import { updateEntry, deleteEntry } from './entry-management.js';

// Pure function for simple markdown parsing
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

// Pure function to create delete button
export const createDeleteButton = (entry) => {
  return safeDomOperation(() => {
    const deleteBtn = createElement('button', 'delete-btn', '🗑️').data;
    deleteBtn.onclick = () => handleDeleteEntry(entry.id, entry.title);
    deleteBtn.title = 'Delete entry';
    return deleteBtn;
  }, 'createDeleteButton');
};

// Pure function to create edit button
export const createEditButton = (entry, entryDiv) => {
  return safeDomOperation(() => {
    const editBtn = createElement('button', 'edit-btn', '✏️').data;
    editBtn.onclick = () => enableEditMode(entryDiv, entry);
    editBtn.title = 'Edit entry';
    return editBtn;
  }, 'createEditButton');
};

// Pure function to create entry element
export const createEntryElement = (entry) => {
  return safeDomOperation(() => {
    const entryDiv = createElement('article', 'entry').data;
    entryDiv.dataset.entryId = entry.id;

    // Create header with title and meta info
    const header = createElement('header', 'entry-header').data;
    
    const title = createElement('h3', 'entry-title', entry.title).data;
    const meta = createElement('div', 'entry-meta').data;
    
    const timestamp = createElement('span', 'entry-timestamp', formatDate(entry.timestamp)).data;
    
    // Create action buttons
    const deleteBtn = createDeleteButton(entry).data;
    const editBtn = createEditButton(entry, entryDiv).data;
    
    meta.appendChild(timestamp);
    meta.appendChild(editBtn);
    meta.appendChild(deleteBtn);
    
    header.appendChild(title);
    header.appendChild(meta);

    // Create content
    const content = createElement('div', 'entry-content').data;
    content.innerHTML = parseMarkdown(entry.content);

    entryDiv.appendChild(header);
    entryDiv.appendChild(content);

    return entryDiv;
  }, 'createEntryElement');
};

// Pure function to create empty state element
export const createEmptyStateElement = () => {
  return safeDomOperation(() => {
    const emptyDiv = createElement('div', 'empty-state').data;
    const message = createElement('p', '', 'No entries yet. Start writing your adventure!').data;
    emptyDiv.appendChild(message);
    return emptyDiv;
  }, 'createEmptyStateElement');
};

// Pure function to render entries list
export const renderEntries = (entries = []) => {
  return safeDomOperation(() => {
    const container = document.getElementById('entries-list') || document.getElementById('entries-container');
    if (!container) {
      throw new Error('Entries container not found');
    }

    // Clear existing content
    container.innerHTML = '';

    if (entries.length === 0) {
      const emptyState = createEmptyStateElement().data;
      container.appendChild(emptyState);
      return container;
    }

    // Sort entries by date (newest first)
    const sortedEntries = sortEntriesByDate(entries);

    // Create and append entry elements
    sortedEntries.forEach(entry => {
      const entryElement = createEntryElement(entry);
      if (entryElement.success) {
        container.appendChild(entryElement.data);
      }
    });

    return container;
  }, 'renderEntries');
};

// Pure function to create edit form elements
export const createEditForm = (entry) => {
  return safeDomOperation(() => {
    const editForm = createElement('div', 'edit-form').data;
    
    const titleInput = createElementWithAttributes('input', {
      type: 'text',
      value: entry.title,
      className: 'edit-title-input'
    }).data;
    
    const contentTextarea = createElementWithAttributes('textarea', {
      textContent: entry.content,
      className: 'edit-content-textarea'
    }).data;
    
    const saveBtn = createElement('button', '', 'Save').data;
    const cancelBtn = createElement('button', '', 'Cancel').data;
    
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
  }, 'createEditForm');
};

// Function to enable edit mode for an entry
export const enableEditMode = (entryDiv, entry) => {
  return safeDomOperation(() => {
    const title = entryDiv.querySelector('.entry-title');
    const content = entryDiv.querySelector('.entry-content');
    const headerActions = entryDiv.querySelector('.entry-meta');
    
    if (!title || !content || !headerActions) {
      throw new Error('Entry elements not found');
    }
    
    // Create edit form
    const formResult = createEditForm(entry);
    if (!formResult.success) {
      throw new Error('Failed to create edit form');
    }
    
    const { editForm, titleInput, contentTextarea, saveBtn, cancelBtn } = formResult.data;
    
    // Set up event handlers
    saveBtn.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
    cancelBtn.onclick = () => cancelEdit(entryDiv, entry);
    
    // Hide original content and show edit form
    title.style.display = 'none';
    content.style.display = 'none';
    headerActions.style.display = 'none';
    
    entryDiv.appendChild(editForm);
    titleInput.focus();
    
    return editForm;
  }, 'enableEditMode');
};

// Function to save edit changes
export const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  try {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Title and content cannot be empty');
      return;
    }

    // Update the entry using the entry management module
    const updateResult = updateEntry(entry.id, newTitle, newContent);
    if (!updateResult.success) {
      alert(`Failed to save changes: ${updateResult.error}`);
      return;
    }

    // Update the entry object for compatibility
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

// Function to cancel edit mode
export const cancelEdit = (entryDiv, entry) => {
  return safeDomOperation(() => {
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
    
    return entryDiv;
  }, 'cancelEdit');
};

// Function to handle entry deletion
export const handleDeleteEntry = (entryId, entryTitle) => {
  const deleteResult = deleteEntry(entryId, entryTitle);
  if (!deleteResult.success && !deleteResult.error.includes('cancelled')) {
    alert(`Failed to delete entry: ${deleteResult.error}`);
  }
  // Note: UI will be updated by the YJS change listener
};

// Function to focus entry title input
export const focusEntryTitle = () => {
  focusElement('entry-title');
};