// Character Page - Storytelling-focused Character Management
// Following functional programming patterns from style guide

const STORAGE_KEY = 'simple-dnd-journal';

// Pure function for creating initial character state (simplified for storytelling)
const createInitialCharacterState = () => ({
  // Basic info
  name: '',
  race: '',
  class: '',
  
  // Story elements
  concept: '',
  backstory: '',
  personality: '',
  goals: '',
  relationships: '',
  growth: '',
  abilities: '',
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

// Pure function to get all form field IDs (simplified)
const getFormFieldIds = () => [
  'character-name', 'character-race', 'character-class', 'character-concept',
  'character-backstory', 'character-personality', 'character-goals',
  'character-relationships', 'character-growth', 'character-abilities',
  'character-notes'
];

// Pure function to convert form field ID to character property name
const getPropertyName = (fieldId) => fieldId.replace('character-', '');

// Pure function to get current character data from form
const getCharacterFromForm = () => {
  const character = createInitialCharacterState();
  
  return getFormFieldIds().reduce((acc, fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyName(fieldId);
      acc[propertyName] = element.value.trim();
    }
    return acc;
  }, character);
};

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

// Pure function to create save indicator element
const createSaveIndicator = () => {
  const indicator = document.createElement('div');
  indicator.className = 'character-form__save-indicator';
  indicator.textContent = 'Saved';
  return indicator;
};

// Pure function to show save feedback
const showSaveIndicator = () => {
  // Remove any existing indicator
  const existing = document.querySelector('.character-form__save-indicator');
  if (existing) existing.remove();
  
  // Create and show new indicator
  const indicator = createSaveIndicator();
  document.body.appendChild(indicator);
  
  // Animate in
  setTimeout(() => {
    indicator.classList.add('character-form__save-indicator--visible');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    indicator.classList.remove('character-form__save-indicator--visible');
    setTimeout(() => {
      if (indicator.parentNode) indicator.remove();
    }, 300);
  }, 2000);
};

// Function to auto-save character data (with side effects)
const autoSave = () => {
  const character = getCharacterFromForm();
  const result = saveCharacterData(character);
  
  if (result.success) {
    showSaveIndicator();
  } else {
    console.error('Failed to save character:', result.error);
  }
};

// Pure function to create debounced function
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
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
  const handleKeydown = (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      autoSave();
    }
    
    // Escape to go back to journal
    if (e.key === 'Escape') {
      if (confirm('Return to journal? Any unsaved changes will be lost.')) {
        window.location.href = 'index.html';
      }
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
};

// Pure function to extract level from class field for summary
const extractLevel = (classText) => {
  const levelMatch = classText.match(/level\s*(\d+)/i);
  return levelMatch ? `Level ${levelMatch[1]}` : '';
};

// Pure function to extract race from race field for summary
const extractRace = (raceText) => {
  const parts = raceText.split(/\s+/);
  return parts[0] || raceText; // First word is usually the race
};

// Pure function to extract class from class field for summary
const extractClass = (classText) => {
  // Remove level information to get just the class
  return classText.replace(/level\s*\d+\s*/i, '').trim();
};

// Initialize character page
const init = () => {
  const character = loadCharacterData();
  populateForm(character);
  setupAutoSave();
  setupKeyboardShortcuts();
  
  // Focus on character name if empty
  const nameInput = document.getElementById('character-name');
  if (nameInput && !character.name) {
    nameInput.focus();
  }
  
  console.log('Character page initialized');
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
  global.extractLevel = extractLevel;
  global.extractRace = extractRace;
  global.extractClass = extractClass;
}
