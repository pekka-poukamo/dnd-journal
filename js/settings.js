// Settings Page - Pure Functional Y.js Integration
import { 
  initYjs,
  getYjsState,
  setSetting,
  getSetting,
  onSettingsChange,
  resetYjs,
  clearLocalYjsPersistence
} from './yjs.js';

import {
  renderSettingsForm,
  renderConnectionStatus,
  renderCachedSettingsContent,
  renderAIPromptPreview
} from './settings-views.js';

import { getFormData, showNotification } from './utils.js';
import { showChoiceModal as baseShowChoiceModal } from './components/modal.js';

// Allow overriding in tests via dependency injection
let showChoiceModal = baseShowChoiceModal;
export const setShowChoiceModal = (impl) => {
  showChoiceModal = typeof impl === 'function' ? impl : baseShowChoiceModal;
};

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
      'sync-server-url': getSetting(state, 'sync-server-url', ''),
      'journal-name': getSetting(state, 'journal-name', '')
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
  
  const refreshAppButton = document.getElementById('refresh-app');
  const unlinkBtn = document.getElementById('unlink-journal');
  if (unlinkBtn && !unlinkBtn.hasAttribute('data-handler-attached')) {
    unlinkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      unlinkJournal();
    });
    unlinkBtn.setAttribute('data-handler-attached', 'true');
  }
  if (refreshAppButton && !refreshAppButton.hasAttribute('data-handler-attached')) {
    refreshAppButton.addEventListener('click', () => window.location.reload());
    refreshAppButton.setAttribute('data-handler-attached', 'true');
  }

  // Form handler setup (ensure attached per current form instance)
  const formElement = settingsFormElement || document.getElementById('settings-form');
  if (!formElement) return;

  if (!formElement.hasAttribute('data-handler-attached')) {
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
    });
    formElement.setAttribute('data-handler-attached', 'true');
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
    
    // Gather inputs
    const apiKey = (formData['openai-api-key'] || '').trim();
    const aiEnabled = formData['ai-enabled'] === true || formData['ai-enabled'] === 'on';
    const syncServerUrl = (formData['sync-server-url'] || '').trim();
    const journalName = (formData['journal-name'] || '').trim();
    
    const applySettings = (targetState) => {
      setSetting(targetState, 'openai-api-key', apiKey);
      setSetting(targetState, 'ai-enabled', aiEnabled);
      setSetting(targetState, 'sync-server-url', syncServerUrl);
      setSetting(targetState, 'journal-name', journalName);
      showNotification('Settings saved successfully!', 'success');
    };

    const applySettingsLocalOnly = (targetState) => {
      setSetting(targetState, 'openai-api-key', apiKey);
      setSetting(targetState, 'ai-enabled', aiEnabled);
      setSetting(targetState, 'sync-server-url', syncServerUrl);
      setSetting(targetState, 'journal-name', '');
      showNotification('Settings saved successfully!', 'success');
    };

    // If no journal name, operate local-only
    if (!journalName) {
      applySettingsLocalOnly(state);
      return;
    }

    if (syncServerUrl) {
      const url = new URL(syncServerUrl.replace(/^ws/, 'http'));
      const statusUrl = `${url.protocol}//${url.host}/sync/room/${encodeURIComponent(journalName)}/status`;
      return fetch(statusUrl)
        .then(r => r.ok ? r.json() : { exists: false })
        .then(async ({ exists }) => {
          if (!exists) {
            applySettings(state);
            return;
          }
          const choice = await showChoiceModal({
            title: 'Journal found on server',
            message: 'This journal name already has saved data on the server. What would you like to do on this device?',
            options: [
              { id: 'merge', label: 'Merge with server', type: 'primary' },
              { id: 'replace', label: 'Use server copy (discard this device\'s local data)', type: 'secondary' },
              { id: 'cancel', label: 'Cancel', type: 'secondary' }
            ]
          });
          if (choice === 'cancel') {
            showNotification('Cancelled. No changes made.', 'info');
            return;
          }
          if (choice === 'replace') {
            // Clear persisted cache via yjs module, reset in-memory doc, then re-init
            clearLocalYjsPersistence();
            resetYjs();
            initYjs().then(() => {
              const freshState = getYjsState();
              applySettings(freshState);
            });
            return;
          }
          // Merge: rely on CRDT
          applySettings(state);
        })
        .catch(() => {
          // On error, just save
          applySettings(state);
        });
    } else {
      return Promise.resolve(applySettings(state));
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    showNotification('Failed to save settings', 'error');
  }
};

