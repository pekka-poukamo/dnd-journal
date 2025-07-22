// D&D Journal - Simple & Functional with In-Place Editing
const STORAGE_KEY = 'simple-dnd-journal';

// Initialize OpenAI service
let openAIService = null;

// Pure function for creating initial state
const createInitialState = () => ({
  character: {
    name: '',
    race: '',
    class: ''
  },
  entries: []
});

// Simple state management
let state = createInitialState();

// Pure function for safe JSON parsing
const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Load state from localStorage - now more functional
const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parseResult = safeParseJSON(stored);
      if (parseResult.success) {
        state = { ...state, ...parseResult.data };
      }
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// Save state to localStorage - pure function approach
const saveData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

// Generate simple ID
const generateId = () => Date.now().toString();

// Format date simply
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  dateDiv.textContent = formatDate(entry.timestamp);
  
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

// Pure function to sort entries by newest first
const sortEntriesByDate = (entries) => 
  [...entries].sort((a, b) => b.timestamp - a.timestamp);

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
  const sortedEntries = sortEntriesByDate(state.entries);
  const entryElements = sortedEntries.map(createEntryElement);
  
  entriesContainer.replaceChildren(...entryElements);
};

// Pure function to create entry from form data
const createEntryFromForm = (formData) => ({
  id: generateId(),
  title: formData.title.trim(),
  content: formData.content.trim(),
  image: formData.image.trim(),
  timestamp: Date.now()
});

// Pure function to validate entry data
const isValidEntry = (entryData) => 
  entryData.title.trim().length > 0 && entryData.content.trim().length > 0;

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

// Add new entry - now more functional
const addEntry = () => {
  const formData = getFormData();
  
  if (!isValidEntry(formData)) return;
  
  const newEntry = createEntryFromForm(formData);
  
  // Add to state (keeping mutation for now to maintain test compatibility)
  state.entries.push(newEntry);
  
  saveData();
  renderEntries();
  clearEntryForm();
  focusEntryTitle();
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

// Pure function to get character form data
const getCharacterFormData = () => {
  const nameElement = document.getElementById('character-name');
  const raceElement = document.getElementById('character-race');
  const classElement = document.getElementById('character-class');
  
  return {
    name: nameElement ? nameElement.value.trim() : '',
    race: raceElement ? raceElement.value.trim() : '',
    class: classElement ? classElement.value.trim() : ''
  };
};

// Update character - now with immutable state update
const updateCharacter = () => {
  const characterData = getCharacterFormData();
  
  // Update state (keeping mutation for now to maintain test compatibility)  
  state.character = characterData;
  
  saveData();
};

// Setup auto-updating inputs for character only
const setupAutoUpdates = () => {
  // Character inputs - auto-save on input
  const characterInputs = ['character-name', 'character-race', 'character-class'];
  characterInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', updateCharacter);
    }
  });
  
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

// Populate character form
const populateCharacterForm = () => {
  const nameInput = document.getElementById('character-name');
  const raceInput = document.getElementById('character-race');
  const classInput = document.getElementById('character-class');
  
  if (nameInput) nameInput.value = state.character.name || '';
  if (raceInput) raceInput.value = state.character.race || '';
  if (classInput) classInput.value = state.character.class || '';
};

// Initialize app
const init = () => {
  loadData();
  populateCharacterForm();
  renderEntries();
  setupAutoUpdates();
  
  // Focus on character name if empty, otherwise focus on entry title
  const nameInput = document.getElementById('character-name');
  const titleInput = document.getElementById('entry-title');
  
  if (nameInput && !state.character.name) {
    nameInput.focus();
  } else if (titleInput) {
    titleInput.focus();
  }
};

// AI Functionality
let currentPromptType = null;

// Initialize OpenAI service
const initAI = () => {
  if (typeof OpenAIService !== 'undefined') {
    openAIService = new OpenAIService();
    updateAIUI();
  }
};

// Update AI UI based on configuration
const updateAIUI = () => {
  const apiWarning = document.getElementById('api-key-warning');
  const promptButtons = document.querySelectorAll('.prompt-buttons button');
  
  if (openAIService && openAIService.isConfigured()) {
    if (apiWarning) apiWarning.style.display = 'none';
    promptButtons.forEach(btn => btn.disabled = false);
  } else {
    if (apiWarning) apiWarning.style.display = 'block';
    promptButtons.forEach(btn => btn.disabled = true);
  }
};

// Settings Modal Functions
const openSettingsModal = () => {
  const modal = document.getElementById('settings-modal');
  const apiKeyInput = document.getElementById('openai-api-key');
  const modelSelect = document.getElementById('ai-model');
  
  if (modal) modal.style.display = 'flex';
  
  // Populate current settings
  if (openAIService) {
    if (apiKeyInput) apiKeyInput.value = openAIService.apiKey || '';
    if (modelSelect) modelSelect.value = openAIService.model || 'gpt-3.5-turbo';
    
    // Update cache statistics
    updateCacheStats();
  }
};

