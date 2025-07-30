// D&D Journal - Simple Main Application
// Direct YJS data binding, no "system" abstraction

import { generateId } from './utils.js';
import { renderEntries, parseMarkdown, enableEditMode, saveEdit, cancelEdit, focusEntryTitle } from './entry-ui.js';
import { displayCharacterSummary } from './character-display.js';
import { initializeYjs, onUpdate, getCharacter, getEntries, addEntry } from './yjs-simple.js';

// Simple state for UI rendering (mirrors YJS data)
let state = { character: {}, entries: [] };

// Simple function to get current state
export const getState = () => ({ ...state });

// Simple function to reset state (for testing)
export const resetState = () => {
  state = { character: {}, entries: [] };
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};

// Load data from YJS into local state
const loadStateFromYjs = () => {
  try {
    state.character = getCharacter();
    state.entries = getEntries();
    
    // Update global state for tests
    if (typeof global !== 'undefined') {
      global.state = state;
    }
  } catch (error) {
    console.error('Failed to load state from YJS:', error);
  }
};

// Simple UI update
const updateUI = () => {
  loadStateFromYjs();
  renderEntries(state.entries);
  displayCharacterSummary(state.character);
};

// Add new entry
export const addNewEntry = async () => {
  try {
    const titleInput = document.getElementById('entry-title');
    const contentInput = document.getElementById('entry-content');
    
    if (!titleInput || !contentInput) return;
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
      alert('Please enter both title and content');
      return;
    }

    // Create and add entry directly to YJS
    const entry = {
      id: generateId(),
      title,
      content,
      timestamp: Date.now()
    };

    addEntry(entry);

    // Clear form
    titleInput.value = '';
    contentInput.value = '';
    
    // Focus for next entry
    focusEntryTitle();
  } catch (error) {
    console.error('Error adding entry:', error);
    alert('Failed to add entry');
  }
};

// Setup event handlers
export const setupEventHandlers = () => {
  // Add entry button
  const addBtn = document.getElementById('add-entry-btn');
  if (addBtn) {
    addBtn.addEventListener('click', addNewEntry);
  }
  
  // Form submission
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addNewEntry();
    });
  }
  
  // Make functions globally available for onclick handlers
  if (typeof window !== 'undefined') {
    window.enableEditMode = enableEditMode;
    window.saveEdit = saveEdit;
    window.cancelEdit = cancelEdit;
  }
};

// Simple AI prompt display (lazy loaded)
export const displayAIPrompt = async () => {
  try {
    const { generateIntrospectionPrompt } = await import('./ai-simple.js');
    const prompt = await generateIntrospectionPrompt(state.character, state.entries);
    
    if (!prompt) {
      console.log('AI prompt not available');
      return;
    }
    
    const promptContainer = document.getElementById('ai-prompt-container');
    const promptText = document.getElementById('ai-prompt-text');
    
    if (promptContainer && promptText) {
      promptText.innerHTML = prompt.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
      promptContainer.style.display = 'block';
    }
  } catch (error) {
    console.error('Error displaying AI prompt:', error);
  }
};

// Regenerate AI prompt
export const regenerateAIPrompt = async () => {
  const btn = document.getElementById('regenerate-prompt-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Generating...';
  }
  
  try {
    await displayAIPrompt();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Regenerate';
    }
  }
};

// Get entry summaries (lazy loaded)
export const getEntrySummaries = async () => {
  try {
    const { getAllSummaries } = await import('./summarization.js');
    return getAllSummaries();
  } catch {
    return {};
  }
};

// Initialize the application
export const initializeApp = async () => {
  try {
    // Initialize YJS with direct data binding
    await initializeYjs();
    
    // Load initial state
    loadStateFromYjs();
    
    // Setup YJS update listener
    onUpdate(() => {
      console.log('YJS updated - refreshing UI');
      updateUI();
    });
    
    // Setup event handlers
    setupEventHandlers();
    
    // Initial UI render
    updateUI();
    
    // Display AI prompt if container exists
    if (document.getElementById('ai-prompt-container')) {
      displayAIPrompt();
    }
    
    console.log('D&D Journal initialized with direct YJS binding');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for compatibility
export { 
  state, 
  parseMarkdown, 
  enableEditMode, 
  saveEdit, 
  cancelEdit,
  displayCharacterSummary,
  setupEventHandlers,
  addNewEntry as addEntry // Alias for compatibility
};