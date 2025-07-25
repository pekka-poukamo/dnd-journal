// Shared Utilities - Common functions used across modules
// Following functional programming principles and style guide
// Updated for coverage testing - PR comment test v3

// Storage keys - centralized constants
export const STORAGE_KEYS = {
  JOURNAL: 'simple-dnd-journal',
  SETTINGS: 'simple-dnd-journal-settings',
  SUMMARIES: 'simple-dnd-journal-summaries',
  META_SUMMARIES: 'simple-dnd-journal-meta-summaries',
  CHARACTER_SUMMARIES: 'simple-dnd-journal-character-summaries'
};

// Pure function for safe JSON parsing
export const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function for safe localStorage operations
export const safeGetFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? safeParseJSON(stored) : { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function for safe localStorage saving
export const safeSetToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Pure function to load data with fallback
export const loadDataWithFallback = (key, fallbackData) => {
  const result = safeGetFromStorage(key);
  return result.success && result.data ? result.data : fallbackData;
};

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

// Pure function to convert field ID to property name
export const getPropertyNameFromFieldId = (fieldId) => fieldId.replace('character-', '');
