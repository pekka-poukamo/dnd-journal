// D&D Journal - Simple & Functional with In-Place Editing

import { 
  safeGetFromStorage, 
  safeSetToStorage, 
  createInitialJournalState, 
  STORAGE_KEYS, 
  generateId, 
  formatDate, 
  sortEntriesByDate, 
  isValidEntry 
} from './utils.js';

import { generateIntrospectionPrompt } from './ai.js';
import { createYjsSync } from './sync.js';

// Simple state management
let state = createInitialJournalState();

// Initialize Yjs sync enhancement (ADR-0003)
let yjsSync = null;
try {
  yjsSync = createYjsSync();
} catch (e) {
      // Yjs sync not available, using localStorage-only mode
}

// Load state from localStorage - using utils
export const loadData = () => {
  const result = safeGetFromStorage(STORAGE_KEYS.JOURNAL);
  if (result.success && result.data) {
    state = { ...state, ...result.data };
    // Update global state reference for tests
    if (typeof global !== 'undefined') {
      global.state = state;
    }
  }
  
  // Initialize Yjs with current localStorage data (ADR-0003)
  if (yjsSync && yjsSync.isAvailable) {
    const syncData = yjsSync.getData();
    if (syncData) {
      // Merge remote data if available and newer
      const localTime = state.lastModified || 0;
      const remoteTime = syncData.lastModified || 0;
      
      if (remoteTime > localTime) {
        // Loading newer data from sync
        state = { ...state, ...syncData };
        safeSetToStorage(STORAGE_KEYS.JOURNAL, state);
      } else {
        // Upload current data to sync
        yjsSync.setData(state);
      }
    } else {
      // First time - upload current localStorage data
      yjsSync.setData(state);
    }
  }
};

// Save state to localStorage and sync - enhanced for ADR-0003
export const saveData = () => {
  state.lastModified = Date.now();
  const result = safeSetToStorage(STORAGE_KEYS.JOURNAL, state);
  
  // Update sync if available
  if (yjsSync && yjsSync.isAvailable) {
    yjsSync.setData(state);
  }
  
  return result;
};

// Get entry summary from AI if available
export const getEntrySummary = (entryId) => {
  if (window.AI && window.AI.isAIEnabled()) {
    const entry = state.entries.find(e => e.id === entryId);
    if (entry) {
      return window.AI.getEntrySummary(entry);
    }
  }
  return null;
};

// Create DOM element for an entry
export const createEntryElement = (entry) => {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'entry';
  entryDiv.dataset.entryId = entry.id;
  
  const header = document.createElement('div');
  header.className = 'entry-header';
  
  const title = document.createElement('h3');
  title.className = 'entry-title';
  title.textContent = entry.title;
  
  const date = document.createElement('span');
  date.className = 'entry-date';
  date.textContent = formatDate(entry.timestamp);
  
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.onclick = () => enableEditMode(entryDiv, entry);
  
  header.appendChild(title);
  header.appendChild(date);
  header.appendChild(editBtn);
  
  const content = document.createElement('div');
  content.className = 'entry-content';
  content.textContent = entry.content;
  
  entryDiv.appendChild(header);
  entryDiv.appendChild(content);
  
  return entryDiv;
};

// Enable edit mode for an entry
export const enableEditMode = (entryDiv, entry) => {
  const title = entryDiv.querySelector('.entry-title');
  const content = entryDiv.querySelector('.entry-content');
  const editBtn = entryDiv.querySelector('.edit-btn');
  
  // Create edit form
  const editForm = document.createElement('div');
  editForm.className = 'edit-form';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = entry.title;
  titleInput.className = 'edit-title-input';
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.value = entry.content;
  contentTextarea.className = 'edit-content-textarea';
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => cancelEdit(entryDiv, entry);
  
  editForm.appendChild(titleInput);
  editForm.appendChild(contentTextarea);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);
  
  // Replace content with edit form
  title.style.display = 'none';
  content.style.display = 'none';
  editBtn.style.display = 'none';
  
  entryDiv.appendChild(editForm);
  
  // Focus on title input
  titleInput.focus();
};

// Save edit changes
export const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  if (newTitle.trim() && newContent.trim()) {
    entry.title = newTitle.trim();
    entry.content = newContent.trim();
    entry.timestamp = Date.now();
    
    // Remove edit form and restore display
    const editForm = entryDiv.querySelector('.edit-form');
    if (editForm) {
      editForm.remove();
    }
    
    const title = entryDiv.querySelector('.entry-title');
    const content = entryDiv.querySelector('.entry-content');
    const editBtn = entryDiv.querySelector('.edit-btn');
    
    title.textContent = entry.title;
    title.style.display = '';
    content.textContent = entry.content;
    content.style.display = '';
    editBtn.style.display = '';
    
    saveData();
  }
};

// Cancel edit mode
export const cancelEdit = (entryDiv, entry) => {
  const editForm = entryDiv.querySelector('.edit-form');
  if (editForm) {
    editForm.remove();
  }
  
  const title = entryDiv.querySelector('.entry-title');
  const content = entryDiv.querySelector('.entry-content');
  const editBtn = entryDiv.querySelector('.edit-btn');
  
  title.style.display = '';
  content.style.display = '';
  editBtn.style.display = '';
};

// Create empty state element
export const createEmptyStateElement = () => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.innerHTML = '<p>No journal entries yet. Start writing your adventure!</p>';
  return emptyDiv;
};

