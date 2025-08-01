// Journal Views - Pure Rendering Functions for Journal Page
import { parseMarkdown, formatDate, sortEntriesByDate } from './utils.js';

// Create journal entry form
export const createEntryForm = (options = {}) => {
  const form = document.createElement('form');
  form.id = 'entry-form';
  form.className = 'entry-form';
  
  form.innerHTML = `
    <div class="form-group">
      <label for="entry-title" class="form-label">Title</label>
      <input type="text" id="entry-title" name="title" class="form-input" placeholder="What happened?" required>
    </div>
    <div class="form-group">
      <label for="entry-content" class="form-label">Notes</label>
      <textarea id="entry-content" name="content" class="form-textarea" rows="4" placeholder="Write your notes here..." required></textarea>
    </div>
    <div class="form-group">
      <button type="submit" class="btn btn-primary">Add Entry</button>
    </div>
  `;
  
  // Set up form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const entryData = {
      title: formData.get('title'),
      content: formData.get('content')
    };
    
    if (options.onSubmit) {
      options.onSubmit(entryData);
    }
  });
  
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
export const createEntryEditForm = (entry, options = {}) => {
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
  cancelButton.onclick = () => {
    if (options.onCancel) {
      options.onCancel();
    }
  };
  
  actionsDiv.appendChild(saveButton);
  actionsDiv.appendChild(cancelButton);
  
  form.onsubmit = (e) => {
    e.preventDefault();
    if (options.onSave) {
      options.onSave({
        title: titleInput.value.trim(),
        content: contentTextarea.value.trim()
      });
    }
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

// Render character summary (simplified for journal page)
export const renderCharacterSummary = (container, character) => {
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
    { key: 'class', label: 'Class' }
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
export const renderEntries = (container, entries, options = {}) => {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (entries.length === 0) {
    container.appendChild(createEmptyState('No journal entries yet. Start writing your adventure!'));
    return;
  }
  
  const sortedEntries = sortEntriesByDate(entries);
  
  sortedEntries.forEach(entry => {
    const entryElement = createEntryElement(entry, options.onEdit, options.onDelete);
    container.appendChild(entryElement);
  });
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