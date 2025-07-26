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
  
  // Prioritize new combined summary format
  if (generalSummaries['character:combined']) {
    combinedSummaries['character:combined'] = generalSummaries['character:combined'];
  } else {
    // Fallback to individual field summaries for backward compatibility
    
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
      if (key.startsWith('character:') && key !== 'character:combined') {
        combinedSummaries[key] = generalSummaries[key];
      }
    });
  }
  
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
        <p>No character summaries available yet. Character summaries are automatically generated when your backstory or notes become lengthy. Generated summaries will appear here as collapsible sections.</p>
      </div>
    `;
    if (generateBtn) generateBtn.style.display = 'none';
    return;
  }
  
  // Show generate button if API is available
  if (generateBtn && isAPIAvailable()) {
    generateBtn.style.display = 'inline-block';
  }
  
  // Display summaries using collapsible sections
  const summariesHTML = summaryKeys.map(key => {
    const summary = summaries[key];
    const fieldName = key.replace('character:', '');
    const displayName = fieldName === 'combined' 
      ? 'Character Summary' 
      : fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    const timestamp = summary.timestamp ? formatDate(summary.timestamp) : 'Unknown date';
    const wordCount = summary.words || 0;
    
    return `
      <div class="entry-summary">
        <button class="entry-summary__toggle" type="button">
          <span class="entry-summary__label">${displayName} (${wordCount} words, ${timestamp})</span>
          <span class="entry-summary__icon">▼</span>
        </button>
        <div class="entry-summary__content" style="display: none;">
          <p>${summary.content || summary.summary || 'No summary content available'}</p>
        </div>
      </div>
    `;
  }).join('');
  
  summariesContent.innerHTML = summariesHTML;
  
  // Add click handlers for collapsible functionality
  const toggles = summariesContent.querySelectorAll('.entry-summary__toggle');
  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      const icon = toggle.querySelector('.entry-summary__icon');
      const isExpanded = content.style.display !== 'none';
      
      content.style.display = isExpanded ? 'none' : 'block';
      icon.textContent = isExpanded ? '▼' : '▲';
      toggle.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
    });
  });
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
    // Combine all character data into single text
    const combinedText = [
      character.name ? `Name: ${character.name}` : '',
      character.race ? `Race: ${character.race}` : '',
      character.class ? `Class: ${character.class}` : '',
      character.backstory || '',
      character.notes || ''
    ].filter(text => text.length > 0).join('\n\n');
    
    // Count total words in combined text
    const totalWords = combinedText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Only summarize if there's substantial content
    if (totalWords >= 150) {
      // Use character:combined as the key for the unified summary
      // The summarization module will automatically calculate logarithmic length
      const summaryKey = 'character:combined';
      const summary = await summarize(summaryKey, combinedText);
      
      if (summary) {
        displayCharacterSummaries();
        alert('Generated character summary.');
      } else {
        alert('No summary was generated. Summary may already exist.');
      }
    } else {
      alert('Character information is too short to summarize. Need at least 150 words.');
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

// Get formatted character with automatic summarization for storytelling context
export const getFormattedCharacterForAI = async (character) => {
  // Check if we have a combined character summary
  const summaries = loadDataWithFallback('simple-summaries', {});
  const combinedSummary = summaries['character:combined'];
  
  if (combinedSummary) {
    // Use the combined summary for storytelling context
    return {
      name: character.name || 'Unnamed Character',
      summary: `${combinedSummary.content} (summarized)`
    };
  }
  
  // Fallback: Create combined text and potentially summarize
  const combinedText = [
    character.name ? `Name: ${character.name}` : '',
    character.race ? `Race: ${character.race}` : '',
    character.class ? `Class: ${character.class}` : '',
    character.backstory || '',
    character.notes || ''
  ].filter(text => text.length > 0).join('\n\n');
  
  const totalWords = combinedText.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  // If content is substantial, try to create summary
  if (totalWords >= 150) {
    const summary = await summarize('character:combined', combinedText);
    
    if (summary) {
      return {
        name: character.name || 'Unnamed Character',
        summary: `${summary} (summarized)`
      };
    }
  }
  
  // Fallback to original character data
  return { ...character };
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

// Start when DOM is ready (only in browser environment)
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init);
}
