// Settings Views - Pure Rendering Functions for Settings Page
import { getFormData, showNotification, getWordCount } from './utils.js';
import {
  getCachedSettings,
  getFormDataForPage
} from './navigation-cache.js';

// Render settings form with current data
// Backward compatible usage:
// - renderSettingsForm(settingsData)
// - renderSettingsForm(formElement, settingsData)
export const renderSettingsForm = (formOrSettings, maybeSettings = null, uiElements = {}) => {
  let form = null;
  let settingsData = null;
  const looksLikeForm = !!(formOrSettings && typeof formOrSettings.querySelector === 'function');
  if (looksLikeForm) {
    form = formOrSettings;
    settingsData = maybeSettings || {};
  } else {
    settingsData = formOrSettings || {};
    try { form = document.getElementById('settings-form'); } catch {}
  }
  if (!form || typeof form.querySelector !== 'function') return;
  
  // API Key setting - try form-based access first, then fallback to document query
  const apiKeyInput = form.querySelector('[name="openai-api-key"]') || (typeof document !== 'undefined' ? document.getElementById('openai-api-key') : null);
  if (apiKeyInput) {
    apiKeyInput.value = settingsData['openai-api-key'] || '';
  }
  
  // AI Features checkbox
  const aiEnabledCheckbox = form.querySelector('[name="ai-enabled"]') || (typeof document !== 'undefined' ? document.getElementById('ai-enabled') : null);
  if (aiEnabledCheckbox) {
    aiEnabledCheckbox.checked = settingsData['ai-enabled'] === 'true' || settingsData['ai-enabled'] === true;
  }
  
  // Update show AI prompt button state
  const showPromptButton = uiElements.showPromptButton || (typeof document !== 'undefined' ? document.getElementById('show-ai-prompt') : null);
  if (showPromptButton) {
    const hasApiKey = settingsData['openai-api-key'] && settingsData['openai-api-key'].trim().length > 0;
    const aiEnabled = settingsData['ai-enabled'] === 'true' || settingsData['ai-enabled'] === true;
    showPromptButton.disabled = !hasApiKey || !aiEnabled;
    
    // Update button title to give user feedback about requirements
    if (!hasApiKey && !aiEnabled) {
      showPromptButton.title = 'Requires OpenAI API Key and AI Features to be enabled';
    } else if (!hasApiKey) {
      showPromptButton.title = 'Requires OpenAI API Key';
    } else if (!aiEnabled) {
      showPromptButton.title = 'Requires AI Features to be enabled';
    } else {
      showPromptButton.title = 'Show current AI prompt configuration';
    }
  }
  
  // Sync server setting - try different ID patterns and key names
  const syncServerInput = form.querySelector('[name="sync-server-url"]') || (typeof document !== 'undefined' ? (document.getElementById('sync-server-url') || document.getElementById('sync-server')) : null);
  if (syncServerInput) {
    // Support both key names for backward compatibility
    syncServerInput.value = settingsData['sync-server-url'] || settingsData['dnd-journal-sync-server'] || '';
  }

  // Journal name
  const journalNameInput = form.querySelector('[name="journal-name"]') || (typeof document !== 'undefined' ? document.getElementById('journal-name') : null);
  if (journalNameInput) {
    journalNameInput.value = (settingsData['journal-name'] || '').toLowerCase();
    // Provide inline hint for allowed characters
    journalNameInput.setAttribute('placeholder', 'lowercase letters, numbers, hyphens only');
  }
};

// Update connection status display
// Backward compatible usage:
// - renderConnectionStatus(isConnected, serverUrl)
// - renderConnectionStatus(statusElement, isConnected, serverUrl)
export const renderConnectionStatus = (statusElementOrIsConnected, maybeIsConnected, maybeServerUrl) => {
  let statusElement = null;
  let isConnected = false;
  let serverUrl = undefined;
  if (statusElementOrIsConnected && typeof statusElementOrIsConnected === 'object' && statusElementOrIsConnected !== null && ('textContent' in statusElementOrIsConnected)) {
    statusElement = statusElementOrIsConnected;
    isConnected = !!maybeIsConnected;
    serverUrl = maybeServerUrl;
  } else {
    isConnected = !!statusElementOrIsConnected;
    serverUrl = maybeIsConnected;
    try { statusElement = document.getElementById('connection-status'); } catch {}
  }
  if (!statusElement) return;
  
  if (isConnected) {
    statusElement.textContent = `Connected to ${serverUrl}`;
    statusElement.className = 'connection-status connection-status--connected';
  } else if (serverUrl) {
    statusElement.textContent = `Disconnected from ${serverUrl}`;
    statusElement.className = 'connection-status connection-status--disconnected';
  } else {
    statusElement.textContent = 'No sync server configured';
    statusElement.className = 'connection-status connection-status--none';
  }
};

