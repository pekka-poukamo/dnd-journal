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
  getFormData,
  renderCachedSettingsContent
} from './settings-views.js';

import { createPageInitializer } from './cache-utils.js';

import { isAPIAvailable } from './openai-wrapper.js';

// State management
let settingsFormElement = null;
let connectionStatusElement = null;

// Create settings page initializer using shared pattern
const initSettingsPageImpl = createPageInitializer('settings', {
  getDOMElements: () => {
    settingsFormElement = document.getElementById('settings-form');
    connectionStatusElement = document.getElementById('connection-status');
    
    return {
      isValid: !!settingsFormElement,
      settingsFormElement,
      connectionStatusElement,
      formElement: settingsFormElement
    };
  },
  
  renderCachedContent: (elements) => {
    renderCachedSettingsContent(elements);
  },
  
  initializeYjs: async () => {
    await initYjs();
    return getYjsState();
  },
  
  setupObservers: (state, withCacheSaving) => {
    onSettingsChange(state, withCacheSaving(() => {
      renderSettingsPage();
    }));
  },
  
  renderFreshContent: () => {
    renderSettingsPage();
  },
  
  setupFormHandlers: () => {
    setupFormHandlers();
  },
  
  getFormData: getSettingsFormData
});

// Export the enhanced initializer
export const initSettingsPage = initSettingsPageImpl;

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
