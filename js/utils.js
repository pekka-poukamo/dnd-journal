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

// Simple markdown parser for basic formatting
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>') // Code
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // H3
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // H2
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // H1
    // Handle unordered lists
    .replace(/^- (.+)(\n- .+)*/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^- /, '').trim()).join('</li><li>');
      return `<ul><li>${items}</li></ul>`;
    })
    // Handle ordered lists
    .replace(/^\d+\. (.+)(\n\d+\. .+)*/gm, (match) => {
      const items = match.split('\n').map(line => line.replace(/^\d+\. /, '').trim()).join('</li><li>');
      return `<ol><li>${items}</li></ol>`;
    })
    .replace(/\n\n/g, '__PARAGRAPH__') // Paragraph breaks
    .replace(/\n/g, '__LINE_BREAK__') // Line breaks
    .replace(/__PARAGRAPH__/g, '</p><p>') // Convert paragraph breaks
    .replace(/^/, '<p>') // Start with paragraph
    .replace(/$/, '</p>') // End with paragraph
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/__LINE_BREAK__/g, '<br>'); // Single line breaks
};
