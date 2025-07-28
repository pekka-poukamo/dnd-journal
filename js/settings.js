// Settings Page - AI Configuration & Data Management

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { 
  loadDataWithFallback, 
  createInitialSettings, 
  createInitialJournalState,
  safeSetToStorage, 
  STORAGE_KEYS 
} from './utils.js';
import { clearAll } from './summarization.js';
import { 
  getIntrospectionPromptForPreview,
  isAIEnabled
} from './ai.js';

import { createYjsSync } from './sync.js';

// Initialize sync system - lazy initialization
let yjsSync = null;
const getYjsSync = () => {
  if (!yjsSync) {
    try {
      yjsSync = createYjsSync();
    } catch (e) {
      // In test environment or when browser APIs aren't available
      // Silently fail - sync not available
      return null;
    }
  }
  return yjsSync;
};

// Load settings from localStorage
export const loadSettings = () => {
  return loadDataWithFallback(
    STORAGE_KEYS.SETTINGS, 
    createInitialSettings()
  );
};

// Save settings - use Yjs directly if available, otherwise localStorage
export const saveSettings = (settings) => {
  // First save to localStorage for backward compatibility
  const result = safeSetToStorage(STORAGE_KEYS.SETTINGS, settings);
  
  // Update Yjs directly if available (for real-time sync)
  import('./yjs-registry.js').then(({ getYjsSystem }) => {
    const yjsSystem = getYjsSystem();
    if (yjsSystem) {
      import('./yjs.js').then(({ updateSettingsInYjs }) => {
        updateSettingsInYjs(yjsSystem, settings);
      });
    }
  }).catch(() => {
    // Yjs not available, that's OK
  });
  
  return result;
};

// Test API key with OpenAI
export const testApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return { success: false, error: 'Invalid API key format' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, message: 'API key is valid!' };
    } else {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || 'Invalid API key' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Network error: Unable to test API key' 
    };
  }
};

// Show API test result
const showApiTestResult = (result) => {
  const resultDiv = document.getElementById('api-test-result');
  if (!resultDiv) return;

  resultDiv.className = 'api-test-result';
  
  if (result.success) {
    resultDiv.className += ' success';
    resultDiv.textContent = result.message;
  } else {
    resultDiv.className += ' error';
    resultDiv.textContent = result.error;
  }
};

// Show loading state for API test
const showApiTestLoading = () => {
  const resultDiv = document.getElementById('api-test-result');
  if (!resultDiv) return;

  resultDiv.className = 'api-test-result loading';
  resultDiv.textContent = 'Testing API key...';
};

// Handle API key test
const handleApiKeyTest = async () => {
  const apiKeyInput = document.getElementById('api-key');
  if (!apiKeyInput) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showApiTestResult({ success: false, error: 'Please enter an API key' });
    return;
  }

  showApiTestLoading();
  const result = await testApiKey(apiKey);
  showApiTestResult(result);
};

// Handle settings form changes (without auto-saving)
const handleSettingsChange = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');
  const showPromptButton = document.getElementById('show-ai-prompt');

  if (!apiKeyInput || !enableAIInput || !testButton) return;

  const apiKey = apiKeyInput.value.trim();
  const enableAI = enableAIInput.checked;
  
  // Enable/disable test button based on API key presence
  testButton.disabled = !apiKey;
  
  // Enable/disable show prompt button based on AI being enabled (check current saved state)
  if (showPromptButton) {
    showPromptButton.disabled = !isAIEnabled();
  }
};

// Unified save handler for all settings
const handleSaveAllSettings = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const syncServerInput = document.getElementById('sync-server');
  const saveButton = document.getElementById('save-all-settings');

  if (!saveButton) return;

  const originalText = saveButton.textContent;
  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;

  try {
    // Save AI settings
    if (apiKeyInput && enableAIInput) {
      const aiSettings = {
        apiKey: apiKeyInput.value.trim(),
        enableAIFeatures: enableAIInput.checked
      };
      saveSettings(aiSettings);
    }

    // Save sync settings
    if (syncServerInput) {
      const serverUrl = syncServerInput.value.trim();
      if (serverUrl) {
        localStorage.setItem('dnd-journal-sync-server', serverUrl);
      } else {
        localStorage.removeItem('dnd-journal-sync-server');
      }
    }
    
    saveButton.textContent = 'Saved!';
    saveButton.className = 'btn btn-success btn-large';
    
    // Update UI state after saving
    handleSettingsChange();
    
    // Reset button after a delay
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.className = 'btn btn-primary btn-large';
      saveButton.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to save settings:', error);
    saveButton.textContent = 'Error saving';
    saveButton.className = 'btn btn-danger btn-large';
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.className = 'btn btn-primary btn-large';
      saveButton.disabled = false;
    }, 2000);
  }
};