// showNotification function moved to utils.js for shared use across all view modules



// Show/hide loading indicator for test connection
// Backward compatible: setTestConnectionLoading(isLoading) or setTestConnectionLoading(buttonEl, isLoading)
export const setTestConnectionLoading = (testBtn, isLoading) => {
  if (typeof testBtn === 'boolean' && typeof isLoading === 'undefined') {
    isLoading = testBtn;
    try { testBtn = document.getElementById('test-connection'); } catch { testBtn = null; }
  }
  if (testBtn && typeof testBtn === 'object') {
    testBtn.disabled = isLoading;
    testBtn.textContent = isLoading ? 'Testing...' : 'Test Connection';
  }
};

// Render AI prompt preview
// Backward compatible usage:
// - renderAIPromptPreview(aiEnabled, messages)
// - renderAIPromptPreview(previewEl, contentEl, aiEnabled, messages)
export const renderAIPromptPreview = (...args) => {
  let promptPreviewElement = null;
  let promptContentElement = null;
  let aiEnabled = false;
  let messages = null;
  if (args.length >= 3 && typeof args[2] === 'boolean') {
    [promptPreviewElement, promptContentElement, aiEnabled, messages = null] = args;
  } else {
    [aiEnabled, messages = null] = args;
    try {
      promptPreviewElement = document.getElementById('ai-prompt-preview');
      promptContentElement = document.getElementById('ai-prompt-content');
    } catch {}
  }
  if (!promptPreviewElement || !promptContentElement) {
    return;
  }
  
  if (!aiEnabled) {
    promptContentElement.innerHTML = `
      <div class="system-prompt">
        <p><strong>AI features are not enabled.</strong></p>
        <p>Please configure your OpenAI API key and enable AI features to view prompts.</p>
      </div>
    `;
  } else if (!messages) {
    promptContentElement.innerHTML = `
      <div class="system-prompt">
        <p><strong>No context available.</strong></p>
        <p>Add some journal entries and character information to see prompts.</p>
      </div>
    `;
  } else {
    // Show the exact messages sent to OpenAI with word count summary
    const totalWords = Array.isArray(messages)
      ? messages.reduce((sum, msg) => sum + getWordCount(String(msg && msg.content ? msg.content : '')), 0)
      : 0;

    const content = messages.map(msg => `
      <div class="${msg.role === 'system' ? 'system-prompt' : 'user-prompt'}">
        <h4>${msg.role === 'system' ? 'System' : 'User'}</h4>
        <div>${msg.content}</div>
      </div>
    `).join('');

    const header = `<div class="token-count">Word count: ${totalWords}</div>`;
    promptContentElement.innerHTML = header + content;
  }
  
  // Ensure the preview is visible even if initially hidden via utility class
  try { promptPreviewElement.classList.remove('is-hidden'); } catch {}
  promptPreviewElement.style.display = 'block';
};

// Pure function to render cached settings content immediately
export const renderCachedSettingsContent = (elements) => {
  const { settingsFormElement, connectionStatusElement } = elements;
  
  const cachedSettings = getCachedSettings();
  const cachedFormData = getFormDataForPage('settings');
  
  if (Object.keys(cachedSettings).length > 0 || Object.keys(cachedFormData).length > 0) {
    // Merge cached settings with form data
    const displayData = { ...cachedSettings, ...cachedFormData };
    
    // Render form with cached data
    if (settingsFormElement) {
      renderSettingsForm(settingsFormElement, displayData);
    }
    
    // Show loading indicator for connection status
    if (connectionStatusElement) {
      connectionStatusElement.innerHTML = '<p>Checking connection status...</p>';
    }
  }
};