// D&D Journal - Simple & Functional with In-Place Editing
const STORAGE_KEY = 'simple-dnd-journal';

// Pure function for creating initial state
const createInitialState = () => ({
  character: {
    // Basic info
    name: '',
    race: '',
    class: '',
    level: '',
    subclass: '',
    background: '',
    alignment: '',
    
    // Backstory
    backstory: '',
    goals: '',
    
    // Appearance
    age: '',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
    appearance: '',
    personality: '',
    
    // Stats
    str: '',
    dex: '',
    con: '',
    int: '',
    wis: '',
    cha: '',
    ac: '',
    hp: '',
    speed: '',
    
    // Equipment & Notes
    equipment: '',
    notes: ''
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

// Pure function to create character summary data
const createCharacterSummary = (character) => {
  if (!character.name && !character.race && !character.class) {
    return {
      name: 'No character created yet',
      details: 'Click "View Details" to create your character'
    };
  }
  
  const details = [];
  if (character.level) details.push(`Level ${character.level}`);
  if (character.race) details.push(character.race);
  if (character.class) details.push(character.class);
  
  return {
    name: character.name || 'Unnamed Character',
    details: details.join(' • ') || 'Click "View Details" to add more information'
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

// Initialize app
const init = () => {
  loadData();
  displayCharacterSummary();
  renderEntries();
  setupEventHandlers();
  
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
  global.createCharacterSummary = createCharacterSummary;
  global.displayCharacterSummary = displayCharacterSummary;
  global.init = init;
}