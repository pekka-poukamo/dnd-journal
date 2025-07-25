// Yjs Sync Enhancement - ADR-0003 Implementation
// Maintains localStorage as primary store while adding cross-device sync
// Follows ADR-0002: Functional Programming Only

import { SYNC_CONFIG } from '../sync-config.js';

// Sync state management
let syncState = {
  isAvailable: false,
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

// Check if Yjs libraries are available
const checkYjsAvailability = () => {
  try {
    const hasY = typeof window.Y !== 'undefined';
    const hasWebsocket = typeof window.WebsocketProvider !== 'undefined';
    const hasIndexeddb = typeof window.IndexeddbPersistence !== 'undefined';
    
    // Log detailed availability for debugging
    if (!hasY || !hasWebsocket || !hasIndexeddb) {
      console.warn('Yjs library availability:', {
        Y: hasY,
        WebsocketProvider: hasWebsocket,
        IndexeddbPersistence: hasIndexeddb
      });
    }
    
    return hasY && hasWebsocket && hasIndexeddb;
  } catch (e) {
    console.error('Error checking Yjs availability:', e);
    return false;
  }
};

// Initialize Yjs sync system
const initializeSync = () => {
  const isAvailable = checkYjsAvailability();
  
  if (!isAvailable) {
    // Yjs not available, using localStorage-only mode
    return { ...syncState, isAvailable: false };
  }

  try {
    const ydoc = new window.Y.Doc();
    const ymap = ydoc.getMap('journal');
    
    const newState = {
      ...syncState,
      isAvailable: true,
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
    return { ...syncState, isAvailable: false };
  }
};

// Setup IndexedDB persistence
const setupPersistence = (state) => {
  if (!state.isAvailable || !state.ydoc) return state;
  
  try {
    const indexeddbProvider = new window.IndexeddbPersistence('dnd-journal-sync', state.ydoc);
    
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

// Simple sync configuration
const getSyncConfig = () => {
  // Use config file setting if available
  try {
    if (SYNC_CONFIG && SYNC_CONFIG.server) {
      return [SYNC_CONFIG.server];
    }
  } catch (e) {}
  
  // Default to more reliable public relays
  // Note: These are demo servers - for production use, consider PartyKit, Liveblocks, or your own server
  return [
    'wss://demos.yjs.dev',
    // Removing y-websocket.herokuapp.com due to reliability issues
    // You can add your own backup servers here
  ];
};

// Setup network providers
const setupNetworking = (state) => {
  if (!state.isAvailable || !state.ydoc) return state;
  
  const providers = [];
  const servers = getSyncConfig();
  
  servers.forEach(serverUrl => {
    try {
      const provider = new window.WebsocketProvider(serverUrl, 'dnd-journal', state.ydoc);
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

// Setup change observers
const setupObservers = (state) => {
  if (!state.isAvailable || !state.ymap) return state;
  
  state.ymap.observe((event) => {
    console.log('Remote changes detected');
    syncState.lastModified = Date.now();
    notifyCallbacks(syncState);
  });
  
  return state;
};

// Get current data from Yjs
const getSyncData = () => {
  if (!syncState.isAvailable || !syncState.ymap) {
    return null; // Indicates to use localStorage
  }
  
  try {
    return syncState.ymap.get('data') || null;
  } catch (e) {
    console.error('Failed to get Yjs data:', e);
    return null;
  }
};

// Save data to Yjs
const setSyncData = (data) => {
  if (!syncState.isAvailable || !syncState.ymap) {
    return; // Graceful degradation
  }
  
  try {
    const timestamp = Date.now();
    syncState.ymap.set('data', data);
    syncState.ymap.set('lastModified', timestamp);
    syncState.ymap.set('deviceId', getDeviceId());
    syncState.lastModified = timestamp;
    console.log('Data uploaded to sync');
  } catch (e) {
    console.error('Failed to set Yjs data:', e);
    syncState.errors.push(`Failed to upload data: ${e.message}`);
  }
};

// Register callback for remote changes
const onSyncChange = (callback) => {
  syncState = {
    ...syncState,
    callbacks: [...syncState.callbacks, callback]
  };
};

// Notify all callbacks of changes
const notifyCallbacks = (state) => {
  if (!state.isAvailable) return;
  
  const data = getSyncData();
  if (data) {
    state.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error('Failed to execute callback:', e);
      }
    });
  }
};

// Get sync status
const getSyncStatus = () => {
  const deviceId = getDeviceId();
  
  if (!syncState.isAvailable) {
    return { 
      available: false, 
      reason: 'Yjs not loaded',
      deviceId,
      connected: false,
      lastModified: null,
      connectionAttempts: 0,
      errors: [],
      providers: []
    };
  }
  
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
    isAvailable: false,
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
    get isAvailable() { return syncState.isAvailable; },
    get isConnected() { return syncState.isConnected; },
    
    // Methods
    getData: getSyncData,
    setData: setSyncData,
    onChange: onSyncChange,
    getStatus: getSyncStatus,
    getDeviceId,
    teardown: teardownSync,
    
    // Internal for testing
    _getState: () => syncState
  };
};