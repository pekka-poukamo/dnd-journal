// Character Page - Simple & Functional
const STORAGE_KEY = 'simple-dnd-journal';

// Pure function for creating initial character state
const createInitialCharacterState = () => ({
  name: '',
  race: '',
  class: '',
  backstory: '',
  notes: ''
});

// Pure function for safe JSON parsing
const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function to load character data from localStorage
const loadCharacterData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createInitialCharacterState();
  
  const parseResult = safeParseJSON(stored);
  if (!parseResult.success) return createInitialCharacterState();
  
  return parseResult.data.character || createInitialCharacterState();
};

// Pure function to save character data to localStorage
const saveCharacterData = (characterData) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentData = stored ? safeParseJSON(stored).data : {};
    
    const updatedData = {
      character: createInitialCharacterState(),
      entries: [],
      ...currentData,
      character: characterData
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function to get form field IDs
const getFormFieldIds = () => [
  'character-name', 
  'character-race', 
  'character-class',
  'character-backstory', 
  'character-notes'
];

// Pure function to convert field ID to property name
const getPropertyName = (fieldId) => fieldId.replace('character-', '');

// Pure function to get character data from form
const getCharacterFromForm = () => 
  getFormFieldIds().reduce((character, fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyName(fieldId);
      character[propertyName] = element.value.trim();
    }
    return character;
  }, createInitialCharacterState());

// Pure function to populate form with character data
const populateForm = (character) => {
  getFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyName(fieldId);
      element.value = character[propertyName] || '';
    }
  });
};

// Pure function to create debounced function
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Function to auto-save character data
const autoSave = () => {
  const character = getCharacterFromForm();
  saveCharacterData(character);
};

// Setup auto-save with debouncing
const setupAutoSave = () => {
  const debouncedAutoSave = debounce(autoSave, 500);
  
  getFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener('input', debouncedAutoSave);
      element.addEventListener('blur', autoSave);
    }
  });
};

// Setup keyboard shortcuts
const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      autoSave();
    }
    
    if (e.key === 'Escape') {
      window.location.href = 'index.html';
    }
  });
};

// Initialize character page
const init = () => {
  const character = loadCharacterData();
  populateForm(character);
  setupAutoSave();
  setupKeyboardShortcuts();
  
  const nameInput = document.getElementById('character-name');
  if (nameInput && !character.name) {
    nameInput.focus();
  }
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Export for testing
if (typeof global !== 'undefined') {
  global.createInitialCharacterState = createInitialCharacterState;
  global.safeParseJSON = safeParseJSON;
  global.loadCharacterData = loadCharacterData;
  global.saveCharacterData = saveCharacterData;
  global.getCharacterFromForm = getCharacterFromForm;
  global.populateForm = populateForm;
  global.debounce = debounce;
}
