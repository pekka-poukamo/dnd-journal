// Simple D&D Journal POC - All data automatically saved
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

// Create entry element
const createEntryElement = (entry) => {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'entry-card';
  entryDiv.dataset.entryId = entry.id;
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'entry-header';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'entry-title';
  titleDiv.textContent = entry.title;
  
  const dateDiv = document.createElement('div');
  dateDiv.className = 'entry-date';
  dateDiv.textContent = formatDate(entry.timestamp);
  
  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn--small btn--secondary';
  editBtn.textContent = 'Edit';
  editBtn.onclick = () => editEntry(entry.id);
  
  headerDiv.appendChild(titleDiv);
  headerDiv.appendChild(dateDiv);
  headerDiv.appendChild(editBtn);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-content';
  contentDiv.textContent = entry.content;
  
  entryDiv.appendChild(headerDiv);
  entryDiv.appendChild(contentDiv);
  
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

// Edit entry
const editEntry = (entryId) => {
  const entry = state.entries.find(e => e.id === entryId);
  if (!entry) return;
  
  // Populate form with entry data
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  const addBtn = document.getElementById('add-entry-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  
  titleInput.value = entry.title;
  contentInput.value = entry.content;
  imageInput.value = entry.image || '';
  
  // Change button text and functionality
  addBtn.textContent = 'Update Entry';
  addBtn.onclick = () => updateEntry(entryId);
  
  // Show cancel button
  cancelBtn.style.display = 'inline-block';
  cancelBtn.onclick = () => cancelEdit();
  
  // Store original onclick for cancel functionality
  addBtn.dataset.originalOnclick = 'addEntry';
  
  // Focus on title
  titleInput.focus();
};

// Cancel edit and reset form
const cancelEdit = () => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  const addBtn = document.getElementById('add-entry-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  
  // Clear form
  titleInput.value = '';
  contentInput.value = '';
  imageInput.value = '';
  
  // Reset button
  addBtn.textContent = 'Add Entry';
  addBtn.onclick = addEntry;
  
  // Hide cancel button
  cancelBtn.style.display = 'none';
  
  // Focus back to title for next entry
  titleInput.focus();
};

// Update existing entry
const updateEntry = (entryId) => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  const addBtn = document.getElementById('add-entry-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const image = imageInput.value.trim();
  
  if (!title || !content) return;
  
  const entryIndex = state.entries.findIndex(e => e.id === entryId);
  if (entryIndex === -1) return;
  
  // Update entry
  state.entries[entryIndex] = {
    ...state.entries[entryIndex],
    title,
    content,
    image,
    timestamp: Date.now() // Update timestamp to show it was edited
  };
  
  saveData();
  renderEntries();
  
  // Reset form and button
  titleInput.value = '';
  contentInput.value = '';
  imageInput.value = '';
  addBtn.textContent = 'Add Entry';
  addBtn.onclick = addEntry;
  
  // Hide cancel button
  cancelBtn.style.display = 'none';
  
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

// Setup auto-updating inputs
const setupAutoUpdates = () => {
  // Character inputs
  const characterInputs = ['character-name', 'character-race', 'character-class'];
  characterInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateCharacter);
    }
  });
  
  // Add entry button
  const addBtn = document.getElementById('add-entry-btn');
  if (addBtn) {
    addBtn.addEventListener('click', addEntry);
  }
  
  // Entry inputs - allow Enter key to submit
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  
  if (titleInput && contentInput) {
    // Enter in title field moves to content
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentInput.focus();
      }
    });
    
    // Enter in content field submits the form
    contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addEntry();
      }
    });
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