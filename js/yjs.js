// Simple Y.js - Pure Functional Interface (ADR-0002 Compliant)
import * as Y from 'yjs';
export { 
  ensureChronicleStructure,
  getChroniclePartsMap,
  setChronicleSoFarSummary,
  setChronicleRecentSummary,
  setChronicleLatestPartIndex,
  createOrGetChroniclePart,
  setChroniclePartTitle,
  setChroniclePartSummary,
  setChroniclePartEntries
} from './chronicle-state.js';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { isValidRoomName } from './utils.js';

// Internal Y.js state (private)
let ydoc = null;
let provider = null;
let isInitialized = false;
// Resolve WS URL from current origin, defaulting to localhost in file://
const resolveWebSocketUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.location && window.location.host) {
      const isSecure = window.location.protocol === 'https:';
      return `${isSecure ? 'wss' : 'ws'}://${window.location.host}/ws`;
    }
  } catch {}
  return 'ws://localhost:1234/ws';
};

// Derive the HTTP(S) base URL of the sync server from the WebSocket URL
export const getSyncServerHttpBase = () => {
  const wsUrl = resolveWebSocketUrl();
  try {
    const url = new URL(wsUrl);
    const isSecure = url.protocol === 'wss:';
    return `${isSecure ? 'https' : 'http'}://${url.host}`;
  } catch {
    // Fallback to localhost default
    return 'http://localhost:1234';
  }
};


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

// Initialize Y.js with non-blocking persistence (optimized for performance)
export const initYjs = async () => {
  if (isInitialized) return getYjsState(); // Already initialized
  
  // Create document
  ydoc = new Y.Doc();
  
  // Set up persistence but don't block initialization
  const persistence = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Mark as initialized immediately to allow app to start
  isInitialized = true;
  
  // Set up persistence loading in background (non-blocking)
  const persistencePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn('IndexedDB persistence initialization timed out after 10 seconds, continuing anyway');
      resolve(); // Don't reject, just continue
    }, 10000); // 10 second timeout
    
    // Handle test environment where IndexedDB might not work properly
    const isTestEnvironment = typeof global !== 'undefined' && global.document && global.document.constructor.name === 'Document';
    
    if (isTestEnvironment) {
      // In test environment, resolve immediately to avoid blocking tests
      clearTimeout(timeout);
      resolve();
      return;
    }
    
    persistence.once('synced', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  
  // Set up sync from settings after persistence loads (in background)
  persistencePromise.then(() => {
    setupSyncFromSettings();
  }).catch(error => {
    console.warn('Failed to complete persistence setup:', error);
  });
  
  return getYjsState();
};

// Clear local IndexedDB persistence used by Yjs for this app
export const clearLocalYjsPersistence = () => {
  try {
    if (typeof window !== 'undefined' && window.indexedDB) {
      const request = window.indexedDB.deleteDatabase('dnd-journal');
      request.onsuccess = () => {};
      request.onerror = () => {};
    }
  } catch {}
};

// Get current Y.js state object for pure functions
export const getYjsState = () => {
  if (!isInitialized) {
    throw new Error('Y.js not initialized. Call initYjs() first.');
  }
  
  return {
    characterMap: ydoc.getMap('character'),
    journalArray: ydoc.getArray('journal-entries'),
    settingsMap: ydoc.getMap('settings'),
    summariesMap: ydoc.getMap('summaries'),
    questionsMap: ydoc.getMap('session-questions'),
    chronicleMap: ydoc.getMap('chronicle'),
    ydoc
  };
};

// Set up sync provider from settings
const setupSyncFromSettings = () => {
  // Only try to get settings if we're initialized
  if (!isInitialized) {
    console.debug('Yjs not initialized, skipping sync setup');
    return;
  }
  
  try {
    const state = getYjsState();
    const journalName = (getSetting(state, 'journal-name', '') || '').trim();
    
    console.log('Setting up sync from settings, journal name:', journalName);
    
    if (journalName) {
      try {
        const wsUrl = resolveWebSocketUrl();
        const normalizedDocName = journalName.toLowerCase();
        console.log('WebSocket URL:', wsUrl, 'Document name:', normalizedDocName);
        
        if (!isValidRoomName(normalizedDocName)) {
          console.warn('Invalid room name:', normalizedDocName);
          return; // Do not attempt to connect with invalid names
        }
        
        // Destroy existing provider if any
        if (provider) {
          console.log('Destroying existing provider');
          provider.destroy();
          provider = null;
        }
        
        console.log('Creating new WebsocketProvider...');
        provider = new WebsocketProvider(wsUrl, normalizedDocName, ydoc);
        
        // Add event listeners for debugging
        provider.on('status', (event) => {
          console.log('WebSocket provider status:', event.status);
        });
        
        provider.on('connection-close', (event) => {
          console.log('WebSocket connection closed:', event);
        });
        
        provider.on('connection-error', (event) => {
          console.log('WebSocket connection error:', event);
        });
        
        console.log('WebSocket provider created successfully');
        // Rely on CRDT; no post-sync preference overwrites
      } catch (error) {
        console.warn('Failed to connect to sync server:', error);
      }
    } else {
      console.log('No journal name set, skipping sync setup');
    }
  } catch (error) {
    // Settings not available yet, skip sync setup for now
    console.debug('Settings not available during initialization, skipping sync setup:', error);
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
export const getJournalArray = (state) => state.journalArray;
export const getSettingsMap = (state) => state.settingsMap;
export const getSummariesMap = (state) => state.summariesMap;
export const getChronicleMap = (state) => state.chronicleMap;

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
  getJournalArray(state).push([entry]);
};

export const updateEntry = (state, entryId, updates) => {
  const entries = getEntries(state);
  const index = entries.findIndex(e => e.id === entryId);
  if (index !== -1) {
    // Preserve the original timestamp when editing an entry
    const originalTimestamp = entries[index].timestamp;
    const updatedEntry = { ...entries[index], ...updates, timestamp: originalTimestamp };
    getJournalArray(state).delete(index, 1);
    getJournalArray(state).insert(index, [updatedEntry]);
  }
};

export const deleteEntry = (state, entryId) => {
  const entries = getEntries(state);
  const index = entries.findIndex(e => e.id === entryId);
  if (index !== -1) {
    getJournalArray(state).delete(index, 1);
  }
};

export const getEntries = (state) => {
  return getJournalArray(state).toArray();
};

// Pure settings operations
export const setSetting = (state, key, value) => {
  getSettingsMap(state).set(key, value);
  
  // If journal changed, reconnect
  if (key === 'journal-name') {
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
  getJournalArray(state).observe(callback);
};

export const onSettingsChange = (state, callback) => {
  getSettingsMap(state).observe(callback);
};

export const onSummariesChange = (state, callback) => {
  getSummariesMap(state).observe(callback);
};

export const onQuestionsChange = (state, callback) => {
  state.questionsMap.observe(callback);
};

export const onChronicleChange = (state, callback) => {
  getChronicleMap(state).observe(callback);
};

// Chronicle helpers have been extracted to chronicle-state.js

// =============================================================================
// SESSION QUESTIONS FUNCTIONS (Radically Simple)
// =============================================================================

// Get current session questions
export const getSessionQuestions = (state) => {
  return state.questionsMap.get('current') || null;
};

// Set current session questions  
export const setSessionQuestions = (state, questions) => {
  state.questionsMap.set('current', questions);
};

// Clear session questions
export const clearSessionQuestions = (state) => {
  state.questionsMap.delete('current');
};