// Render all entries
export const renderEntries = () => {
  const entriesList = document.getElementById('entries-list');
  if (!entriesList) return;
  
  entriesList.innerHTML = '';
  
  if (state.entries.length === 0) {
    entriesList.appendChild(createEmptyStateElement());
    return;
  }
  
  const sortedEntries = sortEntriesByDate(state.entries);
  sortedEntries.forEach(entry => {
    const entryElement = createEntryElement(entry);
    entriesList.appendChild(entryElement);
  });
};

// Create entry from form data
export const createEntryFromForm = (formData) => ({
  id: generateId(),
  title: formData.title.trim(),
  content: formData.content.trim(),
  timestamp: Date.now()
});

// Get form data
export const getFormData = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  return {
    title: titleInput ? titleInput.value : '',
    content: contentTextarea ? contentTextarea.value : ''
  };
};

// Add new entry
export const addEntry = async () => {
  const formData = getFormData();
  
  if (!formData.title.trim() || !formData.content.trim()) {
    alert('Please fill in both title and content.');
    return;
  }
  
  const entry = createEntryFromForm(formData);
  
  if (isValidEntry(entry)) {
    state.entries.push(entry);
    saveData();
    renderEntries();
    clearEntryForm();
    focusEntryTitle();
    
    // Generate AI summary if available
    if (window.AI && window.AI.isAIEnabled()) {
      try {
        await window.AI.generateEntrySummary(entry);
      } catch (error) {
        console.error('Failed to generate entry summary:', error);
      }
    }
  }
};

// Clear entry form
export const clearEntryForm = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  if (titleInput) titleInput.value = '';
  if (contentTextarea) contentTextarea.value = '';
};

// Focus on entry title input
export const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) {
    titleInput.focus();
  }
};

// Create character summary
export const createCharacterSummary = (character) => {
  if (!character || !character.name) {
    return {
      name: 'No Character',
      details: 'Create a character to see details here.'
    };
  }
  
  const details = [];
  if (character.race) details.push(`Race: ${character.race}`);
  if (character.class) details.push(`Class: ${character.class}`);
  if (character.backstory) details.push(`Backstory: ${character.backstory}`);
  if (character.notes) details.push(`Notes: ${character.notes}`);
  
  return {
    name: character.name,
    details: details.join(' | ')
  };
};

// Display character summary
export const displayCharacterSummary = () => {
  const characterSummary = document.getElementById('character-summary');
  if (!characterSummary) return;
  
  const summary = createCharacterSummary(state.character);
  characterSummary.innerHTML = `
    <h3>${summary.name}</h3>
    <p>${summary.details}</p>
  `;
};

// Display AI prompt
export const displayAIPrompt = async () => {
  const aiPromptText = document.getElementById('ai-prompt-text');
  if (!aiPromptText) return;
  
  try {
    const prompt = await generateIntrospectionPrompt(state.character, state.entries);
    if (prompt) {
      aiPromptText.innerHTML = formatAIPrompt(prompt);
    }
  } catch (error) {
    console.error('Failed to generate AI prompt:', error);
    aiPromptText.innerHTML = '<p>Unable to generate AI prompt at this time.</p>';
  }
};

// Regenerate AI prompt
export const regenerateAIPrompt = async () => {
  const aiPromptText = document.getElementById('ai-prompt-text');
  const regenerateBtn = document.getElementById('regenerate-prompt-btn');
  
  if (!aiPromptText || !regenerateBtn) return;
  
  try {
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = 'Generating...';
    
    const prompt = await generateIntrospectionPrompt(state.character, state.entries);
    
    if (prompt) {
      aiPromptText.innerHTML = formatAIPrompt(prompt);
    }
  } catch (error) {
    console.error('Failed to regenerate AI prompt:', error);
  } finally {
    regenerateBtn.disabled = false;
    regenerateBtn.textContent = 'Regenerate';
  }
};

// Format AI prompt for display
export const formatAIPrompt = (prompt) => {
  return prompt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');
};

// Setup event handlers
export const setupEventHandlers = () => {
  const addEntryBtn = document.getElementById('add-entry-btn');
  if (addEntryBtn) {
    addEntryBtn.addEventListener('click', addEntry);
  }
  
  const regeneratePromptBtn = document.getElementById('regenerate-prompt-btn');
  if (regeneratePromptBtn) {
    regeneratePromptBtn.addEventListener('click', regenerateAIPrompt);
  }
  
  // Enter key to add entry
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  const handleEnterKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addEntry();
    }
  };
  
  if (titleInput) titleInput.addEventListener('keydown', handleEnterKey);
  if (contentTextarea) contentTextarea.addEventListener('keydown', handleEnterKey);
};

// Setup sync listener for real-time updates
export const setupSyncListener = () => {
  if (yjsSync && yjsSync.isAvailable) {
    yjsSync.onUpdate(() => {
      // Reload data from sync
      const syncData = yjsSync.getData();
      if (syncData) {
        state = { ...state, ...syncData };
        renderEntries();
        displayCharacterSummary();
      }
    });
  }
};

// Initialize app
export const init = async () => {
  loadData();
  renderEntries();
  displayCharacterSummary();
  setupEventHandlers();
  setupSyncListener();
  
  // Initialize summarization if available
  if (window.Summarization) {
    try {
      await window.Summarization.initializeSummarization();
    } catch (error) {
      console.error('Failed to initialize summarization:', error);
    }
  }
  
  // Display AI prompt
  await displayAIPrompt();
};

// Reset state to initial values (for testing)
export const resetState = () => {
  state = createInitialJournalState();
  // Update global state reference for tests
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};

// Export state for testing
export { state };

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for testing (backward compatibility)
if (typeof global !== 'undefined') {
  global.loadData = loadData;
  global.saveData = saveData;
  global.state = state;
  global.resetState = resetState;
}