// Setup event handlers
const setupEventHandlers = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');
  
  // Listen for input changes to update UI state (without auto-saving)
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', handleSettingsChange);
  }

  if (enableAIInput) {
    enableAIInput.addEventListener('change', handleSettingsChange);
  }

  if (testButton) {
    testButton.addEventListener('click', handleApiKeyTest);
  }

  const clearSummariesButton = document.getElementById('clear-summaries');
  if (clearSummariesButton) {
    clearSummariesButton.addEventListener('click', handleClearSummaries);
  }
  
  const showPromptButton = document.getElementById('show-ai-prompt');
  if (showPromptButton) {
    showPromptButton.addEventListener('click', handleShowAIPrompt);
  }
  
  // Unified save button
  const saveAllButton = document.getElementById('save-all-settings');
  if (saveAllButton) {
    saveAllButton.addEventListener('click', handleSaveAllSettings);
  }
  
  // Sync event handlers
  const testSyncButton = document.getElementById('test-sync-server');
  
  if (testSyncButton) {
    testSyncButton.addEventListener('click', handleSyncServerTest);
  }
};

// Handle clear summaries button
const handleClearSummaries = async () => {
  const button = document.getElementById('clear-summaries');
  if (!button) return;
  
  // Confirm before clearing
  if (!confirm('Are you sure you want to clear all summaries? This action cannot be undone.')) {
    return;
  }
  
  const originalText = button.textContent;
  button.textContent = 'Clearing...';
  button.disabled = true;
  
  try {
    const result = clearAll();
    if (result) {
      alert('All summaries have been cleared successfully.');
    } else {
      alert('Failed to clear summaries.');
    }
  } catch (error) {
    alert('Failed to clear summaries: ' + error.message);
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
};

// Handle show AI prompt button
const handleShowAIPrompt = async () => {
  const button = document.getElementById('show-ai-prompt');
  const previewDiv = document.getElementById('ai-prompt-preview');
  const contentDiv = document.getElementById('ai-prompt-content');
  
  if (!button || !previewDiv || !contentDiv) return;
  
  // Toggle visibility
  if (previewDiv.style.display === 'none') {
    button.disabled = true;
    button.textContent = 'Loading...';
    
    try {
      // Load current journal data
      const journalData = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
      
      // Get the prompt that would be sent to AI using the AI module function
      const promptData = await getIntrospectionPromptForPreview(journalData.character, journalData.entries);
      
      if (!promptData) {
        contentDiv.innerHTML = `<div class="error">AI features are not properly configured. Please check your API key and settings.</div>`;
        previewDiv.style.display = 'block';
        button.textContent = 'Hide AI Prompt';
        return;
      }
      
      // Format for display using the prompt data from AI module
      contentDiv.innerHTML = `
        <div class="token-count">
          <strong>Estimated Token Count:</strong> ${promptData.totalTokens} tokens
        </div>
        <div class="system-prompt">
          <strong>System Prompt:</strong><br>
          ${promptData.systemPrompt.replace(/\n/g, '<br>')}
        </div>
        <div class="user-prompt">
          <strong>User Prompt:</strong><br>
          ${promptData.userPrompt.replace(/\n/g, '<br>')}
        </div>
      `;
      
      previewDiv.style.display = 'block';
      button.textContent = 'Hide AI Prompt';
    } catch (error) {
      console.error('Failed to generate prompt preview:', error);
      contentDiv.innerHTML = `<div class="error">Failed to generate prompt: ${error.message}</div>`;
      previewDiv.style.display = 'block';
      button.textContent = 'Hide AI Prompt';
    } finally {
      button.disabled = false;
    }
  } else {
    previewDiv.style.display = 'none';
    button.textContent = 'Show Current AI Prompt';
  }
};

// Test sync server connection
const testSyncServer = async (serverUrl) => {

  // If no custom server URL, test default public servers
  if (!serverUrl) {
    const defaultServers = [
      'wss://demos.yjs.dev',
      'wss://y-websocket.herokuapp.com'
    ];
    // Note: These are demo servers that may have limited reliability
    
    // Test the first available public server
    for (const server of defaultServers) {
      const result = await testSingleServer(server);
      if (result.success) {
        return { 
          success: true, 
          message: `Public sync server (${server}) is working!` 
        };
      }
    }
    
    return { 
      success: false, 
      error: 'Unable to connect to public sync servers' 
    };
  }
  
  // Validate server URL format with better error messages
  if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
    // Check for common mistakes like email addresses
    if (serverUrl.includes('@')) {
      return { 
        success: false, 
        error: 'Server URL cannot be an email address. Use a WebSocket URL like ws://your-server.com:1234' 
      };
    }
    
    // Check for HTTP URLs
    if (serverUrl.startsWith('http://') || serverUrl.startsWith('https://')) {
      return { 
        success: false, 
        error: 'Use WebSocket URLs (ws:// or wss://) instead of HTTP URLs' 
      };
    }
    
    // Generic format error
    return { 
      success: false, 
      error: 'Server URL must start with ws:// (unsecured) or wss:// (secured). Example: ws://192.168.1.100:1234' 
    };
  }
  
  // Additional validation for URL structure
  try {
    const url = new URL(serverUrl);
    if (!url.hostname) {
      return { 
        success: false, 
        error: 'Invalid server hostname in URL' 
      };
    }
  } catch (e) {
    return { 
      success: false, 
      error: 'Invalid URL format. Use format like ws://hostname:port or wss://hostname:port' 
    };
  }
  
  return await testSingleServer(serverUrl);
};

