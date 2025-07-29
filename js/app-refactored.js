// D&D Journal - Refactored Main Application Module
// Following functional programming principles and style guide

// Import utility modules
import { 
  generateId, 
  formatDate, 
  sortEntriesByDate, 
  isValidEntry 
} from './utils.js';

// Import error handling
import { handleError, createSuccess, safeDomOperation } from './error-handling.js';

// Import form utilities
import { getEntryFormData, clearEntryForm } from './form-utils.js';

// Import DOM utilities
import { focusElement, addEventListener } from './dom-utils.js';

// Import extracted modules
import { addNewEntry, getEntriesFromSystem } from './entry-management.js';
import { 
  renderEntries, 
  parseMarkdown, 
  enableEditMode, 
  saveEdit, 
  cancelEdit,
  focusEntryTitle 
} from './entry-ui.js';
import { 
  displayCharacterSummary, 
  getCharacterFromSystem 
} from './character-display.js';

// Import YJS optimization
import { 
  initializeYjsSystem, 
  loadStateOptimized, 
  setupOptimizedUpdateListener,
  ensureSystemReady,
  getInitializationPriority
} from './yjs-optimization.js';

// Import performance utilities
import { loadAIFeatures, initializeFeature } from './performance-utils.js';

// Simple state for UI rendering (read-only mirror of Yjs)
let state = { character: {}, entries: [] };

// Yjs system instance (created by pure function)
let yjsSystem = null;

// Pure function to get current state
export const getState = () => ({ ...state });

// Pure function to reset state (for testing)
export const resetState = () => {
  state = { character: {}, entries: [] };
  
  // Update global state reference for tests
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};

// Load data from Yjs into local state (optimized)
const loadStateFromYjs = () => {
  const result = loadStateOptimized();
  if (result.success && result.data) {
    state = result.data;
    
    // Update global state reference for tests
    if (typeof global !== 'undefined') {
      global.state = state;
    }
  }
};

// Optimized UI update function
const updateUI = () => {
  safeDomOperation(() => {
    loadStateFromYjs();
    renderEntries(state.entries);
    displayCharacterSummary(state.character);
  }, 'updateUI');
};

// Add new entry with optimized flow
export const addEntry = async () => {
  try {
    await ensureSystemReady();
    
    const result = addNewEntry();
    if (!result.success) {
      alert(result.error);
      return;
    }
    
    // Update UI
    updateUI();
    focusEntryTitle();
  } catch (error) {
    console.error('Error adding entry:', error);
    alert('Failed to add entry');
  }
};

// Setup event handlers with lazy loading
export const setupEventHandlers = () => {
  // Add entry form submission
  addEventListener('add-entry-btn', 'click', addEntry);
  
  // Form submission with Enter key
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addEntry();
    });
  }
  
  // Make functions available globally for onclick handlers
  if (typeof window !== 'undefined') {
    window.enableEditMode = enableEditMode;
    window.saveEdit = saveEdit;
    window.cancelEdit = cancelEdit;
  }
};

// AI prompt functionality with lazy loading
let aiFeatures = null;

const loadAIFeaturesIfNeeded = async () => {
  if (aiFeatures) return aiFeatures;
  
  const result = await initializeFeature(loadAIFeatures, {
    elementExists: 'ai-prompt-container'
  });
  
  if (result.success) {
    aiFeatures = result.data;
  }
  
  return aiFeatures;
};

// Display AI prompt with lazy loading
export const displayAIPrompt = async () => {
  try {
    const features = await loadAIFeaturesIfNeeded();
    if (!features) {
      console.log('AI features not available');
      return;
    }
    
    // Use the loaded AI module to generate prompt
    const prompt = await features.ai.getIntrospectionPromptForPreview(state.character, state.entries);
    if (!prompt) {
      console.log('No AI prompt available');
      return;
    }
    
    const promptContainer = document.getElementById('ai-prompt-container');
    const promptText = document.getElementById('ai-prompt-text');
    
    if (promptContainer && promptText) {
      promptText.innerHTML = formatAIPrompt(prompt.user);
      promptContainer.style.display = 'block';
    }
  } catch (error) {
    console.error('Error displaying AI prompt:', error);
  }
};

// Format AI prompt for display
const formatAIPrompt = (promptText) => {
  if (!promptText) return '';
  
  return promptText
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
};

// Regenerate AI prompt
export const regenerateAIPrompt = async () => {
  const regenerateBtn = document.getElementById('regenerate-prompt-btn');
  if (regenerateBtn) {
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = 'Generating...';
  }
  
  try {
    await displayAIPrompt();
  } finally {
    if (regenerateBtn) {
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = 'Regenerate';
    }
  }
};

// Get entry summaries (with lazy loading)
export const getEntrySummaries = async () => {
  const features = await loadAIFeaturesIfNeeded();
  if (!features) return {};
  
  return features.summarization.getAllSummaries();
};

// Initialize the application with optimized loading
export const initializeApp = async () => {
  try {
    // Get initialization priority based on current page
    const priority = getInitializationPriority();
    
    // Initialize YJS system with priority
    const systemResult = await initializeYjsSystem(priority);
    if (!systemResult.success) {
      console.error('Failed to initialize YJS system:', systemResult.error);
      return;
    }
    
    yjsSystem = systemResult.data;
    
    // Load initial state
    loadStateFromYjs();
    
    // Setup optimized update listener
    setupOptimizedUpdateListener(updateUI);
    
    // Setup event handlers
    setupEventHandlers();
    
    // Initial UI render
    updateUI();
    
    // Display AI prompt if needed (lazy loaded)
    if (document.getElementById('ai-prompt-container')) {
      displayAIPrompt();
    }
    
    console.log('D&D Journal initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export state and functions for compatibility
export { 
  state, 
  parseMarkdown, 
  enableEditMode, 
  saveEdit, 
  cancelEdit,
  displayCharacterSummary,
  setupEventHandlers
};