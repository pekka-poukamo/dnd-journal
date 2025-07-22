// Simple D&D Journal POC - Manual save with in-place editing
const STORAGE_KEY = 'simple-dnd-journal';

// Simple state management
let state = {
  character: {
    name: '',
    race: '',
    class: ''
  },
  entries: []
};

// Load state from localStorage
const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state = { ...state, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// Save state to localStorage
const saveData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

// Generate simple ID
const generateId = () => Date.now().toString();

// Format date simply
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Create entry element with edit functionality
const createEntryElement = (entry) => {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'entry-card';
  entryDiv.dataset.entryId = entry.id;
  
  // Create view mode elements
  const titleDiv = document.createElement('div');
  titleDiv.className = 'entry-title';
  titleDiv.textContent = entry.title;
  
  const dateDiv = document.createElement('div');
  dateDiv.className = 'entry-date';
  dateDiv.textContent = formatDate(entry.timestamp);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-content';
  contentDiv.textContent = entry.content;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'entry-actions';
  
  const editButton = document.createElement('button');
  editButton.className = 'button button--secondary button--small';
  editButton.textContent = 'Edit';
  editButton.onclick = () => enableEditMode(entryDiv, entry);
  
  actionsDiv.appendChild(editButton);
  
  entryDiv.appendChild(titleDiv);
  entryDiv.appendChild(dateDiv);
  entryDiv.appendChild(contentDiv);
  entryDiv.appendChild(actionsDiv);
  
  // Add image if present
  if (entry.image && entry.image.trim()) {
    const imageElement = document.createElement('img');
    imageElement.className = 'entry-image';
    imageElement.src = entry.image;
    imageElement.alt = entry.title;
    imageElement.onerror = () => {
      imageElement.style.display = 'none';
    };
    entryDiv.appendChild(imageElement);
  }
  
  return entryDiv;
};

// Enable edit mode for an entry
const enableEditMode = (entryDiv, entry) => {
  const titleDiv = entryDiv.querySelector('.entry-title');
  const contentDiv = entryDiv.querySelector('.entry-content');
  const actionsDiv = entryDiv.querySelector('.entry-actions');
  
  // Create edit inputs
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'form-input';
  titleInput.value = entry.title;
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.className = 'form-input';
  contentTextarea.rows = 4;
  contentTextarea.value = entry.content;
  
  // Create save/cancel buttons
  const saveButton = document.createElement('button');
  saveButton.className = 'button button--small';
  saveButton.textContent = 'Save';
  saveButton.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'button button--secondary button--small';
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = () => cancelEdit(entryDiv, entry);
  
  // Replace content with edit form
  titleDiv.replaceWith(titleInput);
  contentDiv.replaceWith(contentTextarea);
  
  // Update actions
  actionsDiv.innerHTML = '';
  actionsDiv.appendChild(saveButton);
  actionsDiv.appendChild(cancelButton);
  
  // Focus on title input
  titleInput.focus();
};

// Save edit changes
const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  const title = newTitle.trim();
  const content = newContent.trim();
  
  if (!title || !content) return;
  
  // Update entry data
  entry.title = title;
  entry.content = content;
  entry.timestamp = Date.now(); // Update timestamp to show it was edited
  
  // Save to storage
  saveData();
  
  // Re-render the entry
  const newEntryElement = createEntryElement(entry);
  entryDiv.replaceWith(newEntryElement);
};

// Cancel edit and restore original view
const cancelEdit = (entryDiv, entry) => {
  const newEntryElement = createEntryElement(entry);
  entryDiv.replaceWith(newEntryElement);
};

// Render entries
const renderEntries = () => {
  const entriesContainer = document.getElementById('entries-list');
  if (!entriesContainer) return;
  
  if (state.entries.length === 0) {
    entriesContainer.innerHTML = '<div class="empty-state">No entries yet. Add your first adventure above!</div>';
    return;
  }
  
  // Sort entries by newest first
  const sortedEntries = [...state.entries].sort((a, b) => b.timestamp - a.timestamp);
  
  entriesContainer.innerHTML = '';
  sortedEntries.forEach(entry => {
    entriesContainer.appendChild(createEntryElement(entry));
  });
};

// Add new entry
const addEntry = () => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const image = imageInput.value.trim();
  
  if (!title || !content) return;
  
  const entry = {
    id: generateId(),
    title,
    content,
    image,
    timestamp: Date.now()
  };
  
  state.entries.push(entry);
  saveData();
  renderEntries();
  
  // Clear form
  titleInput.value = '';
  contentInput.value = '';
  imageInput.value = '';
  
  // Focus back to title for next entry
  titleInput.focus();
};

// Update character
const updateCharacter = () => {
  const nameInput = document.getElementById('character-name');
  const raceInput = document.getElementById('character-race');
  const classInput = document.getElementById('character-class');
  
  state.character = {
    name: nameInput.value.trim(),
    race: raceInput.value.trim(),
    class: classInput.value.trim()
  };
  
  saveData();
};

// Setup auto-updating inputs for character only
const setupAutoUpdates = () => {
  // Character inputs - auto-save on input
  const characterInputs = ['character-name', 'character-race', 'character-class'];
  characterInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateCharacter);
    }
  });
  
  // Entry inputs - manual save via button
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const addEntryBtn = document.getElementById('add-entry-btn');
  
  if (titleInput && contentInput) {
    // Add entry on Enter in title field
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentInput.focus();
      }
    });
    
    // Add entry on Enter in content field
    contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addEntry();
      }
    });
  }
  
  // Add entry button click handler
  if (addEntryBtn) {
    addEntryBtn.addEventListener('click', addEntry);
  }
};

// Populate character form
const populateCharacterForm = () => {
  const nameInput = document.getElementById('character-name');
  const raceInput = document.getElementById('character-race');
  const classInput = document.getElementById('character-class');
  
  if (nameInput) nameInput.value = state.character.name || '';
  if (raceInput) raceInput.value = state.character.race || '';
  if (classInput) classInput.value = state.character.class || '';
};

// Initialize app
const init = () => {
  loadData();
  populateCharacterForm();
  renderEntries();
  setupAutoUpdates();
  
  // Focus on character name if empty, otherwise focus on entry title
  const nameInput = document.getElementById('character-name');
  const titleInput = document.getElementById('entry-title');
  
  if (nameInput && !state.character.name) {
    nameInput.focus();
  } else if (titleInput) {
    titleInput.focus();
  }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);