// Unlink from server: clear journal name and disconnect via settings observer
export const unlinkJournal = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const confirmed = confirm('You will continue locally. Server data remains under this journal name. Proceed?');
    if (!confirmed) return;
    setSetting(state, 'journal-name', '');
    showNotification('Unlinked. You are now working locally only.', 'success');
  } catch (error) {
    console.error('Failed to unlink journal:', error);
    showNotification('Failed to unlink', 'error');
  }
};

// Test API key
export const testAPIKey = (stateParam = null) => {
  // Always use current form value for testing
  const apiKeyInput = document.getElementById('openai-api-key');
  const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
  
  if (!apiKey) {
    showNotification('Please enter an API key first', 'warning');
    return Promise.resolve();
  }
  
  if (!apiKey.startsWith('sk-')) {
    showNotification('API key should start with "sk-"', 'warning');
    return Promise.resolve();
  }
  
  // Show testing message
  showNotification('Testing API key...', 'info');
  
  // Test the API key with a simple request to OpenAI
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    })
  })
  .then(response => {
    if (response.ok) {
      showNotification('API key is valid!', 'success');
    } else if (response.status === 401) {
      showNotification('API key is invalid or unauthorized', 'error');
    } else if (response.status === 429) {
      showNotification('API key is valid but rate limited', 'warning');
    } else {
      return response.json()
        .then(errorData => {
          const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          showNotification(`API key test failed: ${errorMessage}`, 'error');
        })
        .catch(() => {
          showNotification(`API key test failed: HTTP ${response.status}`, 'error');
        });
    }
  })
  .catch(error => {
    console.error('Failed to test API key:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showNotification('Network error: Could not connect to OpenAI API', 'error');
    } else {
      showNotification('Error testing API key', 'error');
    }
  });
};

// Test connection
export const testConnection = (stateParam = null) => {
  // Always use current form value for testing
  const syncServerInput = document.getElementById('sync-server-url');
  const syncServerUrl = syncServerInput ? syncServerInput.value.trim() : '';
  
  if (!syncServerUrl) {
    showNotification('Please enter a sync server URL first', 'warning');
    return Promise.resolve();
  }
  
  // Validate URL format
  if (!syncServerUrl.startsWith('ws://') && !syncServerUrl.startsWith('wss://')) {
    showNotification('Sync server URL must start with ws:// or wss://', 'warning');
    return Promise.resolve();
  }
  
  // Show testing message
  showNotification('Testing connection...', 'info');
  
  // Test WebSocket connection and return promise
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(syncServerUrl);
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 5000); // 5 second timeout
    
    ws.onopen = () => {
      clearTimeout(timeout);
      ws.close();
      resolve('Connected successfully');
    };
    
    ws.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error('Connection failed'));
    };
    
    ws.onclose = (event) => {
      clearTimeout(timeout);
      if (event.wasClean) {
        resolve('Connection test completed');
      } else {
        reject(new Error('Connection closed unexpectedly'));
      }
    };
  })
  .then(result => {
    showNotification('Sync server connection successful!', 'success');
    return result;
  })
  .catch(testError => {
    console.warn('Connection test failed:', testError);
    if (testError.message.includes('timeout')) {
      showNotification('Connection test timed out - server may be unreachable', 'warning');
    } else {
      showNotification('Failed to connect to sync server', 'error');
    }
    throw testError;
  })
  .catch(error => {
    console.error('Failed to test connection:', error);
    showNotification('Error testing connection', 'error');
  });
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
    
    // Show preview container immediately, then fill with messages
    renderAIPromptPreview(aiEnabled, null);
    
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







// Initialize when DOM is ready (only in browser environment)
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    import('./yjs.js').then(YjsModule => {
      YjsModule.initYjs().then(state => {
        initSettingsPage(state);
        
        // Initialize version display in footer
        const footerContent = document.querySelector('.footer-content');
        import('./version.js').then(versionModule => {
          const versionInfo = versionModule.VERSION_INFO;
          const versionText = versionInfo.commit === 'dev' ? 'Development' : `v${versionInfo.runNumber} (${versionInfo.shortCommit})`;
          const versionElement = document.createElement('div');
          versionElement.className = 'version-info';
          versionElement.textContent = versionText;
          versionElement.title = `Deployed: ${versionInfo.timestamp}\nCommit: ${versionInfo.commit}\nBranch: ${versionInfo.ref}`;
          footerContent.appendChild(versionElement);
        });
      });
    });
  });
}

// Export for testing
