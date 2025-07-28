// Yjs Sync Enhancement - ADR-0003 Implementation
// Maintains localStorage as primary store while adding cross-device sync
// Follows ADR-0002: Functional Programming Only

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { SYNC_CONFIG } from '../sync-config.js';
import { STORAGE_KEYS } from './utils.js';

// Sync state management
let syncState = {
  isConnected: false,
  ydoc: null,
  ymap: null,
  providers: [],
  callbacks: [],
  indexeddbProvider: null,
  lastModified: null,
  connectionAttempts: 0,
  errors: []
};

// Initialize Yjs sync system
const initializeSync = () => {
  // Don't initialize in non-browser environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Yjs sync requires browser environment');
  }
  
  // Allow sync tests to run by checking for explicit sync testing flag
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    // Only disable if not explicitly testing sync functionality
    if (!process.env.ENABLE_SYNC_TESTS && !global.enableSyncTests) {
      throw new Error('Yjs sync disabled in test environment');
    }
  }
  
  try {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap('journal');
    
    const newState = {
      ...syncState,
      ydoc,
      ymap
    };
    
    // Setup persistence and networking
    const withPersistence = setupPersistence(newState);
    const withNetworking = setupNetworking(withPersistence);
    const withObservers = setupObservers(withNetworking);
    
    syncState = withObservers;
    return syncState;
  } catch (e) {
    console.error('Failed to setup Yjs:', e);
    throw e; // Let the error bubble up since Yjs should always be available now
  }
};

// Setup IndexedDB persistence
const setupPersistence = (state) => {
  try {
    const indexeddbProvider = new IndexeddbPersistence('dnd-journal-sync', state.ydoc);
    
    indexeddbProvider.on('synced', () => {
      // Yjs local persistence ready
      notifyCallbacks(syncState);
    });
    
    return { ...state, indexeddbProvider };
  } catch (e) {
    console.error('Failed to setup IndexedDB persistence:', e);
    return state;
  }
};

// Simple sync configuration with validation
const getSyncConfig = () => {
  console.log('Loading sync configuration...');
  
  // Use config file setting if available
  try {
    if (SYNC_CONFIG && SYNC_CONFIG.server) {
      const server = SYNC_CONFIG.server.trim();
      console.log('Found sync server config:', server);
      if (server && isValidWebSocketUrl(server)) {
        console.log('Using configured sync server:', server);
        return [server];
      } else if (server) {
        console.warn('Invalid sync server URL configured:', server);
        // Fall through to default servers
      }
    } else {
      console.log('No custom sync server configured');
    }
  } catch (e) {
    console.warn('Error loading sync config:', e);
  }
  
  // Default to more reliable public relays
  // Note: These are demo servers - for production use, consider PartyKit, Liveblocks, or your own server
  const defaultServers = [
    'wss://demos.yjs.dev',
    'wss://y-websocket.herokuapp.com'
  ];
  console.log('Using default sync servers:', defaultServers);
  return defaultServers;
};

// Validate WebSocket URL format
const isValidWebSocketUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check for obvious invalid formats
  if (url.includes('@')) {
    return false; // Email address
  }
  
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    return false; // Not a WebSocket URL
  }
  
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname && parsedUrl.hostname.length > 0;
  } catch (e) {
    return false;
  }
};

