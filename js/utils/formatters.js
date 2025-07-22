// js/utils/formatters.js - Text formatting utilities

// Pure function for formatting dates
export const formatDate = (date) => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Pure function for formatting relative dates
export const formatRelativeDate = (date) => {
  try {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now - target;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return 'Unknown';
  }
};

// Pure function for escaping HTML
export const escapeHtml = (text) => 
  text.replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[match]);

// Pure function for stripping HTML tags
export const stripHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

// Pure function for creating text preview
export const createPreview = (text, maxLength = 100) => {
  const stripped = stripHtml(text);
  return stripped.length > maxLength 
    ? stripped.substring(0, maxLength) + '...'
    : stripped;
};

// Pure function for parsing tags
export const parseTags = (tagString) => 
  tagString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .map(tag => tag.toLowerCase());

// Pure function for formatting tags
export const formatTags = (tags) => 
  Array.isArray(tags) ? tags.join(', ') : '';

// Pure function for capitalizing text
export const capitalize = (text) => 
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// Pure function for creating initials
export const createInitials = (name) => {
  if (!name) return '?';
  return name.split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Pure function for formatting character summary
export const formatCharacterSummary = (character) => {
  if (!character) return 'No character';
  
  const { name, race, class: characterClass, level } = character;
  const parts = [name];
  
  if (race && characterClass) {
    parts.push(`${race} ${characterClass}`);
  } else if (race) {
    parts.push(race);
  } else if (characterClass) {
    parts.push(characterClass);
  }
  
  if (level) {
    parts.push(`Level ${level}`);
  }
  
  return parts.join(' • ');
};

// Pure function for formatting entry type
export const formatEntryType = (type) => {
  const typeMap = {
    'session': 'Session Notes',
    'character': 'Character Development',
    'note': 'Quick Note',
    'npc': 'NPC Profile',
    'location': 'Location',
    'item': 'Item/Equipment',
    'lore': 'Campaign Lore'
  };
  
  return typeMap[type] || capitalize(type);
};

// Pure function for word count
export const getWordCount = (text) => {
  const stripped = stripHtml(text);
  return stripped.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Pure function for reading time estimation
export const estimateReadingTime = (text, wordsPerMinute = 200) => {
  const wordCount = getWordCount(text);
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
};

// Pure function for pluralization
export const pluralize = (count, singular, plural = null) => {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
};