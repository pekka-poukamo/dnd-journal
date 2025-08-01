// Character Page - Pure Functional Y.js Integration
import { 
  initYjs,
  getYjsState,
  getCharacterData,
  setCharacter,
  getSummary,
  onCharacterChange
} from './yjs.js';

import {
  getCachedCharacterData,
  getFormDataForPage,
  saveNavigationCache,
  saveCurrentFormData
} from './navigation-cache.js';

import {
  renderCharacterForm,
  renderSummaries,
  toggleGenerateButton,
  getFormData,
  showNotification
} from './character-views.js';

import { isAPIAvailable } from './openai-wrapper.js';
import { summarize } from './summarization.js';

// State management
let characterFormElement = null;

// Initialize Character page
export const initCharacterPage = async (stateParam = null) => {
  try {
    // Get DOM elements first
    characterFormElement = document.getElementById('character-form');
    
    if (!characterFormElement) {
      console.warn('Character form not found');
      return;
    }
    
    // 1. Show cached content immediately
    renderCachedCharacterContent();
    
    // 2. Initialize Yjs in background
    const state = stateParam || (await initYjs(), getYjsState());
    
    // 3. Set up reactive updates
    onCharacterChange(state, () => {
      renderCharacterPage(state);
      updateSummariesDisplay(state);
      // Save to cache when data changes
      saveNavigationCache(state);
    });
    
    // 4. Replace cached content with fresh Yjs data
    renderCharacterPage(state);
    
    // 5. Set up form handling with cached data
    setupFormHandlers();
    
    // 6. Update summaries
    updateSummariesDisplay(state);
    
    // 7. Set up navigation caching
    setupCharacterNavigationCaching(state);
    
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
    
    showNotification('Character saved!', 'success');
  } catch (error) {
    console.error('Failed to save character data:', error);
    showNotification('Failed to save character', 'error');
  }
};

// Generate summary for character field
const generateSummary = async (field) => {
  try {
    const state = getYjsState();
    const character = getCharacterData(state);
    const content = character[field];
    
    if (!content || content.trim().length === 0) {
      showNotification(`No ${field} content to summarize`, 'warning');
      return;
    }
    
    if (!isAPIAvailable()) {
      showNotification('AI not available for summary generation', 'warning');
      return;
    }
    
    showNotification('Generating summary...', 'info');
    
    const summary = await summarize(content, 'character');
    showNotification('Summary generated!', 'success');
    
    updateSummariesDisplay(state);
    
  } catch (error) {
    console.error('Failed to generate summary:', error);
    showNotification('Failed to generate summary', 'error');
  }
};



// Update summaries display
export const updateSummariesDisplay = (stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    const backstorySummary = getSummary(state, 'character-backstory');
    const notesSummary = getSummary(state, 'character-notes');
    
    renderSummaries(backstorySummary, notesSummary);
    
    const available = isAPIAvailable();
    toggleGenerateButton(available);
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

// Pure function to render cached character content immediately
const renderCachedCharacterContent = () => {
  const cachedCharacter = getCachedCharacterData();
  const cachedFormData = getFormDataForPage('character');
  
  if (Object.keys(cachedCharacter).length > 0 || Object.keys(cachedFormData).length > 0) {
    // Merge cached character data with form data
    const displayData = { ...cachedCharacter, ...cachedFormData };
    
    // Render form with cached data
    renderCharacterForm(characterFormElement, displayData, {
      onSave: () => {}, // Disabled during cache phase
      onGenerate: () => {} // Disabled during cache phase
    });
    
    // Show loading indicator for summaries
    const summariesContainer = document.getElementById('summaries-container');
    if (summariesContainer) {
      summariesContainer.innerHTML = '<p>Loading AI summaries...</p>';
    }
  }
};

// Pure function to set up character navigation caching
const setupCharacterNavigationCaching = (state) => {
  // Save cache before page unload
  const handleBeforeUnload = () => {
    saveNavigationCache(state);
    
    // Save current form data
    const formData = getCharacterFormData();
    if (formData) {
      saveCurrentFormData('character', formData);
    }
  };
  
  // Set up event listener
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Save on form changes (debounced)
  let formTimeout;
  const debouncedFormSave = () => {
    clearTimeout(formTimeout);
    formTimeout = setTimeout(() => {
      const formData = getCharacterFormData();
      if (formData) {
        saveCurrentFormData('character', formData);
      }
    }, 1000); // 1 second delay
  };
  
  // Listen for form changes
  if (characterFormElement) {
    characterFormElement.addEventListener('input', debouncedFormSave);
    characterFormElement.addEventListener('change', debouncedFormSave);
  }
};

// Pure function to get current character form data
const getCharacterFormData = () => {
  if (!characterFormElement) return null;
  
  const formData = getFormData(characterFormElement);
  return Object.keys(formData).length > 0 ? formData : null;
};

