// Yjs Module - Local-first collaborative editing
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// Export Y constructor for other modules
export { Y };

// Yjs system instance
let yjsSystem = null;

// Update callbacks
const updateCallbacks = [];

// Register update callback
export const onUpdate = (callback) => {
  updateCallbacks.push(callback);
};

// Trigger all update callbacks
const triggerUpdateCallbacks = (system) => {
  updateCallbacks.forEach(callback => {
    try {
      callback(system);
    } catch (e) {
      console.warn('Error in update callback:', e);
    }
  });
};

// Get the current Yjs system instance
export const getSystem = () => yjsSystem;

// Clear the Yjs system instance (for testing)
export const clearSystem = () => {
  yjsSystem = null;
  updateCallbacks.length = 0;
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

// Create sync providers
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

// Create Yjs document with all maps
export const createDocument = () => {
  const ydoc = new Y.Doc();
  
  return {
    ydoc,
    characterMap: ydoc.getMap('character'),
    journalMap: ydoc.getMap('journal'),
    settingsMap: ydoc.getMap('settings'),
    summariesMap: ydoc.getMap('summaries')
  };
};

// Create persistence layer
export const createPersistence = (ydoc) => {
  return new IndexeddbPersistence('dnd-journal', ydoc);
};

// Create complete Yjs system
export const createSystem = async () => {
  // Skip in test environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return null;
  }

  // Create document and maps
  const { ydoc, characterMap, journalMap, settingsMap, summariesMap } = createDocument();
  
  // Create persistence
  const persistence = createPersistence(ydoc);
  
  // Create sync providers
  const providers = createSyncProviders(ydoc);
  
  // Wait for IndexedDB to sync
  await new Promise((resolve) => {
    persistence.on('synced', resolve);
  });
  
  const system = {
    ydoc,
    characterMap,
    journalMap,
    settingsMap,
    summariesMap,
    persistence,
    providers
  };
  
  // Store the system instance
  yjsSystem = system;
  
  // Setup update listener
  ydoc.on('update', () => {
    triggerUpdateCallbacks(system);
  });
  
  console.log('Yjs system initialized');
  return system;
};

// Get sync status
export const getSyncStatus = (providers) => {
  if (!providers || providers.length === 0) {
    return {
      available: false,
      connected: false,
      connectedCount: 0,
      totalProviders: 0,
      providers: []
    };
  }
  
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