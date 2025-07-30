// Character Page - Simplified Architecture
import { 
  initData, 
  onStateChange, 
  getState,
  updateCharacter,
  getSetting,
  updateSummary,
  getSummary
} from './data.js';

import {
  renderCharacterForm,
  renderSummaries,
  toggleGenerateButton,
  getFormData,
  showNotification
} from './character-views.js';

import { summarize } from './summarization.js';
import { isAPIAvailable } from './openai-wrapper.js';

// Initialize character page
const initCharacterPage = async () => {
  try {
    // Initialize data layer
    await initData();
    
    // Set up reactive rendering
    onStateChange(handleStateChange);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderCharacterPage();
    
  } catch (error) {
    console.error('Failed to initialize character page:', error);
    showNotification('Failed to load character page. Please refresh.', 'error');
  }
};

// Handle state changes from Y.js
const handleStateChange = (state) => {
  renderCharacterPage();
};

// Render the character page
const renderCharacterPage = () => {
  const state = getState();
  
  // Update form fields with current character data
  renderCharacterForm(state.character);
  
  // Update summaries display
  updateSummariesDisplay();
};

// Set up event listeners
const setupEventListeners = () => {
  // Character form submission
  const characterForm = document.getElementById('character-form');
  if (characterForm) {
    characterForm.addEventListener('submit', handleCharacterFormSubmit);
    
    // Add real-time field updates
    const inputs = characterForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', handleFieldChange);
    });
  }
  
  // Summary refresh button
  const refreshBtn = document.getElementById('refresh-summaries');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefreshSummaries);
  }
  
  // Generate summaries button
  const generateBtn = document.getElementById('generate-summaries');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateSummaries);
  }
};

// Handle character form submission
const handleCharacterFormSubmit = (event) => {
  event.preventDefault();
  const formData = getFormData(event.target);
  
  // Update each field in Y.js
  Object.entries(formData).forEach(([field, value]) => {
    updateCharacter(field, value.trim());
  });
  
  showNotification('Character information saved!', 'success');
};

// Handle individual field changes for real-time updates
const handleFieldChange = (event) => {
  const field = event.target.name;
  const value = event.target.value.trim();
  
  if (field) {
    updateCharacter(field, value);
  }
};

// Handle refresh summaries
const handleRefreshSummaries = async () => {
  const state = getState();
  const character = state.character;
  
  if (!await isAPIAvailable()) {
    showNotification('AI features not available. Please configure API settings.', 'error');
    return;
  }
  
  try {
    // Generate summaries for backstory and notes if they exist
    if (character.backstory && character.backstory.length > 100) {
      await summarize('character-backstory', character.backstory);
    }
    
    if (character.notes && character.notes.length > 100) {
      await summarize('character-notes', character.notes);
    }
    
    updateSummariesDisplay();
    showNotification('Summaries refreshed!', 'success');
    
  } catch (error) {
    console.error('Failed to refresh summaries:', error);
    showNotification('Failed to refresh summaries.', 'error');
  }
};

// Handle generate summaries
const handleGenerateSummaries = async () => {
  await handleRefreshSummaries();
};

// Update summaries display
const updateSummariesDisplay = () => {
  const backstorySummary = getSummary('character-backstory');
  const notesSummary = getSummary('character-notes');
  
  renderSummaries(backstorySummary, notesSummary);
  
  // Show generate button if API is available
  isAPIAvailable().then(available => {
    toggleGenerateButton(available);
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCharacterPage);

// Export for testing
export { 
  initCharacterPage,
  handleCharacterFormSubmit,
  handleFieldChange,
  renderCharacterPage 
};
