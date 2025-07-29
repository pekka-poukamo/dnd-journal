// D&D Journal Sync Configuration
// Edit this file to set your sync server, or configure via Settings page

import { getSystem } from './js/yjs.js';

// Get server configuration from Yjs settingsMap or fallback to empty string
const getServerConfig = () => {
  try {
    const yjsSystem = getSystem();
    if (yjsSystem?.settingsMap) {
      const savedServer = yjsSystem.settingsMap.get('dnd-journal-sync-server');
      if (savedServer) {
        return savedServer;
      }
    }
  } catch (e) {
    // Yjs system not available, fallback to static config
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