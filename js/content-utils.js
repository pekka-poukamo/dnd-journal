// Content Utilities - Shared utilities for content processing
// Following functional programming principles and style guide

import { 
  loadDataWithFallback, 
  STORAGE_KEYS, 
  createInitialJournalState,
  getWordCount 
} from './utils.js';

// =============================================================================
// CONTENT EXTRACTION AND FORMATTING
// =============================================================================

// Pure function to extract content items from journal data
export const extractJournalEntries = () => {
  const journalData = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  return journalData.entries || [];
};

// Pure function to extract character data from journal
export const extractCharacterData = () => {
  const journalData = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  return journalData.character || {};
};

// Pure function to extract character fields that can be summarized
export const extractCharacterFields = (character) => {
  const summarizableFields = ['backstory', 'notes'];
  const fields = [];
  
  summarizableFields.forEach(fieldName => {
    if (character[fieldName] && typeof character[fieldName] === 'string') {
      fields.push({
        type: 'character',
        id: fieldName,
        content: character[fieldName],
        fieldName,
        timestamp: Date.now() // Use current time for character fields
      });
    }
  });
  
  return fields;
};

// Pure function to format content items for processing
export const formatContentForProcessing = (contentItems, contentType) => {
  return contentItems.map(item => ({
    type: contentType,
    id: item.id || item.fieldName,
    content: item.content || item.text || '',
    title: item.title || `${contentType} ${item.id}`,
    timestamp: item.timestamp || Date.now(),
    metadata: {
      wordCount: getWordCount(item.content || item.text || ''),
      originalItem: item
    }
  }));
};

// =============================================================================
// CONTENT ANALYSIS
// =============================================================================

// Pure function to analyze content statistics
export const analyzeContentStats = (contentItems) => {
  const stats = {
    totalItems: contentItems.length,
    totalWords: 0,
    averageWords: 0,
    itemsByWordCount: {
      short: 0,    // < 100 words
      medium: 0,   // 100-300 words
      long: 0,     // 300-1000 words
      veryLong: 0  // > 1000 words
    },
    oldestTimestamp: null,
    newestTimestamp: null
  };
  
  if (contentItems.length === 0) {
    return stats;
  }
  
  contentItems.forEach(item => {
    const wordCount = getWordCount(item.content || '');
    stats.totalWords += wordCount;
    
    // Categorize by word count
    if (wordCount < 100) {
      stats.itemsByWordCount.short++;
    } else if (wordCount < 300) {
      stats.itemsByWordCount.medium++;
    } else if (wordCount < 1000) {
      stats.itemsByWordCount.long++;
    } else {
      stats.itemsByWordCount.veryLong++;
    }
    
    // Track timestamps
    const timestamp = item.timestamp || 0;
    if (stats.oldestTimestamp === null || timestamp < stats.oldestTimestamp) {
      stats.oldestTimestamp = timestamp;
    }
    if (stats.newestTimestamp === null || timestamp > stats.newestTimestamp) {
      stats.newestTimestamp = timestamp;
    }
  });
  
  stats.averageWords = Math.round(stats.totalWords / stats.totalItems);
  
  return stats;
};

// Pure function to find content items that need attention
export const findContentNeedingAttention = (contentItems, criteria = {}) => {
  const defaultCriteria = {
    minWords: 200,           // Minimum words to consider for summarization
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    includeRecent: false     // Whether to include recent items
  };
  
  const finalCriteria = { ...defaultCriteria, ...criteria };
  const now = Date.now();
  
  return contentItems.filter(item => {
    const wordCount = getWordCount(item.content || '');
    const age = now - (item.timestamp || 0);
    
    // Check word count threshold
    if (wordCount < finalCriteria.minWords) {
      return false;
    }
    
    // Check age if specified
    if (finalCriteria.maxAge && age > finalCriteria.maxAge) {
      return false;
    }
    
    // Check recent items policy
    if (!finalCriteria.includeRecent && age < (7 * 24 * 60 * 60 * 1000)) { // Less than 7 days
      return false;
    }
    
    return true;
  });
};

// =============================================================================
// CONTENT GROUPING AND ORGANIZATION
// =============================================================================

// Pure function to group content by time periods
export const groupContentByTimePeriod = (contentItems, periodType = 'month') => {
  const groups = {};
  
  contentItems.forEach(item => {
    const timestamp = item.timestamp || 0;
    const date = new Date(timestamp);
    
    let groupKey;
    switch (periodType) {
      case 'day':
        groupKey = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        groupKey = String(date.getFullYear());
        break;
      default:
        groupKey = 'all';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(item);
  });
  
  return groups;
};

// Pure function to group content by word count ranges
export const groupContentByWordCount = (contentItems) => {
  const groups = {
    short: [],    // < 100 words
    medium: [],   // 100-300 words
    long: [],     // 300-1000 words
    veryLong: []  // > 1000 words
  };
  
  contentItems.forEach(item => {
    const wordCount = getWordCount(item.content || '');
    
    if (wordCount < 100) {
      groups.short.push(item);
    } else if (wordCount < 300) {
      groups.medium.push(item);
    } else if (wordCount < 1000) {
      groups.long.push(item);
    } else {
      groups.veryLong.push(item);
    }
  });
  
  return groups;
};

// =============================================================================
// CONTENT VALIDATION AND CLEANING
// =============================================================================

// Pure function to validate content item structure
export const validateContentItem = (item) => {
  const errors = [];
  
  if (!item || typeof item !== 'object') {
    errors.push('Content item must be an object');
    return { valid: false, errors };
  }
  
  if (!item.id && !item.fieldName) {
    errors.push('Content item must have an id or fieldName');
  }
  
  if (!item.content && !item.text) {
    errors.push('Content item must have content or text');
  }
  
  if (item.content && typeof item.content !== 'string') {
    errors.push('Content must be a string');
  }
  
  if (item.timestamp && (typeof item.timestamp !== 'number' || item.timestamp < 0)) {
    errors.push('Timestamp must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Pure function to clean and normalize content
export const cleanContent = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  return content
    .trim()
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')     // Limit consecutive newlines
    .replace(/[^\S\n]+/g, ' ');     // Normalize non-newline whitespace
};

// Pure function to sanitize content for safe processing
export const sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Remove potentially problematic characters while preserving readability
  return content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\u200B/g, '')                           // Remove zero-width spaces
    .trim();
};

// =============================================================================
// CONTENT SEARCH AND FILTERING
// =============================================================================

// Pure function to search content by text
export const searchContent = (contentItems, searchTerm, options = {}) => {
  const defaultOptions = {
    caseSensitive: false,
    searchFields: ['content', 'title'],
    matchWholeWords: false
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  const term = finalOptions.caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  return contentItems.filter(item => {
    return finalOptions.searchFields.some(field => {
      const fieldValue = item[field] || '';
      const searchableValue = finalOptions.caseSensitive ? fieldValue : fieldValue.toLowerCase();
      
      if (finalOptions.matchWholeWords) {
        const wordRegex = new RegExp(`\\b${term}\\b`);
        return wordRegex.test(searchableValue);
      } else {
        return searchableValue.includes(term);
      }
    });
  });
};

// Pure function to filter content by date range
export const filterContentByDateRange = (contentItems, startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return contentItems.filter(item => {
    const timestamp = item.timestamp || 0;
    return timestamp >= start && timestamp <= end;
  });
};

// Pure function to filter content by word count range
export const filterContentByWordCount = (contentItems, minWords, maxWords) => {
  return contentItems.filter(item => {
    const wordCount = getWordCount(item.content || '');
    return wordCount >= minWords && wordCount <= maxWords;
  });
};