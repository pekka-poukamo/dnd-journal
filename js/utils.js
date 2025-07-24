// Shared Utilities - Common functions used across modules
// Following functional programming principles and style guide

// Storage keys - centralized constants
const STORAGE_KEYS = {
  JOURNAL: 'simple-dnd-journal',
  SETTINGS: 'simple-dnd-journal-settings',
  SUMMARIES: 'simple-dnd-journal-summaries',
  META_SUMMARIES: 'simple-dnd-journal-meta-summaries',
  CHARACTER_SUMMARIES: 'simple-dnd-journal-character-summaries'
};

// Pure function for safe JSON parsing
const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function for safe localStorage operations
const safeGetFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? safeParseJSON(stored) : { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function for safe localStorage saving
const safeSetToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function to load data with fallback
const loadDataWithFallback = (key, fallbackData) => {
  const result = safeGetFromStorage(key);
  return result.success && result.data ? result.data : fallbackData;
};

// Pure function to generate unique IDs
const generateId = () => Date.now().toString();

// Pure function to format dates
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Pure function to count words
const getWordCount = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Pure function to create debounced function
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Pure function to validate entry data
const isValidEntry = (entryData) => 
  entryData.title.trim().length > 0 && entryData.content.trim().length > 0;

// Pure function to create initial journal state
const createInitialJournalState = () => ({
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
const createInitialSettings = () => ({
  apiKey: '',
  enableAIFeatures: false
});

// Pure function to sort entries by date (newest first)
const sortEntriesByDate = (entries) => 
  [...entries].sort((a, b) => b.timestamp - a.timestamp);

// Pure function to get form field IDs for character
const getCharacterFormFieldIds = () => [
  'character-name', 
  'character-race', 
  'character-class',
  'character-backstory', 
  'character-notes'
];

// Pure function to convert field ID to property name
const getPropertyNameFromFieldId = (fieldId) => fieldId.replace('character-', '');

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEYS,
    safeParseJSON,
    safeGetFromStorage,
    safeSetToStorage,
    loadDataWithFallback,
    generateId,
    formatDate,
    getWordCount,
    debounce,
    isValidEntry,
    createInitialJournalState,
    createInitialSettings,
    sortEntriesByDate,
    getCharacterFormFieldIds,
    getPropertyNameFromFieldId
  };
} else if (typeof global !== 'undefined') {
  // For testing
  global.STORAGE_KEYS = STORAGE_KEYS;
  global.safeParseJSON = safeParseJSON;
  global.safeGetFromStorage = safeGetFromStorage;
  global.safeSetToStorage = safeSetToStorage;
  global.loadDataWithFallback = loadDataWithFallback;
  global.generateId = generateId;
  global.formatDate = formatDate;
  global.getWordCount = getWordCount;
  global.debounce = debounce;
  global.isValidEntry = isValidEntry;
  global.createInitialJournalState = createInitialJournalState;
  global.createInitialSettings = createInitialSettings;
  global.sortEntriesByDate = sortEntriesByDate;
  global.getCharacterFormFieldIds = getCharacterFormFieldIds;
  global.getPropertyNameFromFieldId = getPropertyNameFromFieldId;
} else {
  // For browser
  window.Utils = {
    STORAGE_KEYS,
    safeParseJSON,
    safeGetFromStorage,
    safeSetToStorage,
    loadDataWithFallback,
    generateId,
    formatDate,
    getWordCount,
    debounce,
    isValidEntry,
    createInitialJournalState,
    createInitialSettings,
    sortEntriesByDate,
    getCharacterFormFieldIds,
    getPropertyNameFromFieldId
  };
}