// Helper function to test a single server
const testSingleServer = async (serverUrl) => {
  return new Promise((resolve) => {
    try {
      const testDoc = new Y.Doc();
      const provider = new WebsocketProvider(serverUrl, 'test-connection', testDoc);
      
      const timeout = setTimeout(() => {
        provider.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      }, 5000);
      
      provider.on('status', (event) => {
        if (provider.wsconnected) {
          clearTimeout(timeout);
          provider.destroy();
          resolve({ success: true, message: 'Server connection successful!' });
        }
      });
      
      provider.on('connection-error', (error) => {
        clearTimeout(timeout);
        provider.destroy();
        resolve({ success: false, error: error.message || 'Connection failed' });
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
};

// Show sync status only when checking or when results are available
const showSyncStatus = (status, message, helpText) => {
  const syncContainer = document.getElementById('sync-status-container');
  const syncDot = document.getElementById('sync-dot');
  const syncText = document.getElementById('sync-text');
  const syncHelp = document.getElementById('sync-help');
  
  if (!syncContainer) return;
  
  // Show the container
  syncContainer.style.display = 'block';
  
  if (syncDot) syncDot.className = `sync-dot ${status}`;
  if (syncText) syncText.textContent = message;
  if (syncHelp) syncHelp.textContent = helpText;
  
  // Auto-hide after successful connection test (but keep visible during ongoing checks)
  if (status === 'connected') {
    setTimeout(() => {
      syncContainer.style.display = 'none';
    }, 3000);
  }
};

// Hide sync status
const hideSyncStatus = () => {
  const syncContainer = document.getElementById('sync-status-container');
  if (syncContainer) {
    syncContainer.style.display = 'none';
  }
};

// Populate form with current settings
const populateForm = () => {
  const settings = loadSettings();
  
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');
  const showPromptButton = document.getElementById('show-ai-prompt');

  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey;
  }

  if (enableAIInput) {
    enableAIInput.checked = settings.enableAIFeatures;
  }

  if (testButton) {
    testButton.disabled = !settings.apiKey;
  }
  
  if (showPromptButton) {
    showPromptButton.disabled = !isAIEnabled();
  }
  
  // Load sync server configuration
  const syncServerInput = document.getElementById('sync-server');
  if (syncServerInput) {
    // Try to load from sync config or localStorage
    try {
      const savedServer = localStorage.getItem('dnd-journal-sync-server');
      if (savedServer) {
        syncServerInput.value = savedServer;
      }
    } catch (e) {}
  }
  
  // Hide sync status initially
  hideSyncStatus();
};

// Handle sync server test
const handleSyncServerTest = async () => {
  const syncServerInput = document.getElementById('sync-server');
  const testButton = document.getElementById('test-sync-server');
  const resultDiv = document.getElementById('sync-test-result');
  
  if (!syncServerInput || !testButton || !resultDiv) return;
  
  const serverUrl = syncServerInput.value.trim();
  
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  resultDiv.innerHTML = '';
  
  // Show sync status as "checking"
  showSyncStatus('connecting', 'Testing connection...', 'Checking server connectivity');
  
  try {
    const result = await testSyncServer(serverUrl);
    
    if (result.success) {
      resultDiv.innerHTML = `<div class="test-success">✓ ${result.message}</div>`;
      showSyncStatus('connected', 'Connected', result.message);
    } else {
      resultDiv.innerHTML = `<div class="test-error">✗ ${result.error}</div>`;
      showSyncStatus('disconnected', 'Connection failed', result.error);
      
      // Hide status after showing error briefly
      setTimeout(() => {
        hideSyncStatus();
      }, 5000);
    }
  } catch (error) {
    resultDiv.innerHTML = `<div class="test-error">✗ Test failed: ${error.message}</div>`;
    showSyncStatus('disconnected', 'Test failed', error.message);
    
    // Hide status after showing error briefly
    setTimeout(() => {
      hideSyncStatus();
    }, 5000);
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test Connection';
  }
};

// Initialize settings page
const init = () => {
  populateForm();
  setupEventHandlers();
};

// Start when DOM is ready (only in browser environment)
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init);
}
