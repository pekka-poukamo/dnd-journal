// Settings Views - Pure Rendering Functions for Settings Page
import { getFormData } from './utils.js';
import {
  getCachedSettings,
  getFormDataForPage
} from './navigation-cache.js';
import { PROMPTS } from './prompts.js';

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
  
  // API Key setting - try form-based access first, then fallback to document query
  const apiKeyInput = form ? 
    form.querySelector('[name="openai-api-key"]') : 
    document.getElementById('openai-api-key');
  if (apiKeyInput) {
    apiKeyInput.value = settingsData['openai-api-key'] || '';
  }
  
  // AI Features checkbox
  const aiEnabledCheckbox = form ? form.querySelector('[name="ai-enabled"]') : document.getElementById('ai-enabled');
  if (aiEnabledCheckbox) {
    aiEnabledCheckbox.checked = settingsData['ai-enabled'] === 'true' || settingsData['ai-enabled'] === true;
  }
  
  // Update show AI prompt button state
  const showPromptButton = document.getElementById('show-ai-prompt');
  if (showPromptButton) {
    const hasApiKey = settingsData['openai-api-key'] && settingsData['openai-api-key'].trim().length > 0;
    const aiEnabled = settingsData['ai-enabled'] === 'true' || settingsData['ai-enabled'] === true;
    showPromptButton.disabled = !hasApiKey || !aiEnabled;
  }
  
  // Sync server setting - try different ID patterns and key names
  const syncServerInput = form ? 
    form.querySelector('[name="sync-server-url"]') : 
    (document.getElementById('sync-server-url') || document.getElementById('sync-server'));
  if (syncServerInput) {
    // Support both key names for backward compatibility
    syncServerInput.value = settingsData['sync-server-url'] || settingsData['dnd-journal-sync-server'] || '';
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

// Show notification message
export const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
};



// Show/hide loading indicator for test connection
export const setTestConnectionLoading = (isLoading) => {
  const testBtn = document.getElementById('test-connection');
  if (testBtn) {
    testBtn.disabled = isLoading;
    testBtn.textContent = isLoading ? 'Testing...' : 'Test Connection';
  }
};

// Render AI prompt preview
export const renderAIPromptPreview = (aiEnabled, promptPreview = null, contextData = null) => {
  const promptPreviewElement = document.getElementById('ai-prompt-preview');
  const promptContentElement = document.getElementById('ai-prompt-content');
  
  if (!promptPreviewElement || !promptContentElement) {
    console.warn('AI prompt preview elements not found');
    return;
  }
  
  if (!aiEnabled) {
    promptContentElement.innerHTML = `
      <div class="system-prompt">
        <p><strong>AI features are not enabled.</strong></p>
        <p>Please configure your OpenAI API key and enable AI features to view prompts.</p>
      </div>
    `;
  } else if (!promptPreview) {
    promptContentElement.innerHTML = `
      <div class="system-prompt">
        <p><strong>No context available.</strong></p>
        <p>Add some journal entries and character information to see a full prompt preview with context.</p>
      </div>
      
      <div class="user-prompt">
        <h4>Available Prompt Templates</h4>
        <p><strong>Storytelling System:</strong></p>
        <div>${PROMPTS.storytelling.system}</div>
        <br>
        <p><strong>Summarization Templates:</strong></p>
        <div>• Journal Entry: ${PROMPTS.summarization.entry('[YOUR_ENTRY_TEXT]')}</div>
        <div>• Character Info: ${PROMPTS.summarization.character('[YOUR_CHARACTER_TEXT]')}</div>
      </div>
    `;
  } else {
    // Show the full prompt with actual context and data
    const characterData = contextData?.character || {};
    const entriesData = contextData?.entries || [];
    
    promptContentElement.innerHTML = `
      <div class="system-prompt">
        <h4>System Prompt</h4>
        <div style="white-space: pre-wrap;">${promptPreview.systemPrompt}</div>
      </div>
      
      <div class="system-prompt">
        <h4>Current Data Used for Context</h4>
        <div style="white-space: pre-wrap; font-family: monospace; font-size: 0.9em;">
          <strong>Character:</strong>
          Name: ${characterData.name || 'Not set'}
          Race: ${characterData.race || 'Not set'}
          Class: ${characterData.class || 'Not set'}
          
          <strong>Backstory:</strong> ${characterData.backstory ? (characterData.backstory.length > 100 ? characterData.backstory.substring(0, 100) + '...' : characterData.backstory) : 'Not set'}
          
          <strong>Notes:</strong> ${characterData.notes ? (characterData.notes.length > 100 ? characterData.notes.substring(0, 100) + '...' : characterData.notes) : 'Not set'}
          
          <strong>Journal Entries:</strong> ${entriesData.length} entries
          ${entriesData.length > 0 ? entriesData.slice(-3).map(entry => `- ${entry.title}: ${entry.content.substring(0, 80)}${entry.content.length > 80 ? '...' : ''}`).join('\n          ') : 'No entries yet'}
        </div>
      </div>
      
      <div class="system-prompt">
        <h4>Built Context String</h4>
        <div style="white-space: pre-wrap; font-family: monospace; font-size: 0.9em;">${promptPreview.context}</div>
      </div>
      
      <div class="user-prompt">
        <h4>Complete User Prompt (sent to OpenAI)</h4>
        <div style="white-space: pre-wrap; font-family: monospace; font-size: 0.9em;">${promptPreview.userPrompt}</div>
      </div>
      
      <div class="user-prompt">
        <h4>Summarization Prompts</h4>
        <p><strong>Journal Entry Template:</strong></p>
        <div style="font-family: monospace; font-size: 0.9em;">${PROMPTS.summarization.entry('[ENTRY_TEXT]')}</div>
        <br>
        <p><strong>Character Template:</strong></p>
        <div style="font-family: monospace; font-size: 0.9em;">${PROMPTS.summarization.character('[CHARACTER_TEXT]')}</div>
      </div>
    `;
  }
  
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