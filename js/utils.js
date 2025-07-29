// Shared Utilities - Common functions used across modules
// Following functional programming principles and style guide

// Note: STORAGE_KEYS removed per ADR-0004 - use Yjs Maps instead
// All data is now stored in Yjs Maps: characterMap, journalMap, settingsMap, summariesMap

// Pure function for safe JSON parsing
export const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Note: localStorage functions have been removed per ADR-0004
// All data persistence must use Yjs Maps - see js/yjs.js

// Pure function to generate unique IDs
export const generateId = () => Date.now().toString();

// Pure function to format dates
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Pure function to count words
export const getWordCount = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Pure function to create debounced function
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Pure function to validate entry data
export const isValidEntry = (entryData) => 
  entryData.title.trim().length > 0 && entryData.content.trim().length > 0;

// Pure function to create initial journal state
export const createInitialJournalState = () => ({
  character: {
    name: '',
    race: '',
    class: '',
    backstory: '',
    notes: ''
  },
  entries: []
});

// Pure function to create initial settings state
export const createInitialSettings = () => ({
  apiKey: '',
  enableAIFeatures: false
});

// Pure function to sort entries by date (newest first)
export const sortEntriesByDate = (entries) => 
  [...entries].sort((a, b) => b.timestamp - a.timestamp);

// Pure function to get form field IDs for character
export const getCharacterFormFieldIds = () => [
  'character-name', 
  'character-race', 
  'character-class',
  'character-backstory', 
  'character-notes'
];

// Pure function to convert field ID to property name for character forms
export const getPropertyNameFromFieldId = (fieldId) => fieldId.replace('character-', '');
