// Simple YJS - Direct data binding
// Following radical simplicity principles

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// Simple globals - direct YJS data
export let ydoc = null;
export let characterMap = null;
export let journalMap = null;
export let settingsMap = null;
export let summariesMap = null;
export let provider = null;
export let persistence = null;

// Update callbacks (simple array)
const updateCallbacks = [];

// Simple initialization
export const initializeYjs = async () => {
  if (ydoc) return; // Already initialized
  
  // Create document and maps
  ydoc = new Y.Doc();
  characterMap = ydoc.getMap('character');
  journalMap = ydoc.getMap('journal');
  settingsMap = ydoc.getMap('settings');
  summariesMap = ydoc.getMap('summaries');
  
  // Setup persistence
  persistence = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Setup sync provider if configured
  if (SYNC_CONFIG?.servers?.[0]) {
    try {
      provider = new WebsocketProvider(SYNC_CONFIG.servers[0], 'dnd-journal', ydoc);
      provider.on('status', (event) => {
        console.log('Sync status:', event.status);
      });
    } catch (error) {
      console.warn('Sync provider failed:', error);
    }
  }
  
  // Setup update listener
  ydoc.on('update', () => {
    updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Update callback error:', error);
      }
    });
  });
  
  console.log('YJS initialized with direct data binding');
};

// Simple update callback registration
export const onUpdate = (callback) => {
  updateCallbacks.push(callback);
};

// Simple character operations
export const getCharacter = () => ({
  name: characterMap?.get('name') || '',
  race: characterMap?.get('race') || '',
  class: characterMap?.get('class') || '',
  backstory: characterMap?.get('backstory') || '',
  notes: characterMap?.get('notes') || ''
});

export const saveCharacter = (character) => {
  if (!characterMap) return;
  
  characterMap.set('name', character.name || '');
  characterMap.set('race', character.race || '');
  characterMap.set('class', character.class || '');
  characterMap.set('backstory', character.backstory || '');
  characterMap.set('notes', character.notes || '');
};

// Simple journal operations
export const getEntries = () => {
  if (!journalMap) return [];
  
  const entriesArray = journalMap.get('entries');
  if (!entriesArray) return [];
  
  return entriesArray.toArray().map(entryMap => ({
    id: entryMap.get('id'),
    title: entryMap.get('title'),
    content: entryMap.get('content'),
    timestamp: entryMap.get('timestamp')
  }));
};

export const addEntry = (entry) => {
  if (!journalMap) return;
  
  let entriesArray = journalMap.get('entries');
  if (!entriesArray) {
    entriesArray = ydoc.getArray('entries');
    journalMap.set('entries', entriesArray);
  }
  
  const entryMap = ydoc.getMap();
  entryMap.set('id', entry.id);
  entryMap.set('title', entry.title);
  entryMap.set('content', entry.content);
  entryMap.set('timestamp', entry.timestamp);
  
  entriesArray.push([entryMap]);
};

export const updateEntry = (entryId, newTitle, newContent) => {
  if (!journalMap) return;
  
  const entriesArray = journalMap.get('entries');
  if (!entriesArray) return;
  
  const entries = entriesArray.toArray();
  const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    const entryMap = entries[entryIndex];
    entryMap.set('title', newTitle);
    entryMap.set('content', newContent);
    entryMap.set('timestamp', Date.now());
  }
};

export const deleteEntry = (entryId) => {
  if (!journalMap) return;
  
  const entriesArray = journalMap.get('entries');
  if (!entriesArray) return;
  
  const entries = entriesArray.toArray();
  const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    entriesArray.delete(entryIndex, 1);
  }
};

// Simple settings operations
export const getSettings = () => ({
  apiKey: settingsMap?.get('apiKey') || '',
  enableAIFeatures: settingsMap?.get('enableAIFeatures') || false,
  syncServer: settingsMap?.get('syncServer') || ''
});

export const saveSettings = (settings) => {
  if (!settingsMap) return;
  
  settingsMap.set('apiKey', settings.apiKey || '');
  settingsMap.set('enableAIFeatures', Boolean(settings.enableAIFeatures));
  settingsMap.set('syncServer', settings.syncServer || '');
};

// Simple summaries operations
export const getSummary = (key) => {
  return summariesMap?.get(key) || null;
};

export const saveSummary = (key, summary) => {
  if (!summariesMap) return;
  summariesMap.set(key, summary);
};

export const getAllSummaries = () => {
  if (!summariesMap) return {};
  
  const result = {};
  summariesMap.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

export const clearAllSummaries = () => {
  if (!summariesMap) return;
  summariesMap.clear();
};

// Simple sync status
export const getSyncStatus = () => {
  if (!provider) return { connected: false, available: false };
  
  return {
    connected: provider.wsconnected || false,
    available: Boolean(provider.ws)
  };
};

// Initialize when imported (if in browser)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeYjs();
}