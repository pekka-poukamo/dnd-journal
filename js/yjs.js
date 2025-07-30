// Yjs Integration - Real-time collaborative data with IndexedDB and WebSocket sync
// Following functional programming principles and ADR decisions

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { createInitialJournalState, createInitialSettings } from './utils.js';

// Global system state
let yjsSystem = null;
let syncStatusListeners = [];

// Initialize Yjs system
export const createSystem = async () => {
  if (yjsSystem) {
    return yjsSystem;
  }

  const ydoc = new Y.Doc();
  
  // Create Yjs maps for different data types
  const characterMap = ydoc.getMap('character');
  const journalMap = ydoc.getMap('journal');
  const settingsMap = ydoc.getMap('settings');
  const summariesMap = ydoc.getMap('summaries');

  // Initialize with default data if empty
  if (journalMap.size === 0) {
    const initialState = createInitialJournalState();
    
    // Initialize character data
    Object.entries(initialState.character).forEach(([key, value]) => {
      characterMap.set(key, value);
    });
    
    // Initialize entries as a Y.Array within the journal map
    const entriesArray = new Y.Array();
    journalMap.set('entries', entriesArray);
    
    console.log('Initialized Yjs with default data');
  }

  // Initialize settings if empty
  if (settingsMap.size === 0) {
    const initialSettings = createInitialSettings();
    Object.entries(initialSettings).forEach(([key, value]) => {
      settingsMap.set(key, value);
    });
    console.log('Initialized Yjs settings with defaults');
  }

  // Set up IndexedDB persistence
  const indexeddbProvider = new IndexeddbPersistence('dnd-journal', ydoc);
  
  // Set up WebSocket provider for real-time sync
  let websocketProvider = null;
  
  try {
    // Try to connect to local sync server (configurable)
    const syncServer = settingsMap.get('syncServer') || 'ws://localhost:1234';
    websocketProvider = new WebsocketProvider(syncServer, 'dnd-journal', ydoc);
    
    websocketProvider.on('status', (event) => {
      console.log('Sync status:', event.status);
      notifySyncStatusListeners({
        connected: websocketProvider.wsconnected,
        server: syncServer,
        status: event.status
      });
    });
    
    console.log(`WebSocket provider initialized for ${syncServer}`);
  } catch (error) {
    console.warn('WebSocket provider initialization failed:', error);
  }

  // Create system object
  yjsSystem = {
    ydoc,
    characterMap,
    journalMap,
    settingsMap,
    summariesMap,
    indexeddbProvider,
    websocketProvider,
    updateCallbacks: []
  };

  // Set up update listener for real-time sync
  ydoc.on('update', () => {
    yjsSystem.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Update callback error:', error);
      }
    });
  });

  console.log('Yjs system initialized successfully');
  return yjsSystem;
};

// Get current system
export const getSystem = () => yjsSystem;

// Export Y for use in other modules
export { Y };

// Register update callback
export const onUpdate = (callback) => {
  if (yjsSystem) {
    yjsSystem.updateCallbacks.push(callback);
  }
};

// Clear system (for testing)
export const clearSystem = () => {
  if (yjsSystem) {
    yjsSystem.ydoc.destroy();
    yjsSystem = null;
  }
};

// Sync status management
const notifySyncStatusListeners = (status) => {
  syncStatusListeners.forEach(listener => {
    try {
      listener(status);
    } catch (error) {
      console.error('Sync status listener error:', error);
    }
  });
};

export const onSyncStatusChange = (listener) => {
  syncStatusListeners.push(listener);
};

// Get current sync status
export const getSyncStatus = () => {
  if (!yjsSystem?.websocketProvider) {
    return { connected: false, server: null };
  }
  
  return {
    connected: yjsSystem.websocketProvider.wsconnected,
    server: yjsSystem.websocketProvider.url
  };
};

// Save data to system (compatibility function)
export const saveToSystem = (data) => {
  if (!yjsSystem) {
    console.warn('Yjs system not initialized');
    return false;
  }

  try {
    // Save based on data type
    if (data.character) {
      Object.entries(data.character).forEach(([key, value]) => {
        yjsSystem.characterMap.set(key, value);
      });
    }

    if (data.entries) {
      const entriesArray = yjsSystem.journalMap.get('entries') || new Y.Array();
      
      // Clear existing entries and add new ones
      entriesArray.delete(0, entriesArray.length);
      
      data.entries.forEach(entry => {
        const entryMap = new Y.Map();
        Object.entries(entry).forEach(([key, value]) => {
          entryMap.set(key, value);
        });
        entriesArray.push([entryMap]);
      });
      
      yjsSystem.journalMap.set('entries', entriesArray);
    }

    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        yjsSystem.settingsMap.set(key, value);
      });
    }

    return true;
  } catch (error) {
    console.error('Error saving to system:', error);
    return false;
  }
};

// Test environment detection
const isTestEnvironment = () => 
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
  (typeof global !== 'undefined' && global.describe && global.it) ||
  (typeof document !== 'undefined' && document.location && document.location.href === 'http://localhost/');

// Auto-initialize in browser environment
if (typeof document !== 'undefined' && !isTestEnvironment()) {
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSystem);
  } else {
    createSystem();
  }
}