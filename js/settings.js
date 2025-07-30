// Settings Page - Simplified Architecture
import { 
  initData, 
  onStateChange, 
  getState,
  updateSetting,
  getSetting
} from './data.js';

import {
  renderSettingsForm,
  renderConnectionStatus,
  setTestConnectionLoading,
  getFormData,
  showNotification
} from './settings-views.js';

// Initialize settings page
const initSettingsPage = async () => {
  try {
    // Initialize data layer
    await initData();
    
    // Set up reactive rendering
    onStateChange(handleStateChange);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderSettingsPage();
    
  } catch (error) {
    console.error('Failed to initialize settings page:', error);
    showNotification('Failed to load settings page. Please refresh.', 'error');
  }
};

// Handle state changes from Y.js
const handleStateChange = (state) => {
  renderSettingsPage();
};

// Render the settings page
const renderSettingsPage = () => {
  const state = getState();
  
  // Render settings form with current data
  renderSettingsForm(state.settings);
  
  // Update connection status
  const syncServer = getSetting('dnd-journal-sync-server');
  // TODO: Get actual connection status from Y.js provider
  renderConnectionStatus(false, syncServer);
};

// Set up event listeners
const setupEventListeners = () => {
  // Settings form submission
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSettingsFormSubmit);
  }
  
  // Test API key button
  const testApiBtn = document.getElementById('test-api-key');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', handleTestApiKey);
  }
  
  // Test connection button
  const testConnBtn = document.getElementById('test-connection');
  if (testConnBtn) {
    testConnBtn.addEventListener('click', handleTestConnection);
  }
  
  // Real-time field updates
  const apiKeyInput = document.getElementById('api-key');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('blur', (e) => {
      updateSetting('openai-api-key', e.target.value.trim());
    });
  }
  
  const aiEnabledCheckbox = document.getElementById('ai-enabled');
  if (aiEnabledCheckbox) {
    aiEnabledCheckbox.addEventListener('change', (e) => {
      updateSetting('ai-enabled', e.target.checked);
    });
  }
  
  const syncServerInput = document.getElementById('sync-server');
  if (syncServerInput) {
    syncServerInput.addEventListener('blur', (e) => {
      updateSetting('dnd-journal-sync-server', e.target.value.trim());
    });
  }
};

// Handle settings form submission
const handleSettingsFormSubmit = (event) => {
  event.preventDefault();
  const formData = getFormData(event.target);
  
  // Update all settings in Y.js
  Object.entries(formData).forEach(([key, value]) => {
    if (key === 'ai-enabled') {
      updateSetting('ai-enabled', value === 'on');
    } else if (key === 'api-key') {
      updateSetting('openai-api-key', value.trim());
    } else if (key === 'sync-server') {
      updateSetting('dnd-journal-sync-server', value.trim());
    }
  });
  
  showNotification('Settings saved!', 'success');
};

// Test API key with OpenAI
const testApiKey = async (apiKey) => {
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

// Handle API key test
const handleTestApiKey = async () => {
  const apiKeyInput = document.getElementById('api-key');
  if (!apiKeyInput) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showNotification('Please enter an API key', 'error');
    return;
  }

  setTestConnectionLoading(true);
  const result = await testApiKey(apiKey);
  setTestConnectionLoading(false);
  
  if (result.success) {
    showNotification(result.message, 'success');
  } else {
    showNotification(result.error, 'error');
  }
};

// Handle connection test
const handleTestConnection = async () => {
  const syncServerInput = document.getElementById('sync-server');
  if (!syncServerInput) return;

  const serverUrl = syncServerInput.value.trim();
  if (!serverUrl) {
    showNotification('Please enter a sync server URL', 'error');
    return;
  }

  setTestConnectionLoading(true);
  
  try {
    // Test WebSocket connection
    const ws = new WebSocket(serverUrl);
    
    const testResult = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve({ success: false, error: 'Connection timeout' });
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ success: true, message: 'Connection successful!' });
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        resolve({ success: false, error: 'Connection failed' });
      };
    });
    
    if (testResult.success) {
      showNotification(testResult.message, 'success');
    } else {
      showNotification(testResult.error, 'error');
    }
    
  } catch (error) {
    showNotification('Failed to test connection', 'error');
  } finally {
    setTestConnectionLoading(false);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initSettingsPage);

// Export for testing
export { 
  initSettingsPage,
  handleSettingsFormSubmit,
  testApiKey,
  renderSettingsPage 
};
