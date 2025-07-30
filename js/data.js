// Data Layer - Direct Y.js Integration with Reactive Updates
import { createSystem, onUpdate, Y } from './yjs.js';

// Simple state mirror of Y.js data (read-only)
let appState = {
  character: {},
  entries: [],
  settings: {},
  summaries: {}
};

// Y.js system instance
let yjsSystem = null;

// Update callbacks for reactive rendering
const updateCallbacks = [];

// Subscribe to state changes
export const onStateChange = (callback) => {
  updateCallbacks.push(callback);
  return () => {
    const index = updateCallbacks.indexOf(callback);
    if (index > -1) updateCallbacks.splice(index, 1);
  };
};

// Notify all subscribers of state changes
const notifyStateChange = () => {
  updateCallbacks.forEach(callback => callback(appState));
};

// Sync Y.js data to local state and notify subscribers
const syncFromYjs = () => {
  if (!yjsSystem?.characterMap || !yjsSystem?.journalMap) return;
  
  // Sync character data
  appState.character = {
    name: yjsSystem.characterMap.get('name') || '',
    race: yjsSystem.characterMap.get('race') || '',
    class: yjsSystem.characterMap.get('class') || '',
    backstory: yjsSystem.characterMap.get('backstory') || '',
    notes: yjsSystem.characterMap.get('notes') || ''
  };
  
  // Sync journal entries
  const entriesArray = yjsSystem.journalMap.get('entries');
  if (entriesArray) {
    appState.entries = entriesArray.toArray().map(entryMap => ({
      id: entryMap.get('id'),
      title: entryMap.get('title'),
      content: entryMap.get('content'),
      timestamp: entryMap.get('timestamp')
    }));
  } else {
    appState.entries = [];
  }
  
  // Sync settings
  appState.settings = {};
  if (yjsSystem.settingsMap) {
    yjsSystem.settingsMap.forEach((value, key) => {
      appState.settings[key] = value;
    });
  }
  
  // Sync summaries
  appState.summaries = {};
  if (yjsSystem.summariesMap) {
    yjsSystem.summariesMap.forEach((value, key) => {
      appState.summaries[key] = value;
    });
  }
  
  notifyStateChange();
};

// Initialize data system
export const initData = async () => {
  if (yjsSystem) return yjsSystem;
  
  yjsSystem = await createSystem();
  
  // Set up Y.js observers for reactive updates
  if (yjsSystem.characterMap) {
    yjsSystem.characterMap.observe(syncFromYjs);
  }
  if (yjsSystem.journalMap) {
    yjsSystem.journalMap.observe(syncFromYjs);
  }
  if (yjsSystem.settingsMap) {
    yjsSystem.settingsMap.observe(syncFromYjs);
  }
  if (yjsSystem.summariesMap) {
    yjsSystem.summariesMap.observe(syncFromYjs);
  }
  
  // Initial sync
  syncFromYjs();
  
  return yjsSystem;
};

// Get current state (read-only)
export const getState = () => appState;

// Character operations
export const updateCharacter = (field, value) => {
  if (!yjsSystem?.characterMap) return;
  yjsSystem.characterMap.set(field, value);
};

export const getCharacter = (field) => {
  if (!yjsSystem?.characterMap) return '';
  return yjsSystem.characterMap.get(field) || '';
};

// Journal operations
export const addJournalEntry = (entry) => {
  if (!yjsSystem?.journalMap) return;
  
  let entriesArray = yjsSystem.journalMap.get('entries');
  if (!entriesArray) {
    entriesArray = new Y.Array();
    yjsSystem.journalMap.set('entries', entriesArray);
  }
  
  const entryMap = new Y.Map();
  entryMap.set('id', entry.id);
  entryMap.set('title', entry.title);
  entryMap.set('content', entry.content);
  entryMap.set('timestamp', entry.timestamp);
  
  entriesArray.push([entryMap]);
  yjsSystem.journalMap.set('lastModified', Date.now());
};

export const updateJournalEntry = (entryId, updates) => {
  if (!yjsSystem?.journalMap) return;
  
  const entriesArray = yjsSystem.journalMap.get('entries');
  if (!entriesArray) return;
  
  const entries = entriesArray.toArray();
  const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    const entryMap = entries[entryIndex];
    Object.entries(updates).forEach(([key, value]) => {
      entryMap.set(key, value);
    });
    entryMap.set('timestamp', Date.now());
    yjsSystem.journalMap.set('lastModified', Date.now());
  }
};

export const deleteJournalEntry = (entryId) => {
  if (!yjsSystem?.journalMap) return;
  
  const entriesArray = yjsSystem.journalMap.get('entries');
  if (!entriesArray) return;
  
  const entries = entriesArray.toArray();
  const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    entriesArray.delete(entryIndex, 1);
    yjsSystem.journalMap.set('lastModified', Date.now());
  }
};

// Settings operations
export const updateSetting = (key, value) => {
  if (!yjsSystem?.settingsMap) return;
  yjsSystem.settingsMap.set(key, value);
};

export const getSetting = (key, defaultValue = null) => {
  if (!yjsSystem?.settingsMap) return defaultValue;
  return yjsSystem.settingsMap.get(key) ?? defaultValue;
};

// Summary operations
export const updateSummary = (key, value) => {
  if (!yjsSystem?.summariesMap) return;
  yjsSystem.summariesMap.set(key, value);
};

export const getSummary = (key) => {
  if (!yjsSystem?.summariesMap) return null;
  return yjsSystem.summariesMap.get(key) || null;
};

// Clear all data (for testing)
export const clearData = () => {
  if (yjsSystem?.characterMap) yjsSystem.characterMap.clear();
  if (yjsSystem?.journalMap) yjsSystem.journalMap.clear();
  if (yjsSystem?.settingsMap) yjsSystem.settingsMap.clear();
  if (yjsSystem?.summariesMap) yjsSystem.summariesMap.clear();
};

// For testing - expose system
export const getYjsSystem = () => yjsSystem;