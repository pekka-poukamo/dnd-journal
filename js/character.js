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
let loadingIndicator = null;

// Initialize Character page
export const initCharacterPage = async (stateParam = null) => {
  try {
    // Get DOM elements first
    characterFormElement = document.getElementById('character-form');
    
    if (!characterFormElement) {
      console.warn('Character form not found');
      return;
    }
    
    // Set up form handling immediately
    setupFormHandlers();
    
    // Render empty form immediately for fast initial render
    renderCharacterForm(characterFormElement, {
      name: '',
      race: '',
      class: '',
      backstory: '',
      notes: ''
    });
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Initialize YJS and load data in background
    const state = stateParam || (await initYjs(), getYjsState());
    
    // Render with actual data once available
    renderCharacterPage(state);
    
    // Hide loading indicator
    hideLoadingIndicator();
    
    // Set up reactive updates
    onCharacterChange(state, () => {
      renderCharacterPage(state);
      updateSummariesDisplay(state);
    });
    
    // Initial summaries update
    updateSummariesDisplay(state);
    
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

// Show loading indicator
const showLoadingIndicator = () => {
  if (loadingIndicator) return; // Already showing
  
  loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="loading-spinner"></div>
    <span>Loading character data...</span>
  `;
  loadingIndicator.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-size: 14px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  const spinner = loadingIndicator.querySelector('.loading-spinner');
  spinner.style.cssText = `
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #666;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  `;
  
  // Add animation keyframes if not already present
  if (!document.querySelector('#loading-spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-spinner-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(loadingIndicator);
};

// Hide loading indicator
const hideLoadingIndicator = () => {
  if (loadingIndicator) {
    document.body.removeChild(loadingIndicator);
    loadingIndicator = null;
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