// Update cache statistics display
const updateCacheStats = () => {
  const cacheStatsDiv = document.getElementById('cache-stats');
  if (!cacheStatsDiv || !openAIService) return;
  
  const stats = openAIService.getCacheStats();
  const sizeKB = Math.round(stats.cacheSize / 1024 * 100) / 100;
  
  cacheStatsDiv.innerHTML = `
    <div class="cache-stat-item">
      <span>Individual Summaries:</span>
      <span>${stats.individualSummaries}</span>
    </div>
    <div class="cache-stat-item">
      <span>Group Summaries:</span>
      <span>${stats.groupSummaries}</span>
    </div>
    <div class="cache-stat-item">
      <span>Total Cached:</span>
      <span>${stats.totalEntries}</span>
    </div>
    <div class="cache-stat-item">
      <span>Cache Size:</span>
      <span>${sizeKB} KB</span>
    </div>
  `;
};

// Clear summary cache
const clearSummaryCache = () => {
  if (!openAIService) return;
  
  if (confirm('Are you sure you want to clear all cached summaries? This will require regenerating summaries on the next prompt request.')) {
    const success = openAIService.clearSummaryCache();
    if (success) {
      updateCacheStats();
      alert('Summary cache cleared successfully.');
    } else {
      alert('Failed to clear summary cache.');
    }
  }
};

const closeSettingsModal = () => {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.style.display = 'none';
};

const saveSettings = () => {
  const apiKeyInput = document.getElementById('openai-api-key');
  const modelSelect = document.getElementById('ai-model');
  
  if (openAIService && apiKeyInput && modelSelect) {
    openAIService.saveSettings(apiKeyInput.value.trim(), modelSelect.value);
    updateAIUI();
    closeSettingsModal();
  }
};

// AI Prompt Generation
const generatePrompt = async (type) => {
  if (!openAIService || !openAIService.isConfigured()) {
    alert('Please configure your OpenAI API key in Settings first.');
    return;
  }

  currentPromptType = type;
  const promptButtons = document.querySelectorAll('.prompt-buttons button');
  const resultDiv = document.getElementById('ai-prompt-result');
  const contentDiv = document.getElementById('prompt-content');

  // Disable buttons and show loading
  promptButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.id === `generate-${type}-btn`) {
      btn.textContent = 'Generating...';
    }
  });

  try {
    const prompt = await openAIService.generatePrompt(type, state.character, state.entries);
    
    if (contentDiv) contentDiv.textContent = prompt;
    if (resultDiv) resultDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Error generating prompt:', error);
    alert(`Error generating prompt: ${error.message}`);
  } finally {
    // Re-enable buttons
    promptButtons.forEach(btn => {
      btn.disabled = false;
      if (btn.id === `generate-${type}-btn`) {
        const typeNames = {
          'introspective': 'Introspective',
          'action': 'Action',
          'surprise': 'Surprise'
        };
        btn.textContent = `Generate ${typeNames[type]} Prompt`;
      }
    });
  }
};

const regeneratePrompt = () => {
  if (currentPromptType) {
    generatePrompt(currentPromptType);
  }
};

const usePrompt = () => {
  const contentDiv = document.getElementById('prompt-content');
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  
  if (contentDiv && titleInput && contentInput) {
    const promptText = contentDiv.textContent;
    
    // Set title based on prompt type
    const titles = {
      'introspective': 'Character Reflection',
      'action': 'Critical Decision',
      'surprise': 'Unexpected Encounter'
    };
    
    titleInput.value = titles[currentPromptType] || 'AI Generated Prompt';
    contentInput.value = promptText;
    
    // Scroll to entry form
    document.getElementById('entry-title').scrollIntoView({ behavior: 'smooth' });
    contentInput.focus();
  }
};

// Setup AI event listeners
const setupAIEventListeners = () => {
  // Settings modal
  const settingsBtn = document.getElementById('settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings');
  const saveSettingsBtn = document.getElementById('save-settings');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  
  if (settingsBtn) settingsBtn.addEventListener('click', openSettingsModal);
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
  if (clearCacheBtn) clearCacheBtn.addEventListener('click', clearSummaryCache);

  // Close modal on background click
  const settingsModal = document.getElementById('settings-modal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsModal();
    });
  }

  // Prompt generation buttons
  const introspectiveBtn = document.getElementById('generate-introspective-btn');
  const actionBtn = document.getElementById('generate-action-btn');
  const surpriseBtn = document.getElementById('generate-surprise-btn');
  
  if (introspectiveBtn) introspectiveBtn.addEventListener('click', () => generatePrompt('introspective'));
  if (actionBtn) actionBtn.addEventListener('click', () => generatePrompt('action'));
  if (surpriseBtn) surpriseBtn.addEventListener('click', () => generatePrompt('surprise'));

  // Prompt actions
  const usePromptBtn = document.getElementById('use-prompt-btn');
  const regenerateBtn = document.getElementById('regenerate-prompt-btn');
  
  if (usePromptBtn) usePromptBtn.addEventListener('click', usePrompt);
  if (regenerateBtn) regenerateBtn.addEventListener('click', regeneratePrompt);
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  init();
  initAI();
  setupAIEventListeners();
});

// Export functions for testing (only in test environment)
if (typeof global !== 'undefined') {
  global.state = state;
  global.generateId = generateId;
  global.formatDate = formatDate;
  global.loadData = loadData;
  global.saveData = saveData;
  global.createEntryElement = createEntryElement;
  global.enableEditMode = enableEditMode;
  global.saveEdit = saveEdit;
  global.cancelEdit = cancelEdit;
  global.renderEntries = renderEntries;
  global.addEntry = addEntry;
  global.updateCharacter = updateCharacter;
  global.populateCharacterForm = populateCharacterForm;
  global.init = init;
  global.openAIService = openAIService;
}