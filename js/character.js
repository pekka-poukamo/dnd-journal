// Character Page - Simple & Functional

import { 
  safeGetFromStorage, 
  safeSetToStorage, 
  createInitialJournalState, 
  STORAGE_KEYS, 
  getCharacterFormFieldIds, 
  getPropertyNameFromFieldId, 
  debounce 
} from './utils.js';

// Pure function to load character data from localStorage
export const loadCharacterData = () => {
  const result = safeGetFromStorage(STORAGE_KEYS.JOURNAL);
  if (!result.success || !result.data) {
    return createInitialJournalState().character;
  }
  
  return result.data.character || createInitialJournalState().character;
};

// Pure function to save character data to localStorage
export const saveCharacterData = (characterData) => {
  const result = safeGetFromStorage(STORAGE_KEYS.JOURNAL);
  const currentData = result.success && result.data ? result.data : createInitialJournalState();
  
  const updatedData = {
    ...currentData,
    character: characterData
  };
  
  return safeSetToStorage(STORAGE_KEYS.JOURNAL, updatedData);
};

// Pure function to get character data from form
export const getCharacterFromForm = () => 
  getCharacterFormFieldIds().reduce((character, fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyNameFromFieldId(fieldId);
      character[propertyName] = element.value.trim();
    }
    return character;
  }, createInitialJournalState().character);

// Pure function to populate form with character data
export const populateForm = (character) => {
  getCharacterFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyNameFromFieldId(fieldId);
      element.value = character[propertyName] || '';
    }
  });
};

// Function to auto-save character data
const autoSave = () => {
  const character = getCharacterFromForm();
  saveCharacterData(character);
};

// Setup auto-save with debouncing
const setupAutoSave = () => {
  const debouncedAutoSave = debounce(autoSave, 500);
  
  getCharacterFormFieldIds().forEach(fieldId => {
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
