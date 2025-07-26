// Settings Page - AI Configuration & Data Management

import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.6.27/+esm';
import { WebsocketProvider } from 'https://cdn.jsdelivr.net/npm/y-websocket@3/+esm';
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

// Save settings to localStorage
export const saveSettings = (settings) => {
  return safeSetToStorage(STORAGE_KEYS.SETTINGS, settings);
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

// Handle AI settings save
const handleSaveAISettings = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const saveButton = document.getElementById('save-ai-settings');

  if (!apiKeyInput || !enableAIInput || !saveButton) return;

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    enableAIFeatures: enableAIInput.checked
  };

  const originalText = saveButton.textContent;
  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;

  try {
    saveSettings(settings);
    saveButton.textContent = 'Saved!';
    
    // Update UI state after saving
    handleSettingsChange();
    
    // Reset button after a delay
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1500);
  } catch (error) {
    console.error('Failed to save AI settings:', error);
    saveButton.textContent = 'Error';
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1500);
  }
};

// Handle sync settings save
const handleSaveSyncSettings = () => {
  const syncServerInput = document.getElementById('sync-server');
  const saveButton = document.getElementById('save-sync-settings');

  if (!syncServerInput || !saveButton) return;

  const serverUrl = syncServerInput.value.trim();
  const originalText = saveButton.textContent;
  
  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;

  try {
    if (serverUrl) {
      localStorage.setItem('dnd-journal-sync-server', serverUrl);
    } else {
      localStorage.removeItem('dnd-journal-sync-server');
    }
    
    saveButton.textContent = 'Saved!';
    
    // Reset button after a delay
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1500);
  } catch (error) {
    console.error('Failed to save sync settings:', error);
    saveButton.textContent = 'Error';
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.disabled = false;
    }, 1500);
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
  
  // AI settings save button
  const saveAIButton = document.getElementById('save-ai-settings');
  if (saveAIButton) {
    saveAIButton.addEventListener('click', handleSaveAISettings);
  }
  
  // Sync event handlers
  const syncServerInput = document.getElementById('sync-server');
  const testSyncButton = document.getElementById('test-sync-server');
  const saveSyncButton = document.getElementById('save-sync-settings');
  
  // No auto-saving on blur for sync server input
  
  if (testSyncButton) {
    testSyncButton.addEventListener('click', handleSyncServerTest);
  }
  
  if (saveSyncButton) {
    saveSyncButton.addEventListener('click', handleSaveSyncSettings);
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
          message: `Default public sync server (${server}) is working!` 
        };
      }
    }
    
    return { 
      success: false, 
      error: 'Unable to connect to default public sync servers' 
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

// Simple sync status update
const updateSimpleSyncStatus = () => {
  const syncSection = document.getElementById('sync-status-simple');
  const syncDot = document.getElementById('sync-dot');
  const syncText = document.getElementById('sync-text');
  const syncHelp = document.getElementById('sync-help');
  
  if (!syncSection) return;
  
  // Always show sync status - requirement: "should display all the time, even using public servers"
  syncSection.style.display = 'block';
  
  const sync = getYjsSync();
  if (!sync) {
    // Sync not available
    if (syncDot) syncDot.className = 'sync-dot unavailable';
    if (syncText) syncText.textContent = 'Sync unavailable';
    if (syncHelp) syncHelp.textContent = 'Sync not available in this environment';
    return;
  }
  
  const status = sync.getStatus();
  
  if (syncDot && syncText && syncHelp) {
    if (status.connected) {
      syncDot.className = 'sync-dot connected';
      syncText.textContent = 'Connected';
      syncHelp.textContent = 'Your journal is syncing across devices.';
    } else {
      syncDot.className = 'sync-dot disconnected';
      syncText.textContent = 'Working offline';
      syncHelp.textContent = 'Your journal will sync when connection is restored.';
    }
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
  
  updateSimpleSyncStatus();
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
  
  try {
    const result = await testSyncServer(serverUrl);
    
    if (result.success) {
      resultDiv.innerHTML = `<div class="test-success">✓ ${result.message}</div>`;
      
      // Save the server configuration
      if (serverUrl) {
        localStorage.setItem('dnd-journal-sync-server', serverUrl);
      } else {
        localStorage.removeItem('dnd-journal-sync-server');
      }
    } else {
      resultDiv.innerHTML = `<div class="test-error">✗ ${result.error}</div>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<div class="test-error">✗ Test failed: ${error.message}</div>`;
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test Sync Connection';
  }
};



// Initialize settings page
const init = () => {
  populateForm();
  setupEventHandlers();
  
  // Update sync status periodically (only in browser, not in tests)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    setInterval(updateSimpleSyncStatus, 5000);
  }
};

// Start when DOM is ready (only in browser environment)
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init);
}
