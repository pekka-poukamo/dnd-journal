// Core D&D Journal Logic - Testable module
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
const loadData = (storage = localStorage) => {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedData = JSON.parse(stored);
      state = {
        character: { ...state.character, ...parsedData.character },
        entries: parsedData.entries || []
      };
    }
    return state;
  } catch (error) {
    console.error('Failed to load data:', error);
    return state;
  }
};

// Save state to localStorage
const saveData = (storage = localStorage) => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Failed to save data:', error);
    return false;
  }
};

// Generate simple ID
const generateId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
};

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

// Add new entry
const addEntry = (title, content, image = '') => {
  if (!title || !content) return null;
  
  const entry = {
    id: generateId(),
    title: title.trim(),
    content: content.trim(),
    image: image.trim(),
    timestamp: Date.now()
  };
  
  state.entries.push(entry);
  return entry;
};

// Update character
const updateCharacter = (name, race, characterClass) => {
  state.character = {
    name: (name || '').trim(),
    race: (race || '').trim(),
    class: (characterClass || '').trim()
  };
  return state.character;
};

// Get all entries
const getEntries = () => {
  return [...state.entries].sort((a, b) => b.timestamp - a.timestamp);
};

// Get character
const getCharacter = () => {
  return { ...state.character };
};

// Clear all data
const clearData = (storage = localStorage) => {
  state = {
    character: { name: '', race: '', class: '' },
    entries: []
  };
  storage.removeItem(STORAGE_KEY);
  return state;
};

// Get entry by ID
const getEntryById = (id) => {
  return state.entries.find(entry => entry.id === id);
};

// Delete entry by ID
const deleteEntry = (id) => {
  const index = state.entries.findIndex(entry => entry.id === id);
  if (index !== -1) {
    state.entries.splice(index, 1);
    return true;
  }
  return false;
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadData,
    saveData,
    generateId,
    formatDate,
    addEntry,
    updateCharacter,
    getEntries,
    getCharacter,
    clearData,
    getEntryById,
    deleteEntry,
    STORAGE_KEY
  };
}
