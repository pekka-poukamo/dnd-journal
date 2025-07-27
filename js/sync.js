// Yjs Sync Enhancement - ADR-0003 Implementation
// Maintains localStorage as primary store while adding cross-device sync
// Follows ADR-0002: Functional Programming Only

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { SYNC_CONFIG } from '../sync-config.js';

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
  // Use config file setting if available
  try {
    if (SYNC_CONFIG && SYNC_CONFIG.server) {
      const server = SYNC_CONFIG.server.trim();
      if (server && isValidWebSocketUrl(server)) {
        return [server];
      } else if (server) {
        console.warn('Invalid sync server URL configured:', server);
        // Fall through to default servers
      }
    }
  } catch (e) {
    console.warn('Error loading sync config:', e);
  }
  
  // Default to more reliable public relays
  // Note: These are demo servers - for production use, consider PartyKit, Liveblocks, or your own server
  return [
    'wss://demos.yjs.dev',
    'wss://y-websocket.herokuapp.com'
  ];
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

// Setup change observers
const setupObservers = (state) => {
  state.ymap.observe((event) => {
    console.log('Remote changes detected');
    syncState.lastModified = Date.now();
    notifyCallbacks(syncState);
  });
  
  return state;
};

// Get current data from Yjs
const getSyncData = () => {
  try {
    return syncState.ymap.get('data') || null;
  } catch (e) {
    console.error('Failed to get Yjs data:', e);
    return null;
  }
};

// Save data to Yjs
const setSyncData = (data) => {
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