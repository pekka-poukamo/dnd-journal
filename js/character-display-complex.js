// Character Display - Character summary display functionality
// Following functional programming principles and style guide

import { handleError, createSuccess, safeDomOperation } from './error-handling.js';
import { setElementContent } from './dom-utils.js';
import { getSystem } from './yjs.js';

// Pure function to create character summary data
export const createCharacterSummary = (character) => {
  if (!character) {
    return {
      name: 'No Character',
      details: 'Create a character to see their details here.'
    };
  }

  // If character has a name, return it, otherwise return 'No Character'
  if (character.name && character.name.trim()) {
    const details = [];
    if (character.race) details.push(character.race);
    if (character.class) details.push(character.class);
    if (character.backstory) details.push(character.backstory);
    if (character.notes) details.push(character.notes);

    return {
      name: character.name.trim(),
      details: details.join(', ')
    };
  }

  return {
    name: 'No Character',
    details: 'Create a character to see their details here.'
  };
};

// Pure function to create simplified character data for main page display
export const createSimpleCharacterData = (character) => {
  if (!character) {
    return {
      name: 'Unnamed Character',
      race: 'Unknown',
      class: 'Unknown'
    };
  }
  
  // Determine the display name - use 'Unnamed Character' if name is missing or just whitespace
  const displayName = (!character.name || character.name.trim() === '') 
    ? 'Unnamed Character' 
    : character.name.trim();
  
  return {
    name: displayName,
    race: character.race || 'Unknown',
    class: character.class || 'Unknown'
  };
};

// Pure function to get character data from YJS system
export const getCharacterFromSystem = () => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.characterMap) {
      return createSuccess({
        name: '',
        race: '',
        class: '',
        backstory: '',
        notes: ''
      });
    }

    const character = {
      name: yjsSystem.characterMap.get('name') || '',
      race: yjsSystem.characterMap.get('race') || '',
      class: yjsSystem.characterMap.get('class') || '',
      backstory: yjsSystem.characterMap.get('backstory') || '',
      notes: yjsSystem.characterMap.get('notes') || ''
    };

    return createSuccess(character);
  } catch (error) {
    return handleError('getCharacterFromSystem', error);
  }
};

// Pure function to format character display value
export const formatCharacterDisplayValue = (value, defaultValue = '—') => {
  if (!value || value === 'Unknown') {
    return defaultValue;
  }
  return value;
};

// Function to display character summary in DOM
export const displayCharacterSummary = (character = null) => {
  return safeDomOperation(() => {
    // Get character data if not provided
    let characterData = character;
    if (!characterData) {
      const characterResult = getCharacterFromSystem();
      if (!characterResult.success) {
        console.warn('Failed to get character data:', characterResult.error);
        characterData = { name: '', race: '', class: '' };
      } else {
        characterData = characterResult.data;
      }
    }

    // Get DOM elements
    const nameEl = document.getElementById('display-name');
    const raceEl = document.getElementById('display-race');
    const classEl = document.getElementById('display-class');
    
    if (!nameEl || !raceEl || !classEl) {
      throw new Error('Character display elements not found');
    }
    
    // Create simple character data for display
    const simpleData = createSimpleCharacterData(characterData);
    
    // Update DOM elements
    nameEl.textContent = simpleData.name;
    raceEl.textContent = formatCharacterDisplayValue(simpleData.race);
    classEl.textContent = formatCharacterDisplayValue(simpleData.class);
    
    return { nameEl, raceEl, classEl };
  }, 'displayCharacterSummary');
};

// Function to create character summary element (for character page)
export const createCharacterSummaryElement = (character) => {
  return safeDomOperation(() => {
    const summary = createCharacterSummary(character);
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'character-summary';
    
    const nameEl = document.createElement('h2');
    nameEl.textContent = summary.name;
    nameEl.className = 'character-name';
    
    const detailsEl = document.createElement('p');
    detailsEl.textContent = summary.details;
    detailsEl.className = 'character-details';
    
    summaryDiv.appendChild(nameEl);
    summaryDiv.appendChild(detailsEl);
    
    return summaryDiv;
  }, 'createCharacterSummaryElement');
};

// Function to update character display when data changes
export const updateCharacterDisplay = () => {
  return displayCharacterSummary();
};

// Function to check if character has meaningful data
export const hasCharacterData = (character) => {
  if (!character) return false;
  
  return Boolean(
    character.name?.trim() ||
    character.race?.trim() ||
    character.class?.trim() ||
    character.backstory?.trim() ||
    character.notes?.trim()
  );
};

// Pure function to create character display state
export const createCharacterDisplayState = (character) => {
  const hasData = hasCharacterData(character);
  const summary = createCharacterSummary(character);
  const simpleData = createSimpleCharacterData(character);
  
  return {
    hasData,
    summary,
    simpleData,
    isEmpty: !hasData
  };
};