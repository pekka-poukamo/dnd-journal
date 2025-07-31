// Simple Y.js - Direct integration without abstractions
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';

// Internal Y.js state (private)
let ydoc = null;
let provider = null;
let isInitialized = false;

// Reset function for testing
export const resetYjs = () => {
  if (ydoc) {
    ydoc.destroy();
  }
  if (provider) {
    provider.destroy();
  }
  
  ydoc = null;
  provider = null;
  isInitialized = false;
};

// Initialize Y.js (call once per page)
export const initYjs = async () => {
  if (isInitialized) return; // Already initialized
  
  // Create document
  ydoc = new Y.Doc();
  
  // Set up persistence
  const persistence = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Mark as initialized first, then set up sync
  isInitialized = true;
  
  // Set up sync server from settings (if configured)
  // Now we can safely access settings since we're initialized
  setupSyncFromSettings();
  
  // Wait for initial sync
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Set up sync provider from settings
const setupSyncFromSettings = () => {
  // Only try to get settings if we're initialized
  if (!isInitialized) return;
  
  try {
    const syncServer = getSetting('sync-server-url', '');
    
    if (syncServer && syncServer.trim()) {
      try {
        provider = new WebsocketProvider(syncServer.trim(), 'dnd-journal', ydoc);
      } catch (error) {
        console.warn('Failed to connect to sync server:', error);
      }
    }
  } catch (error) {
    // Settings not available yet, skip sync setup for now
    console.debug('Settings not available during initialization, skipping sync setup');
  }
};

// Functional getters for Y.js maps - these ensure initialization and provide safe access
export const getCharacterMap = () => {
  if (!isInitialized) {
    throw new Error('Y.js not initialized. Call initYjs() first.');
  }
  return ydoc.getMap('character');
};

export const getJournalMap = () => {
  if (!isInitialized) {
    throw new Error('Y.js not initialized. Call initYjs() first.');
  }
  return ydoc.getMap('journal');
};

export const getSettingsMap = () => {
  if (!isInitialized) {
    throw new Error('Y.js not initialized. Call initYjs() first.');
  }
  return ydoc.getMap('settings');
};

export const getSummariesMap = () => {
  if (!isInitialized) {
    throw new Error('Y.js not initialized. Call initYjs() first.');
  }
  return ydoc.getMap('summaries');
};

// Legacy exports for backwards compatibility during transition
// These will auto-initialize if accessed before manual initialization
export const characterMap = new Proxy({}, {
  get(target, prop) {
    if (!isInitialized) {
      console.warn('Auto-initializing Y.js. Consider calling initYjs() explicitly.');
      initYjs();
    }
    return getCharacterMap()[prop];
  }
});

export const journalMap = new Proxy({}, {
  get(target, prop) {
    if (!isInitialized) {
      console.warn('Auto-initializing Y.js. Consider calling initYjs() explicitly.');
      initYjs();
    }
    return getJournalMap()[prop];
  }
});

export const settingsMap = new Proxy({}, {
  get(target, prop) {
    if (!isInitialized) {
      console.warn('Auto-initializing Y.js. Consider calling initYjs() explicitly.');
      initYjs();
    }
    return getSettingsMap()[prop];
  }
});

export const summariesMap = new Proxy({}, {
  get(target, prop) {
    if (!isInitialized) {
      console.warn('Auto-initializing Y.js. Consider calling initYjs() explicitly.');
      initYjs();
    }
    return getSummariesMap()[prop];
  }
});

// Character operations
export const setCharacter = (field, value) => {
  getCharacterMap().set(field, value);
};

export const getCharacter = (field, defaultValue = '') => {
  return getCharacterMap().get(field) || defaultValue;
};

export const getCharacterData = () => {
  const map = getCharacterMap();
  const data = {
    name: '',
    race: '',
    class: '',
    backstory: '',
    notes: ''
  };
  
  map.forEach((value, key) => {
    data[key] = value;
  });
  
  return data;
};

// Journal operations
export const addEntry = (entry) => {
  const entries = getEntries();
  entries.push(entry);
  getJournalMap().set('entries', entries);
};

export const updateEntry = (entryId, updates) => {
  const entries = getEntries();
  const index = entries.findIndex(e => e.id === entryId);
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates, timestamp: Date.now() };
    getJournalMap().set('entries', entries);
  }
};

export const deleteEntry = (entryId) => {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== entryId);
  getJournalMap().set('entries', filtered);
};

export const getEntries = () => {
  return getJournalMap().get('entries') || [];
};

// Settings operations
export const setSetting = (key, value) => {
  getSettingsMap().set(key, value);
  
  // If sync server was updated, reconnect
  if (key === 'sync-server-url') {
    reconnectSync();
  }
};

export const getSetting = (key, defaultValue = null) => {
  return getSettingsMap().get(key) ?? defaultValue;
};

// Reconnect sync provider when settings change
const reconnectSync = () => {
  if (provider) {
    provider.destroy();
    provider = null;
  }
  setupSyncFromSettings();
};

// Summary operations
export const setSummary = (key, summary) => {
  getSummariesMap().set(key, summary);
};

export const getSummary = (key) => {
  return getSummariesMap().get(key) || null;
};

// Observer functions for reactive updates
export const onCharacterChange = (callback) => {
  getCharacterMap().observe(callback);
};

export const onJournalChange = (callback) => {
  getJournalMap().observe(callback);
};

export const onSettingsChange = (callback) => {
  getSettingsMap().observe(callback);
};

export const onSummariesChange = (callback) => {
  getSummariesMap().observe(callback);
};