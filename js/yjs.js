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
    aiQuestionsCache: ydoc.getMap('ai-questions-cache'),
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
export const getJournalArray = (state) => state.journalArray;
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
  getJournalArray(state).push([entry]);
};

export const updateEntry = (state, entryId, updates) => {
  const entries = getEntries(state);
  const index = entries.findIndex(e => e.id === entryId);
  if (index !== -1) {
    const updatedEntry = { ...entries[index], ...updates, timestamp: Date.now() };
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
  getJournalArray(state).observe(callback);
};

export const onSettingsChange = (state, callback) => {
  getSettingsMap(state).observe(callback);
};

export const onSummariesChange = (state, callback) => {
  getSummariesMap(state).observe(callback);
};

// =============================================================================
// AI QUESTIONS CACHE FUNCTIONS (ADR-0016 compliant caching)
// =============================================================================

// Generate cache key for AI questions based on character and journal data
export const generateAIQuestionsCacheKey = (character, entries) => {
  // Create a deterministic key based on data that affects question generation
  const characterHash = character ? {
    name: character.name || '',
    race: character.race || '',
    class: character.class || '',
    backstory: character.backstory || '',
    notes: character.notes || ''
  } : {};
  
  const entriesHash = entries ? entries.map(entry => ({
    id: entry.id,
    content: entry.content,
    timestamp: entry.timestamp
  })) : [];
  
  // Create simple hash of the relevant data
  const dataString = JSON.stringify({ character: characterHash, entries: entriesHash });
  return `questions:${btoa(dataString).substring(0, 32)}`; // Use base64 hash, truncated
};

// Get cached AI questions if available and valid
export const getCachedAIQuestions = (state, character, entries) => {
  const cacheKey = generateAIQuestionsCacheKey(character, entries);
  const cached = state.aiQuestionsCache.get(cacheKey);
  
  if (cached && cached.questions && cached.timestamp) {
    // Check if cache is still fresh (valid for 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - cached.timestamp < oneHour) {
      return cached.questions;
    }
  }
  
  return null;
};

// Set cached AI questions
export const setCachedAIQuestions = (state, character, entries, questions) => {
  const cacheKey = generateAIQuestionsCacheKey(character, entries);
  state.aiQuestionsCache.set(cacheKey, {
    questions,
    timestamp: Date.now()
  });
};

// Clear AI questions cache (called when input data changes)
export const clearAIQuestionsCache = (state) => {
  state.aiQuestionsCache.clear();
};