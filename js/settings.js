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
  
  // Set up button handlers directly on the elements
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
    console.log('Attaching click handler to show AI prompt button');
    showAIPromptButton.addEventListener('click', (e) => {
      console.log('Show AI prompt button clicked!');
      e.preventDefault();
      showCurrentAIPrompt();
    });
    showAIPromptButton.setAttribute('data-handler-attached', 'true');
  } else if (showAIPromptButton) {
    console.log('Show AI prompt button found but handler already attached');
  } else {
    console.log('Show AI prompt button not found');
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
  console.log('=== showCurrentAIPrompt called ===');
  try {
    const aiEnabled = isAIEnabled();
    console.log('AI enabled:', aiEnabled);
    
    if (!aiEnabled) {
      console.log('AI not enabled, showing disabled message');
      renderAIPromptPreview(aiEnabled, null);
      showNotification('AI features not enabled', 'info');
      return;
    }
    
    console.log('Getting prompt preview...');
    
    // Get prompt preview using same logic as AI module
    let promptPreview = null;
    try {
      promptPreview = await getPromptPreview();
      console.log('Prompt preview result:', promptPreview);
    } catch (previewError) {
      console.error('Error getting prompt preview:', previewError);
      // Continue with null preview to show something useful
    }
    
    let messages = null;
    if (promptPreview) {
      try {
        messages = buildMessages(promptPreview.systemPrompt, promptPreview.userPrompt);
        console.log('Built messages:', messages);
      } catch (messageError) {
        console.error('Error building messages:', messageError);
      }
    }
    
    console.log('Rendering AI prompt preview...');
    try {
      renderAIPromptPreview(aiEnabled, messages);
      console.log('Preview rendered successfully');
    } catch (renderError) {
      console.error('Error rendering preview:', renderError);
      // Show basic preview as fallback
      const promptPreviewElement = document.getElementById('ai-prompt-preview');
      const promptContentElement = document.getElementById('ai-prompt-content');
      if (promptPreviewElement && promptContentElement) {
        promptContentElement.innerHTML = `
          <div class="system-prompt">
            <p><strong>Preview Error</strong></p>
            <p>There was an error displaying the AI prompt preview. Check console for details.</p>
          </div>
        `;
        promptPreviewElement.style.display = 'block';
      }
    }
    
    console.log('Showing success notification...');
    showNotification('Current AI prompts displayed', 'success');
    console.log('=== showCurrentAIPrompt completed ===');
  } catch (error) {
    console.error('Failed to show AI prompt:', error);
    showNotification('Error displaying AI prompts', 'error');
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
