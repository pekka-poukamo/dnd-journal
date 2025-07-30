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
  createCharacterForm,
  getFormData,
  showNotification
} from './views.js';

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
  const form = document.getElementById('character-form');
  if (form) {
    const fields = ['name', 'race', 'class', 'backstory', 'notes'];
    fields.forEach(field => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input && state.character[field] !== undefined) {
        input.value = state.character[field];
      }
    });
  }
  
  // Update summaries if available
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
  const summariesContainer = document.getElementById('summaries-content');
  if (!summariesContainer) return;
  
  const backstorySummary = getSummary('character-backstory');
  const notesSummary = getSummary('character-notes');
  
  if (!backstorySummary && !notesSummary) {
    summariesContainer.innerHTML = `
      <div class="summary-placeholder">
        <p>No character summaries available yet. Character summaries are automatically generated when your backstory or notes become lengthy.</p>
      </div>
    `;
    return;
  }
  
  let summariesHTML = '';
  
  if (backstorySummary) {
    summariesHTML += `
      <div class="summary-item">
        <h3>Backstory Summary</h3>
        <p>${backstorySummary}</p>
      </div>
    `;
  }
  
  if (notesSummary) {
    summariesHTML += `
      <div class="summary-item">
        <h3>Notes Summary</h3>
        <p>${notesSummary}</p>
      </div>
    `;
  }
  
  summariesContainer.innerHTML = summariesHTML;
  
  // Show generate button if API is available
  const generateBtn = document.getElementById('generate-summaries');
  if (generateBtn) {
    isAPIAvailable().then(available => {
      generateBtn.style.display = available ? 'inline-block' : 'none';
    });
  }
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
