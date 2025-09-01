// Settings Views - Pure Rendering Functions for Settings Page
import { getFormData, showNotification, getWordCount } from './utils.js';
import {
  getCachedSettings,
  getFormDataForPage
} from './navigation-cache.js';

// Render settings form with current data
export const renderSettingsForm = (formOrSettings, settings = null) => {
  // Handle both old signature (settings) and new signature (form, settings)
  let form = null;
  let settingsData = null;
  
  if (settings === null) {
    // Old signature: renderSettingsForm(settings)
    settingsData = formOrSettings;
  } else {
    // New signature: renderSettingsForm(form, settings)
    form = formOrSettings;
    settingsData = settings;
  }
  
  // Ensure AI prompt button is enabled by default; availability handled elsewhere
  const showPromptButton = document.getElementById('show-ai-prompt');
  if (showPromptButton) {
    showPromptButton.disabled = false;
    showPromptButton.title = 'Show current AI prompt configuration';
  }
  
  // Sync server setting - try different ID patterns and key names
  const syncServerInput = form ? 
    form.querySelector('[name="sync-server-url"]') : 
    (document.getElementById('sync-server-url') || document.getElementById('sync-server'));
  if (syncServerInput) {
    // Support both key names for backward compatibility
    syncServerInput.value = settingsData['sync-server-url'] || settingsData['dnd-journal-sync-server'] || '';
  }

  // Journal name
  const journalNameInput = form ?
    form.querySelector('[name="journal-name"]') :
    document.getElementById('journal-name');
  if (journalNameInput) {
    journalNameInput.value = settingsData['journal-name'] || '';
  }
};

// Update connection status display
export const renderConnectionStatus = (isConnected, serverUrl) => {
  const statusElement = document.getElementById('connection-status');
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
export const setTestConnectionLoading = (isLoading) => {
  const testBtn = document.getElementById('test-connection');
  if (testBtn) {
    testBtn.disabled = isLoading;
    testBtn.textContent = isLoading ? 'Testing...' : 'Test Connection';
  }
};

// Render AI prompt preview
export const renderAIPromptPreview = (aiAvailable, messages = null) => {
  const promptPreviewElement = document.getElementById('ai-prompt-preview');
  const promptContentElement = document.getElementById('ai-prompt-content');
  
  if (!promptPreviewElement || !promptContentElement) {
    console.warn('AI prompt preview elements not found');
    return;
  }
  
  if (!aiAvailable) {
    promptContentElement.innerHTML = `
      <div class="system-prompt">
        <p><strong>AI is currently unavailable.</strong></p>
        <p>The server does not have an API key configured or is unreachable.</p>
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
  
  promptPreviewElement.style.display = 'block';
};

// Render AI status indicator (visible only when unavailable)
export const renderAIStatus = (available, model) => {
  const status = document.getElementById('ai-status');
  if (!status) return;
  if (available) {
    status.style.display = 'none';
    status.textContent = '';
  } else {
    status.style.display = 'block';
    status.textContent = 'AI is unavailable on the server.';
  }
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
      renderSettingsForm(settingsFormElement, displayData, {
        onSave: () => {}, // Disabled during cache phase
        onClear: () => {} // Disabled during cache phase
      });
      

    }
    
    // Show loading indicator for connection status
    if (connectionStatusElement) {
      connectionStatusElement.innerHTML = '<p>Checking connection status...</p>';
    }
  }
};