// js/app.js - Main dashboard application logic

import { getStorage } from './utils/storage.js';
import { createEntryCard, createCompactCharacterCard, createEmptyState } from './components/Cards.js';
import { query, replaceContent, show, hide, getFormData, setFormData } from './utils/dom.js';
import { showSuccess, showError } from './utils/notifications.js';
import { pluralize } from './utils/formatters.js';

// Pure functions for data selection
const getCurrentCharacter = (state) => 
  state.characters[state.settings.currentCharacter];

const getRecentEntries = (state, limit = 5) => 
  Object.values(state.entries)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);

const getStats = (state) => {
  const totalEntries = Object.keys(state.entries).length;
  const totalCharacters = Object.keys(state.characters).length;
  const weekEntries = getStorage().getEntriesThisWeek().length;
  
  return {
    totalEntries,
    totalCharacters,
    weekEntries
  };
};

// Pure rendering functions
const renderEntries = (entries, container) => {
  if (!container) return;
  
  const elements = entries.length > 0 
    ? entries.map(createEntryCard)
    : [createEmptyState(
        'No journal entries yet. Start documenting your adventures!',
        'Create First Entry',
        'journal.html'
      )];
  
  replaceContent(container, ...elements);
};

const renderCharacterSummary = (character, container) => {
  if (!container) return;
  
  const element = character 
    ? createCompactCharacterCard(character)
    : createEmptyState(
        'No character selected. Create your first character!',
        'Create Character',
        'character.html'
      );
  
  replaceContent(container, element);
};

const renderStats = (stats, container) => {
  if (!container) return;
  
  const totalEntriesElement = query('#total-entries');
  const totalCharactersElement = query('#total-characters');
  const weekEntriesElement = query('#week-entries');
  
  if (totalEntriesElement) totalEntriesElement.textContent = stats.totalEntries;
  if (totalCharactersElement) totalCharactersElement.textContent = stats.totalCharacters;
  if (weekEntriesElement) weekEntriesElement.textContent = stats.weekEntries;
};

// Settings modal functions
const openSettingsModal = () => {
  const modal = query('#settings-modal');
  const storage = getStorage();
  const settings = storage.getSettings();
  
  // Populate current settings
  const apiKeyInput = query('#api-key');
  const themeSelect = query('#theme-select');
  const autoSaveCheckbox = query('#auto-save');
  
  if (apiKeyInput) apiKeyInput.value = settings.openaiApiKey || '';
  if (themeSelect) themeSelect.value = settings.preferences.theme || 'light';
  if (autoSaveCheckbox) autoSaveCheckbox.checked = settings.preferences.autoSave !== false;
  
  show(modal);
};

const closeSettingsModal = () => {
  const modal = query('#settings-modal');
  hide(modal);
};

const saveSettings = () => {
  const storage = getStorage();
  const apiKey = query('#api-key').value.trim();
  const theme = query('#theme-select').value;
  const autoSave = query('#auto-save').checked;
  
  const result = storage.updateSettings({
    openaiApiKey: apiKey || null,
    preferences: {
      theme,
      autoSave
    }
  });
  
  if (result.success) {
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
    
    showSuccess('Settings saved successfully!');
    closeSettingsModal();
    
    // Refresh dashboard to reflect any changes
    initDashboard();
  } else {
    showError('Failed to save settings: ' + result.error);
  }
};

// Data export/import functions
const exportData = () => {
  const storage = getStorage();
  const data = storage.exportData();
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `dnd-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  showSuccess('Data exported successfully!');
};

const openImportModal = () => {
  closeSettingsModal();
  const modal = query('#import-modal');
  show(modal);
};

const closeImportModal = () => {
  const modal = query('#import-modal');
  hide(modal);
  
  // Clear form
  const fileInput = query('#import-file');
  const textArea = query('#import-text');
  if (fileInput) fileInput.value = '';
  if (textArea) textArea.value = '';
};

const confirmImport = () => {
  const fileInput = query('#import-file');
  const textArea = query('#import-text');
  
  let jsonData = textArea.value.trim();
  
  // If file is selected, read it
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      jsonData = e.target.result;
      performImport(jsonData);
    };
    
    reader.readAsText(file);
  } else if (jsonData) {
    performImport(jsonData);
  } else {
    showError('Please select a file or paste JSON data.');
  }
};

const performImport = (jsonData) => {
  const storage = getStorage();
  const result = storage.importData(jsonData);
  
  if (result.success) {
    showSuccess('Data imported successfully!');
    closeImportModal();
    
    // Refresh dashboard to show imported data
    initDashboard();
  } else {
    showError('Failed to import data: ' + result.error);
  }
};

// Event handlers
const setupEventHandlers = () => {
  // Settings modal
  const settingsBtn = query('#settings-btn');
  const closeSettingsBtn = query('#close-settings');
  const saveSettingsBtn = query('#save-settings');
  const exportBtn = query('#export-data');
  const importBtn = query('#import-data');
  
  if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  if (exportBtn) exportBtn.addEventListener('click', exportData);
  if (importBtn) importBtn.addEventListener('click', openImportModal);
  
  // Import modal
  const closeImportBtn = query('#close-import');
  const confirmImportBtn = query('#confirm-import');
  const cancelImportBtn = query('#cancel-import');
  
  if (closeImportBtn) closeImportBtn.addEventListener('click', closeImportModal);
  if (confirmImportBtn) confirmImportBtn.addEventListener('click', confirmImport);
  if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImportModal);
  
  // Modal overlay clicks
  const settingsModal = query('#settings-modal');
  const importModal = query('#import-modal');
  
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal || e.target.classList.contains('modal-overlay')) {
        closeSettingsModal();
      }
    });
  }
  
  if (importModal) {
    importModal.addEventListener('click', (e) => {
      if (e.target === importModal || e.target.classList.contains('modal-overlay')) {
        closeImportModal();
      }
    });
  }
  
  // Keyboard handlers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettingsModal();
      closeImportModal();
    }
  });
};

// Main dashboard initialization
const initDashboard = () => {
  const storage = getStorage();
  const state = storage.getData();
  
  // Get DOM elements
  const entriesContainer = query('#entries-list');
  const characterContainer = query('#current-character');
  const statsContainer = query('#stats-container');
  
  if (!entriesContainer || !characterContainer) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // Get data
  const recentEntries = getRecentEntries(state);
  const currentCharacter = getCurrentCharacter(state);
  const stats = getStats(state);
  
  // Render components
  renderEntries(recentEntries, entriesContainer);
  renderCharacterSummary(currentCharacter, characterContainer);
  renderStats(stats, statsContainer);
  
  // Apply theme
  const theme = state.settings.preferences?.theme || 'light';
  document.documentElement.setAttribute('data-theme', theme);
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupEventHandlers();
});

// Export for potential use by other modules
export { initDashboard, setupEventHandlers };