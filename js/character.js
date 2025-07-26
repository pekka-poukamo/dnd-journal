// Character Page - Simple & Functional

import { 
  safeGetFromStorage, 
  safeSetToStorage, 
  createInitialJournalState, 
  STORAGE_KEYS, 
  getCharacterFormFieldIds, 
  getPropertyNameFromFieldId, 
  debounce,
  loadDataWithFallback,
  formatDate
} from './utils.js';
import { summarize } from './summarization.js';
import { isAPIAvailable } from './openai-wrapper.js';

// Pure function to load character data from localStorage
export const loadCharacterData = () => {
  const result = safeGetFromStorage(STORAGE_KEYS.JOURNAL);
  if (!result.success || !result.data) {
    return createInitialJournalState().character;
  }
  
  return result.data.character || createInitialJournalState().character;
};

// Pure function to save character data to localStorage
export const saveCharacterData = (characterData) => {
  const result = safeGetFromStorage(STORAGE_KEYS.JOURNAL);
  const currentData = result.success && result.data ? result.data : createInitialJournalState();
  
  const updatedData = {
    ...currentData,
    character: characterData
  };
  
  return safeSetToStorage(STORAGE_KEYS.JOURNAL, updatedData);
};

// Pure function to get character data from form
export const getCharacterFromForm = () => 
  getCharacterFormFieldIds().reduce((character, fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyNameFromFieldId(fieldId);
      character[propertyName] = element.value.trim();
    }
    return character;
  }, createInitialJournalState().character);

// Pure function to populate form with character data
export const populateForm = (character) => {
  getCharacterFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyNameFromFieldId(fieldId);
      element.value = character[propertyName] || '';
    }
  });
};

// Load character summaries from storage
export const loadCharacterSummaries = () => {
  // Check both storage locations for character summaries
  const characterSummaries = loadDataWithFallback(STORAGE_KEYS.CHARACTER_SUMMARIES, {});
  const generalSummaries = loadDataWithFallback('simple-summaries', {});
  
  // Combine summaries from both sources
  const combinedSummaries = {};
  
  // Add from dedicated character summaries storage (format: fieldname: {summary, timestamp, etc})
  Object.keys(characterSummaries).forEach(field => {
    if (characterSummaries[field]) {
      combinedSummaries[`character:${field}`] = {
        content: characterSummaries[field].summary || characterSummaries[field].content,
        words: characterSummaries[field].words || 0,
        timestamp: characterSummaries[field].timestamp
      };
    }
  });
  
  // Add from general summaries storage (format: character:fieldname: {content, words, timestamp})
  Object.keys(generalSummaries).forEach(key => {
    if (key.startsWith('character:')) {
      combinedSummaries[key] = generalSummaries[key];
    }
  });
  
  return combinedSummaries;
};

// Display character summaries in the UI
export const displayCharacterSummaries = () => {
  const summariesContent = document.getElementById('summaries-content');
  const generateBtn = document.getElementById('generate-summaries');
  
  if (!summariesContent) return;
  
  const summaries = loadCharacterSummaries();
  const summaryKeys = Object.keys(summaries);
  
  if (summaryKeys.length === 0) {
    summariesContent.innerHTML = `
      <div class="summary-placeholder">
        <p>No character summaries available yet. Character summaries are automatically generated when your backstory or notes become lengthy.</p>
      </div>
    `;
    if (generateBtn) generateBtn.style.display = 'none';
    return;
  }
  
  // Show generate button if API is available
  if (generateBtn && isAPIAvailable()) {
    generateBtn.style.display = 'inline-block';
  }
  
  // Display summaries
  const summariesHTML = summaryKeys.map(key => {
    const summary = summaries[key];
    const fieldName = key.replace('character:', '');
    const displayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const timestamp = summary.timestamp ? formatDate(summary.timestamp) : 'Unknown date';
    
    return `
      <div class="summary-item">
        <div class="summary-header">
          <h3>${displayName} Summary</h3>
          <span class="summary-date">${timestamp}</span>
        </div>
        <div class="summary-content">
          <p>${summary.content || summary.summary || 'No summary content available'}</p>
        </div>
        <div class="summary-meta">
          <span class="word-count">${summary.words || 0} words</span>
        </div>
      </div>
    `;
  }).join('');
  
  summariesContent.innerHTML = summariesHTML;
};

// Generate summaries for character fields
export const generateCharacterSummaries = async () => {
  const character = loadCharacterData();
  const generateBtn = document.getElementById('generate-summaries');
  
  if (!isAPIAvailable()) {
    alert('AI features are not available. Please configure your API key in Settings.');
    return;
  }
  
  // Disable button and show loading
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
  }
  
  try {
    const fieldsToSummarize = ['backstory', 'notes'];
    let generated = 0;
    
    for (const field of fieldsToSummarize) {
      if (character[field] && character[field].length > 100) {
        const summaryKey = `character:${field}`;
        const summary = await summarize(summaryKey, character[field]);
        if (summary) {
          generated++;
        }
      }
    }
    
    if (generated > 0) {
      displayCharacterSummaries();
      alert(`Generated ${generated} character summary(ies).`);
    } else {
      alert('No summaries were generated. Character fields may be too short or summaries may already exist.');
    }
    
  } catch (error) {
    console.error('Error generating character summaries:', error);
    alert('Error generating summaries. Please try again.');
  } finally {
    // Reset button
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Summaries';
    }
  }
};

// Function to auto-save character data
const autoSave = () => {
  const character = getCharacterFromForm();
  saveCharacterData(character);
};

// Setup auto-save with debouncing
const setupAutoSave = () => {
  const debouncedAutoSave = debounce(autoSave, 500);
  
  getCharacterFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener('input', debouncedAutoSave);
      element.addEventListener('blur', autoSave);
    }
  });
};

// Setup summary-related event listeners
const setupSummaryEventListeners = () => {
  const refreshBtn = document.getElementById('refresh-summaries');
  const generateBtn = document.getElementById('generate-summaries');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', displayCharacterSummaries);
  }
  
  if (generateBtn) {
    generateBtn.addEventListener('click', generateCharacterSummaries);
  }
};

// Setup keyboard shortcuts
const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      autoSave();
    }
    
    if (e.key === 'Escape') {
      window.location.href = 'index.html';
    }
  });
};

// Initialize character page
const init = () => {
  const character = loadCharacterData();
  populateForm(character);
  setupAutoSave();
  setupSummaryEventListeners();
  setupKeyboardShortcuts();
  displayCharacterSummaries();
  
  const nameInput = document.getElementById('character-name');
  if (nameInput && !character.name) {
    nameInput.focus();
  }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
