// Simple Y.js - Pure Functional Interface (ADR-0002 Compliant)
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

// Initialize Y.js and return the state object (call once per page)
export const initYjs = async () => {
  if (isInitialized) return getYjsState(); // Already initialized
  
  // Create document
  ydoc = new Y.Doc();
  
  // Set up persistence
  const persistence = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Mark as initialized first, then set up sync
  isInitialized = true;
  
  // Set up sync server from settings (if configured)
  setupSyncFromSettings();
  
  // Wait for initial sync
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return getYjsState();
};

// Get current Y.js state object for pure functions
export const getYjsState = () => {
  if (!isInitialized) {
    throw new Error('Y.js not initialized. Call initYjs() first.');
  }
  
  return {
    characterMap: ydoc.getMap('character'),
    journalMap: ydoc.getMap('journal'),
    settingsMap: ydoc.getMap('settings'),
    summariesMap: ydoc.getMap('summaries'),
    ydoc
  };
};

// Set up sync provider from settings
const setupSyncFromSettings = () => {
  // Only try to get settings if we're initialized
  if (!isInitialized) return;
  
  try {
    const state = getYjsState();
    const syncServer = getSetting(state, 'sync-server-url', '');
    
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

// Reconnect sync provider when settings change
const reconnectSync = () => {
  if (provider) {
    provider.destroy();
    provider = null;
  }
  setupSyncFromSettings();
};

// ============================================================================
// PURE FUNCTIONAL API - All functions take state as first parameter
// Following ADR-0002 (Functional Programming Only)
// ============================================================================

// Pure map accessors
export const getCharacterMap = (state) => state.characterMap;
export const getJournalMap = (state) => state.journalMap;
export const getSettingsMap = (state) => state.settingsMap;
export const getSummariesMap = (state) => state.summariesMap;

// Pure character operations
export const setCharacter = (state, field, value) => {
  getCharacterMap(state).set(field, value);
};

export const getCharacter = (state, field, defaultValue = '') => {
  return getCharacterMap(state).get(field) || defaultValue;
};

export const getCharacterData = (state) => {
  const map = getCharacterMap(state);
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

// Pure journal operations
export const addEntry = (state, entry) => {
  const entries = getEntries(state);
  const newEntries = [...entries, entry];
  getJournalMap(state).set('entries', newEntries);
};

export const updateEntry = (state, entryId, updates) => {
  const entries = getEntries(state);
  const index = entries.findIndex(e => e.id === entryId);
  if (index !== -1) {
    const newEntries = [...entries];
    newEntries[index] = { ...entries[index], ...updates, timestamp: Date.now() };
    getJournalMap(state).set('entries', newEntries);
  }
};

export const deleteEntry = (state, entryId) => {
  const entries = getEntries(state);
  const filtered = entries.filter(e => e.id !== entryId);
  getJournalMap(state).set('entries', filtered);
};

export const getEntries = (state) => {
  return getJournalMap(state).get('entries') || [];
};

// Pure settings operations
export const setSetting = (state, key, value) => {
  getSettingsMap(state).set(key, value);
  
  // If sync server was updated, reconnect
  if (key === 'sync-server-url') {
    reconnectSync();
  }
};

export const getSetting = (state, key, defaultValue = null) => {
  return getSettingsMap(state).get(key) ?? defaultValue;
};

// Pure summary operations
export const setSummary = (state, key, summary) => {
  getSummariesMap(state).set(key, summary);
};

export const getSummary = (state, key) => {
  return getSummariesMap(state).get(key) || null;
};

// Pure observer functions
export const onCharacterChange = (state, callback) => {
  getCharacterMap(state).observe(callback);
};

export const onJournalChange = (state, callback) => {
  getJournalMap(state).observe(callback);
};

export const onSettingsChange = (state, callback) => {
  getSettingsMap(state).observe(callback);
};

export const onSummariesChange = (state, callback) => {
  getSummariesMap(state).observe(callback);
};