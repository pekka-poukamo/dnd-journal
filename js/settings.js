// Settings Page - AI Configuration & Data Management

import { 
  loadDataWithFallback, 
  createInitialSettings, 
  safeSetToStorage, 
  STORAGE_KEYS 
} from './utils.js';
import { getSummaryStats, autoSummarizeEntries } from './summarization.js';

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
  
  // Use the summarization module
  try {
    const stats = getSummaryStats();
    
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
  } catch (error) {
    console.error('Failed to load summary stats:', error);
    // Hide stats on error
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
    const result = await autoSummarizeEntries();
    if (result && result.length > 0) {
      alert(`Generated ${result.length} summaries.`);
      updateSummaryStats();
    } else {
      alert('No summaries needed at this time.');
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
  // Wait for libraries to load if they're still loading
  await waitForLibraries();
  
  // If no Yjs libraries are available after waiting, return helpful error
  if (typeof window.Y === 'undefined' || typeof window.WebsocketProvider === 'undefined') {
    return { 
      success: false, 
      error: 'Sync libraries failed to load from CDN. Check your internet connection and try refreshing the page.' 
    };
  }

  // If no custom server URL, test default public servers
  if (!serverUrl) {
    const defaultServers = [
      'wss://demos.yjs.dev',
      // Note: Other demo servers removed due to reliability issues
    ];
    // Note: These are demo servers that may have limited reliability
    
    // Test the first available public server
    for (const server of defaultServers) {
      const result = await testSingleServer(server);
      if (result.success) {
        return { 
          success: true, 
          message: `Default public sync server (${server}) is working! Note: Demo servers may have limited reliability.` 
        };
      }
    }
    
    return { 
      success: false, 
      error: 'Unable to connect to default public sync servers. These demo servers may be temporarily unavailable. Consider setting up your own sync server.' 
    };
  }
  
  if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
    return { success: false, error: 'Server URL must start with ws:// or wss://' };
  }
  
  return await testSingleServer(serverUrl);
};

// Helper function to wait for libraries to load
const waitForLibraries = async () => {
  const maxWaitTime = 5000; // 5 seconds
  const checkInterval = 100; // Check every 100ms
  let waited = 0;
  
  return new Promise((resolve) => {
    const checkLibraries = () => {
      if (typeof window.Y !== 'undefined' && typeof window.WebsocketProvider !== 'undefined') {
        resolve();
      } else if (waited >= maxWaitTime) {
        resolve(); // Stop waiting after max time
      } else {
        waited += checkInterval;
        setTimeout(checkLibraries, checkInterval);
      }
    };
    checkLibraries();
  });
};

// Helper function to test a single server
const testSingleServer = async (serverUrl) => {
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
    if (syncHelp) syncHelp.textContent = 'Sync libraries failed to load from CDN. Check your internet connection or try refreshing the page.';
    return;
  }
  
  const status = yjsSync.getStatus();
  
  if (syncDot && syncText && syncHelp) {
    if (!status.available) {
      syncDot.className = 'sync-dot unavailable';
      syncText.textContent = 'Sync unavailable';
      syncHelp.textContent = 'Sync libraries are not available. Check browser console for details.';
    } else if (status.connected) {
      syncDot.className = 'sync-dot connected';
      syncText.textContent = 'Connected';
      syncHelp.textContent = 'Your journal is syncing across devices.';
    } else {
      syncDot.className = 'sync-dot disconnected';
      syncText.textContent = 'Working offline';
      syncHelp.textContent = 'Your journal will sync when connection is restored. Demo servers may have limited availability.';
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
