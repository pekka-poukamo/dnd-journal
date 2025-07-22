// Simple D&D Journal POC - Functional Style
const STORAGE_KEY = 'simple-dnd-journal';

// Pure state management
const createInitialState = () => ({
  character: {
    name: '',
    race: '',
    class: ''
  },
  entries: []
});

let state = createInitialState();

// Pure utility functions
const generateId = () => Date.now().toString();

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Pure storage functions
const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...createInitialState(), ...parsed };
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
  return createInitialState();
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: error.message };
  }
};

// Pure state update functions
const updateCharacter = (currentState, characterData) => ({
  ...currentState,
  character: { ...currentState.character, ...characterData }
});

const addEntry = (currentState, entryData) => ({
  ...currentState,
  entries: [...currentState.entries, {
    id: generateId(),
    ...entryData,
    timestamp: Date.now()
  }]
});

const updateEntry = (currentState, entryId, entryData) => ({
  ...currentState,
  entries: currentState.entries.map(entry => 
    entry.id === entryId 
      ? { ...entry, ...entryData, timestamp: Date.now() }
      : entry
  )
});

// Pure DOM creation functions
const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') element.className = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    }
    else element.setAttribute(key, value);
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
};

const createEntryElement = (entry, onEdit) => {
  const headerDiv = createElement('div', { className: 'entry-header' });
  
  const titleDiv = createElement('div', { className: 'entry-title' }, [entry.title]);
  const dateDiv = createElement('div', { className: 'entry-date' }, [formatDate(entry.timestamp)]);
  const editBtn = createElement('button', {
    className: 'btn btn--small btn--secondary',
    onclick: () => onEdit(entry.id)
  }, ['Edit']);
  
  headerDiv.appendChild(titleDiv);
  headerDiv.appendChild(dateDiv);
  headerDiv.appendChild(editBtn);
  
  const contentDiv = createElement('div', { className: 'entry-content' }, [entry.content]);
  
  const children = [headerDiv, contentDiv];
  
  // Add image if present
  if (entry.image && entry.image.trim()) {
    const imageElement = createElement('img', {
      className: 'entry-image',
      src: entry.image,
      alt: entry.title,
      onerror: () => { imageElement.style.display = 'none'; }
    });
    children.push(imageElement);
  }
  
  return createElement('div', {
    className: 'entry-card',
    dataset: { entryId: entry.id }
  }, children);
};

// Pure rendering functions
const renderEntries = (entries, container) => {
  if (!container) return;
  
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state">No entries yet. Add your first adventure above!</div>';
    return;
  }
  
  // Sort entries by newest first
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  const entryElements = sortedEntries.map(entry => 
    createEntryElement(entry, (entryId) => {
      const entry = state.entries.find(e => e.id === entryId);
      if (!entry) return;
      
      populateForm(entry);
      setEditMode(true, entryId);
    })
  );
  
  container.replaceChildren(...entryElements);
};

const populateForm = (entry) => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  
  if (titleInput) titleInput.value = entry.title;
  if (contentInput) contentInput.value = entry.content;
  if (imageInput) imageInput.value = entry.image || '';
};

const clearForm = () => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  
  if (titleInput) titleInput.value = '';
  if (contentInput) contentInput.value = '';
  if (imageInput) imageInput.value = '';
};

const setEditMode = (isEditing, entryId = null) => {
  const addBtn = document.getElementById('add-entry-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  
  if (addBtn) {
    addBtn.textContent = isEditing ? 'Update Entry' : 'Add Entry';
    addBtn.onclick = isEditing ? () => handleUpdateEntry(entryId) : handleAddEntry;
  }
  
  if (cancelBtn) {
    cancelBtn.style.display = isEditing ? 'inline-block' : 'none';
    cancelBtn.onclick = handleCancelEdit;
  }
};

// Event handlers
const handleAddEntry = () => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  
  const title = titleInput?.value.trim();
  const content = contentInput?.value.trim();
  const image = imageInput?.value.trim();
  
  if (!title || !content) return;
  
  const newState = addEntry(state, { title, content, image });
  const saveResult = saveData(newState);
  
  if (saveResult.success) {
    state = newState;
    renderEntries(state.entries, document.getElementById('entries-list'));
    clearForm();
    focusTitle();
  }
};

const handleUpdateEntry = (entryId) => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  
  const title = titleInput?.value.trim();
  const content = contentInput?.value.trim();
  const image = imageInput?.value.trim();
  
  if (!title || !content) return;
  
  const newState = updateEntry(state, entryId, { title, content, image });
  const saveResult = saveData(newState);
  
  if (saveResult.success) {
    state = newState;
    renderEntries(state.entries, document.getElementById('entries-list'));
    clearForm();
    setEditMode(false);
    focusTitle();
  }
};

const handleCancelEdit = () => {
  clearForm();
  setEditMode(false);
  focusTitle();
};

const handleCharacterUpdate = () => {
  const nameInput = document.getElementById('character-name');
  const raceInput = document.getElementById('character-race');
  const classInput = document.getElementById('character-class');
  
  const characterData = {
    name: nameInput?.value.trim() || '',
    race: raceInput?.value.trim() || '',
    class: classInput?.value.trim() || ''
  };
  
  const newState = updateCharacter(state, characterData);
  const saveResult = saveData(newState);
  
  if (saveResult.success) {
    state = newState;
  }
};

const focusTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) titleInput.focus();
};

// Setup functions
const setupCharacterInputs = () => {
  const characterInputs = ['character-name', 'character-race', 'character-class'];
  characterInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', handleCharacterUpdate);
    }
  });
};

const setupEntryForm = () => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const addBtn = document.getElementById('add-entry-btn');
  
  if (addBtn) {
    addBtn.addEventListener('click', handleAddEntry);
  }
  
  if (titleInput && contentInput) {
    // Enter in title field moves to content
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentInput.focus();
      }
    });
    
    // Ctrl+Enter in content field submits the form
    contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleAddEntry();
      }
    });
  }
};

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
  state = loadData();
  populateCharacterForm();
  renderEntries(state.entries, document.getElementById('entries-list'));
  setupCharacterInputs();
  setupEntryForm();
  
  // Focus on character name if empty, otherwise focus on entry title
  const nameInput = document.getElementById('character-name');
  if (nameInput && !state.character.name) {
    nameInput.focus();
  } else {
    focusTitle();
  }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);