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

// Initialize sync system
let yjsSync = null;
try {
  yjsSync = createYjsSync();
} catch (e) {
  console.warn('Sync not available:', e);
}

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

// Handle settings form changes
const handleSettingsChange = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');
  const showPromptButton = document.getElementById('show-ai-prompt');

  if (!apiKeyInput || !enableAIInput || !testButton) return;

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    enableAIFeatures: enableAIInput.checked
  };

  saveSettings(settings);
  
  // Enable/disable test button based on API key presence
  testButton.disabled = !settings.apiKey;
  
  // Enable/disable show prompt button based on AI being enabled
  if (showPromptButton) {
    showPromptButton.disabled = !isAIEnabled();
  }
};

// Setup event handlers
const setupEventHandlers = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', handleSettingsChange);
    apiKeyInput.addEventListener('blur', handleSettingsChange);
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
  
  // Sync event handlers
  const syncServerInput = document.getElementById('sync-server');
  const testSyncButton = document.getElementById('test-sync-server');
  
  if (syncServerInput) {
    syncServerInput.addEventListener('blur', () => {
      const serverUrl = syncServerInput.value.trim();
      if (serverUrl) {
        localStorage.setItem('dnd-journal-sync-server', serverUrl);
      } else {
        localStorage.removeItem('dnd-journal-sync-server');
      }
    });
  }
  
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
  // If no Yjs libraries are available, return helpful error
  if (typeof Y === 'undefined' || typeof WebsocketProvider === 'undefined') {
    return { 
      success: false, 
      error: 'Sync libraries not loaded. Refresh the page to enable sync testing.' 
    };
  }

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
  
  if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
    return { success: false, error: 'Server URL must start with ws:// or wss://' };
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
  
  if (!yjsSync) {
    if (syncDot) syncDot.className = 'sync-dot unavailable';
    if (syncText) syncText.textContent = 'Sync unavailable';
    if (syncHelp) syncHelp.textContent = 'Sync libraries not loaded.';
    return;
  }
  
  const status = yjsSync.getStatus();
  
  if (syncDot && syncText && syncHelp) {
    if (!status.available) {
      syncDot.className = 'sync-dot unavailable';
      syncText.textContent = 'Sync unavailable';
      syncHelp.textContent = 'Sync is not available.';
    } else if (status.connected) {
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
  
  // Update sync status periodically
  if (yjsSync) {
    setInterval(updateSimpleSyncStatus, 5000);
  }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
