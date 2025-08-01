// Settings Page - Pure Functional Y.js Integration
import { 
  initYjs,
  getYjsState,
  setSetting,
  getSetting,
  onSettingsChange
} from './yjs.js';

import {
  renderSettingsForm,
  renderConnectionStatus,
  showNotification,
  getFormData
} from './settings-views.js';

import {
  getCachedSettings,
  getFormDataForPage,
  saveNavigationCache,
  saveCurrentFormData
} from './navigation-cache.js';

import { isAPIAvailable } from './openai-wrapper.js';

// State management
let settingsFormElement = null;
let connectionStatusElement = null;

// Initialize Settings page
export const initSettingsPage = async (stateParam = null) => {
  try {
    // Get DOM elements first
    settingsFormElement = document.getElementById('settings-form');
    connectionStatusElement = document.getElementById('connection-status');
    
    if (!settingsFormElement) {
      console.warn('Settings form not found');
      return;
    }
    
    // 1. Show cached content immediately
    renderCachedSettingsContent();
    
    // 2. Initialize Yjs in background
    const state = stateParam || (await initYjs(), getYjsState());
    
    // 3. Set up reactive updates
    onSettingsChange(state, () => {
      renderSettingsPage();
      // Save to cache when data changes
      saveNavigationCache(state);
    });
    
    // 4. Replace cached content with fresh data
    renderSettingsPage();
    
    // 5. Set up form handling
    setupFormHandlers();
    
    // 6. Set up navigation caching
    setupSettingsNavigationCaching(state);
    
  } catch (error) {
    console.error('Failed to initialize settings page:', error);
  }
};

// Render settings page
export const renderSettingsPage = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const settings = {
      'openai-api-key': getSetting(state, 'openai-api-key', ''),
      'ai-enabled': getSetting(state, 'ai-enabled', false),
      'sync-server-url': getSetting(state, 'sync-server-url', '')
    };
    
    // Use module-level element if available, otherwise find it
    const formElement = settingsFormElement || document.getElementById('settings-form');
    if (formElement) {
      renderSettingsForm(formElement, settings);
    }
    
    const statusElement = connectionStatusElement || document.getElementById('connection-status');
    if (statusElement) {
      const connected = false; // TODO: implement connection status check
      renderConnectionStatus(statusElement, connected, settings['sync-server-url']);
    }
  } catch (error) {
    console.error('Failed to render settings page:', error);
  }
};

// Set up form event handlers
const setupFormHandlers = () => {
  if (!settingsFormElement) return;
  
  settingsFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });
  
  // Test API key button
  const testApiButton = document.getElementById('test-api-key');
  if (testApiButton) {
    testApiButton.addEventListener('click', () => {
      testAPIKey();
    });
  }
  
  // Test connection button
  const testConnectionButton = document.getElementById('test-connection');
  if (testConnectionButton) {
    testConnectionButton.addEventListener('click', () => {
      testConnection();
    });
  }
};

// Save settings to Y.js
export const saveSettings = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const formElement = settingsFormElement || document.getElementById('settings-form');
    if (!formElement) {
      console.warn('Settings form not found');
      return;
    }
    const formData = getFormData(formElement);
    
    // Save individual settings
    const apiKey = (formData['openai-api-key'] || '').trim();
    const aiEnabled = formData['ai-enabled'] === true || formData['ai-enabled'] === 'on';
    const syncServerUrl = (formData['sync-server-url'] || '').trim();
    
    setSetting(state, 'openai-api-key', apiKey);
    setSetting(state, 'ai-enabled', aiEnabled);
    setSetting(state, 'sync-server-url', syncServerUrl);
    
    // Temporarily disable notifications for testing
    // showNotification('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    // showNotification('Failed to save settings', 'error');
  }
};

// Test API key
export const testAPIKey = async (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const apiKey = getSetting(state, 'openai-api-key', '');
    
    if (!apiKey) {
      showNotification('Please enter an API key first', 'warning');
      return;
    }
    
    const available = isAPIAvailable();
    if (available) {
      showNotification('API key is valid!', 'success');
    } else {
      showNotification('API key appears to be invalid', 'error');
    }
  } catch (error) {
    console.error('Failed to test API key:', error);
    showNotification('Error testing API key', 'error');
  }
};

// Test connection
export const testConnection = async (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const syncServerUrl = getSetting(state, 'sync-server-url', '');
    
    if (!syncServerUrl) {
      showNotification('Please enter a sync server URL first', 'warning');
      return;
    }
    
    // TODO: Implement actual connection test
    showNotification('Connection test not implemented yet', 'info');
  } catch (error) {
    console.error('Failed to test connection:', error);
    showNotification('Error testing connection', 'error');
  }
};

// Pure function to render cached settings content immediately
const renderCachedSettingsContent = () => {
  const cachedSettings = getCachedSettings();
  const cachedFormData = getFormDataForPage('settings');
  
  if (Object.keys(cachedSettings).length > 0 || Object.keys(cachedFormData).length > 0) {
    // Merge cached settings with form data
    const displayData = { ...cachedSettings, ...cachedFormData };
    
    // Render form with cached data
    renderSettingsForm(settingsFormElement, displayData, {
      onSave: () => {}, // Disabled during cache phase
      onClear: () => {} // Disabled during cache phase
    });
    
    // Show loading indicator for connection status
    if (connectionStatusElement) {
      connectionStatusElement.innerHTML = '<p>Checking connection status...</p>';
    }
  }
};

// Pure function to set up settings navigation caching
const setupSettingsNavigationCaching = (state) => {
  // Save cache before page unload
  const handleBeforeUnload = () => {
    saveNavigationCache(state);
    
    // Save current form data
    const formData = getSettingsFormData();
    if (formData) {
      saveCurrentFormData('settings', formData);
    }
  };
  
  // Set up event listener
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Save on form changes (debounced)
  let formTimeout;
  const debouncedFormSave = () => {
    clearTimeout(formTimeout);
    formTimeout = setTimeout(() => {
      const formData = getSettingsFormData();
      if (formData) {
        saveCurrentFormData('settings', formData);
      }
    }, 1000); // 1 second delay
  };
  
  // Listen for form changes
  if (settingsFormElement) {
    settingsFormElement.addEventListener('input', debouncedFormSave);
    settingsFormElement.addEventListener('change', debouncedFormSave);
  }
};

// Pure function to get current settings form data
const getSettingsFormData = () => {
  if (!settingsFormElement) return null;
  
  const formData = getFormData(settingsFormElement);
  return Object.keys(formData).length > 0 ? formData : null;
};

// Initialize when DOM is ready (only in browser environment)
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    import('./yjs.js').then(YjsModule => {
      YjsModule.initYjs().then(state => {
        initSettingsPage(state);
      });
    });
  });
}

// Export for testing
