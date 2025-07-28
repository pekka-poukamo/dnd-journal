// Functional Yjs Module - Pure functions, no mutable state
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// Export Y constructor for other modules
export { Y };

// Simple registry for Yjs update callbacks (no coupling)
const updateCallbacks = [];

// Pure function to register update callback
export const onYjsUpdate = (callback) => {
  updateCallbacks.push(callback);
};

// Pure function to trigger all update callbacks
const triggerUpdateCallbacks = (yjsSystem) => {
  updateCallbacks.forEach(callback => {
    try {
      callback(yjsSystem);
    } catch (e) {
      console.warn('Error in Yjs update callback:', e);
    }
  });
};

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
    
    const yjsSystem = {
      ydoc,
      journalMap,
      settingsMap,
      summariesMap,
      persistence,
      providers
    };
    
    // Setup update listener to trigger callbacks
    ydoc.on('update', () => {
      triggerUpdateCallbacks(yjsSystem);
    });
    
    console.log('Yjs system created');
    return yjsSystem;
    
  } catch (e) {
    console.error('Failed to create Yjs system:', e);
    return null;
  }
};

// Pure function to update character data in Yjs
export const updateCharacterInYjs = (yjsSystem, characterData) => {
  if (!yjsSystem?.journalMap) return;
  
  try {
    let characterMap = yjsSystem.journalMap.get('character');
    if (!characterMap) {
      characterMap = new Y.Map();
      yjsSystem.journalMap.set('character', characterMap);
    }
    
    // Set each field individually for CRDT conflict resolution
    characterMap.set('name', characterData.name || '');
    characterMap.set('race', characterData.race || '');
    characterMap.set('class', characterData.class || '');
    characterMap.set('backstory', characterData.backstory || '');
    characterMap.set('notes', characterData.notes || '');
    
    yjsSystem.journalMap.set('lastModified', Date.now());
  } catch (e) {
    console.warn('Could not update character in Yjs:', e);
  }
};

// Pure function to update settings in Yjs
export const updateSettingsInYjs = (yjsSystem, settings) => {
  if (!yjsSystem?.settingsMap) return;
  
  try {
    yjsSystem.settingsMap.set('apiKey', settings.apiKey || '');
    yjsSystem.settingsMap.set('enableAIFeatures', Boolean(settings.enableAIFeatures));
  } catch (e) {
    console.warn('Could not update settings in Yjs:', e);
  }
};

// Pure function to update summaries in Yjs
export const updateSummariesInYjs = (yjsSystem, summaries) => {
  if (!yjsSystem?.summariesMap) return;
  
  try {
    // Clear existing summaries in Yjs
    yjsSystem.summariesMap.clear();
    
    // Add each summary to Yjs
    Object.entries(summaries).forEach(([key, summary]) => {
      const summaryMap = new Y.Map();
      summaryMap.set('content', summary.content || summary.summary || '');
      summaryMap.set('words', summary.words || 0);
      summaryMap.set('timestamp', summary.timestamp || Date.now());
      yjsSystem.summariesMap.set(key, summaryMap);
    });
  } catch (e) {
    console.warn('Could not update summaries in Yjs:', e);
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