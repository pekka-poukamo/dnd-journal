// D&D Journal Sync Configuration
// Edit this file to set your sync server, or configure via Settings page

// Get server configuration from localStorage or fallback to this file
const getServerConfig = () => {
  try {
    const savedServer = localStorage.getItem('dnd-journal-sync-server');
    if (savedServer) {
      return savedServer;
    }
  } catch (e) {
    // localStorage not available, fallback to static config
  }
  
  // Static configuration fallback
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