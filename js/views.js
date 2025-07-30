// Views Layer - Pure Rendering Functions
import { parseMarkdown } from './utils.js';
import { formatDate, sortEntriesByDate } from './utils.js';

// Create character form elements
export const createCharacterForm = (character) => {
  const form = document.createElement('form');
  form.className = 'character-form';
  
  const fields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'race', label: 'Race', type: 'text' },
    { key: 'class', label: 'Class', type: 'text' },
    { key: 'backstory', label: 'Backstory', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ];
  
  fields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = `character-${field.key}`;
    
    const input = field.type === 'textarea' 
      ? document.createElement('textarea')
      : document.createElement('input');
    
    input.id = `character-${field.key}`;
    input.name = field.key;
    if (field.type !== 'textarea') input.type = field.type;
    input.value = character[field.key] || '';
    
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    form.appendChild(fieldDiv);
  });
  
  return form;
};

// Create journal entry form
export const createEntryForm = () => {
  const form = document.createElement('form');
  form.className = 'entry-form';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'form-field';
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Title';
  titleLabel.htmlFor = 'entry-title';
  const titleInput = document.createElement('input');
  titleInput.id = 'entry-title';
  titleInput.name = 'title';
  titleInput.type = 'text';
  titleInput.required = true;
  
  titleDiv.appendChild(titleLabel);
  titleDiv.appendChild(titleInput);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'form-field';
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Content';
  contentLabel.htmlFor = 'entry-content';
  const contentTextarea = document.createElement('textarea');
  contentTextarea.id = 'entry-content';
  contentTextarea.name = 'content';
  contentTextarea.required = true;
  
  contentDiv.appendChild(contentLabel);
  contentDiv.appendChild(contentTextarea);
  
  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'form-actions';
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Add Entry';
  
  buttonDiv.appendChild(submitButton);
  
  form.appendChild(titleDiv);
  form.appendChild(contentDiv);
  form.appendChild(buttonDiv);
  
  return form;
};

// Create single journal entry element
export const createEntryElement = (entry, onEdit, onDelete) => {
  const entryDiv = document.createElement('article');
  entryDiv.className = 'entry';
  entryDiv.dataset.entryId = entry.id;
  
  const header = document.createElement('header');
  header.className = 'entry-header';
  
  const title = document.createElement('h2');
  title.className = 'entry-title';
  title.textContent = entry.title;
  
  const meta = document.createElement('div');
  meta.className = 'entry-meta';
  
  const timestamp = document.createElement('time');
  timestamp.className = 'entry-timestamp';
  timestamp.textContent = formatDate(entry.timestamp);
  timestamp.dateTime = new Date(entry.timestamp).toISOString();
  
  const actions = document.createElement('div');
  actions.className = 'entry-actions';
  
  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.onclick = () => onEdit(entry.id);
  
  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.onclick = () => onDelete(entry.id);
  
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);
  
  meta.appendChild(timestamp);
  meta.appendChild(actions);
  
  header.appendChild(title);
  header.appendChild(meta);
  
  const content = document.createElement('div');
  content.className = 'entry-content';
  content.innerHTML = parseMarkdown(entry.content);
  
  entryDiv.appendChild(header);
  entryDiv.appendChild(content);
  
  return entryDiv;
};

// Create edit form for an entry
export const createEntryEditForm = (entry, onSave, onCancel) => {
  const form = document.createElement('form');
  form.className = 'entry-edit-form';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'form-field';
  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Title';
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = entry.title;
  titleInput.required = true;
  
  titleDiv.appendChild(titleLabel);
  titleDiv.appendChild(titleInput);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'form-field';
  const contentLabel = document.createElement('label');
  contentLabel.textContent = 'Content';
  const contentTextarea = document.createElement('textarea');
  contentTextarea.value = entry.content;
  contentTextarea.required = true;
  
  contentDiv.appendChild(contentLabel);
  contentDiv.appendChild(contentTextarea);
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'form-actions';
  
  const saveButton = document.createElement('button');
  saveButton.type = 'submit';
  saveButton.textContent = 'Save';
  
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = onCancel;
  
  actionsDiv.appendChild(saveButton);
  actionsDiv.appendChild(cancelButton);
  
  form.onsubmit = (e) => {
    e.preventDefault();
    onSave({
      title: titleInput.value.trim(),
      content: contentTextarea.value.trim()
    });
  };
  
  form.appendChild(titleDiv);
  form.appendChild(contentDiv);
  form.appendChild(actionsDiv);
  
  return form;
};

// Create empty state element
export const createEmptyState = (message) => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  const p = document.createElement('p');
  p.textContent = message;
  emptyDiv.appendChild(p);
  return emptyDiv;
};

// Render character information
export const renderCharacter = (container, character) => {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!character.name && !character.race && !character.class) {
    container.appendChild(createEmptyState('No character information yet.'));
    return;
  }
  
  const characterDiv = document.createElement('div');
  characterDiv.className = 'character-info';
  
  const fields = [
    { key: 'name', label: 'Name' },
    { key: 'race', label: 'Race' },
    { key: 'class', label: 'Class' },
    { key: 'backstory', label: 'Backstory' },
    { key: 'notes', label: 'Notes' }
  ];
  
  fields.forEach(field => {
    const value = character[field.key];
    if (value) {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'character-field';
      
      const label = document.createElement('strong');
      label.textContent = `${field.label}: `;
      
      const content = document.createElement('span');
      content.textContent = value;
      
      fieldDiv.appendChild(label);
      fieldDiv.appendChild(content);
      characterDiv.appendChild(fieldDiv);
    }
  });
  
  container.appendChild(characterDiv);
};

// Render journal entries list
export const renderEntries = (container, entries, onEdit, onDelete) => {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (entries.length === 0) {
    container.appendChild(createEmptyState('No journal entries yet. Start writing your adventure!'));
    return;
  }
  
  const sortedEntries = sortEntriesByDate(entries);
  
  sortedEntries.forEach(entry => {
    const entryElement = createEntryElement(entry, onEdit, onDelete);
    container.appendChild(entryElement);
  });
};

// Update sync status indicator
export const updateSyncStatus = (status, text, details) => {
  const indicator = document.getElementById('sync-status');
  if (indicator) {
    indicator.textContent = text;
    indicator.className = `sync-status sync-${status}`;
    indicator.title = details;
    indicator.style.display = 'block';
  }
};

// Show/hide loading indicator
export const setLoading = (isLoading) => {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.style.display = isLoading ? 'block' : 'none';
  }
};

// Show notification message
export const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
};

// Get form data from any form
export const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
};

// Clear form inputs
export const clearForm = (form) => {
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
};