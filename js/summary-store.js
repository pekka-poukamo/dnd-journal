// Summary Store - Content-agnostic summary storage
// Following functional programming principles and style guide

import { 
  loadDataWithFallback, 
  safeSetToStorage, 
  generateId 
} from './utils.js';

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

const STORAGE_KEYS = {
  SUMMARIES: 'simple-dnd-journal-summaries-v2',
  META_SUMMARIES: 'simple-dnd-journal-meta-summaries-v2'
};

// =============================================================================
// CORE STORAGE OPERATIONS
// =============================================================================

// Pure function to load all summaries
export const loadAllSummaries = () => {
  return loadDataWithFallback(STORAGE_KEYS.SUMMARIES, {});
};

// Pure function to save all summaries
export const saveAllSummaries = (summaries) => {
  return safeSetToStorage(STORAGE_KEYS.SUMMARIES, summaries);
};

// Pure function to load summary by key
export const loadSummary = (key) => {
  const summaries = loadAllSummaries();
  return summaries[key] || null;
};

// Pure function to save summary with key
export const saveSummary = (key, summary) => {
  const summaries = loadAllSummaries();
  const updatedSummaries = { ...summaries, [key]: summary };
  return saveAllSummaries(updatedSummaries);
};

// Pure function to delete summary by key
export const deleteSummary = (key) => {
  const summaries = loadAllSummaries();
  const { [key]: deleted, ...remaining } = summaries;
  return saveAllSummaries(remaining);
};

// =============================================================================
// META-SUMMARY STORAGE OPERATIONS
// =============================================================================

// Pure function to load all meta-summaries
export const loadAllMetaSummaries = () => {
  return loadDataWithFallback(STORAGE_KEYS.META_SUMMARIES, {});
};

// Pure function to save all meta-summaries
export const saveAllMetaSummaries = (metaSummaries) => {
  return safeSetToStorage(STORAGE_KEYS.META_SUMMARIES, metaSummaries);
};

// Pure function to load meta-summary by key
export const loadMetaSummary = (key) => {
  const metaSummaries = loadAllMetaSummaries();
  return metaSummaries[key] || null;
};

// Pure function to save meta-summary with key
export const saveMetaSummary = (key, metaSummary) => {
  const metaSummaries = loadAllMetaSummaries();
  const updatedMetaSummaries = { ...metaSummaries, [key]: metaSummary };
  return saveAllMetaSummaries(updatedMetaSummaries);
};

// Pure function to delete meta-summary by key
export const deleteMetaSummary = (key) => {
  const metaSummaries = loadAllMetaSummaries();
  const { [key]: deleted, ...remaining } = metaSummaries;
  return saveAllMetaSummaries(remaining);
};

// =============================================================================
// QUERY OPERATIONS
// =============================================================================

// Pure function to get summaries by key pattern
export const getSummariesByPattern = (pattern) => {
  const summaries = loadAllSummaries();
  const regex = new RegExp(pattern);
  
  return Object.entries(summaries)
    .filter(([key]) => regex.test(key))
    .reduce((acc, [key, summary]) => {
      acc[key] = summary;
      return acc;
    }, {});
};

// Pure function to get summaries by metadata criteria
export const getSummariesByMetadata = (criteria) => {
  const summaries = loadAllSummaries();
  
  return Object.entries(summaries)
    .filter(([key, summary]) => {
      if (!summary.metadata) return false;
      
      return Object.entries(criteria).every(([field, value]) => {
        return summary.metadata[field] === value;
      });
    })
    .reduce((acc, [key, summary]) => {
      acc[key] = summary;
      return acc;
    }, {});
};

// Pure function to get summaries modified after timestamp
export const getSummariesAfterTimestamp = (timestamp) => {
  const summaries = loadAllSummaries();
  
  return Object.entries(summaries)
    .filter(([key, summary]) => {
      return summary.metadata?.timestamp > timestamp;
    })
    .reduce((acc, [key, summary]) => {
      acc[key] = summary;
      return acc;
    }, {});
};

// =============================================================================
// STATISTICS AND ANALYTICS
// =============================================================================

