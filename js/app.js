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
const loadData = () => {
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
const saveData = () => {
  state.lastModified = Date.now();
  const result = safeSetToStorage(STORAGE_KEYS.JOURNAL, state);
  
  // Update sync if available
  if (yjsSync && yjsSync.isAvailable) {
    yjsSync.setData(state);
  }
  
  return result;
};

// Get entry summary from AI if available
const getEntrySummary = (entryId) => {
  if (window.AI && window.AI.isAIEnabled()) {
    const entry = state.entries.find(e => e.id === entryId);
    if (entry) {
      return window.AI.getEntrySummary(entry);
    }
  }
  return null;
};

// Create DOM element for an entry
const createEntryElement = (entry) => {
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
  
  const editButton = document.createElement('button');
  editButton.className = 'entry-edit-btn';
  editButton.textContent = 'Edit';
  editButton.onclick = () => enableEditMode(entryDiv, entry);
  
  header.appendChild(title);
  header.appendChild(date);
  header.appendChild(editButton);
  
  const content = document.createElement('div');
  content.className = 'entry-content';
  content.textContent = entry.content;
  
  entryDiv.appendChild(header);
  entryDiv.appendChild(content);
  
  return entryDiv;
};

// Enable edit mode for an entry
const enableEditMode = (entryDiv, entry) => {
  const header = entryDiv.querySelector('.entry-header');
  const content = entryDiv.querySelector('.entry-content');
  
  // Create edit form
  const editForm = document.createElement('div');
  editForm.className = 'entry-edit-form';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'entry-edit-title';
  titleInput.value = entry.title;
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.className = 'entry-edit-content';
  contentTextarea.value = entry.content;
  contentTextarea.rows = 4;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'entry-edit-buttons';
  
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.className = 'btn btn-primary btn-small';
  saveButton.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.className = 'btn btn-secondary btn-small';
  cancelButton.onclick = () => cancelEdit(entryDiv, entry);
  
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);
  
  editForm.appendChild(titleInput);
  editForm.appendChild(contentTextarea);
  editForm.appendChild(buttonContainer);
  
  // Replace content with edit form
  entryDiv.innerHTML = '';
  entryDiv.appendChild(editForm);
  
  titleInput.focus();
};

// Save edit changes
const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  if (!isValidEntry({ title: newTitle, content: newContent })) {
    alert('Title and content cannot be empty');
    return;
  }
  
  // Update entry
  const updatedEntry = { ...entry, title: newTitle.trim(), content: newContent.trim() };
  const entryIndex = state.entries.findIndex(e => e.id === entry.id);
  state.entries[entryIndex] = updatedEntry;
  
  // Save and re-render
  saveData();
  renderEntries();
};

// Cancel edit and restore original
const cancelEdit = (entryDiv, entry) => {
  renderEntries();
};

// Create empty state element
const createEmptyStateElement = () => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.innerHTML = '<p>No journal entries yet. Add your first entry above!</p>';
  return emptyDiv;
};

// Render all entries
const renderEntries = () => {
  const entriesList = document.getElementById('entries-list');
  if (!entriesList) return;
  
  entriesList.innerHTML = '';
  
  const sortedEntries = sortEntriesByDate(state.entries);
  
  if (sortedEntries.length === 0) {
    entriesList.appendChild(createEmptyStateElement());
  } else {
    sortedEntries.forEach(entry => {
      entriesList.appendChild(createEntryElement(entry));
    });
  }
};

// Create entry object from form data
const createEntryFromForm = (formData) => ({
  id: generateId(),
  title: formData.title.trim(),
  content: formData.content.trim(),
  timestamp: Date.now()
});

// Get form data
const getFormData = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  return {
    title: titleInput ? titleInput.value : '',
    content: contentTextarea ? contentTextarea.value : ''
  };
};

// Add new entry
const addEntry = async () => {
  const formData = getFormData();
  
  if (!isValidEntry(formData)) {
    alert('Please enter both title and content');
    return;
  }
  
  const newEntry = createEntryFromForm(formData);
  state.entries = [...state.entries, newEntry];
  
  saveData();
  clearEntryForm();
  renderEntries();
  focusEntryTitle();
  
  // Generate AI summary if available
  if (window.AI && window.AI.isAIEnabled()) {
    try {
      await window.AI.getEntrySummary(newEntry);
    } catch (error) {
      console.error('Failed to generate entry summary:', error);
    }
  }
  
  // Display AI introspection prompt
  await displayAIPrompt();
};

// Clear entry form
const clearEntryForm = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  if (titleInput) titleInput.value = '';
  if (contentTextarea) contentTextarea.value = '';
};

// Focus on title input
const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) titleInput.focus();
};

// Create character summary HTML
const createCharacterSummary = (character) => {
  return `
    <div class="character-summary__grid">
      <div class="character-summary__field">
        <label class="character-summary__label">Name</label>
        <span class="character-summary__value">${character.name || 'Unnamed Character'}</span>
      </div>
      <div class="character-summary__field">
        <label class="character-summary__label">Race</label>
        <span class="character-summary__value">${character.race || 'Unknown'}</span>
      </div>
      <div class="character-summary__field">
        <label class="character-summary__label">Class</label>
        <span class="character-summary__value">${character.class || 'Unknown'}</span>
      </div>
    </div>
  `;
};

// Display character summary
const displayCharacterSummary = () => {
  const characterSummary = document.getElementById('character-summary');
  if (!characterSummary) return;
  
  const content = characterSummary.querySelector('.character-summary__content');
  if (content) {
    content.innerHTML = createCharacterSummary(state.character);
  }
};

// Display AI introspection prompt
const displayAIPrompt = async () => {
  const aiPromptSection = document.getElementById('ai-prompt-section');
  const aiPromptText = document.getElementById('ai-prompt-text');
  
  if (!aiPromptSection || !aiPromptText) return;
  
  if (!window.AI || !window.AI.isAIEnabled()) {
    aiPromptSection.style.display = 'none';
    return;
  }
  
  try {
    aiPromptSection.style.display = 'block';
    aiPromptText.textContent = 'Generating your personalized reflection prompt...';
    
    const prompt = await generateIntrospectionPrompt(state.character, state.entries);
    
    if (prompt) {
      aiPromptText.innerHTML = formatAIPrompt(prompt);
    } else {
      aiPromptSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to display AI prompt:', error);
    aiPromptSection.style.display = 'none';
  }
};

// Regenerate AI introspection prompt
const regenerateAIPrompt = async () => {
  const aiPromptText = document.getElementById('ai-prompt-text');
  const regenerateBtn = document.getElementById('regenerate-prompt-btn');
  
  if (!aiPromptText || !regenerateBtn) return;
  
  if (!window.AI || !window.AI.isAIEnabled()) {
    return;
  }
  
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
const formatAIPrompt = (prompt) => {
  return prompt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');
};

// Setup event handlers
const setupEventHandlers = () => {
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
const setupSyncListener = () => {
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
const init = async () => {
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

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for testing
if (typeof global !== 'undefined') {
  global.loadData = loadData;
  global.saveData = saveData;
  global.state = state;
}