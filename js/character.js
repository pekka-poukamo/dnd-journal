// Character Page - Pure Functional Y.js Integration
import { 
  initYjs,
  getYjsState,
  getCharacterData,
  setCharacter,
  getSummary,
  onCharacterChange,
  clearSessionQuestions
} from './yjs.js';
import { clearSummary } from './summarization.js';

import { saveNavigationCache } from './navigation-cache.js';

import {
  renderCharacterForm,
  renderSummaries,
  toggleGenerateButton,
  renderCachedCharacterContent
} from './character-views.js';

import { getFormData, showNotification } from './utils.js';

import { isAIEnabled } from './ai.js';
import { summarize } from './summarization.js';

// State management
let characterFormElement = null;

// Initialize Character page
export const initCharacterPage = async (stateParam = null) => {
  try {
    // Get DOM elements
    characterFormElement = document.getElementById('character-form');
    const summariesContainer = document.getElementById('summaries-container');
    
    if (!characterFormElement) {
      console.warn('Character form not found');
      return;
    }
    
    // Show cached content immediately
    renderCachedCharacterContent({
      characterFormElement,
      summariesContainer
    });
    
    // Set up form handling early (improves responsiveness)
    setupFormHandlers();
    
    // Initialize Yjs asynchronously (non-blocking)
    const state = stateParam || (await initYjs(), getYjsState());
    
    // Set up reactive updates
    onCharacterChange(state, () => {
      renderCharacterPage(state);
      updateSummariesDisplay(state);
    });
    
    // Replace cached content with fresh data
    renderCharacterPage(state);
    
    // Update summaries
    updateSummariesDisplay(state);
    
    // Save cache on page unload
    window.addEventListener('beforeunload', () => {
      saveNavigationCache(state);
    });
    
  } catch (error) {
    console.error('Failed to initialize character page:', error);
  }
};

// Render character page
export const renderCharacterPage = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const character = getCharacterData(state);
    
    // Use module-level element if available, otherwise find it
    const formElement = characterFormElement || document.getElementById('character-form');
    if (formElement) {
      renderCharacterForm(formElement, character);
    }
  } catch (error) {
    console.error('Failed to render character page:', error);
  }
};

// Set up form event handlers
const setupFormHandlers = () => {
  if (!characterFormElement) return;
  
  // Handle form submission
  characterFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCharacterData();
  });
  
  // Handle real-time updates on blur
  const fields = ['name', 'race', 'class', 'backstory', 'notes'];
  fields.forEach(field => {
    const input = characterFormElement.querySelector(`[name="${field}"]`);
    if (input) {
      input.addEventListener('blur', () => {
        saveCharacterField(field, input.value);
      });
    }
  });
  
  // Summary generation buttons
  const generateBackstoryBtn = document.getElementById('generate-backstory-summary');
  const generateNotesBtn = document.getElementById('generate-notes-summary');
  const generateSummariesBtn = document.getElementById('generate-summaries');
  const refreshSummariesBtn = document.getElementById('refresh-summaries');
  
  if (generateBackstoryBtn) {
    generateBackstoryBtn.addEventListener('click', () => {
      generateSummary('backstory');
    });
  }
  
  if (generateNotesBtn) {
    generateNotesBtn.addEventListener('click', () => {
      generateSummary('notes');
    });
  }
  
  if (generateSummariesBtn) {
    generateSummariesBtn.addEventListener('click', () => {
      generateAllSummaries();
    });
  }
  
  if (refreshSummariesBtn) {
    refreshSummariesBtn.addEventListener('click', () => {
      updateSummariesDisplay();
    });
  }
};

// Save individual character field
const saveCharacterField = (field, value) => {
  try {
    const state = getYjsState();
    const trimmedValue = value.trim();
    setCharacter(state, field, trimmedValue);
    
    // Clear cache when character fields that get summarized change
    if (field === 'backstory' || field === 'notes') {
      clearSummary(`character:${field}`);
    }
    
    // Clear session questions when character data changes
    clearSessionQuestions(state);
  } catch (error) {
    console.error(`Failed to save character ${field}:`, error);
  }
};

// Save all character data from form
export const saveCharacterData = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    
    // Use module-level element if available, otherwise find it
    const formElement = characterFormElement || document.getElementById('character-form');
    if (!formElement) {
      console.warn('Character form not found for saving');
      return;
    }
    
    const formData = getFormData(formElement);
    
    Object.entries(formData).forEach(([field, value]) => {
      setCharacter(state, field, value.trim());
    });
    
    // Clear session questions when character data changes
    clearSessionQuestions(state);
    
    showNotification('Character saved!', 'success');
  } catch (error) {
    console.error('Failed to save character data:', error);
    showNotification('Failed to save character', 'error');
  }
};

// Generate summary for character field
const generateSummary = (field) => {
  const state = getYjsState();
  const character = getCharacterData(state);
  const content = character[field];
  
  if (!content || content.trim().length === 0) {
    showNotification(`No ${field} content to summarize`, 'warning');
    return Promise.resolve();
  }
  
  if (!isAIEnabled()) {
    showNotification('AI not available for summary generation', 'warning');
    return Promise.resolve();
  }
  
  showNotification('Generating summary...', 'info');
  
  return summarize(`character:${field}`, content)
    .then(summary => {
      showNotification('Summary generated!', 'success');
      updateSummariesDisplay(state);
      return summary;
    })
    .catch(error => {
      console.error('Failed to generate summary:', error);
      showNotification('Failed to generate summary', 'error');
      throw error;
    });
};

// Generate summaries for all character fields that have content
const generateAllSummaries = () => {
  const state = getYjsState();
  const character = getCharacterData(state);
  
  if (!isAIEnabled()) {
    showNotification('AI not available for summary generation', 'warning');
    return Promise.resolve();
  }
  
  const fieldsToSummarize = ['backstory', 'notes'].filter(field => 
    character[field] && character[field].trim().length > 0
  );
  
  if (fieldsToSummarize.length === 0) {
    showNotification('No content available to summarize', 'warning');
    return Promise.resolve();
  }
  
  showNotification('Generating summaries...', 'info');
  
  // Generate summaries for each field in parallel
  const summaryPromises = fieldsToSummarize.map(field => generateSummary(field));
  
  return Promise.all(summaryPromises)
    .then(summaries => {
      showNotification('All summaries generated!', 'success');
      return summaries;
    })
    .catch(error => {
      console.error('Failed to generate summaries:', error);
      showNotification('Failed to generate summaries', 'error');
      throw error;
    });
};



// Update summaries display
export const updateSummariesDisplay = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const character = getCharacterData(state);
    const backstorySummary = getSummary(state, 'character:backstory');
    const notesSummary = getSummary(state, 'character:notes');
    
    renderSummaries(backstorySummary, notesSummary);
    
    const available = isAIEnabled();
    const hasContent = (character.backstory && character.backstory.trim().length > 0) || 
                      (character.notes && character.notes.trim().length > 0);
    toggleGenerateButton(available, hasContent);
  } catch (error) {
    console.error('Failed to update summaries display:', error);
  }
};

// Initialize when DOM is ready (only in browser environment)
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    import('./yjs.js').then(YjsModule => {
      YjsModule.initYjs().then(state => {
        initCharacterPage(state);
      });
    });
  });
}



