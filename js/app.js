// D&D Journal - Simple & Functional
const STORAGE_KEY = 'simple-dnd-journal';

// Pure function for creating initial state
const createInitialState = () => ({
  character: {
    name: '',
    race: '',
    class: ''
  },
  entries: []
});

// Simple state management
let state = createInitialState();

// Pure function for safe JSON parsing
const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Load state from localStorage - now more functional
const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parseResult = safeParseJSON(stored);
      if (parseResult.success) {
        state = { ...state, ...parseResult.data };
      }
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// Save state to localStorage - pure function approach
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
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'entry-title';
  titleDiv.textContent = entry.title;
  
  const dateDiv = document.createElement('div');
  dateDiv.className = 'entry-date';
  dateDiv.textContent = formatDate(entry.timestamp);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-content';
  contentDiv.textContent = entry.content;
  
  entryDiv.appendChild(titleDiv);
  entryDiv.appendChild(dateDiv);
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

// Pure function to sort entries by newest first
const sortEntriesByDate = (entries) => 
  [...entries].sort((a, b) => b.timestamp - a.timestamp);

// Pure function to create empty state element
const createEmptyStateElement = () => {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.textContent = 'No entries yet. Add your first adventure above!';
  return div;
};

// Render entries - more functional approach
const renderEntries = () => {
  const entriesContainer = document.getElementById('entries-list');
  if (!entriesContainer) return;
  
  if (state.entries.length === 0) {
    entriesContainer.replaceChildren(createEmptyStateElement());
    return;
  }
  
  // Functional approach to rendering
  const sortedEntries = sortEntriesByDate(state.entries);
  const entryElements = sortedEntries.map(createEntryElement);
  
  entriesContainer.replaceChildren(...entryElements);
};

// Pure function to create entry from form data
const createEntryFromForm = (formData) => ({
  id: generateId(),
  title: formData.title.trim(),
  content: formData.content.trim(),
  image: formData.image.trim(),
  timestamp: Date.now()
});

// Pure function to validate entry data
const isValidEntry = (entryData) => 
  entryData.title.trim().length > 0 && entryData.content.trim().length > 0;

// Pure function to get form data
const getFormData = () => {
  const titleElement = document.getElementById('entry-title');
  const contentElement = document.getElementById('entry-content');
  const imageElement = document.getElementById('entry-image');
  
  return {
    title: titleElement ? titleElement.value : '',
    content: contentElement ? contentElement.value : '',
    image: imageElement ? imageElement.value : ''
  };
};

// Add new entry - now more functional
const addEntry = () => {
  const formData = getFormData();
  
  if (!isValidEntry(formData)) return;
  
  const newEntry = createEntryFromForm(formData);
  
  // Add to state (keeping mutation for now to maintain test compatibility)
  state.entries.push(newEntry);
  
  saveData();
  renderEntries();
  clearEntryForm();
  focusEntryTitle();
};

// Pure function to clear entry form
const clearEntryForm = () => {
  const formFields = ['entry-title', 'entry-content', 'entry-image'];
  formFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });
};

// Pure function to focus on entry title
const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) titleInput.focus();
};

// Pure function to get character form data
const getCharacterFormData = () => {
  const nameElement = document.getElementById('character-name');
  const raceElement = document.getElementById('character-race');
  const classElement = document.getElementById('character-class');
  
  return {
    name: nameElement ? nameElement.value.trim() : '',
    race: raceElement ? raceElement.value.trim() : '',
    class: classElement ? classElement.value.trim() : ''
  };
};

// Update character - now with immutable state update
const updateCharacter = () => {
  const characterData = getCharacterFormData();
  
  // Update state (keeping mutation for now to maintain test compatibility)  
  state.character = characterData;
  
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
  
  // Entry inputs - add entry when both title and content have values
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  
  const checkAndAddEntry = () => {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    // Only auto-add if both title and content are present
    if (title && content) {
      // Small delay to ensure user is done typing
      setTimeout(() => {
        if (titleInput.value.trim() === title && contentInput.value.trim() === content) {
          addEntry();
        }
      }, 1000);
    }
  };
  
  if (titleInput && contentInput) {
    titleInput.addEventListener('blur', checkAndAddEntry);
    contentInput.addEventListener('blur', checkAndAddEntry);
    
    // Also add on Enter in title field
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentInput.focus();
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

// Export functions for testing (only in test environment)
if (typeof global !== 'undefined') {
  global.state = state;
  global.generateId = generateId;
  global.formatDate = formatDate;
  global.loadData = loadData;
  global.saveData = saveData;
  global.createEntryElement = createEntryElement;
  global.renderEntries = renderEntries;
  global.addEntry = addEntry;
  global.updateCharacter = updateCharacter;
  global.populateCharacterForm = populateCharacterForm;
  global.init = init;
}