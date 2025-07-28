// D&D Journal Sync Configuration
// Edit this file to set your sync server, or configure via Settings page

// Get server configuration from Yjs system or fallback to this file
const getServerConfig = () => {
  try {
    // Try to get Yjs system if available
    if (typeof window !== 'undefined' && window.yjsSystemGlobal?.settingsMap) {
      const savedServer = window.yjsSystemGlobal.settingsMap.get('syncServer');
      if (savedServer) {
        return savedServer;
      }
    }
    
    // Fallback to localStorage for backward compatibility during migration
    const savedServer = localStorage.getItem('dnd-journal-sync-server');
    if (savedServer) {
      return savedServer;
    }
  } catch (e) {
    // Neither Yjs nor localStorage available, fallback to static config
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