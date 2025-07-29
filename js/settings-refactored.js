// Settings - Refactored Settings Page with Extracted Modules
// Following functional programming principles and style guide

// Import extracted modules
import { 
  loadSettingsFromSystem, 
  saveSettingsToSystem, 
  updateSettings,
  createDefaultSettings 
} from './settings-data.js';

import { 
  testApiKey, 
  createTestResultDisplay, 
  createLoadingDisplay 
} from './api-testing.js';

import { 
  testWebSocketConnection, 
  createConnectionTestDisplay, 
  createConnectionLoadingDisplay 
} from './sync-testing.js';

import { handleError, createSuccess, safeDomOperation } from './error-handling.js';
import { getElementValue, setElementValue, addEventListener } from './dom-utils.js';
import { createSystem } from './yjs.js';

// Pure function to populate form with settings data
export const populateSettingsForm = (settings) => {
  return safeDomOperation(() => {
    const formData = settings || createDefaultSettings();
    
    // Populate form fields
    setElementValue('api-key', formData.apiKey);
    
    const enableAIInput = document.getElementById('enable-ai-features');
    if (enableAIInput) {
      enableAIInput.checked = Boolean(formData.enableAIFeatures);
    }
    
    setElementValue('sync-server', formData.syncServer);
    
    return formData;
  }, 'populateSettingsForm');
};

// Pure function to get settings data from form
export const getSettingsFromForm = () => {
  return safeDomOperation(() => {
    const apiKey = getElementValue('api-key').data || '';
    const syncServer = getElementValue('sync-server').data || '';
    
    const enableAIInput = document.getElementById('enable-ai-features');
    const enableAIFeatures = enableAIInput ? enableAIInput.checked : false;
    
    return {
      apiKey: apiKey.trim(),
      enableAIFeatures,
      syncServer: syncServer.trim()
    };
  }, 'getSettingsFromForm');
};

// Function to load and populate form
export const loadAndPopulateForm = () => {
  const result = loadSettingsFromSystem();
  if (result.success) {
    populateSettingsForm(result.data);
  } else {
    console.warn('Failed to load settings:', result.error);
    populateSettingsForm(createDefaultSettings());
  }
};

// Function to handle settings save
export const handleSettingsSave = () => {
  const formResult = getSettingsFromForm();
  if (!formResult.success) {
    alert('Failed to read form data');
    return;
  }
  
  const saveResult = saveSettingsToSystem(formResult.data);
  if (saveResult.success) {
    alert('Settings saved successfully!');
  } else {
    alert(`Failed to save settings: ${saveResult.error}`);
  }
};

// Function to handle API key test
export const handleApiKeyTest = async () => {
  const resultDiv = document.getElementById('api-test-result');
  if (!resultDiv) return;
  
  const apiKeyResult = getElementValue('api-key');
  if (!apiKeyResult.success) {
    alert('Failed to read API key');
    return;
  }
  
  const apiKey = apiKeyResult.data.trim();
  if (!apiKey) {
    const display = createTestResultDisplay({ 
      success: false, 
      error: 'Please enter an API key' 
    });
    resultDiv.className = display.className;
    resultDiv.textContent = display.message;
    return;
  }
  
  // Show loading state
  const loadingDisplay = createLoadingDisplay();
  resultDiv.className = loadingDisplay.className;
  resultDiv.textContent = loadingDisplay.message;
  
  // Test API key
  const testResult = await testApiKey(apiKey);
  const display = createTestResultDisplay(testResult);
  
  resultDiv.className = display.className;
  resultDiv.textContent = display.message;
};

// Function to handle sync server test
export const handleSyncServerTest = async () => {
  const testButton = document.getElementById('test-sync-server');
  const resultDiv = document.getElementById('sync-test-result');
  
  if (!testButton || !resultDiv) return;
  
  const serverResult = getElementValue('sync-server');
  if (!serverResult.success) {
    alert('Failed to read sync server URL');
    return;
  }
  
  const serverUrl = serverResult.data.trim();
  
  // Update button state
  testButton.disabled = true;
  testButton.textContent = 'Testing...';
  
  // Show loading state
  const loadingDisplay = createConnectionLoadingDisplay();
  resultDiv.innerHTML = `<div class="${loadingDisplay.className}">${loadingDisplay.message}</div>`;
  
  try {
    // Test connection
    const testResult = await testWebSocketConnection(serverUrl);
    const display = createConnectionTestDisplay(testResult);
    
    resultDiv.innerHTML = `<div class="${display.className}">${display.message}</div>`;
    
  } catch (error) {
    const errorDisplay = createConnectionTestDisplay({ 
      success: false, 
      error: error.message 
    });
    resultDiv.innerHTML = `<div class="${errorDisplay.className}">${errorDisplay.message}</div>`;
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test Connection';
  }
};

// Function to handle settings change
export const handleSettingsChange = () => {
  // Auto-save on change (optional feature)
  // For now, just indicate that settings have changed
  console.log('Settings changed - remember to save');
};

// Function to handle clear summaries
export const handleClearSummaries = async () => {
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
    // Import summarization module lazily
    const { clearAll } = await import('./summarization.js');
    await clearAll();
    alert('All summaries have been cleared.');
  } catch (error) {
    console.error('Failed to clear summaries:', error);
    alert('Failed to clear summaries. Feature may not be available.');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
};

// Function to setup event handlers
export const setupSettingsEventHandlers = () => {
  // API key test button
  addEventListener('test-api-key', 'click', handleApiKeyTest);
  
  // Sync server test button
  addEventListener('test-sync-server', 'click', handleSyncServerTest);
  
  // Save settings button
  addEventListener('save-all-settings', 'click', handleSettingsSave);
  
  // Clear summaries button
  addEventListener('clear-summaries', 'click', handleClearSummaries);
  
  // Auto-change handlers
  addEventListener('api-key', 'input', handleSettingsChange);
  addEventListener('sync-server', 'input', handleSettingsChange);
  
  const enableAIInput = document.getElementById('enable-ai-features');
  if (enableAIInput) {
    enableAIInput.addEventListener('change', handleSettingsChange);
  }
};

// Function to show sync status
export const showSyncStatus = (status, text, details) => {
  return safeDomOperation(() => {
    const syncIndicator = document.getElementById('sync-status');
    if (syncIndicator) {
      syncIndicator.textContent = text;
      syncIndicator.className = `sync-status sync-${status}`;
      syncIndicator.title = details;
      syncIndicator.style.display = 'block';
    }
  }, 'showSyncStatus');
};

// Function to hide sync status
export const hideSyncStatus = () => {
  return safeDomOperation(() => {
    const syncIndicator = document.getElementById('sync-status');
    if (syncIndicator) {
      syncIndicator.style.display = 'none';
    }
  }, 'hideSyncStatus');
};

// Function to initialize settings page
export const initializeSettings = async () => {
  try {
    // Initialize YJS system first
    await createSystem();
    
    // Load and populate form
    loadAndPopulateForm();
    
    // Setup event handlers
    setupSettingsEventHandlers();
    
    // Hide sync status initially
    hideSyncStatus();
    
    console.log('Settings page initialized successfully');
  } catch (error) {
    console.error('Failed to initialize settings:', error);
    alert('Failed to initialize settings page');
  }
};

// Initialize when DOM is ready (only in browser environment)
if (typeof document !== 'undefined' && document.addEventListener) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSettings);
  } else {
    initializeSettings();
  }
}

// Export for compatibility
export {
  loadSettingsFromSystem as loadSettings,
  saveSettingsToSystem as saveSettings,
  testApiKey
};