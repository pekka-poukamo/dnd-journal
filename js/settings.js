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
  showNotification
} from './settings-views.js';

import { isAPIAvailable } from './openai-wrapper.js';

// State management
let settingsFormElement = null;
let connectionStatusElement = null;

// Initialize Settings page
export const initSettingsPage = async () => {
  try {
    await initYjs();
    const state = getYjsState();
    
    // Get DOM elements
    settingsFormElement = document.getElementById('settings-form');
    connectionStatusElement = document.getElementById('connection-status');
    
    if (!settingsFormElement) {
      console.warn('Settings form not found');
      return;
    }
    
    // Render initial state
    renderSettingsPage();
    
    // Set up reactive updates
    onSettingsChange(state, () => {
      renderSettingsPage();
    });
    
    // Set up form handling
    setupFormHandlers();
    
  } catch (error) {
    console.error('Failed to initialize settings page:', error);
  }
};

// Render settings page
export const renderSettingsPage = () => {
  try {
    const state = getYjsState();
    const settings = {
      'openai-api-key': getSetting(state, 'openai-api-key', ''),
      'ai-enabled': getSetting(state, 'ai-enabled', false),
      'sync-server-url': getSetting(state, 'sync-server-url', '')
    };
    
    if (settingsFormElement) {
      renderSettingsForm(settingsFormElement, settings);
    }
    
    if (connectionStatusElement) {
      const connected = false; // TODO: implement connection status check
      renderConnectionStatus(connectionStatusElement, connected, settings['sync-server-url']);
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
const saveSettings = () => {
  try {
    const state = getYjsState();
    const formData = new FormData(settingsFormElement);
    
    // Save individual settings
    const apiKey = (formData.get('openai-api-key') || '').trim();
    const aiEnabled = formData.get('ai-enabled') === 'on';
    const syncServerUrl = (formData.get('sync-server-url') || '').trim();
    
    setSetting(state, 'openai-api-key', apiKey);
    setSetting(state, 'ai-enabled', aiEnabled);
    setSetting(state, 'sync-server-url', syncServerUrl);
    
    showNotification('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showNotification('Failed to save settings', 'error');
  }
};

// Test API key
const testAPIKey = async () => {
  try {
    const state = getYjsState();
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
const testConnection = async () => {
  try {
    const state = getYjsState();
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