// Setup network providers
const setupNetworking = (state) => {
  
  const providers = [];
  const servers = getSyncConfig();
  
  servers.forEach(serverUrl => {
    // Additional validation before attempting connection
    if (!isValidWebSocketUrl(serverUrl)) {
      console.error(`Invalid WebSocket URL: ${serverUrl}`);
      syncState.errors.push(`Invalid WebSocket URL: ${serverUrl}`);
      return;
    }
    
    try {
      const provider = new WebsocketProvider(serverUrl, 'dnd-journal', state.ydoc, {
        // Add connection timeout for better UX
        connect: true,
        // Yjs will handle reconnection automatically
      });
      providers.push(provider);
      console.log(`Connecting to sync server: ${serverUrl}`);
    } catch (e) {
      console.error(`Failed to connect to ${serverUrl}:`, e);
      syncState.errors.push(`Failed to connect to ${serverUrl}: ${e.message}`);
    }
  });
  
  // Setup connection monitoring
  const monitoredProviders = providers.map(provider => {
    provider.on('status', (event) => {
      const wasConnected = syncState.isConnected;
      const isConnected = providers.some(p => p.wsconnected);
      
      if (!wasConnected && isConnected) {
        console.log('Sync connected');
        syncState.connectionAttempts = 0;
        syncState.errors = [];
      } else if (wasConnected && !isConnected) {
        console.log('Sync disconnected');
      }
      
      syncState = { ...syncState, isConnected };
      notifyCallbacks(syncState);
    });
    
    provider.on('connection-error', (error) => {
      console.warn('Sync connection error, continuing offline:', error);
      syncState.connectionAttempts++;
      syncState.errors.push(`Connection error: ${error.message || 'Unknown error'}`);
      notifyCallbacks(syncState);
    });
    
    provider.on('connection-close', (event) => {
      console.log('Sync connection closed:', event);
      notifyCallbacks(syncState);
    });
    
    return provider;
  });
  
  return { ...state, providers: monitoredProviders };
};

// Setup change observers for CRDT
const setupObservers = (state) => {
  // Observe changes to the root map and all nested maps
  state.ymap.observeDeep((events) => {
    console.log('Remote CRDT changes detected:', events.length, 'events');
    syncState.lastModified = Date.now();
    
    // Log the types of changes for debugging
    events.forEach(event => {
      if (event.path.length > 0) {
        console.log(`CRDT change in ${event.path.join('.')}: ${event.action}`);
      }
    });
    
    notifyCallbacks(syncState);
  });
  
  return state;
};

// Get current data from Yjs (legacy function - returns journal data)
const getSyncData = () => {
  try {
    return syncState.ymap.get('data') || null;
  } catch (e) {
    console.error('Failed to get Yjs data:', e);
    return null;
  }
};

// Get complete app state from Yjs CRDT structure
const getSyncCompleteAppState = () => {
  try {
    const appState = {};
    let hasData = false;
    
    // Reconstruct app state from individual CRDT storage keys
    Object.values(STORAGE_KEYS).forEach(storageKey => {
      if (syncState.ymap.has(storageKey)) {
        const yjsStorageMap = syncState.ymap.get(storageKey);
        if (yjsStorageMap instanceof Y.Map) {
          appState[storageKey] = yjsMapToObject(yjsStorageMap);
          hasData = true;
        }
      }
    });
    
    return hasData ? appState : null;
  } catch (e) {
    console.error('Failed to get Yjs complete app state:', e);
    return null;
  }
};

// Sync individual storage key to Yjs using field-by-field CRDT updates
const syncStorageKeyToYjs = (storageKey) => {
  try {
    const item = localStorage.getItem(storageKey);
    if (item === null) {
      // Remove from Yjs if not in localStorage
      if (syncState.ymap.has(storageKey)) {
        syncState.ymap.delete(storageKey);
      }
      return;
    }
    
    const data = JSON.parse(item);
    
    // Create or get nested Yjs Map for this storage key
    let storageMap = syncState.ymap.get(storageKey);
    if (!storageMap || !(storageMap instanceof Y.Map)) {
      storageMap = new Y.Map();
      syncState.ymap.set(storageKey, storageMap);
    }
    
    // Update fields individually to leverage CRDT conflict resolution
    syncObjectToYjsMap(data, storageMap);
    
  } catch (e) {
    console.warn(`Failed to sync storage key ${storageKey} to Yjs:`, e);
  }
};

