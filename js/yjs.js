// Functional Yjs Module - Pure functions, no mutable state
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// Export Y constructor for other modules
export { Y };

// Pure function to validate WebSocket URL
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

// Pure function to get sync server configuration
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

// Pure function to create sync providers
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

// Pure function to create Yjs document with all maps
export const createYjsDocument = () => {
  const ydoc = new Y.Doc();
  
  return {
    ydoc,
    journalMap: ydoc.getMap('journal'),
    settingsMap: ydoc.getMap('settings'),
    summariesMap: ydoc.getMap('summaries')
  };
};

// Pure function to create persistence layer
export const createPersistence = (ydoc) => {
  return new IndexeddbPersistence('dnd-journal', ydoc);
};

// Pure function to setup complete Yjs system
export const createYjsSystem = async () => {
  // Skip in test environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return null;
  }

  try {
    // Create document and maps
    const { ydoc, journalMap, settingsMap, summariesMap } = createYjsDocument();
    
    // Create persistence
    const persistence = createPersistence(ydoc);
    
    // Create sync providers
    const providers = createSyncProviders(ydoc);
    
    // Wait for IndexedDB to sync
    await new Promise((resolve) => {
      persistence.on('synced', resolve);
    });
    
    console.log('Yjs system created');
    
    return {
      ydoc,
      journalMap,
      settingsMap,
      summariesMap,
      persistence,
      providers
    };
    
  } catch (e) {
    console.error('Failed to create Yjs system:', e);
    return null;
  }
};

// Pure function to get sync status
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