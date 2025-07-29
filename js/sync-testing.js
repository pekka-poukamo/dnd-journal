// Sync Testing - Sync server validation and connection testing
// Following functional programming principles and style guide

import { handleError, createSuccess, createError, safeExecute } from './error-handling.js';
import { WebsocketProvider } from './yjs.js';

// Pure function to validate sync server URL format
export const validateSyncServerUrl = (serverUrl) => {
  if (!serverUrl) {
    return createError('No sync server configured. Please set up your own sync server or use localhost for development.');
  }
  
  const trimmedUrl = serverUrl.trim();
  
  if (!trimmedUrl) {
    return createError('Sync server URL cannot be empty');
  }
  
  // Check for common mistakes
  if (trimmedUrl.includes('@')) {
    return createError('Server URL cannot be an email address. Use a WebSocket URL like ws://your-server.com:1234');
  }
  
  // Check for HTTP URLs
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return createError('Use WebSocket URLs (ws:// or wss://) instead of HTTP URLs');
  }
  
  // Check WebSocket format
  if (!trimmedUrl.startsWith('ws://') && !trimmedUrl.startsWith('wss://')) {
    return createError('Server URL must start with ws:// (unsecured) or wss:// (secured). Example: ws://192.168.1.100:1234');
  }
  
  // Validate URL structure
  try {
    const url = new URL(trimmedUrl);
    if (!url.hostname) {
      return createError('Invalid server hostname in URL');
    }
    return createSuccess(trimmedUrl);
  } catch (error) {
    return createError('Invalid WebSocket URL format');
  }
};

// Pure function to create WebSocket test configuration
export const createWebSocketTestConfig = (serverUrl) => ({
  url: serverUrl,
  timeout: 5000, // 5 second timeout
  protocols: [] // No specific protocols needed for basic test
});

