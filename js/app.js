// D&D Journal - Simple & Functional with In-Place Editing

// Get utils reference - works in both browser and test environment
const getUtils = () => {
  if (typeof window !== 'undefined' && window.Utils) return window.Utils;
  if (typeof global !== 'undefined' && global.Utils) return global.Utils;
  try {
    return require('./utils.js');
  } catch (e) {
    try {
      return require('../js/utils.js');
    } catch (e2) {
      // Fallback to inline implementations for tests
      return {
        createInitialJournalState: () => ({
          character: { name: '', race: '', class: '', backstory: '', notes: '' },
          entries: []
        }),
        safeGetFromStorage: (key) => {
          try {
            const stored = localStorage.getItem(key);
            return stored ? { success: true, data: JSON.parse(stored) } : { success: true, data: null };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        safeSetToStorage: (key, data) => {
          try {
            localStorage.setItem(key, JSON.stringify(data));
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        STORAGE_KEYS: {
          JOURNAL: 'simple-dnd-journal',
          SETTINGS: 'simple-dnd-journal-settings',
          SUMMARIES: 'simple-dnd-journal-summaries',
          META_SUMMARIES: 'simple-dnd-journal-meta-summaries'
        },
        generateId: () => Date.now().toString(),
        formatDate: (timestamp) => new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        sortEntriesByDate: (entries) => [...entries].sort((a, b) => b.timestamp - a.timestamp),
        isValidEntry: (entryData) => entryData.title.trim().length > 0 && entryData.content.trim().length > 0
      };
    }
  }
};

const utils = getUtils();

// Simple state management
let state = utils.createInitialJournalState();

// Initialize Yjs sync enhancement (ADR-0003)
let yjsSync = null;
try {
  yjsSync = new YjsSync();
} catch (e) {
  console.log('📱 Yjs sync not available, using localStorage-only mode');
}

// Load state from localStorage - using utils
const loadData = () => {
  const result = utils.safeGetFromStorage(utils.STORAGE_KEYS.JOURNAL);
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
        console.log('🔄 Loading newer data from sync');
        state = { ...state, ...syncData };
        utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state);
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
  // Primary storage (ADR-0004)
  utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state);
  
  // Sync enhancement (ADR-0003)
  if (yjsSync && yjsSync.isAvailable) {
    state.lastModified = Date.now();
    yjsSync.setData(state);
  }
};

// Create entry element with edit functionality
const createEntryElement = (entry) => {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'entry-card';
  entryDiv.dataset.entryId = entry.id;
  
  // Create view mode elements
  const titleDiv = document.createElement('div');
  titleDiv.className = 'entry-title';
  titleDiv.textContent = entry.title;
  
  const dateDiv = document.createElement('div');
  dateDiv.className = 'entry-date';
  dateDiv.textContent = utils.formatDate(entry.timestamp);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-content';
  contentDiv.textContent = entry.content;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'entry-actions';
  
  const editButton = document.createElement('button');
  editButton.className = 'button button--secondary button--small';
  editButton.textContent = 'Edit';
  editButton.onclick = () => enableEditMode(entryDiv, entry);
  
  actionsDiv.appendChild(editButton);
  
  entryDiv.appendChild(titleDiv);
  entryDiv.appendChild(dateDiv);
  entryDiv.appendChild(contentDiv);
  entryDiv.appendChild(actionsDiv);
  
  // Add image if present
  if (entry.image && entry.image.trim()) {
    const imageElement = document.createElement('img');
    imageElement.className = 'entry-image';
    imageElement.src = entry.image;
    imageElement.alt = entry.title;
    imageElement.onerror = () => {
      imageElement.style.display = 'none';
    };
    entryDiv.appendChild(imageElement);
  }
  
  return entryDiv;
};

// Enable edit mode for an entry
const enableEditMode = (entryDiv, entry) => {
  const titleDiv = entryDiv.querySelector('.entry-title');
  const contentDiv = entryDiv.querySelector('.entry-content');
  const actionsDiv = entryDiv.querySelector('.entry-actions');
  
  // Create edit inputs
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'form-input';
  titleInput.value = entry.title;
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.className = 'form-input';
  contentTextarea.rows = 4;
  contentTextarea.value = entry.content;
  
  // Create save/cancel buttons
  const saveButton = document.createElement('button');
  saveButton.className = 'button button--small';
  saveButton.textContent = 'Save';
  saveButton.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'button button--secondary button--small';
  cancelButton.textContent = 'Cancel';
  cancelButton.onclick = () => cancelEdit(entryDiv, entry);
  
  // Replace content with edit form
  titleDiv.replaceWith(titleInput);
  contentDiv.replaceWith(contentTextarea);
  
  // Update actions
  actionsDiv.innerHTML = '';
  actionsDiv.appendChild(saveButton);
  actionsDiv.appendChild(cancelButton);
  
  // Focus on title input
  titleInput.focus();
};

// Save edit changes
const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  const title = newTitle.trim();
  const content = newContent.trim();
  
  if (!title || !content) return;
  
  // Update entry data
  entry.title = title;
  entry.content = content;
  entry.timestamp = Date.now(); // Update timestamp to show it was edited
  
  // Save to storage
  saveData();
  
  // Re-render the entry
  const newEntryElement = createEntryElement(entry);
  entryDiv.replaceWith(newEntryElement);
};

// Cancel edit and restore original view
const cancelEdit = (entryDiv, entry) => {
  const newEntryElement = createEntryElement(entry);
  entryDiv.replaceWith(newEntryElement);
};



// Pure function to create empty state element
const createEmptyStateElement = () => {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.textContent = 'No entries yet. Add your first adventure above!';
  return div;
};

// Render entries - more functional approach
const renderEntries = () => {
  const entriesContainer = document.getElementById('entries-list');
  if (!entriesContainer) return;
  
  if (state.entries.length === 0) {
    entriesContainer.replaceChildren(createEmptyStateElement());
    return;
  }
  
  // Functional approach to rendering
  const sortedEntries = utils.sortEntriesByDate(state.entries);
  const entryElements = sortedEntries.map(createEntryElement);
  
  entriesContainer.replaceChildren(...entryElements);
};

// Pure function to create entry from form data
const createEntryFromForm = (formData) => ({
  id: utils.generateId(),
  title: formData.title.trim(),
  content: formData.content.trim(),
  image: formData.image.trim(),
  timestamp: Date.now()
});

// Pure function to get form data
const getFormData = () => {
  const titleElement = document.getElementById('entry-title');
  const contentElement = document.getElementById('entry-content');
  const imageElement = document.getElementById('entry-image');
  
  return {
    title: titleElement ? titleElement.value : '',
    content: contentElement ? contentElement.value : '',
    image: imageElement ? imageElement.value : ''
  };
};

// Add new entry - functional approach
const addEntry = async () => {
  const formData = getFormData();
  
  if (!utils.isValidEntry(formData)) return;
  
  const newEntry = createEntryFromForm(formData);
  
  // Add to state immutably - functional approach
  state = {
    ...state,
    entries: [...state.entries, newEntry]
  };
  
  // Update global state reference for tests
  if (typeof global !== 'undefined') {
    global.state = state;
  }
  
  saveData();
  renderEntries();
  clearEntryForm();
  focusEntryTitle();
  
  // Generate summary for the new entry if AI is enabled
  if (window.AI && window.AI.isAIEnabled()) {
    try {
      await window.AI.getEntrySummary(newEntry);
    } catch (error) {
      console.error('Failed to generate summary for new entry:', error);
    }
  }
  
  // Refresh AI prompt after adding new entry
  await displayAIPrompt();
};

// Pure function to clear entry form
const clearEntryForm = () => {
  const formFields = ['entry-title', 'entry-content', 'entry-image'];
  formFields.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });
};

