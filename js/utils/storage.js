// js/utils/storage.js - Functional storage management
const STORAGE_KEY = 'dnd-journal-data';

// Default state structure
const createDefaultState = () => ({
  characters: {},
  entries: {},
  settings: {
    currentCharacter: null,
    openaiApiKey: null,
    preferences: {
      theme: 'light',
      autoSave: true
    }
  }
});

// Pure functions for data access
const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : createDefaultState();
  } catch (error) {
    console.error('Failed to load data:', error);
    return createDefaultState();
  }
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: error.message };
  }
};

// Pure utility functions
const generateId = () => 
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const addTimestamp = (item) => ({
  ...item,
  id: item.id || generateId(),
  created: item.created || Date.now()
});

// Character operations (pure functions)
const addCharacter = (state, character) => ({
  ...state,
  characters: {
    ...state.characters,
    [character.id]: addTimestamp(character)
  }
});

const updateCharacter = (state, id, updates) => ({
  ...state,
  characters: {
    ...state.characters,
    [id]: { ...state.characters[id], ...updates }
  }
});

const deleteCharacter = (state, id) => {
  const { [id]: deleted, ...remainingCharacters } = state.characters;
  return {
    ...state,
    characters: remainingCharacters,
    settings: state.settings.currentCharacter === id 
      ? { ...state.settings, currentCharacter: null }
      : state.settings
  };
};

// Entry operations (pure functions)
const addEntry = (state, entry) => ({
  ...state,
  entries: {
    ...state.entries,
    [entry.id]: addTimestamp(entry)
  }
});

const updateEntry = (state, id, updates) => ({
  ...state,
  entries: {
    ...state.entries,
    [id]: { ...state.entries[id], ...updates }
  }
});

const deleteEntry = (state, id) => {
  const { [id]: deleted, ...remainingEntries } = state.entries;
  return {
    ...state,
    entries: remainingEntries
  };
};

// Settings operations (pure functions)
const updateSettings = (state, updates) => ({
  ...state,
  settings: {
    ...state.settings,
    ...updates,
    preferences: {
      ...state.settings.preferences,
      ...updates.preferences
    }
  }
});

// Data selectors (pure functions)
const getCharacter = (state, id) => state.characters[id];
const getAllCharacters = (state) => Object.values(state.characters);
const getEntry = (state, id) => state.entries[id];
const getAllEntries = (state) => Object.values(state.entries);
const getSettings = (state) => state.settings;

const getRecentEntries = (state, limit = 10) => 
  getAllEntries(state)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);

const getEntriesForCharacter = (state, characterId) => 
  getAllEntries(state)
    .filter(entry => entry.characterId === characterId)
    .sort((a, b) => b.created - a.created);

const getEntriesThisWeek = (state) => {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return getAllEntries(state)
    .filter(entry => entry.created > oneWeekAgo);
};

// Export/Import functions
const exportData = (state) => JSON.stringify(state, null, 2);

const importData = (jsonString) => {
  try {
    const imported = JSON.parse(jsonString);
    return { success: true, data: imported };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Storage API factory
const createStorage = () => {
  let currentState = loadData();
  
  const updateState = (updateFn) => {
    const newState = updateFn(currentState);
    const saveResult = saveData(newState);
    if (saveResult.success) {
      currentState = newState;
    }
    return saveResult;
  };
  
  return {
    // Data access
    getData: () => currentState,
    
    // Character operations
    saveCharacter: (character) => updateState(state => addCharacter(state, character)),
    updateCharacter: (id, updates) => updateState(state => updateCharacter(state, id, updates)),
    deleteCharacter: (id) => updateState(state => deleteCharacter(state, id)),
    
    // Entry operations
    saveEntry: (entry) => updateState(state => addEntry(state, entry)),
    updateEntry: (id, updates) => updateState(state => updateEntry(state, id, updates)),
    deleteEntry: (id) => updateState(state => deleteEntry(state, id)),
    
    // Settings
    updateSettings: (updates) => updateState(state => updateSettings(state, updates)),
    
    // Import/Export
    exportData: () => exportData(currentState),
    importData: (jsonString) => {
      const result = importData(jsonString);
      if (result.success) {
        const saveResult = saveData(result.data);
        if (saveResult.success) {
          currentState = result.data;
        }
        return saveResult;
      }
      return result;
    },
    
    // Selectors
    getCharacter: (id) => getCharacter(currentState, id),
    getAllCharacters: () => getAllCharacters(currentState),
    getEntry: (id) => getEntry(currentState, id),
    getAllEntries: () => getAllEntries(currentState),
    getRecentEntries: (limit) => getRecentEntries(currentState, limit),
    getEntriesForCharacter: (characterId) => getEntriesForCharacter(currentState, characterId),
    getEntriesThisWeek: () => getEntriesThisWeek(currentState),
    getSettings: () => getSettings(currentState)
  };
};

// Singleton storage instance
let storageInstance = null;
export const getStorage = () => {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
};

export {
  createDefaultState,
  generateId,
  addTimestamp,
  exportData,
  importData
};