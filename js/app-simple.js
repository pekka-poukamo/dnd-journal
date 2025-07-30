// D&D Journal - Simple Main Application
// Following radical simplicity principles

import { 
  generateId, 
  formatDate, 
  sortEntriesByDate 
} from './utils.js';

import { 
  renderEntries, 
  parseMarkdown, 
  enableEditMode, 
  saveEdit, 
  cancelEdit,
  focusEntryTitle 
} from './entry-ui.js';

import { displayCharacterSummary } from './character-display.js';
import { createSystem, getSystem } from './yjs.js';

// Simple state for UI rendering
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
    const yjsSystem = getSystem();
    if (!yjsSystem) return;

    // Load character
    if (yjsSystem.characterMap) {
      state.character = {
        name: yjsSystem.characterMap.get('name') || '',
        race: yjsSystem.characterMap.get('race') || '',
        class: yjsSystem.characterMap.get('class') || '',
        backstory: yjsSystem.characterMap.get('backstory') || '',
        notes: yjsSystem.characterMap.get('notes') || ''
      };
    }

    // Load entries
    const entriesArray = yjsSystem.journalMap?.get('entries');
    if (entriesArray) {
      state.entries = entriesArray.toArray().map(entryMap => ({
        id: entryMap.get('id'),
        title: entryMap.get('title'),
        content: entryMap.get('content'),
        timestamp: entryMap.get('timestamp')
      }));
    }

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
export const addEntry = async () => {
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

    // Create entry
    const entry = {
      id: generateId(),
      title,
      content,
      timestamp: Date.now()
    };

    // Add to YJS
    const yjsSystem = getSystem();
    if (yjsSystem?.journalMap) {
      let entriesArray = yjsSystem.journalMap.get('entries');
      if (!entriesArray) {
        entriesArray = yjsSystem.ydoc.getArray('entriesArray');
        yjsSystem.journalMap.set('entries', entriesArray);
      }

      const entryMap = yjsSystem.ydoc.getMap();
      entryMap.set('id', entry.id);
      entryMap.set('title', entry.title);
      entryMap.set('content', entry.content);
      entryMap.set('timestamp', entry.timestamp);

      entriesArray.push([entryMap]);
      yjsSystem.journalMap.set('lastModified', Date.now());
    }

    // Clear form
    titleInput.value = '';
    contentInput.value = '';
    
    // Update UI and focus
    updateUI();
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
    addBtn.addEventListener('click', addEntry);
  }
  
  // Form submission
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addEntry();
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
    // Initialize YJS system
    await createSystem();
    
    // Load initial state
    loadStateFromYjs();
    
    // Setup YJS update listener
    const yjsSystem = getSystem();
    if (yjsSystem?.ydoc) {
      yjsSystem.ydoc.on('update', () => {
        console.log('YJS document updated - refreshing UI');
        updateUI();
      });
    }
    
    // Setup event handlers
    setupEventHandlers();
    
    // Initial UI render
    updateUI();
    
    // Display AI prompt if container exists
    if (document.getElementById('ai-prompt-container')) {
      displayAIPrompt();
    }
    
    console.log('D&D Journal initialized');
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
  setupEventHandlers
};