// Pure function to get storage statistics
export const getStorageStats = () => {
  const summaries = loadAllSummaries();
  const metaSummaries = loadAllMetaSummaries();
  
  const summaryEntries = Object.values(summaries);
  const metaSummaryEntries = Object.values(metaSummaries);
  
  // Calculate total words
  const totalSummaryWords = summaryEntries.reduce((total, summary) => {
    return total + (summary.metadata?.summaryWordCount || 0);
  }, 0);
  
  const totalOriginalWords = summaryEntries.reduce((total, summary) => {
    return total + (summary.metadata?.originalWordCount || 0);
  }, 0);
  
  const totalMetaSummaryWords = metaSummaryEntries.reduce((total, metaSummary) => {
    return total + (metaSummary.metadata?.summaryWordCount || 0);
  }, 0);
  
  // Calculate compression stats
  const avgCompressionRatio = summaryEntries.length > 0 ? 
    summaryEntries.reduce((total, summary) => total + (summary.metadata?.compressionRatio || 0), 0) / summaryEntries.length : 0;
  
  return {
    totalSummaries: summaryEntries.length,
    totalMetaSummaries: metaSummaryEntries.length,
    totalSummaryWords,
    totalOriginalWords,
    totalMetaSummaryWords,
    averageCompressionRatio: avgCompressionRatio,
    totalStoredItems: summaryEntries.length + metaSummaryEntries.length,
    storageEfficiency: totalOriginalWords > 0 ? (totalSummaryWords / totalOriginalWords) : 0
  };
};

// Pure function to get summaries grouped by content type
export const getSummariesByType = () => {
  const summaries = loadAllSummaries();
  const grouped = {};
  
  Object.entries(summaries).forEach(([key, summary]) => {
    // Extract type from key (e.g., "entry:123" -> "entry")
    const type = key.includes(':') ? key.split(':')[0] : 'unknown';
    
    if (!grouped[type]) {
      grouped[type] = [];
    }
    
    grouped[type].push({ key, ...summary });
  });
  
  return grouped;
};

// =============================================================================
// MAINTENANCE OPERATIONS
// =============================================================================

// Pure function to find orphaned summaries (summaries without corresponding content)
export const findOrphanedSummaries = (validKeys) => {
  const summaries = loadAllSummaries();
  const validKeySet = new Set(validKeys);
  
  return Object.keys(summaries).filter(key => !validKeySet.has(key));
};

// Pure function to clean up orphaned summaries
export const cleanupOrphanedSummaries = (validKeys) => {
  const summaries = loadAllSummaries();
  const validKeySet = new Set(validKeys);
  
  const cleanedSummaries = Object.entries(summaries)
    .filter(([key]) => validKeySet.has(key))
    .reduce((acc, [key, summary]) => {
      acc[key] = summary;
      return acc;
    }, {});
  
  return saveAllSummaries(cleanedSummaries);
};

// Pure function to clear all data (for reset/migration)
export const clearAllData = () => {
  const summaryResult = saveAllSummaries({});
  const metaResult = saveAllMetaSummaries({});
  
  return {
    success: summaryResult.success && metaResult.success,
    results: {
      summaries: summaryResult.success,
      metaSummaries: metaResult.success
    }
  };
};

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

// Pure function to save multiple summaries at once
export const saveBatchSummaries = (summariesBatch) => {
  const existingSummaries = loadAllSummaries();
  const updatedSummaries = { ...existingSummaries, ...summariesBatch };
  return saveAllSummaries(updatedSummaries);
};

// Pure function to delete multiple summaries at once
export const deleteBatchSummaries = (keys) => {
  const summaries = loadAllSummaries();
  const keySet = new Set(keys);
  
  const filteredSummaries = Object.entries(summaries)
    .filter(([key]) => !keySet.has(key))
    .reduce((acc, [key, summary]) => {
      acc[key] = summary;
      return acc;
    }, {});
  
  return saveAllSummaries(filteredSummaries);
};

// =============================================================================
// KEY GENERATION UTILITIES
// =============================================================================

// Pure function to generate summary key
export const generateSummaryKey = (type, id) => {
  return `${type}:${id}`;
};

// Pure function to generate meta-summary key
export const generateMetaSummaryKey = (type = 'meta') => {
  return `${type}:${generateId()}`;
};

// Pure function to parse summary key
export const parseSummaryKey = (key) => {
  const parts = key.split(':');
  return {
    type: parts[0] || 'unknown',
    id: parts[1] || key,
    fullKey: key
  };
};