// Function to test WebSocket connection
export const testWebSocketConnection = (serverUrl, timeout = 5000) => {
  return new Promise((resolve) => {
    const validation = validateSyncServerUrl(serverUrl);
    if (!validation.success) {
      resolve(validation);
      return;
    }
    
    const validatedUrl = validation.data;
    let ws = null;
    let timeoutId = null;
    let resolved = false;
    
    const resolveOnce = (result) => {
      if (resolved) return;
      resolved = true;
      
      if (timeoutId) clearTimeout(timeoutId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      
      resolve(result);
    };
    
    try {
      ws = new WebSocket(validatedUrl);
      
      // Set timeout
      timeoutId = setTimeout(() => {
        resolveOnce(createError('Connection timeout - server may be unreachable'));
      }, timeout);
      
      ws.onopen = () => {
        resolveOnce(createSuccess({
          message: 'Successfully connected to sync server!',
          url: validatedUrl
        }));
      };
      
      ws.onerror = (error) => {
        resolveOnce(createError('Failed to connect to sync server - check URL and server status'));
      };
      
      ws.onclose = (event) => {
        if (!resolved) {
          if (event.code === 1006) {
            resolveOnce(createError('Connection failed - server may be offline or unreachable'));
          } else {
            resolveOnce(createError(`Connection closed unexpectedly (code: ${event.code})`));
          }
        }
      };
      
    } catch (error) {
      resolveOnce(handleError('testWebSocketConnection', error));
    }
  });
};

// Function to test sync server using YJS provider
export const testSyncServerWithYjs = async (serverUrl) => {
  const validation = validateSyncServerUrl(serverUrl);
  if (!validation.success) {
    return validation;
  }
  
  const validatedUrl = validation.data;
  
  return safeExecute(async () => {
    return new Promise((resolve) => {
      let provider = null;
      let timeoutId = null;
      let resolved = false;
      
      const resolveOnce = (result) => {
        if (resolved) return;
        resolved = true;
        
        if (timeoutId) clearTimeout(timeoutId);
        if (provider) {
          provider.destroy();
        }
        
        resolve(result);
      };
      
      try {
        // Create a temporary YJS document for testing
        const Y = window.Y || require('yjs');
        const testDoc = new Y.Doc();
        
        // Create provider
        provider = new WebsocketProvider(validatedUrl, 'test-room', testDoc);
        
        // Set timeout
        timeoutId = setTimeout(() => {
          resolveOnce(createError('YJS sync test timeout - server may not support YJS protocol'));
        }, 5000);
        
        provider.on('status', ({ status }) => {
          if (status === 'connected') {
            resolveOnce(createSuccess({
              message: 'YJS sync server connection successful!',
              url: validatedUrl,
              protocol: 'YJS'
            }));
          }
        });
        
        provider.on('connection-error', () => {
          resolveOnce(createError('YJS sync connection failed - server may not support YJS protocol'));
        });
        
      } catch (error) {
        resolveOnce(handleError('testSyncServerWithYjs', error));
      }
    });
  }, 'YJS sync server test');
};

// Pure function to create connection test result display data
export const createConnectionTestDisplay = (result) => {
  if (!result) {
    return {
      className: 'test-result',
      message: ''
    };
  }
  
  if (result.success) {
    return {
      className: 'test-success',
      message: `✓ ${result.message || result.data?.message || 'Connection successful'}`
    };
  }
  
  return {
    className: 'test-error',
    message: `✗ ${result.error || 'Connection failed'}`
  };
};

// Pure function to create connection loading display data
export const createConnectionLoadingDisplay = () => ({
  className: 'test-loading',
  message: 'Testing connection...'
});

// Function to perform comprehensive sync server test
export const testSyncServerComprehensive = async (serverUrl) => {
  const validation = validateSyncServerUrl(serverUrl);
  if (!validation.success) {
    return validation;
  }
  
  const results = [];
  
  // Test 1: Basic WebSocket connection
  const wsResult = await testWebSocketConnection(serverUrl);
  results.push({
    test: 'WebSocket Connection',
    ...wsResult
  });
  
  // Test 2: YJS protocol support (only if WebSocket works)
  if (wsResult.success) {
    const yjsResult = await testSyncServerWithYjs(serverUrl);
    results.push({
      test: 'YJS Protocol Support',
      ...yjsResult
    });
  }
  
  // Determine overall result
  const hasBasicConnection = results.some(r => r.success && r.test === 'WebSocket Connection');
  const hasYjsSupport = results.some(r => r.success && r.test === 'YJS Protocol Support');
  
  if (hasYjsSupport) {
    return createSuccess({
      message: 'Sync server is fully compatible and ready to use!',
      details: results,
      capabilities: ['WebSocket', 'YJS Protocol']
    });
  } else if (hasBasicConnection) {
    return createSuccess({
      message: 'Basic connection works, but YJS protocol support unclear',
      details: results,
      capabilities: ['WebSocket']
    });
  } else {
    return createError('Unable to connect to sync server');
  }
};

// Pure function to extract connection info from URL
export const parseConnectionInfo = (serverUrl) => {
  try {
    const url = new URL(serverUrl);
    return createSuccess({
      protocol: url.protocol === 'wss:' ? 'Secure WebSocket (wss)' : 'WebSocket (ws)',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'wss:' ? '443' : '80'),
      isSecure: url.protocol === 'wss:',
      isLocalhost: url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    });
  } catch (error) {
    return createError('Invalid URL format');
  }
};

// Pure function to get common sync server suggestions
export const getSyncServerSuggestions = () => [
  {
    name: 'Local Development',
    url: 'ws://localhost:1234',
    description: 'For local development using the included server'
  },
  {
    name: 'Local Network',
    url: 'ws://192.168.1.100:1234',
    description: 'Replace with your local machine\'s IP address'
  },
  {
    name: 'Secure Connection',
    url: 'wss://your-domain.com:1234',
    description: 'For production use with SSL/TLS encryption'
  }
];