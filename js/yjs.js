// Simple Y.js - Direct integration without abstractions
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// Global Y.js document and maps
export let ydoc = null;
export let characterMap = null;
export let journalMap = null;
export let settingsMap = null;
export let summariesMap = null;
export let provider = null;

// Reset function for testing
export const resetYjs = () => {
  if (ydoc) {
    ydoc.destroy();
  }
  if (provider) {
    provider.destroy();
  }
  
  ydoc = null;
  characterMap = null;
  journalMap = null;
  settingsMap = null;
  summariesMap = null;
  provider = null;
};

// Initialize Y.js (call once per page)
export const initYjs = async () => {
  if (ydoc) return; // Already initialized
  
  // Create document
  ydoc = new Y.Doc();
  
  // Get maps
  characterMap = ydoc.getMap('character');
  journalMap = ydoc.getMap('journal');
  settingsMap = ydoc.getMap('settings');
  summariesMap = ydoc.getMap('summaries');
  
  // Set up persistence
  const persistence = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Set up sync (if available)
  const syncServer = SYNC_CONFIG.server;
  if (syncServer) {
    try {
      provider = new WebsocketProvider(syncServer, 'dnd-journal', ydoc);
    } catch (error) {
      console.warn('Failed to connect to sync server:', error);
    }
  }
  
  // Wait for initial sync
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Character operations - direct to Y.js
export const setCharacter = (field, value) => {
  characterMap?.set(field, value);
};

export const getCharacter = (field) => {
  return characterMap?.get(field) || '';
};

// Journal operations - direct to Y.js
export const addEntry = (entry) => {
  let entries = journalMap?.get('entries');
  if (!entries) {
    entries = new Y.Array();
    journalMap?.set('entries', entries);
  }
  
  const entryMap = new Y.Map();
  entryMap.set('id', entry.id);
  entryMap.set('title', entry.title);
  entryMap.set('content', entry.content);
  entryMap.set('timestamp', entry.timestamp);
  
  entries.push([entryMap]);
};

export const updateEntry = (entryId, updates) => {
  const entries = journalMap?.get('entries');
  if (!entries) return;
  
  const entryArray = entries.toArray();
  const entryIndex = entryArray.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    const entryMap = entryArray[entryIndex];
    Object.entries(updates).forEach(([key, value]) => {
      entryMap.set(key, value);
    });
    entryMap.set('timestamp', Date.now());
  }
};

export const deleteEntry = (entryId) => {
  const entries = journalMap?.get('entries');
  if (!entries) return;
  
  const entryArray = entries.toArray();
  const entryIndex = entryArray.findIndex(entryMap => entryMap.get('id') === entryId);
  
  if (entryIndex >= 0) {
    entries.delete(entryIndex, 1);
  }
};

export const getEntries = () => {
  const entries = journalMap?.get('entries');
  if (!entries) return [];
  
  return entries.toArray().map(entryMap => ({
    id: entryMap.get('id'),
    title: entryMap.get('title'),
    content: entryMap.get('content'),
    timestamp: entryMap.get('timestamp')
  }));
};

// Settings operations - direct to Y.js
export const setSetting = (key, value) => {
  settingsMap?.set(key, value);
};

export const getSetting = (key, defaultValue = null) => {
  return settingsMap?.get(key) ?? defaultValue;
};

// Summary operations - direct to Y.js
export const setSummary = (key, value) => {
  summariesMap?.set(key, value);
};

export const getSummary = (key) => {
  return summariesMap?.get(key) || null;
};

// Listen to changes - direct Y.js observers
export const onCharacterChange = (callback) => {
  characterMap?.observe(callback);
};

export const onJournalChange = (callback) => {
  journalMap?.observe(callback);
};

export const onSettingsChange = (callback) => {
  settingsMap?.observe(callback);
};

// Get current character data as object
export const getCharacterData = () => {
  if (!characterMap) return {};
  
  return {
    name: characterMap.get('name') || '',
    race: characterMap.get('race') || '',
    class: characterMap.get('class') || '',
    backstory: characterMap.get('backstory') || '',
    notes: characterMap.get('notes') || ''
  };
};