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
  renderCachedSettingsContent,
  renderAIPromptPreview
} from './settings-views.js';

import { getFormData } from './utils.js';

import { saveNavigationCache } from './navigation-cache.js';

import { isAIEnabled, getPromptPreview, buildMessages } from './ai.js';

import { clearAllSummaries } from './summarization.js';

// State management
let settingsFormElement = null;
let connectionStatusElement = null;
let handlersSetup = false;

// Initialize Settings page
export const initSettingsPage = async (stateParam = null) => {
  try {
    // Get DOM elements
    settingsFormElement = document.getElementById('settings-form');
    connectionStatusElement = document.getElementById('connection-status');
    
    if (!settingsFormElement) {
      console.warn('Settings form not found');
      return;
    }
    
    // Show cached content immediately
    renderCachedSettingsContent({
      settingsFormElement,
      connectionStatusElement
    });
    
    // Initialize Yjs asynchronously (non-blocking)
    const state = stateParam || (await initYjs(), getYjsState());
    
    // Set up reactive updates
    onSettingsChange(state, () => {
      renderSettingsPage();
      // Re-setup form handlers after rendering to ensure buttons exist
      setupFormHandlers();
    });
    
    // Replace cached content with fresh data
    renderSettingsPage();
    
    // Set up form handling after initial render (ensures DOM elements exist)
    setupFormHandlers();
    
    // Save cache on page unload
    window.addEventListener('beforeunload', () => {
      saveNavigationCache(state);
    });
    
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
  // Set up button handlers first (independent of form)
  const testApiButton = document.getElementById('test-api-key');
  if (testApiButton && !testApiButton.hasAttribute('data-handler-attached')) {
    testApiButton.addEventListener('click', (e) => {
      e.preventDefault();
      testAPIKey();
    });
    testApiButton.setAttribute('data-handler-attached', 'true');
  }
  
  const testConnectionButton = document.getElementById('test-connection');
  if (testConnectionButton && !testConnectionButton.hasAttribute('data-handler-attached')) {
    testConnectionButton.addEventListener('click', (e) => {
      e.preventDefault();
      testConnection();
    });
    testConnectionButton.setAttribute('data-handler-attached', 'true');
  }
  
  const showAIPromptButton = document.getElementById('show-ai-prompt');
  if (showAIPromptButton && !showAIPromptButton.hasAttribute('data-handler-attached')) {
    showAIPromptButton.addEventListener('click', (e) => {
      e.preventDefault();
      showCurrentAIPrompt();
    });
    showAIPromptButton.setAttribute('data-handler-attached', 'true');
  }
  
  const clearSummariesButton = document.getElementById('clear-summaries');
  if (clearSummariesButton && !clearSummariesButton.hasAttribute('data-handler-attached')) {
    clearSummariesButton.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllSummariesHandler();
    });
    clearSummariesButton.setAttribute('data-handler-attached', 'true');
  }

  // Form handler setup (can return early if form not found)
  const formElement = settingsFormElement || document.getElementById('settings-form');
  if (!formElement) return;
  
  // Only set up form handler once
  if (!handlersSetup) {
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
    });
    handlersSetup = true;
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
    
    showNotification('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showNotification('Failed to save settings', 'error');
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
    
    if (!apiKey.startsWith('sk-')) {
      showNotification('API key should start with "sk-"', 'warning');
      return;
    }
    
    // Show testing message
    showNotification('Testing API key...', 'info');
    
    // Test the API key with a simple request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      })
    });
    
    if (response.ok) {
      showNotification('API key is valid!', 'success');
    } else if (response.status === 401) {
      showNotification('API key is invalid or unauthorized', 'error');
    } else if (response.status === 429) {
      showNotification('API key is valid but rate limited', 'warning');
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      showNotification(`API key test failed: ${errorMessage}`, 'error');
    }
  } catch (error) {
    console.error('Failed to test API key:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showNotification('Network error: Could not connect to OpenAI API', 'error');
    } else {
      showNotification('Error testing API key', 'error');
    }
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

// Show current AI prompt
export const showCurrentAIPrompt = async () => {
  try {
    const aiEnabled = isAIEnabled();
    
    if (!aiEnabled) {
      renderAIPromptPreview(aiEnabled, null);
      showNotification('AI features not enabled', 'info');
      return;
    }
    
    // Get prompt preview using same logic as AI module
    const promptPreview = await getPromptPreview();
    const messages = promptPreview ? buildMessages(promptPreview.systemPrompt, promptPreview.userPrompt) : null;
    
    renderAIPromptPreview(aiEnabled, messages);
    showNotification('Current AI prompts displayed', 'success');
  } catch (error) {
    console.error('Failed to show AI prompt:', error);
    showNotification('Error displaying AI prompts', 'error');
  }
};

// Clear all summaries handler
export const clearAllSummariesHandler = () => {
  try {
    const confirmed = confirm('Are you sure you want to clear all summaries? This action cannot be undone.');
    
    if (confirmed) {
      clearAllSummaries();
      showNotification('All summaries have been cleared', 'success');
    }
  } catch (error) {
    console.error('Failed to clear summaries:', error);
    showNotification('Error clearing summaries', 'error');
  }
};





// Initialize immediately since script loads after DOM (only in browser environment)
if (typeof document !== 'undefined') {
  import('./yjs.js').then(YjsModule => {
    YjsModule.initYjs().then(state => {
      initSettingsPage(state);
    });
  });
}

// Export for testing
