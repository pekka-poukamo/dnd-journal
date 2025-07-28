// Minimal Yjs Setup - Direct exports, no abstractions
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { SYNC_CONFIG } from '../sync-config.js';

// Global Yjs document and maps
export let ydoc = null;
export let journalMap = null;
export let settingsMap = null;
export let summariesMap = null;
export let persistence = null;
export let providers = [];

// Initialize Yjs document and persistence
export const initYjs = async () => {
  // Skip in test environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return;
  }

  try {
    // Create Yjs document
    ydoc = new Y.Doc();
    
    // Get shared data structures
    journalMap = ydoc.getMap('journal');
    settingsMap = ydoc.getMap('settings');
    summariesMap = ydoc.getMap('summaries');
    
    // Setup IndexedDB persistence (local-first)
    persistence = new IndexeddbPersistence('dnd-journal', ydoc);
    
    // Setup network sync
    const syncServers = getSyncServers();
    providers = syncServers.map(serverUrl => {
      try {
        return new WebsocketProvider(serverUrl, 'dnd-journal', ydoc, { connect: true });
      } catch (e) {
        console.error(`Failed to connect to ${serverUrl}:`, e);
        return null;
      }
    }).filter(Boolean);
    
    // Wait for IndexedDB to sync
    await new Promise((resolve) => {
      persistence.on('synced', resolve);
    });
    
    console.log('Yjs initialized');
    
  } catch (e) {
    console.error('Failed to initialize Yjs:', e);
  }
};

// Get sync server configuration
const getSyncServers = () => {
  try {
    if (SYNC_CONFIG?.server && isValidWebSocketUrl(SYNC_CONFIG.server)) {
      return [SYNC_CONFIG.server.trim()];
    }
  } catch (e) {
    console.warn('Error loading sync config:', e);
  }
  
  return ['wss://demos.yjs.dev', 'wss://y-websocket.herokuapp.com'];
};

// Validate WebSocket URL
const isValidWebSocketUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname?.length > 0;
  } catch (e) {
    return false;
  }
};

// Export Y constructor for creating maps in other modules
export { Y };