// Pure function to focus on entry title
const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) titleInput.focus();
};

// Pure function to create character summary data
const createCharacterSummary = (character) => {
  if (!character.name && !character.race && !character.class) {
    return {
      name: 'No character created yet',
      details: 'Click "View Details" to create your character'
    };
  }
  
  // Functional approach - filter and map instead of push
  const details = [character.race, character.class]
    .filter(detail => detail && detail.trim())
    .join(' • ');
  
  return {
    name: character.name || 'Unnamed Character',
    details: details || 'Click "View Details" to add more information'
  };
};

// Display character summary on main page
const displayCharacterSummary = () => {
  const nameElement = document.getElementById('summary-name');
  const detailsElement = document.getElementById('summary-details');
  
  if (!nameElement || !detailsElement) return;
  
  const summary = createCharacterSummary(state.character);
  nameElement.textContent = summary.name;
  detailsElement.textContent = summary.details;
};

// Display AI introspection prompt
const displayAIPrompt = async () => {
  const promptSection = document.getElementById('ai-prompt-section');
  const promptText = document.getElementById('ai-prompt-text');
  
  if (!promptSection || !promptText) return;
  
  // Check if AI features are enabled
  if (!window.AI || !window.AI.isAIEnabled()) {
    promptSection.style.display = 'none';
    return;
  }
  
  // Show the section
  promptSection.style.display = 'block';
  
  try {
    // Generate introspection prompt
    const prompt = await window.AI.generateIntrospectionPrompt(state.character, state.entries);
    
    if (prompt) {
      promptText.textContent = prompt;
      promptText.classList.remove('loading');
    } else {
      promptSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to generate AI prompt:', error);
    promptSection.style.display = 'none';
  }
};

// Setup event handlers for journal entries
const setupEventHandlers = () => {
  // Entry inputs - manual save via button
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const addEntryBtn = document.getElementById('add-entry-btn');
  
  if (titleInput && contentInput) {
    // Add entry on Enter in title field
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentInput.focus();
      }
    });
    
    // Add entry on Enter in content field
    contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        addEntry();
      }
    });
  }
  
  // Add entry button click handler
  if (addEntryBtn) {
    addEntryBtn.addEventListener('click', addEntry);
  }
};

