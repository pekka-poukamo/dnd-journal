// Character Page - Extended Character Management
const STORAGE_KEY = 'simple-dnd-journal';

// Extended character state structure
const createInitialCharacterState = () => ({
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
});

// Load character data from localStorage
const loadCharacterData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.character || createInitialCharacterState();
    }
  } catch (error) {
    console.error('Failed to load character data:', error);
  }
  return createInitialCharacterState();
};

// Save character data to localStorage
const saveCharacterData = (characterData) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let data = { character: createInitialCharacterState(), entries: [] };
    
    if (stored) {
      data = JSON.parse(stored);
    }
    
    data.character = characterData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save character data:', error);
  }
};

// Get all form field IDs
const getFormFieldIds = () => [
  'character-name', 'character-race', 'character-class', 'character-level',
  'character-subclass', 'character-background', 'character-alignment',
  'character-backstory', 'character-goals', 'character-age', 'character-height',
  'character-weight', 'character-eyes', 'character-hair', 'character-skin',
  'character-appearance', 'character-personality', 'character-str', 'character-dex',
  'character-con', 'character-int', 'character-wis', 'character-cha',
  'character-ac', 'character-hp', 'character-speed', 'character-equipment',
  'character-notes'
];

// Convert form field ID to character property name
const getPropertyName = (fieldId) => {
  return fieldId.replace('character-', '');
};

// Get current character data from form
const getCharacterFromForm = () => {
  const character = createInitialCharacterState();
  
  getFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyName(fieldId);
      character[propertyName] = element.value.trim();
    }
  });
  
  return character;
};

// Populate form with character data
const populateForm = (character) => {
  getFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      const propertyName = getPropertyName(fieldId);
      element.value = character[propertyName] || '';
    }
  });
};

// Auto-save character data
const autoSave = () => {
  const character = getCharacterFromForm();
  saveCharacterData(character);
  
  // Visual feedback for save
  showSaveIndicator();
};

// Show save indicator
const showSaveIndicator = () => {
  // Remove any existing indicator
  const existing = document.querySelector('.save-indicator');
  if (existing) {
    existing.remove();
  }
  
  // Create new save indicator
  const indicator = document.createElement('div');
  indicator.className = 'save-indicator';
  indicator.textContent = 'Saved';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--color-primary);
    color: white;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(indicator);
  
  // Animate in
  setTimeout(() => {
    indicator.style.opacity = '1';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.remove();
      }
    }, 300);
  }, 2000);
};

// Setup auto-save on all form inputs
const setupAutoSave = () => {
  getFormFieldIds().forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      // Add debounced auto-save
      let timeoutId;
      element.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(autoSave, 500); // Save 500ms after user stops typing
      });
      
      // Also save on blur (when user leaves the field)
      element.addEventListener('blur', autoSave);
    }
  });
};

// Calculate ability modifier
const getAbilityModifier = (score) => {
  const num = parseInt(score);
  if (isNaN(num)) return '';
  return Math.floor((num - 10) / 2);
};

// Setup ability score modifiers display
const setupAbilityModifiers = () => {
  const abilityIds = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  
  abilityIds.forEach(ability => {
    const input = document.getElementById(`character-${ability}`);
    if (input) {
      const updateModifier = () => {
        const modifier = getAbilityModifier(input.value);
        const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        
        // Find or create modifier display
        let modifierSpan = input.parentNode.querySelector('.ability-modifier');
        if (!modifierSpan) {
          modifierSpan = document.createElement('span');
          modifierSpan.className = 'ability-modifier';
          modifierSpan.style.cssText = `
            display: block;
            font-size: 0.75rem;
            color: var(--color-text-light);
            text-align: center;
            margin-top: 2px;
          `;
          input.parentNode.appendChild(modifierSpan);
        }
        
        modifierSpan.textContent = modifier !== '' ? `(${modifierText})` : '';
      };
      
      input.addEventListener('input', updateModifier);
      updateModifier(); // Initialize
    }
  });
};

// Setup keyboard shortcuts
const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (e) => {
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
  });
};

// Initialize character page
const init = () => {
  const character = loadCharacterData();
  populateForm(character);
  setupAutoSave();
  setupAbilityModifiers();
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
  global.loadCharacterData = loadCharacterData;
  global.saveCharacterData = saveCharacterData;
  global.getCharacterFromForm = getCharacterFromForm;
  global.populateForm = populateForm;
  global.getAbilityModifier = getAbilityModifier;
}