// Recursively sync object fields to Yjs Map (field-by-field CRDT updates)
const syncObjectToYjsMap = (obj, yjsMap) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    // For primitives and arrays, we need to use Yjs native types
    console.warn('Attempting to sync non-object to Yjs Map:', typeof obj);
    return;
  }
  
  // Remove fields that no longer exist in the object
  const existingKeys = Array.from(yjsMap.keys());
  const currentKeys = Object.keys(obj);
  existingKeys.forEach(key => {
    if (!currentKeys.includes(key)) {
      yjsMap.delete(key);
    }
  });
  
  // Update/add fields
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      yjsMap.delete(key);
      return;
    }
    
    if (Array.isArray(value)) {
      // Handle arrays using Yjs Array
      let yjsArray = yjsMap.get(key);
      if (!yjsArray || !(yjsArray instanceof Y.Array)) {
        yjsArray = new Y.Array();
        yjsMap.set(key, yjsArray);
      }
      
      // Simple array sync - replace content
      // For more sophisticated array sync, we'd need operational transforms
      if (yjsArray.length !== value.length || !arraysEqual(yjsArray.toArray(), value)) {
        yjsArray.delete(0, yjsArray.length);
        yjsArray.insert(0, value);
      }
      
    } else if (value && typeof value === 'object') {
      // Handle nested objects using nested Yjs Map
      let nestedMap = yjsMap.get(key);
      if (!nestedMap || !(nestedMap instanceof Y.Map)) {
        nestedMap = new Y.Map();
        yjsMap.set(key, nestedMap);
      }
      syncObjectToYjsMap(value, nestedMap);
      
    } else {
      // Handle primitives - only update if changed
      const currentValue = yjsMap.get(key);
      if (currentValue !== value) {
        yjsMap.set(key, value);
      }
    }
  });
};

// Helper function to compare arrays
const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((val, i) => {
    if (Array.isArray(val) && Array.isArray(b[i])) {
      return arraysEqual(val, b[i]);
    }
    if (val && typeof val === 'object' && b[i] && typeof b[i] === 'object') {
      return JSON.stringify(val) === JSON.stringify(b[i]);
    }
    return val === b[i];
  });
};

// Convert Yjs Map back to plain object for localStorage
const yjsMapToObject = (yjsMap) => {
  const obj = {};
  
  yjsMap.forEach((value, key) => {
    if (value instanceof Y.Map) {
      obj[key] = yjsMapToObject(value);
    } else if (value instanceof Y.Array) {
      obj[key] = value.toArray().map(item => 
        item instanceof Y.Map ? yjsMapToObject(item) : item
      );
    } else {
      obj[key] = value;
    }
  });
  
  return obj;
};

// Apply Yjs changes to localStorage with conflict resolution
const applyYjsChangesToLocalStorage = () => {
  try {
    let changeCount = 0;
    
    // Process each storage key
    Object.values(STORAGE_KEYS).forEach(storageKey => {
      if (syncState.ymap.has(storageKey)) {
        const yjsStorageMap = syncState.ymap.get(storageKey);
        if (yjsStorageMap instanceof Y.Map) {
          const syncedData = yjsMapToObject(yjsStorageMap);
          const currentData = localStorage.getItem(storageKey);
          const newData = JSON.stringify(syncedData);
          
          if (currentData !== newData) {
            localStorage.setItem(storageKey, newData);
            changeCount++;
            console.log(`Applied CRDT changes to ${storageKey}`);
          }
        }
      }
    });
    
    return changeCount;
  } catch (e) {
    console.error('Failed to apply Yjs changes to localStorage:', e);
    return 0;
  }
};

// Save data to Yjs (legacy function for backward compatibility)
const setSyncData = (data) => {
  // For backward compatibility, if data is provided, just sync journal data
  // Otherwise, sync complete app state
  if (data) {
    setSyncJournalData(data);
  } else {
    setSyncCompleteAppState();
  }
};

// Save journal data to Yjs (legacy support)
const setSyncJournalData = (journalData) => {
  try {
    const timestamp = Date.now();
    syncState.ymap.set('data', journalData);
    syncState.ymap.set('lastModified', timestamp);
    syncState.ymap.set('deviceId', getDeviceId());
    syncState.lastModified = timestamp;
    console.log('Journal data uploaded to sync');
  } catch (e) {
    console.error('Failed to set Yjs journal data:', e);
    syncState.errors.push(`Failed to upload journal data: ${e.message}`);
  }
};