// Setup remote change listener for sync (ADR-0003)
const setupSyncListener = () => {
  if (yjsSync && yjsSync.isAvailable) {
    yjsSync.onChange((remoteData) => {
      const localTime = state.lastModified || 0;
      const remoteTime = remoteData.lastModified || 0;
      
      // Only update if remote data is newer
      if (remoteTime > localTime && JSON.stringify(remoteData) !== JSON.stringify(state)) {
        console.log('🔄 Applying remote changes');
        state = { ...state, ...remoteData };
        utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state);
        
        // Refresh the UI to show new data
        displayCharacterSummary();
        renderEntries();
      }
    });
  }
};

// Initialize app
const init = async () => {
  loadData();
  setupSyncListener();
  displayCharacterSummary();
  renderEntries();
  setupEventHandlers();
  
  // Initialize summarization in background
  if (window.Summarization) {
    setTimeout(async () => {
      await window.Summarization.initializeSummarization();
    }, 1000); // Delay to not block initial load
  }
  
  // Display AI prompt after everything else is loaded
  await displayAIPrompt();
  
  // Focus on entry title
  const titleInput = document.getElementById('entry-title');
  if (titleInput) {
    titleInput.focus();
  }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export functions for testing (only in test environment)
if (typeof global !== 'undefined') {
  global.state = state;
  global.loadData = loadData;
  global.saveData = saveData;
  global.createEntryElement = createEntryElement;
  global.enableEditMode = enableEditMode;
  global.saveEdit = saveEdit;
  global.cancelEdit = cancelEdit;
  global.renderEntries = renderEntries;
  global.addEntry = addEntry;
  global.createCharacterSummary = createCharacterSummary;
  global.displayCharacterSummary = displayCharacterSummary;
  global.displayAIPrompt = displayAIPrompt;
  global.init = init;
}