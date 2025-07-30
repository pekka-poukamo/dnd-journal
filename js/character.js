// Character Page - Simplified Direct Y.js Integration
import { 
  initYjs,
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

import { summarize } from './summarization.js';
import { isAPIAvailable } from './openai-wrapper.js';

// Initialize character page
const initCharacterPage = async () => {
  try {
    // Initialize Y.js
    await initYjs();
    
    // Set up reactive rendering - direct Y.js observer
    onCharacterChange(renderCharacterPage);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderCharacterPage();
    
  } catch (error) {
    console.error('Failed to initialize character page:', error);
    showNotification('Failed to load character page. Please refresh.', 'error');
  }
};

// Render the character page
const renderCharacterPage = () => {
  // Update form fields - direct from Y.js
  const character = getCharacterData();
  renderCharacterForm(character);
  
  // Update summaries display
  updateSummariesDisplay();
};

// Set up event listeners
const setupEventListeners = () => {
  const characterForm = document.getElementById('character-form');
  if (characterForm) {
    characterForm.addEventListener('submit', handleCharacterFormSubmit);
    
    // Real-time field updates - direct to Y.js
    const inputs = characterForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        setCharacter(e.target.name, e.target.value.trim());
      });
    });
  }
  
  const refreshBtn = document.getElementById('refresh-summaries');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefreshSummaries);
  }
  
  const generateBtn = document.getElementById('generate-summaries');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateSummaries);
  }
};

// Handle character form submission
const handleCharacterFormSubmit = (event) => {
  event.preventDefault();
  const formData = getFormData(event.target);
  
  // Direct Y.js operations
  Object.entries(formData).forEach(([field, value]) => {
    setCharacter(field, value.trim());
  });
  
  showNotification('Character information saved!', 'success');
};

// Handle refresh summaries
const handleRefreshSummaries = async () => {
  const character = getCharacterData();
  
  if (!await isAPIAvailable()) {
    showNotification('AI features not available. Please configure API settings.', 'error');
    return;
  }
  
  try {
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
  // Direct Y.js access
  const backstorySummary = getSummary('character-backstory');
  const notesSummary = getSummary('character-notes');
  
  renderSummaries(backstorySummary, notesSummary);
  
  isAPIAvailable().then(available => {
    toggleGenerateButton(available);
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCharacterPage);

// Export for testing
export { 
  initCharacterPage,
  renderCharacterPage 
};
