// Purely Functional Yjs Operations
// Following ADR-0002: Functional Programming Only

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// =============================================================================
// PURE FUNCTIONS FOR YJS DOCUMENT OPERATIONS
// =============================================================================

// Create Yjs document with persistence and sync
export const createYjsDocument = () => {
  const ydoc = new Y.Doc();
  
  // Setup IndexedDB persistence (local-first)
  const persistence = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Setup network sync
  const providers = createSyncProviders(ydoc);
  
  return { ydoc, persistence, providers };
};

// Create sync providers for network sync
const createSyncProviders = (ydoc) => {
  const servers = getSyncServers();
  
  return servers.map(serverUrl => {
    try {
      return new WebsocketProvider(serverUrl, 'dnd-journal', ydoc, { connect: true });
    } catch (e) {
      console.error(`Failed to connect to ${serverUrl}:`, e);
      return null;
    }
  }).filter(Boolean);
};

// Get sync server configuration
const getSyncServers = () => {
  try {
    if (SYNC_CONFIG?.server && isValidWebSocketUrl(SYNC_CONFIG.server)) {
      return [SYNC_CONFIG.server.trim()];
    }
  } catch (e) {
    console.warn('Error loading sync config:', e);
  }
  
  return ['wss://demos.yjs.dev', 'wss://y-websocket.herokuapp.com'];
};

// Validate WebSocket URL
const isValidWebSocketUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname?.length > 0;
  } catch (e) {
    return false;
  }
};

// =============================================================================
// PURE FUNCTIONS FOR CHARACTER DATA
// =============================================================================

// Get character from Yjs document
export const getCharacter = (ydoc) => {
  const journalMap = ydoc.getMap('journal');
  const characterMap = journalMap.get('character');
  
  if (!characterMap) {
    return { name: '', race: '', class: '', backstory: '', notes: '' };
  }
  
  return {
    name: characterMap.get('name') || '',
    race: characterMap.get('race') || '',
    class: characterMap.get('class') || '',
    backstory: characterMap.get('backstory') || '',
    notes: characterMap.get('notes') || ''
  };
};

// Set character in Yjs document
export const setCharacter = (ydoc, character) => {
  const journalMap = ydoc.getMap('journal');
  
  let characterMap = journalMap.get('character');
  if (!characterMap) {
    characterMap = new Y.Map();
    journalMap.set('character', characterMap);
  }
  
  // Set each field individually for CRDT conflict resolution
  characterMap.set('name', character.name || '');
  characterMap.set('race', character.race || '');
  characterMap.set('class', character.class || '');
  characterMap.set('backstory', character.backstory || '');
  characterMap.set('notes', character.notes || '');
  
  journalMap.set('lastModified', Date.now());
  
  return character;
};

// Update single character field
export const updateCharacterField = (ydoc, field, value) => {
  const journalMap = ydoc.getMap('journal');
  
  let characterMap = journalMap.get('character');
  if (!characterMap) {
    characterMap = new Y.Map();
    journalMap.set('character', characterMap);
  }
  
  characterMap.set(field, value || '');
  journalMap.set('lastModified', Date.now());
  
  return getCharacter(ydoc);
};

// =============================================================================
// PURE FUNCTIONS FOR ENTRIES DATA
// =============================================================================

// Get entries from Yjs document
export const getEntries = (ydoc) => {
  const journalMap = ydoc.getMap('journal');
  const entriesArray = journalMap.get('entries');
  
  if (!entriesArray) {
    return [];
  }
  
  return entriesArray.toArray().map(entryMap => ({
    id: entryMap.get('id'),
    title: entryMap.get('title'),
    content: entryMap.get('content'),
    timestamp: entryMap.get('timestamp')
  }));
};

// Add entry to Yjs document
export const addEntry = (ydoc, entry) => {
  const journalMap = ydoc.getMap('journal');
  
  let entriesArray = journalMap.get('entries');
  if (!entriesArray) {
    entriesArray = new Y.Array();
    journalMap.set('entries', entriesArray);
  }
  
  const entryMap = new Y.Map();
  entryMap.set('id', entry.id);
  entryMap.set('title', entry.title);
  entryMap.set('content', entry.content);
  entryMap.set('timestamp', entry.timestamp);
  
  entriesArray.unshift([entryMap]);
  journalMap.set('lastModified', Date.now());
  
  return getEntries(ydoc);
};

// Update entry in Yjs document
export const updateEntry = (ydoc, entryId, updates) => {
  const journalMap = ydoc.getMap('journal');
  const entriesArray = journalMap.get('entries');
  
  if (!entriesArray) return getEntries(ydoc);
  
  const entries = entriesArray.toArray();
  const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    const entryMap = entries[entryIndex];
    
    Object.entries(updates).forEach(([key, value]) => {
      entryMap.set(key, value);
    });
    
    entryMap.set('timestamp', Date.now());
    journalMap.set('lastModified', Date.now());
  }
  
  return getEntries(ydoc);
};

// =============================================================================
// PURE FUNCTIONS FOR SETTINGS DATA
// =============================================================================

// Get settings from Yjs document
export const getSettings = (ydoc) => {
  const settingsMap = ydoc.getMap('settings');
  
  return {
    apiKey: settingsMap.get('apiKey') || '',
    enableAIFeatures: settingsMap.get('enableAIFeatures') || false
  };
};

// Set settings in Yjs document
export const setSettings = (ydoc, settings) => {
  const settingsMap = ydoc.getMap('settings');
  
  settingsMap.set('apiKey', settings.apiKey || '');
  settingsMap.set('enableAIFeatures', Boolean(settings.enableAIFeatures));
  
  return getSettings(ydoc);
};

// =============================================================================
// PURE FUNCTIONS FOR SUMMARIES DATA
// =============================================================================

// Get summary from Yjs document
export const getSummary = (ydoc, key) => {
  const summariesMap = ydoc.getMap('summaries');
  const summaryMap = summariesMap.get(key);
  
  if (!summaryMap) return null;
  
  return {
    content: summaryMap.get('content'),
    words: summaryMap.get('words') || 0,
    timestamp: summaryMap.get('timestamp')
  };
};

// Set summary in Yjs document
export const setSummary = (ydoc, key, summary) => {
  const summariesMap = ydoc.getMap('summaries');
  
  const summaryMap = new Y.Map();
  summaryMap.set('content', summary.content);
  summaryMap.set('words', summary.words || 0);
  summaryMap.set('timestamp', summary.timestamp || Date.now());
  
  summariesMap.set(key, summaryMap);
  
  return getSummary(ydoc, key);
};

// Get all summaries from Yjs document
export const getAllSummaries = (ydoc) => {
  const summariesMap = ydoc.getMap('summaries');
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
// PURE FUNCTIONS FOR JOURNAL DATA (CHARACTER + ENTRIES)
// =============================================================================

// Get complete journal data
export const getJournal = (ydoc) => ({
  character: getCharacter(ydoc),
  entries: getEntries(ydoc)
});

// =============================================================================
// PURE FUNCTIONS FOR SYNC STATUS
// =============================================================================

// Get sync status
export const getSyncStatus = (providers) => {
  const connectedProviders = providers.filter(p => p.wsconnected);
  
  return {
    available: true,
    connected: connectedProviders.length > 0,
    connectedCount: connectedProviders.length,
    totalProviders: providers.length,
    providers: providers.map(p => ({
      url: p.url,
      connected: p.wsconnected || false
    }))
  };
};