// Character management - Character creation and editing functionality
// Following functional programming principles and style guide

import { safeDomOperation, createSuccess, createError, handleError } from './error-handling.js';
import { setElementContent, getElementValue, setElementValue } from './dom-utils.js';
import { getFormData, clearFormFields, populateFormFields, validateFormData } from './form-utils.js';
import { getCharacterFormFieldIds, getPropertyNameFromFieldId } from './utils.js';
import { getSystem, saveToSystem } from './yjs.js';

// Get current character data
export const getCurrentCharacterData = () => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem) {
      return createError('YJS system not available');
    }

    const characterMap = yjsSystem.characterMap;
    if (!characterMap) {
      return createError('Character map not available');
    }

    const character = {
      name: characterMap.get('name') || '',
      race: characterMap.get('race') || '',
      class: characterMap.get('class') || '',
      backstory: characterMap.get('backstory') || '',
      notes: characterMap.get('notes') || ''
    };

    return createSuccess(character);
  } catch (error) {
    return handleError('getCurrentCharacterData', error);
  }
};

// Save character data
export const saveCharacterData = (characterData) => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem) {
      return createError('YJS system not available');
    }

    const characterMap = yjsSystem.characterMap;
    if (!characterMap) {
      return createError('Character map not available');
    }

    // Save all character properties
    characterMap.set('name', characterData.name || '');
    characterMap.set('race', characterData.race || '');
    characterMap.set('class', characterData.class || '');
    characterMap.set('backstory', characterData.backstory || '');
    characterMap.set('notes', characterData.notes || '');

    return createSuccess('Character saved successfully');
  } catch (error) {
    return handleError('saveCharacterData', error);
  }
};

// Load character data into form
export const loadCharacterForm = () => {
  return safeDomOperation(() => {
    const characterResult = getCurrentCharacterData();
    if (!characterResult.success) {
      throw new Error(`Failed to load character: ${characterResult.error}`);
    }

    const character = characterResult.data;
    const fieldIds = getCharacterFormFieldIds();

    // Populate form fields
    fieldIds.forEach(fieldId => {
      const propertyName = getPropertyNameFromFieldId(fieldId);
      const value = character[propertyName] || '';
      setElementValue(fieldId, value);
    });

    return character;
  }, 'loadCharacterForm');
};

// Save character form
export const saveCharacterForm = () => {
  return safeDomOperation(() => {
    // Get form data
    const fieldIds = getCharacterFormFieldIds();
    const formData = getFormData(fieldIds);

    // Validate required fields (only name is required)
    const validationResult = validateFormData(formData, ['character-name']);
    if (!validationResult.success) {
      throw new Error(validationResult.error);
    }

    // Convert field IDs to property names
    const characterData = {};
    fieldIds.forEach(fieldId => {
      const propertyName = getPropertyNameFromFieldId(fieldId);
      characterData[propertyName] = formData[fieldId] || '';
    });

    // Save character data
    const saveResult = saveCharacterData(characterData);
    if (!saveResult.success) {
      throw new Error(`Failed to save character: ${saveResult.error}`);
    }

    return characterData;
  }, 'saveCharacterForm');
};

// Clear character form
export const clearCharacterForm = () => {
  return safeDomOperation(() => {
    const fieldIds = getCharacterFormFieldIds();
    clearFormFields(fieldIds);
    return true;
  }, 'clearCharacterForm');
};

// Delete character data
export const deleteCharacterData = () => {
  return safeDomOperation(() => {
    const yjsSystem = getSystem();
    if (!yjsSystem) {
      throw new Error('YJS system not available');
    }

    const characterMap = yjsSystem.characterMap;
    if (!characterMap) {
      throw new Error('Character map not available');
    }

    // Clear all character data
    characterMap.clear();
    return true;
  }, 'deleteCharacterData');
};

// Check if character has data
export const hasCharacterData = () => {
  try {
    const characterResult = getCurrentCharacterData();
    if (!characterResult.success) {
      return false;
    }

    const character = characterResult.data;
    return Boolean(
      character.name?.trim() ||
      character.race?.trim() ||
      character.class?.trim() ||
      character.backstory?.trim() ||
      character.notes?.trim()
    );
  } catch (error) {
    console.warn('Error checking character data:', error);
    return false;
  }
};

// Get character summary for display
export const getCharacterSummary = () => {
  try {
    const characterResult = getCurrentCharacterData();
    if (!characterResult.success) {
      return 'Character data unavailable';
    }

    const character = characterResult.data;
    
    if (!hasCharacterData()) {
      return 'No character created yet';
    }

    const parts = [];
    if (character.name?.trim()) parts.push(`Name: ${character.name.trim()}`);
    if (character.race?.trim()) parts.push(`Race: ${character.race.trim()}`);
    if (character.class?.trim()) parts.push(`Class: ${character.class.trim()}`);

    return parts.length > 0 ? parts.join(', ') : 'Unnamed character';
  } catch (error) {
    console.warn('Error getting character summary:', error);
    return 'Character summary unavailable';
  }
};

// Initialize character page
export const initializeCharacterPage = () => {
  return safeDomOperation(() => {
    // Load existing character data
    const loadResult = loadCharacterForm();
    if (!loadResult.success) {
      console.warn('Could not load character data:', loadResult.error);
    }

    // Set up form submission
    const characterForm = document.getElementById('character-form');
    if (characterForm) {
      characterForm.addEventListener('submit', handleCharacterFormSubmission);
    }

    // Set up clear button
    const clearBtn = document.getElementById('clear-character-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', handleClearCharacter);
    }

    // Set up back button
    const backBtn = document.getElementById('back-to-journal-btn');
    if (backBtn) {
      backBtn.addEventListener('click', navigateToJournal);
    }

    return true;
  }, 'initializeCharacterPage');
};

// Handle character form submission
export const handleCharacterFormSubmission = (event) => {
  event.preventDefault();
  
  return safeDomOperation(() => {
    const saveResult = saveCharacterForm();
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    // Show success message
    const messageDiv = document.getElementById('character-message');
    if (messageDiv) {
      setElementContent(messageDiv, 'Character saved successfully!');
      messageDiv.className = 'message success';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        if (messageDiv) {
          setElementContent(messageDiv, '');
          messageDiv.className = 'message';
        }
      }, 3000);
    }

    return saveResult.data;
  }, 'handleCharacterFormSubmission');
};

// Handle clear character
export const handleClearCharacter = (event) => {
  event.preventDefault();
  
  return safeDomOperation(() => {
    const confirmed = confirm('Are you sure you want to clear all character data? This action cannot be undone.');
    if (!confirmed) {
      return false;
    }

    const deleteResult = deleteCharacterData();
    if (!deleteResult.success) {
      throw new Error(deleteResult.error);
    }

    const clearResult = clearCharacterForm();
    if (!clearResult.success) {
      throw new Error(clearResult.error);
    }

    // Show success message
    const messageDiv = document.getElementById('character-message');
    if (messageDiv) {
      setElementContent(messageDiv, 'Character data cleared successfully!');
      messageDiv.className = 'message success';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        if (messageDiv) {
          setElementContent(messageDiv, '');
          messageDiv.className = 'message';
        }
      }, 3000);
    }

    return true;
  }, 'handleClearCharacter');
};

// Navigate to journal (proper navigation without window usage)
export const navigateToJournal = () => {
  // Use document.location instead of window.location
  document.location.href = 'index.html';
};

// Auto-initialize if on character page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('character-form')) {
      initializeCharacterPage();
    }
  });
} else {
  if (document.getElementById('character-form')) {
    initializeCharacterPage();
  }
}
