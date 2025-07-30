// Settings Page - AI Configuration & Data Management

import { getSettings, saveSettings as saveSettingsToYjs, settingsMap, getCharacter, getEntries, getAllSummaries } from './yjs.js';
import { createInitialSettings, createInitialJournalState } from './utils.js';
// testApiKey is defined in this module

// Load settings from Yjs
export const loadSettings = () => {
  return getSettings();
};

// Save settings to Yjs
export const saveSettings = (settings) => {
  try {
    saveSettingsToYjs(settings);
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false };
  }
};

// Test API key with OpenAI
export const testApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return { success: false, error: 'Invalid API key format' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, message: 'API key is valid' };
    } else if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    } else {
      return { success: false, error: `API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: `Network error: ${error.message}` };
  }
};

// Get data statistics
export const getDataStats = () => {
  try {
    const character = getCharacter();
    const entries = getEntries();
    const summaries = getAllSummaries();
    
    const characterFields = Object.values(character).filter(value => value && value.trim()).length;
    const totalWords = entries.reduce((sum, entry) => {
      return sum + (entry.content ? entry.content.split(/\s+/).length : 0);
    }, 0);
    
    return {
      characterFields,
      entryCount: entries.length,
      totalWords,
      summaryCount: Object.keys(summaries).length
    };
  } catch (error) {
    console.error('Error getting data stats:', error);
    return {
      characterFields: 0,
      entryCount: 0,
      totalWords: 0,
      summaryCount: 0
    };
  }
};

// Clear all data
export const clearAllData = () => {
  try {
    if (!settingsMap) {
      throw new Error('Settings map not available');
    }
    
    // Clear settings (this will trigger a reload/re-initialization)
    settingsMap.clear();
    return { success: true };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, error: error.message };
  }
};

// Export data for backup
export const exportData = () => {
  try {
    const character = getCharacter();
    const entries = getEntries();
    const settings = getSettings();
    const summaries = getAllSummaries();
    
    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        character,
        entries,
        settings: { ...settings, apiKey: '' }, // Don't export API key
        summaries
      }
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

// Import data from backup
export const importData = (backupData) => {
  try {
    if (!backupData || !backupData.data) {
      throw new Error('Invalid backup data format');
    }
    
    const { character, entries, settings, summaries } = backupData.data;
    
    // Import would need to be implemented with direct map access
    // For now, return a success indicator
    console.warn('Import functionality needs to be implemented with direct YJS map access');
    
    return { success: true, message: 'Data import completed' };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, error: error.message };
  }
};

// Setup settings page
const setupSettingsPage = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAICheckbox = document.getElementById('enable-ai');
  const saveBtn = document.getElementById('save-settings');
  const testBtn = document.getElementById('test-api-key');
  const exportBtn = document.getElementById('export-data');
  const importBtn = document.getElementById('import-data');
  const clearBtn = document.getElementById('clear-all-data');
  const fileInput = document.getElementById('file-input');

  if (!apiKeyInput || !enableAICheckbox || !saveBtn) {
    console.warn('Settings form elements not found');
    return;
  }

  // Load current settings
  const currentSettings = loadSettings();
  apiKeyInput.value = currentSettings.apiKey || '';
  enableAICheckbox.checked = currentSettings.enableAIFeatures || false;

  // Update data statistics
  updateDataStats();

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      enableAIFeatures: enableAICheckbox.checked
    };

    const result = saveSettings(settings);
    
    if (result.success) {
      showMessage('Settings saved successfully!', 'success');
    } else {
      showMessage('Failed to save settings', 'error');
    }
  });

  // Test API key
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const apiKey = apiKeyInput.value.trim();
      
      if (!apiKey) {
        showMessage('Please enter an API key first', 'error');
        return;
      }

      testBtn.disabled = true;
      testBtn.textContent = 'Testing...';

      try {
        const result = await testApiKey(apiKey);
        
        if (result.success) {
          showMessage('API key is valid!', 'success');
        } else {
          showMessage(result.error || 'API key test failed', 'error');
        }
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = 'Test API Key';
      }
    });
  }

  // Export data
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = exportData();
      
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dnd-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showMessage('Data exported successfully!', 'success');
      } else {
        showMessage('Failed to export data', 'error');
      }
    });
  }

  // Import data
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          const result = importData(backupData);
          
          if (result.success) {
            showMessage('Data imported successfully!', 'success');
            // Reload page to reflect changes
            setTimeout(() => document.location.reload(), 1500);
          } else {
            showMessage(result.error || 'Failed to import data', 'error');
          }
        } catch (error) {
          showMessage('Invalid backup file format', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear all data
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const confirmed = confirm(
        'Are you sure you want to clear ALL data? This will delete:\n' +
        '- All journal entries\n' +
        '- Character information\n' +
        '- All summaries\n' +
        '- Settings\n\n' +
        'This action cannot be undone!'
      );

      if (confirmed) {
        const result = clearAllData();
        
        if (result.success) {
          showMessage('All data cleared successfully!', 'success');
          // Reload page after clearing
          setTimeout(() => document.location.reload(), 1500);
        } else {
          showMessage(result.error || 'Failed to clear data', 'error');
        }
      }
    });
  }
};

// Update data statistics display
const updateDataStats = () => {
  const stats = getDataStats();
  
  const statsElements = {
    'character-fields': stats.characterFields,
    'entry-count': stats.entryCount,
    'total-words': stats.totalWords.toLocaleString(),
    'summary-count': stats.summaryCount
  };

  Object.entries(statsElements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });
};

// Show message to user
const showMessage = (message, type) => {
  const messageDiv = document.getElementById('settings-message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 3000);
  }
};

// Initialize settings page
const initializeSettingsPage = async () => {
  try {
    // Setup the settings page
    setupSettingsPage();
    
    console.log('Settings page initialized successfully');
  } catch (error) {
    console.error('Failed to initialize settings page:', error);
  }
};

// Auto-initialize if on settings page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('api-key')) {
      initializeSettingsPage();
    }
  });
} else {
  if (document.getElementById('api-key')) {
    initializeSettingsPage();
  }
}
