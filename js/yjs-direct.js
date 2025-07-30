// YJS Direct - Direct data binding to YJS maps
// Simple, direct access to YJS without abstractions

import { Y } from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';

// Global YJS document and maps (direct access)
export let ydoc = null;
export let characterMap = null;
export let journalMap = null;
export let settingsMap = null;
export let summariesMap = null;
export let provider = null;
export let persistence = null;

// Simple update callbacks
const updateCallbacks = [];

// Initialize YJS with direct data binding
export const initializeYjs = async () => {
  try {
    // Create YJS document
    ydoc = new Y.Doc();
    
    // Create maps for different data types
    characterMap = ydoc.getMap('character');
    journalMap = ydoc.getMap('journal');
    settingsMap = ydoc.getMap('settings');
    summariesMap = ydoc.getMap('summaries');
    
    // Set up IndexedDB persistence
    persistence = new IndexeddbPersistence('dnd-journal', ydoc);
    
    // Set up WebSocket provider for sync
    provider = new WebsocketProvider('ws://localhost:1234', 'dnd-journal', ydoc);
    
    // Set up update listener
    ydoc.on('update', () => {
      updateCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Update callback error:', error);
        }
      });
    });
    
    console.log('YJS initialized with direct data binding');
  } catch (error) {
    console.error('Failed to initialize YJS:', error);
    throw error;
  }
};

// Register update callback
export const onUpdate = (callback) => {
  updateCallbacks.push(callback);
};

// Character operations (direct)
export const getCharacter = () => {
  if (!characterMap) return {};
  
  return {
    name: characterMap.get('name') || '',
    race: characterMap.get('race') || '',
    class: characterMap.get('class') || '',
    backstory: characterMap.get('backstory') || '',
    notes: characterMap.get('notes') || ''
  };
};

export const saveCharacter = (character) => {
  if (!characterMap) return;
  
  characterMap.set('name', character.name || '');
  characterMap.set('race', character.race || '');
  characterMap.set('class', character.class || '');
  characterMap.set('backstory', character.backstory || '');
  characterMap.set('notes', character.notes || '');
};

// Journal operations (direct)
export const getEntries = () => {
  if (!journalMap) return [];
  
  const entries = [];
  journalMap.forEach((entryData, entryId) => {
    try {
      const entry = typeof entryData === 'string' ? JSON.parse(entryData) : entryData;
      entries.push({ id: entryId, ...entry });
    } catch (error) {
      console.error('Error parsing entry:', entryId, error);
    }
  });
  
  return entries;
};

export const addEntry = (entry) => {
  if (!journalMap) return;
  
  const { id, ...entryData } = entry;
  journalMap.set(id, JSON.stringify(entryData));
};

export const updateEntry = (entryId, title, content) => {
  if (!journalMap) return;
  
  const existingEntry = journalMap.get(entryId);
  if (!existingEntry) return;
  
  try {
    const entry = typeof existingEntry === 'string' ? JSON.parse(existingEntry) : existingEntry;
    entry.title = title;
    entry.content = content;
    entry.timestamp = Date.now();
    
    journalMap.set(entryId, JSON.stringify(entry));
  } catch (error) {
    console.error('Error updating entry:', error);
  }
};

export const deleteEntry = (entryId) => {
  if (!journalMap) return;
  journalMap.delete(entryId);
};

// Settings operations (direct)
export const getSettings = () => {
  if (!settingsMap) return { apiKey: '', enableAIFeatures: false };
  
  return {
    apiKey: settingsMap.get('apiKey') || '',
    enableAIFeatures: settingsMap.get('enableAIFeatures') || false
  };
};

export const saveSettings = (settings) => {
  if (!settingsMap) return;
  
  settingsMap.set('apiKey', settings.apiKey || '');
  settingsMap.set('enableAIFeatures', Boolean(settings.enableAIFeatures));
};

// Summaries operations (direct)
export const getSummary = (entryId) => {
  if (!summariesMap) return null;
  return summariesMap.get(entryId) || null;
};

export const saveSummary = (entryId, summary) => {
  if (!summariesMap) return;
  summariesMap.set(entryId, summary);
};

export const getAllSummaries = () => {
  if (!summariesMap) return {};
  
  const summaries = {};
  summariesMap.forEach((summary, entryId) => {
    summaries[entryId] = summary;
  });
  
  return summaries;
};

export const clearAllSummaries = () => {
  if (!summariesMap) return;
  summariesMap.clear();
};

// Sync status (direct)
export const getSyncStatus = () => {
  if (!provider) return { connected: false, synced: false };
  
  return {
    connected: provider.wsconnected,
    synced: provider.synced
  };
};

// Compatibility functions for old yjs.js API
export const getSystem = () => {
  if (!ydoc) return null;
  
  return {
    ydoc,
    characterMap,
    journalMap,
    settingsMap,
    summariesMap,
    persistence,
    provider
  };
};

export const createSystem = async () => {
  await initializeYjs();
  return getSystem();
};

export const saveToSystem = (data) => {
  if (data.character) {
    saveCharacter(data.character);
  }
  if (data.settings) {
    saveSettings(data.settings);
  }
  // Add other data types as needed
  return true;
};

export const reloadSyncProviders = () => {
  // Simple implementation - in direct approach we don't need complex reload
  console.log('Sync provider reload not needed in direct YJS approach');
};

// Export Y and WebsocketProvider for compatibility
export { Y, WebsocketProvider };

// Auto-initialize in browser environment
if (typeof document !== 'undefined') {
  initializeYjs();
}