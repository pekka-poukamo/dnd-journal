// D&D Journal Sync Configuration
// Edit this file to set your sync server, or configure via Settings page

// Static configuration - can be overridden by settings in Y.js
const getServerConfig = () => {
  // Static configuration fallback (Y.js settings take precedence)
  return '';
};

export const SYNC_CONFIG = {
  // Your sync server URL (leave empty to use default public relays)
  get server() {
    return getServerConfig();
  },
  
  // Examples:
  // server: 'ws://192.168.1.100:1234',
  // server: 'ws://raspberrypi.local:1234',
  // server: 'wss://my-server.com:1234',
};