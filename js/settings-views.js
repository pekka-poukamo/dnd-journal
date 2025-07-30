// Settings Views - Pure Rendering Functions for Settings Page

// Render settings form with current data
export const renderSettingsForm = (settings) => {
  // API Key setting
  const apiKeyInput = document.getElementById('api-key');
  if (apiKeyInput && settings['openai-api-key'] !== undefined) {
    apiKeyInput.value = settings['openai-api-key'] || '';
  }
  
  // AI Features checkbox
  const aiEnabledCheckbox = document.getElementById('ai-enabled');
  if (aiEnabledCheckbox && settings['ai-enabled'] !== undefined) {
    aiEnabledCheckbox.checked = settings['ai-enabled'] === 'true' || settings['ai-enabled'] === true;
  }
  
  // Sync server setting
  const syncServerInput = document.getElementById('sync-server');
  if (syncServerInput && settings['dnd-journal-sync-server'] !== undefined) {
    syncServerInput.value = settings['dnd-journal-sync-server'] || '';
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

// Get form data from any form
export const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
};

// Show/hide loading indicator for test connection
export const setTestConnectionLoading = (isLoading) => {
  const testBtn = document.getElementById('test-connection');
  if (testBtn) {
    testBtn.disabled = isLoading;
    testBtn.textContent = isLoading ? 'Testing...' : 'Test Connection';
  }
};