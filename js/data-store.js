// Radically Simple Data Store - Yjs + IndexedDB Local-First
// Eliminates localStorage complexity while maintaining local-first principles

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { SYNC_CONFIG } from '../sync-config.js';

// Single source of truth - Yjs Document
let ydoc = null;
let persistence = null;
let providers = [];
let isReady = false;
let callbacks = [];

// App data maps in Yjs
let journalMap = null;
let settingsMap = null;
let summariesMap = null;
let metaSummariesMap = null;
let characterSummariesMap = null;

// Initialize the data store
export const initializeDataStore = async () => {
  if (ydoc) return; // Already initialized
  
  // Skip in test environment
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    console.log('Skipping Yjs data store in test environment');
    return;
  }
  
  try {
    console.log('Initializing Yjs data store...');
    
    // Create Yjs document
    ydoc = new Y.Doc();
    
    // Setup IndexedDB persistence (local-first)
    persistence = new IndexeddbPersistence('dnd-journal', ydoc);
    
    // Initialize data maps
    journalMap = ydoc.getMap('journal');
    settingsMap = ydoc.getMap('settings');
    summariesMap = ydoc.getMap('summaries');
    metaSummariesMap = ydoc.getMap('metaSummaries');
    characterSummariesMap = ydoc.getMap('characterSummaries');
    
    // Wait for IndexedDB to sync
    await new Promise((resolve) => {
      persistence.on('synced', () => {
        console.log('IndexedDB persistence ready');
        isReady = true;
        resolve();
      });
    });
    
    // Setup network sync
    setupNetworkSync();
    
    // Setup change observers
    setupObservers();
    
    console.log('Yjs data store initialized');
    
  } catch (e) {
    console.error('Failed to initialize Yjs data store:', e);
    // Fall back to in-memory only
    isReady = true;
  }
};

// Setup network synchronization
const setupNetworkSync = () => {
  const servers = getSyncServers();
  
  servers.forEach(serverUrl => {
    try {
      const provider = new WebsocketProvider(serverUrl, 'dnd-journal', ydoc, {
        connect: true
      });
      
      provider.on('status', (event) => {
        console.log(`Sync ${provider.url}: ${event.status}`);
        notifyCallbacks('sync-status', { url: provider.url, status: event.status });
      });
      
      provider.on('connection-error', (error) => {
        console.warn(`Sync connection error for ${provider.url}:`, error);
      });
      
      providers.push(provider);
      console.log(`Connected to sync server: ${serverUrl}`);
    } catch (e) {
      console.error(`Failed to connect to ${serverUrl}:`, e);
    }
  });
};

// Get sync server configuration
const getSyncServers = () => {
  try {
    if (SYNC_CONFIG && SYNC_CONFIG.server) {
      const server = SYNC_CONFIG.server.trim();
      if (server && isValidWebSocketUrl(server)) {
        return [server];
      }
    }
  } catch (e) {
    console.warn('Error loading sync config:', e);
  }
  
  // Default public relays
  return [
    'wss://demos.yjs.dev',
    'wss://y-websocket.herokuapp.com'
  ];
};

// Validate WebSocket URL
const isValidWebSocketUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname && parsedUrl.hostname.length > 0;
  } catch (e) {
    return false;
  }
};

// Setup change observers
const setupObservers = () => {
  // Observe all changes with a single deep observer
  ydoc.on('update', () => {
    notifyCallbacks('data-changed');
  });
  
  // Observe specific maps for targeted updates
  journalMap.observe(() => notifyCallbacks('journal-changed'));
  settingsMap.observe(() => notifyCallbacks('settings-changed'));
  summariesMap.observe(() => notifyCallbacks('summaries-changed'));
  metaSummariesMap.observe(() => notifyCallbacks('meta-summaries-changed'));
  characterSummariesMap.observe(() => notifyCallbacks('character-summaries-changed'));
};

// Notify callbacks
const notifyCallbacks = (event, data = {}) => {
  callbacks.forEach(callback => {
    try {
      callback(event, data);
    } catch (e) {
      console.error('Error in data store callback:', e);
    }
  });
};

// Register callback for data changes
export const onChange = (callback) => {
  callbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
};

// Wait for data store to be ready
export const waitForReady = async () => {
  if (isReady) return;
  
  return new Promise((resolve) => {
    const checkReady = () => {
      if (isReady) {
        resolve();
      } else {
        setTimeout(checkReady, 10);
      }
    };
    checkReady();
  });
};

// =============================================================================
// JOURNAL DATA (character + entries)
// =============================================================================

// Get journal data (character + entries)
export const getJournal = () => {
  if (!journalMap) return { character: createInitialCharacter(), entries: [] };
  
  const character = getCharacter();
  const entries = getEntries();
  
  return { character, entries };
};

// Get character data
export const getCharacter = () => {
  if (!journalMap || !journalMap.has('character')) {
    return createInitialCharacter();
  }
  
  const characterMap = journalMap.get('character');
  if (!characterMap) return createInitialCharacter();
  
  return {
    name: characterMap.get('name') || '',
    race: characterMap.get('race') || '',
    class: characterMap.get('class') || '',
    backstory: characterMap.get('backstory') || '',
    notes: characterMap.get('notes') || ''
  };
};

