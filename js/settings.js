// Settings Page - AI Configuration & Data Management

import { 
  loadDataWithFallback, 
  createInitialSettings, 
  safeSetToStorage, 
  STORAGE_KEYS 
} from './utils.js';
import { getSummaryStats, autoSummarizeEntries } from './summarization.js';

// Load settings from localStorage
export const loadSettings = () => {
  return loadDataWithFallback(
    STORAGE_KEYS.SETTINGS, 
    createInitialSettings()
  );
};

// Save settings to localStorage
export const saveSettings = (settings) => {
  return safeSetToStorage(STORAGE_KEYS.SETTINGS, settings);
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
      return { success: true, message: 'API key is valid!' };
    } else {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || 'Invalid API key' 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Network error: Unable to test API key' 
    };
  }
};

// Show API test result
const showApiTestResult = (result) => {
  const resultDiv = document.getElementById('api-test-result');
  if (!resultDiv) return;

  resultDiv.className = 'api-test-result';
  
  if (result.success) {
    resultDiv.className += ' success';
    resultDiv.textContent = result.message;
  } else {
    resultDiv.className += ' error';
    resultDiv.textContent = result.error;
  }
};

// Show loading state for API test
const showApiTestLoading = () => {
  const resultDiv = document.getElementById('api-test-result');
  if (!resultDiv) return;

  resultDiv.className = 'api-test-result loading';
  resultDiv.textContent = 'Testing API key...';
};

// Handle API key test
const handleApiKeyTest = async () => {
  const apiKeyInput = document.getElementById('api-key');
  if (!apiKeyInput) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showApiTestResult({ success: false, error: 'Please enter an API key' });
    return;
  }

  showApiTestLoading();
  const result = await testApiKey(apiKey);
  showApiTestResult(result);
};

// Handle settings form changes
const handleSettingsChange = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');

  if (!apiKeyInput || !enableAIInput || !testButton) return;

  const settings = {
    apiKey: apiKeyInput.value.trim(),
    enableAIFeatures: enableAIInput.checked
  };

  saveSettings(settings);
  
  // Enable/disable test button based on API key presence
  testButton.disabled = !settings.apiKey;
  
  // Update summary stats display
  updateSummaryStats();
};

// Setup event handlers
const setupEventHandlers = () => {
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('input', handleSettingsChange);
    apiKeyInput.addEventListener('blur', handleSettingsChange);
  }

  if (enableAIInput) {
    enableAIInput.addEventListener('change', handleSettingsChange);
  }

  if (testButton) {
    testButton.addEventListener('click', handleApiKeyTest);
  }

  const generateSummariesButton = document.getElementById('generate-summaries');
  if (generateSummariesButton) {
    generateSummariesButton.addEventListener('click', handleGenerateSummaries);
  }
};

// Update summary stats display
const updateSummaryStats = () => {
  const settings = loadSettings();
  const summaryStatsDiv = document.getElementById('summary-stats');
  
  if (!summaryStatsDiv) return;
  
  if (!settings.enableAIFeatures || !settings.apiKey) {
    summaryStatsDiv.style.display = 'none';
    return;
  }
  
  summaryStatsDiv.style.display = 'block';
  
  // Use the summarization module
  try {
    const stats = getSummaryStats();
    
    const totalEntriesEl = document.getElementById('total-entries');
    const recentEntriesEl = document.getElementById('recent-entries');
    const summarizedEntriesEl = document.getElementById('summarized-entries');
    const pendingSummariesEl = document.getElementById('pending-summaries');
    const progressFill = document.getElementById('summary-progress');
    
    // Meta-summary elements
    const metaSummaryStatEl = document.getElementById('meta-summary-stat');
    const metaSummariesEl = document.getElementById('meta-summaries');
    const metaEntriesStatEl = document.getElementById('meta-entries-stat');
    const metaEntriesEl = document.getElementById('meta-entries');
    
    if (totalEntriesEl) totalEntriesEl.textContent = stats.totalEntries;
    if (recentEntriesEl) recentEntriesEl.textContent = stats.recentEntries;
    if (summarizedEntriesEl) summarizedEntriesEl.textContent = stats.summarizedEntries;
    if (pendingSummariesEl) pendingSummariesEl.textContent = stats.pendingSummaries;
    
    if (progressFill) {
      progressFill.style.width = `${stats.summaryCompletionRate}%`;
    }
    
    // Show meta-summary stats if meta-summarization is active
    if (stats.metaSummaryActive) {
      if (metaSummaryStatEl) metaSummaryStatEl.style.display = 'flex';
      if (metaEntriesStatEl) metaEntriesStatEl.style.display = 'flex';
      if (metaSummariesEl) metaSummariesEl.textContent = stats.metaSummaries;
      if (metaEntriesEl) metaEntriesEl.textContent = stats.entriesInMetaSummaries;
    } else {
      if (metaSummaryStatEl) metaSummaryStatEl.style.display = 'none';
      if (metaEntriesStatEl) metaEntriesStatEl.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to load summary stats:', error);
    // Hide stats on error
    summaryStatsDiv.style.display = 'none';
  }
};

// Handle generate summaries button
const handleGenerateSummaries = async () => {
  const button = document.getElementById('generate-summaries');
  if (!button) return;
  
  const originalText = button.textContent;
  button.textContent = 'Generating...';
  button.disabled = true;
  
  try {
    const result = await autoSummarizeEntries();
    if (result && result.length > 0) {
      alert(`Generated ${result.length} summaries.`);
      updateSummaryStats();
    } else {
      alert('No summaries needed at this time.');
    }
  } catch (error) {
    alert('Failed to generate summaries: ' + error.message);
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
};

// Populate form with current settings
const populateForm = () => {
  const settings = loadSettings();
  
  const apiKeyInput = document.getElementById('api-key');
  const enableAIInput = document.getElementById('enable-ai-features');
  const testButton = document.getElementById('test-api-key');

  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey;
  }

  if (enableAIInput) {
    enableAIInput.checked = settings.enableAIFeatures;
  }

  if (testButton) {
    testButton.disabled = !settings.apiKey;
  }
  
  updateSummaryStats();
};

// Initialize settings page
const init = () => {
  populateForm();
  setupEventHandlers();
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
