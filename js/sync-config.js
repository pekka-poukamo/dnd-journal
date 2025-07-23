// Sync Configuration - Set once by repo maintainer
// Users never need to touch this

const SYNC_CONFIG = {
  // Pi server configuration - set by developer once
  piServer: null, // e.g., 'ws://192.168.1.100:1234' or null to disable
  
  // Public relay servers (always available as fallback)
  publicRelays: [
    'wss://demos.yjs.dev',
    'wss://y-websocket.herokuapp.com'
  ]
};

// Export for use in sync.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SYNC_CONFIG;
} else {
  window.SYNC_CONFIG = SYNC_CONFIG;
}