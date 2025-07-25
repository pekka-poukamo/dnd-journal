// Settings Page - AI Configuration & Data Management

import { 
  loadDataWithFallback, 
  createInitialSettings, 
  safeSetToStorage, 
  STORAGE_KEYS 
} from './utils.js';

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

  if (!apiKeyInput || !enableAIInput || !testButton) return;

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    enableAIFeatures: enableAIInput.checked
  };

  saveSettings(settings);
  
  // Enable/disable test button based on API key presence
  testButton.disabled = !settings.apiKey;
  
  // Update summary stats display
  updateSummaryStats();
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

  const generateSummariesButton = document.getElementById('generate-summaries');
  if (generateSummariesButton) {
    generateSummariesButton.addEventListener('click', handleGenerateSummaries);
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

// Update summary stats display
const updateSummaryStats = () => {
  const settings = loadSettings();
  const summaryStatsDiv = document.getElementById('summary-stats');
  
  if (!summaryStatsDiv) return;
  
  if (!settings.enableAIFeatures || !settings.apiKey) {
    summaryStatsDiv.style.display = 'none';
    return;
  }
  
  summaryStatsDiv.style.display = 'block';
  
  // Use the summarization module if available
  if (typeof window !== 'undefined' && window.Summarization) {
    const stats = window.Summarization.getSummaryStats();
    
    const totalEntriesEl = document.getElementById('total-entries');
    const recentEntriesEl = document.getElementById('recent-entries');
    const summarizedEntriesEl = document.getElementById('summarized-entries');
    const pendingSummariesEl = document.getElementById('pending-summaries');
    const progressFill = document.getElementById('summary-progress');
    
    // Meta-summary elements
    const metaSummaryStatEl = document.getElementById('meta-summary-stat');
    const metaSummariesEl = document.getElementById('meta-summaries');
    const metaEntriesStatEl = document.getElementById('meta-entries-stat');
    const metaEntriesEl = document.getElementById('meta-entries');
    
    if (totalEntriesEl) totalEntriesEl.textContent = stats.totalEntries;
    if (recentEntriesEl) recentEntriesEl.textContent = stats.recentEntries;
    if (summarizedEntriesEl) summarizedEntriesEl.textContent = stats.summarizedEntries;
    if (pendingSummariesEl) pendingSummariesEl.textContent = stats.pendingSummaries;
    
    if (progressFill) {
      progressFill.style.width = `${stats.summaryCompletionRate}%`;
    }
    
    // Show meta-summary stats if meta-summarization is active
    if (stats.metaSummaryActive) {
      if (metaSummaryStatEl) metaSummaryStatEl.style.display = 'flex';
      if (metaEntriesStatEl) metaEntriesStatEl.style.display = 'flex';
      if (metaSummariesEl) metaSummariesEl.textContent = stats.metaSummaries;
      if (metaEntriesEl) metaEntriesEl.textContent = stats.entriesInMetaSummaries;
    } else {
      if (metaSummaryStatEl) metaSummaryStatEl.style.display = 'none';
      if (metaEntriesStatEl) metaEntriesStatEl.style.display = 'none';
    }
  } else {
    // Summarization not available, hide stats
    summaryStatsDiv.style.display = 'none';
  }
};

// Handle generate summaries button
const handleGenerateSummaries = async () => {
  const button = document.getElementById('generate-summaries');
  if (!button) return;
  
  const originalText = button.textContent;
  button.textContent = 'Generating...';
  button.disabled = true;
  
  try {
    if (typeof window !== 'undefined' && window.Summarization) {
      const result = await window.Summarization.generateMissingSummaries();
      if (result) {
        alert(`Generated ${result.generated} summaries. ${result.remaining} remaining.`);
        updateSummaryStats();
      }
    } else {
      alert('Summarization not available');
    }
  } catch (error) {
    alert('Failed to generate summaries: ' + error.message);
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
};

// Test sync server connection
const testSyncServer = async (serverUrl) => {
  if (!serverUrl) {
    return { success: false, error: 'No server URL provided' };
  }
  
  if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
    return { success: false, error: 'Server URL must start with ws:// or wss://' };
  }
  
  return new Promise((resolve) => {
    try {
      const testDoc = new window.Y.Doc();
      const provider = new window.WebsocketProvider(serverUrl, 'test-connection', testDoc);
      
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

// Update sync status in settings
const updateSyncStatus = () => {
  if (!yjsSync) return;
  
  const status = yjsSync.getStatus();
  const statusDetails = document.getElementById('sync-status-details');
  const deviceIdSpan = document.getElementById('settings-device-id');
  const connectionStatusSpan = document.getElementById('settings-connection-status');
  const connectedServersSpan = document.getElementById('settings-connected-servers');
  const lastSyncSpan = document.getElementById('settings-last-sync');
  
  if (statusDetails && status.available) {
    statusDetails.style.display = 'block';
    
    if (deviceIdSpan) {
      deviceIdSpan.textContent = status.deviceId;
    }
    
    if (connectionStatusSpan) {
      connectionStatusSpan.textContent = status.connected ? 'Connected' : 'Disconnected';
      connectionStatusSpan.style.color = status.connected ? '#10b981' : '#ef4444';
    }
    
    if (connectedServersSpan) {
      connectedServersSpan.textContent = `${status.connectedCount}/${status.totalProviders}`;
    }
    
    if (lastSyncSpan) {
      if (status.lastModified) {
        lastSyncSpan.textContent = new Date(status.lastModified).toLocaleString();
      } else {
        lastSyncSpan.textContent = 'Never';
      }
    }
  }
};

// Populate form with current settings
const populateForm = () => {
  const settings = loadSettings();
  
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');

  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey;
  }

  if (enableAIInput) {
    enableAIInput.checked = settings.enableAIFeatures;
  }

  if (testButton) {
    testButton.disabled = !settings.apiKey;
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
  
  updateSummaryStats();
  updateSyncStatus();
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
    testButton.textContent = 'Test Sync Server';
  }
};

// Initialize settings page
const init = () => {
  populateForm();
  setupEventHandlers();
  
  // Update sync status periodically
  if (yjsSync) {
    setInterval(updateSyncStatus, 5000);
  }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
