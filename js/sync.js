// Yjs Sync Enhancement - ADR-0003 Implementation
// Maintains localStorage as primary store while adding cross-device sync
// Follows ADR-0002: Functional Programming Only

// Sync state management
let syncState = {
  isAvailable: false,
  isConnected: false,
  ydoc: null,
  ymap: null,
  providers: [],
  callbacks: [],
  indexeddbProvider: null
};

// Check if Yjs libraries are available
const checkYjsAvailability = () => {
  try {
    return typeof window.Y !== 'undefined' && 
           typeof window.WebsocketProvider !== 'undefined' &&
           typeof window.IndexeddbPersistence !== 'undefined';
  } catch (e) {
    return false;
  }
};

// Initialize Yjs sync system
const initializeSync = () => {
  const isAvailable = checkYjsAvailability();
  
  if (!isAvailable) {
    console.log('📱 Yjs not available, using localStorage-only mode');
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
    console.warn('⚠️ Yjs setup failed, falling back to localStorage-only:', e);
    return { ...syncState, isAvailable: false };
  }
};

// Setup IndexedDB persistence
const setupPersistence = (state) => {
  if (!state.isAvailable || !state.ydoc) return state;
  
  try {
    const indexeddbProvider = new window.IndexeddbPersistence('dnd-journal-sync', state.ydoc);
    
    indexeddbProvider.on('synced', () => {
      console.log('📱 Yjs local persistence ready');
      notifyCallbacks(syncState);
    });
    
    return { ...state, indexeddbProvider };
  } catch (e) {
    console.warn('⚠️ IndexedDB persistence setup failed:', e);
    return state;
  }
};

// Setup network providers
const setupNetworking = (state) => {
  if (!state.isAvailable || !state.ydoc) return state;
  
  const providers = [];
  const config = window.SYNC_CONFIG || {};
  
  // Try configured Pi server first
  if (config.piServer) {
    try {
      providers.push(new window.WebsocketProvider(config.piServer, 'dnd-journal', state.ydoc));
      console.log(`🔧 Connecting to configured Pi server: ${config.piServer}`);
    } catch (e) {
      console.warn('⚠️ Configured Pi server connection failed:', e);
    }
  }
  

  
  // Add public relay servers as fallback
  const publicRelays = config.publicRelays || [
    'wss://demos.yjs.dev',
    'wss://y-websocket.herokuapp.com'
  ];
  
  publicRelays.forEach(url => {
    try {
      providers.push(new window.WebsocketProvider(url, 'dnd-journal', state.ydoc));
    } catch (e) {
      console.warn(`⚠️ Failed to connect to ${url}:`, e);
    }
  });
  
  // Setup connection monitoring
  const monitoredProviders = providers.map(provider => {
    provider.on('status', () => {
      const wasConnected = syncState.isConnected;
      const isConnected = providers.some(p => p.wsconnected);
      
      if (!wasConnected && isConnected) {
        console.log('🌐 Sync connected');
      } else if (wasConnected && !isConnected) {
        console.log('📴 Sync disconnected');
      }
      
      syncState = { ...syncState, isConnected };
    });
    
    provider.on('connection-error', () => {
      console.log('⚠️ Sync connection error, continuing offline');
    });
    
    return provider;
  });
  
  return { ...state, providers: monitoredProviders };
};

// Setup change observers
const setupObservers = (state) => {
  if (!state.isAvailable || !state.ymap) return state;
  
  state.ymap.observe(() => {
    console.log('🔄 Remote changes detected');
    notifyCallbacks(state);
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
    console.warn('⚠️ Failed to get Yjs data:', e);
    return null;
  }
};

// Save data to Yjs
const setSyncData = (data) => {
  if (!syncState.isAvailable || !syncState.ymap) {
    return; // Graceful degradation
  }
  
  try {
    syncState.ymap.set('data', data);
    syncState.ymap.set('lastModified', Date.now());
    syncState.ymap.set('deviceId', getDeviceId());
  } catch (e) {
    console.warn('⚠️ Failed to set Yjs data:', e);
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
        console.warn('⚠️ Callback error:', e);
      }
    });
  }
};

// Get sync status
const getSyncStatus = () => {
  if (!syncState.isAvailable) {
    return { available: false, reason: 'Yjs not loaded' };
  }
  
  return {
    available: true,
    connected: syncState.isConnected,
    providers: syncState.providers.map(p => ({
      url: p.url,
      connected: p.wsconnected || false
    }))
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
    indexeddbProvider: null
  };
};

// Public API object (following functional pattern)
const createYjsSync = () => {
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

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createYjsSync, getSyncData, setSyncData, onSyncChange, getSyncStatus };
} else {
  window.createYjsSync = createYjsSync;
}