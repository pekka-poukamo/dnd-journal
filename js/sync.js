// Yjs Sync Enhancement - ADR-0003 Implementation
// Maintains localStorage as primary store while adding cross-device sync

class YjsSync {
  constructor() {
    this.isAvailable = this.checkYjsAvailability()
    this.callbacks = []
    this.isConnected = false
    this.providers = []
    
    if (this.isAvailable) {
      this.setupYjs()
    } else {
      console.log('📱 Yjs not available, using localStorage-only mode')
    }
  }
  
  checkYjsAvailability() {
    try {
      // Check if Yjs modules are available
      return typeof window.Y !== 'undefined' && 
             typeof window.WebsocketProvider !== 'undefined' &&
             typeof window.IndexeddbPersistence !== 'undefined'
    } catch (e) {
      return false
    }
  }
  
  setupYjs() {
    try {
      // Create Yjs document
      this.ydoc = new window.Y.Doc()
      this.ymap = this.ydoc.getMap('journal')
      
      this.setupPersistence()
      this.setupNetworking()
      this.setupObservers()
    } catch (e) {
      console.warn('⚠️ Yjs setup failed, falling back to localStorage-only:', e)
      this.isAvailable = false
    }
  }
  
  setupPersistence() {
    // IndexedDB persistence for offline support
    this.indexeddbProvider = new window.IndexeddbPersistence('dnd-journal-sync', this.ydoc)
    
    this.indexeddbProvider.on('synced', () => {
      console.log('📱 Yjs local persistence ready')
      this.notifyCallbacks()
    })
  }
  
  setupNetworking() {
    // Network providers with automatic fallback
    const providers = []
    
    // Try to connect to user's Pi (if configured)
    const piServer = this.getPiServerConfig()
    if (piServer) {
      try {
        providers.push(new window.WebsocketProvider(piServer, 'dnd-journal', this.ydoc))
      } catch (e) {
        console.warn('⚠️ Pi server connection failed:', e)
      }
    }
    
    // Free public relay servers as fallback
    const publicRelays = [
      'wss://demos.yjs.dev',
      'wss://y-websocket.herokuapp.com'
    ]
    
    publicRelays.forEach(url => {
      try {
        providers.push(new window.WebsocketProvider(url, 'dnd-journal', this.ydoc))
      } catch (e) {
        console.warn(`⚠️ Failed to connect to ${url}:`, e)
      }
    })
    
    this.providers = providers
    
    // Monitor connection status
    this.providers.forEach(provider => {
      provider.on('status', event => {
        const wasConnected = this.isConnected
        this.isConnected = this.providers.some(p => p.wsconnected)
        
        if (!wasConnected && this.isConnected) {
          console.log('🌐 Sync connected')
        } else if (wasConnected && !this.isConnected) {
          console.log('📴 Sync disconnected')
        }
      })
      
      provider.on('connection-error', () => {
        // Graceful degradation - app continues working
        console.log('⚠️ Sync connection error, continuing offline')
      })
    })
  }
  
  setupObservers() {
    // Listen for remote changes
    this.ymap.observe(() => {
      console.log('🔄 Remote changes detected')
      this.notifyCallbacks()
    })
  }
  
  getPiServerConfig() {
    // Check for Pi server configuration
    // Could be set via localStorage, URL parameter, or auto-discovery
    const stored = window.localStorage.getItem('dnd-journal-pi-server')
    if (stored) {
      return stored
    }
    
    // Check URL parameter for easy configuration
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const piParam = urlParams.get('pi')
      if (piParam) {
        // Format: ?pi=192.168.1.100:1234 or ?pi=192.168.1.100 (defaults to 1234)
        const hasPort = piParam.includes(':')
        const server = hasPort ? `ws://${piParam}` : `ws://${piParam}:1234`
        
        // Save for future use
        window.localStorage.setItem('dnd-journal-pi-server', server)
        return server
      }
    } catch (e) {
      // Handle test environment where window.location might not be fully available
      console.log('URL parameter check failed, continuing without Pi config')
    }
    
    return null
  }
  
  // Get current data from Yjs (fallback to empty if not available)
  getData() {
    if (!this.isAvailable || !this.ymap) {
      return null // Indicates to use localStorage
    }
    
    try {
      return this.ymap.get('data') || null
    } catch (e) {
      console.warn('⚠️ Failed to get Yjs data:', e)
      return null
    }
  }
  
  // Save data to Yjs (enhancement layer)
  setData(data) {
    if (!this.isAvailable || !this.ymap) {
      // Graceful degradation - no sync but app continues working
      return
    }
    
    try {
      this.ymap.set('data', data)
      this.ymap.set('lastModified', Date.now())
      this.ymap.set('deviceId', this.getDeviceId())
    } catch (e) {
      console.warn('⚠️ Failed to set Yjs data:', e)
      // Continue without sync - localStorage is still primary
    }
  }
  
  // Register callback for remote changes
  onChange(callback) {
    this.callbacks.push(callback)
  }
  
  notifyCallbacks() {
    if (!this.isAvailable) return
    
    const data = this.getData()
    if (data) {
      this.callbacks.forEach(cb => {
        try {
          cb(data)
        } catch (e) {
          console.warn('⚠️ Callback error:', e)
        }
      })
    }
  }
  
  // Get connection status for debugging
  getStatus() {
    if (!this.isAvailable) {
      return { available: false, reason: 'Yjs not loaded' }
    }
    
    return {
      available: true,
      connected: this.isConnected,
      providers: this.providers.map(p => ({
        url: p.url,
        connected: p.wsconnected || false
      }))
    }
  }
  
  getDeviceId() {
    try {
      let deviceId = window.localStorage.getItem('dnd-journal-device-id')
      if (!deviceId) {
        deviceId = 'device-' + Math.random().toString(36).substr(2, 9)
        window.localStorage.setItem('dnd-journal-device-id', deviceId)
      }
      return deviceId
    } catch (e) {
      // Fallback for test environment
      return 'device-test-' + Math.random().toString(36).substr(2, 9)
    }
  }
  
  // Configuration helpers
  configurePiServer(serverUrl) {
    if (serverUrl) {
      window.localStorage.setItem('dnd-journal-pi-server', serverUrl)
    } else {
      window.localStorage.removeItem('dnd-journal-pi-server')
    }
    
    // Restart sync with new configuration
    if (this.isAvailable) {
      this.teardown()
      this.setupYjs()
    }
  }
  
  teardown() {
    // Clean shutdown
    if (this.providers) {
      this.providers.forEach(provider => {
        try {
          provider.destroy()
        } catch (e) {}
      })
    }
    
    if (this.indexeddbProvider) {
      try {
        this.indexeddbProvider.destroy()
      } catch (e) {}
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YjsSync
} else {
  window.YjsSync = YjsSync
}