// Set character data
export const setCharacter = (character) => {
  if (!journalMap) return;
  
  let characterMap = journalMap.get('character');
  if (!characterMap) {
    characterMap = new Y.Map();
    journalMap.set('character', characterMap);
  }
  
  // Update fields individually for CRDT conflict resolution
  Object.entries(character).forEach(([key, value]) => {
    characterMap.set(key, value || '');
  });
  
  // Update last modified
  journalMap.set('lastModified', Date.now());
};

// Get entries array
export const getEntries = () => {
  if (!journalMap || !journalMap.has('entries')) {
    return [];
  }
  
  const entriesArray = journalMap.get('entries');
  if (!entriesArray) return [];
  
  return entriesArray.toArray().map(entryMap => ({
    id: entryMap.get('id'),
    title: entryMap.get('title'),
    content: entryMap.get('content'),
    timestamp: entryMap.get('timestamp')
  }));
};

// Add new entry
export const addEntry = (entry) => {
  if (!journalMap) return;
  
  let entriesArray = journalMap.get('entries');
  if (!entriesArray) {
    entriesArray = new Y.Array();
    journalMap.set('entries', entriesArray);
  }
  
  // Create entry map
  const entryMap = new Y.Map();
  entryMap.set('id', entry.id);
  entryMap.set('title', entry.title);
  entryMap.set('content', entry.content);
  entryMap.set('timestamp', entry.timestamp);
  
  // Add to beginning of array (newest first)
  entriesArray.unshift([entryMap]);
  
  // Update last modified
  journalMap.set('lastModified', Date.now());
};

// Update existing entry
export const updateEntry = (entryId, updates) => {
  if (!journalMap) return;
  
  const entriesArray = journalMap.get('entries');
  if (!entriesArray) return;
  
  // Find entry by ID
  const entries = entriesArray.toArray();
  const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    const entryMap = entries[entryIndex];
    
    // Update fields individually
    Object.entries(updates).forEach(([key, value]) => {
      entryMap.set(key, value);
    });
    
    // Update timestamp
    entryMap.set('timestamp', Date.now());
    
    // Update last modified
    journalMap.set('lastModified', Date.now());
  }
};

// =============================================================================
// SETTINGS DATA
// =============================================================================

// Get settings
export const getSettings = () => {
  if (!settingsMap) return createInitialSettings();
  
  return {
    apiKey: settingsMap.get('apiKey') || '',
    enableAIFeatures: settingsMap.get('enableAIFeatures') || false
  };
};

// Set settings
export const setSettings = (settings) => {
  if (!settingsMap) return;
  
  Object.entries(settings).forEach(([key, value]) => {
    settingsMap.set(key, value);
  });
};

// =============================================================================
// SUMMARIES DATA
// =============================================================================

// Get summary by key
export const getSummary = (key) => {
  if (!summariesMap || !summariesMap.has(key)) return null;
  
  const summaryMap = summariesMap.get(key);
  if (!summaryMap) return null;
  
  return {
    content: summaryMap.get('content'),
    words: summaryMap.get('words') || 0,
    timestamp: summaryMap.get('timestamp')
  };
};

// Set summary
export const setSummary = (key, summary) => {
  if (!summariesMap) return;
  
  const summaryMap = new Y.Map();
  summaryMap.set('content', summary.content);
  summaryMap.set('words', summary.words || 0);
  summaryMap.set('timestamp', summary.timestamp || Date.now());
  
  summariesMap.set(key, summaryMap);
};

// Get all summaries
export const getAllSummaries = () => {
  if (!summariesMap) return {};
  
  const summaries = {};
  summariesMap.forEach((summaryMap, key) => {
    summaries[key] = {
      content: summaryMap.get('content'),
      words: summaryMap.get('words') || 0,
      timestamp: summaryMap.get('timestamp')
    };
  });
  
  return summaries;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Create initial character
const createInitialCharacter = () => ({
  name: '',
  race: '',
  class: '',
  backstory: '',
  notes: ''
});

// Create initial settings
const createInitialSettings = () => ({
  apiKey: '',
  enableAIFeatures: false
});

// Get sync status
export const getSyncStatus = () => {
  const connectedProviders = providers.filter(p => p.wsconnected);
  
  return {
    available: true,
    connected: connectedProviders.length > 0,
    providers: providers.map(p => ({
      url: p.url,
      connected: p.wsconnected || false
    })),
    connectedCount: connectedProviders.length,
    totalProviders: providers.length
  };
};

// Cleanup
export const cleanup = () => {
  providers.forEach(provider => {
    try {
      provider.destroy();
    } catch (e) {}
  });
  
  if (persistence) {
    try {
      persistence.destroy();
    } catch (e) {}
  }
  
  ydoc = null;
  persistence = null;
  providers = [];
  isReady = false;
  callbacks = [];
};