// Character Page - Simple & Functional

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
      // Fallback for tests - minimal implementation
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
        getCharacterFormFieldIds: () => ['character-name', 'character-race', 'character-class', 'character-backstory', 'character-notes'],
        getPropertyNameFromFieldId: (fieldId) => fieldId.replace('character-', ''),
        debounce: (fn, delay) => {
          let timeoutId;
          return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
          };
        }
      };
    }
  }
};

const utils = getUtils();

// Pure function to load character data from localStorage
const loadCharacterData = () => {
  const result = utils.safeGetFromStorage(utils.STORAGE_KEYS.JOURNAL);
  if (!result.success || !result.data) {
    return utils.createInitialJournalState().character;
  }
  
  return result.data.character || utils.createInitialJournalState().character;
};

// Pure function to save character data to localStorage
const saveCharacterData = (characterData) => {
  const result = utils.safeGetFromStorage(utils.STORAGE_KEYS.JOURNAL);
  const currentData = result.success && result.data ? result.data : utils.createInitialJournalState();
  
  const updatedData = {
    ...currentData,
    character: characterData
  };
  
  return utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, updatedData);
};



// Pure function to get character data from form
const getCharacterFromForm = () => 
  utils.getCharacterFormFieldIds().reduce((character, fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = utils.getPropertyNameFromFieldId(fieldId);
      character[propertyName] = element.value.trim();
    }
    return character;
  }, utils.createInitialJournalState().character);

// Pure function to populate form with character data
const populateForm = (character) => {
  utils.getCharacterFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = utils.getPropertyNameFromFieldId(fieldId);
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
  const debouncedAutoSave = utils.debounce(autoSave, 500);
  
  utils.getCharacterFormFieldIds().forEach(fieldId => {
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
  global.loadCharacterData = loadCharacterData;
  global.saveCharacterData = saveCharacterData;
  global.getCharacterFromForm = getCharacterFromForm;
  global.populateForm = populateForm;
}
