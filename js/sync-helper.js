// Sync Helper - Simple functions for sync setup and testing
// Follows ADR-0002 (Functional Programming) and ADR-0013 (Radical Simplicity)

// Default local server configuration
export const DEFAULT_LOCAL_SERVER = 'ws://localhost:1234';

// Simple function to set local server in localStorage
export const setLocalServer = () => {
  try {
    localStorage.setItem('dnd-journal-sync-server', DEFAULT_LOCAL_SERVER);
    return { success: true, server: DEFAULT_LOCAL_SERVER };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Simple function to clear server configuration
export const clearSyncServer = () => {
  try {
    localStorage.removeItem('dnd-journal-sync-server');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Simple function to get current server configuration
export const getCurrentServer = () => {
  try {
    const server = localStorage.getItem('dnd-journal-sync-server');
    return server || 'Default public servers';
  } catch (error) {
    return 'Error reading configuration';
  }
};

// Simple function to test WebSocket connection
export const testWebSocketConnection = (serverUrl) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Connection timeout' });
    }, 5000);

    try {
      const ws = new WebSocket(serverUrl);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ success: true, message: 'Connected successfully' });
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        resolve({ success: false, error: 'Connection failed' });
      };
      
      ws.onclose = (event) => {
        if (!event.wasClean) {
          clearTimeout(timeout);
          resolve({ success: false, error: 'Connection closed unexpectedly' });
        }
      };
    } catch (error) {
      clearTimeout(timeout);
      resolve({ success: false, error: error.message });
    }
  });
};

// Simple function to check if we're using local server
export const isUsingLocalServer = () => {
  const current = getCurrentServer();
  return current === DEFAULT_LOCAL_SERVER;
};

// Simple function to get sync setup instructions
export const getSyncInstructions = () => {
  const isLocal = isUsingLocalServer();
  
  if (isLocal) {
    return {
      status: 'local',
      message: 'Using local sync server',
      instructions: [
        '1. Run: npm run sync-server',
        '2. Server should be running on localhost:1234',
        '3. Check connection in Settings'
      ]
    };
  }
  
  return {
    status: 'public',
    message: 'Using public relay servers',
    instructions: [
      '1. Click "Set Local Server" for private sync',
      '2. Or run: npm run sync-server',
      '3. Configure custom server in Settings'
    ]
  };
};