// Sync complete app state to Yjs using field-by-field CRDT operations
const setSyncCompleteAppState = () => {
  try {
    const timestamp = Date.now();
    
    // Sync each storage key individually using CRDT operations
    Object.values(STORAGE_KEYS).forEach(storageKey => {
      syncStorageKeyToYjs(storageKey);
    });
    
    // Set metadata
    syncState.ymap.set('lastModified', timestamp);
    syncState.ymap.set('deviceId', getDeviceId());
    syncState.lastModified = timestamp;
    
    console.log('Complete app state synced to Yjs using CRDT operations:', {
      storageKeys: Object.values(STORAGE_KEYS),
      timestamp
    });
  } catch (e) {
    console.error('Failed to sync complete app state to Yjs:', e);
    syncState.errors.push(`Failed to sync complete app state: ${e.message}`);
  }
};

// Register callback for remote changes
const onSyncChange = (callback) => {
  syncState = {
    ...syncState,
    callbacks: [...syncState.callbacks, callback]
  };
};

// Notify all callbacks of changes (CRDT-aware)
const notifyCallbacks = (state) => {
  // Apply CRDT changes to localStorage first
  const changeCount = applyYjsChangesToLocalStorage();
  
  if (changeCount > 0) {
    // Notify callbacks that CRDT changes were applied
    state.callbacks.forEach(callback => {
      try {
        callback(null, 'crdt-update', { changeCount });
      } catch (e) {
        console.error('Failed to execute CRDT callback:', e);
      }
    });
  } else {
    // Check for legacy journal data sync for backward compatibility
    const journalData = getSyncData();
    if (journalData) {
      state.callbacks.forEach(callback => {
        try {
          callback(journalData, 'journal');
        } catch (e) {
          console.error('Failed to execute journal callback:', e);
        }
      });
    }
  }
};

// Get sync status
const getSyncStatus = () => {
  const deviceId = getDeviceId();
  const connectedProviders = syncState.providers.filter(p => p.wsconnected);
  
  return {
    available: true,
    reason: syncState.isConnected ? 'Connected and syncing' : 'Available but not connected',
    connected: syncState.isConnected,
    deviceId,
    lastModified: syncState.lastModified,
    connectionAttempts: syncState.connectionAttempts,
    errors: [...syncState.errors],
    providers: syncState.providers.map(p => ({
      url: p.url,
      connected: p.wsconnected || false,
      wsReadyState: p.ws ? p.ws.readyState : null
    })),
    connectedCount: connectedProviders.length,
    totalProviders: syncState.providers.length
  };
};

// Generate and persist device ID
const getDeviceId = () => {
  try {
    let deviceId = window.localStorage.getItem('dnd-journal-device-id');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
      window.localStorage.setItem('dnd-journal-device-id', deviceId);
    }
    return deviceId;
  } catch (e) {
    return 'device-test-' + Math.random().toString(36).substr(2, 9);
  }
};



// Clean shutdown
const teardownSync = () => {
  if (syncState.providers) {
    syncState.providers.forEach(provider => {
      try {
        provider.destroy();
      } catch (e) {}
    });
  }
  
  if (syncState.indexeddbProvider) {
    try {
      syncState.indexeddbProvider.destroy();
    } catch (e) {}
  }
  
  syncState = {
    isConnected: false,
    ydoc: null,
    ymap: null,
    providers: [],
    callbacks: [],
    indexeddbProvider: null,
    lastModified: null,
    connectionAttempts: 0,
    errors: []
  };
};

// Reset sync state (for testing)
export const resetSyncState = () => {
  syncState = {
    isConnected: false,
    ydoc: null,
    ymap: null,
    providers: [],
    callbacks: [],
    indexeddbProvider: null,
    lastModified: null,
    connectionAttempts: 0,
    errors: []
  };
};

// Public API object (following functional pattern)
export const createYjsSync = () => {
  // Initialize on creation
  syncState = initializeSync();
  
  return {
    // Read-only properties
    get isConnected() { return syncState.isConnected; },
    
    // Methods
    getData: getSyncData, // Legacy - gets journal data
    setData: setSyncData, // Legacy - sets journal data or triggers complete sync
    getCompleteAppState: getSyncCompleteAppState, // New - gets complete app state
    setCompleteAppState: setSyncCompleteAppState, // New - sets complete app state
    syncCompleteState: setSyncCompleteAppState, // Alias for convenience
    onChange: onSyncChange,
    getStatus: getSyncStatus,
    getDeviceId,
    teardown: teardownSync,
    
    // Internal for testing
    _getState: () => syncState
  };
};