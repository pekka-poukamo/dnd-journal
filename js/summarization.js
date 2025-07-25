// Summarization Management - General framework for handling different types of summaries

import { 
  loadDataWithFallback, 
  createInitialJournalState, 
  getWordCount, 
  STORAGE_KEYS, 
  safeSetToStorage 
} from './utils.js';

// =============================================================================
// GENERAL SUMMARIZATION FRAMEWORK
// =============================================================================

// Base configuration for different summarization types
export const SUMMARIZATION_CONFIGS = {
  entries: {
    storageKey: STORAGE_KEYS.SUMMARIES,
    recentCount: 5, // Keep 5 most recent entries in full
    batchSize: 3,
    targetCompressionRatio: 0.3 // 30% of original length
  },
  
  metaSummaries: {
    storageKey: STORAGE_KEYS.META_SUMMARIES,
    triggerThreshold: 50,
    summariesPerGroup: 10,
    maxWords: 200,
    batchSize: 2
  },
  
  character: {
    storageKey: STORAGE_KEYS.CHARACTER_SUMMARIES,
    fields: ['backstory', 'notes'],
    maxWordsBeforeSummary: 100,
    targetWords: 50,
    batchSize: 2
  }
};

// Generic summary storage operations
export const createStorageManager = (storageKey) => ({
  load: () => loadDataWithFallback(storageKey, {}),
  save: (data) => safeSetToStorage(storageKey, data)
});

// Generic content analyzer - determines if content needs summarization
export const analyzeContent = (content, config, existingSummaries = {}) => {
  const results = {};
  
  if (config.type === 'character') {
    // Character field analysis
    config.fields.forEach(field => {
      if (content[field]) {
        const wordCount = getWordCount(content[field]);
        if (wordCount > config.maxWordsBeforeSummary) {
          const contentHash = btoa(content[field]).substring(0, 16);
          const existing = existingSummaries[field];
          
          if (!existing || existing.contentHash !== contentHash) {
            results[field] = {
              type: 'character',
              field: field,
              content: content[field],
              wordCount: wordCount,
              contentHash: contentHash,
              targetWords: config.targetWords
            };
          }
        }
      }
    });
  } else if (config.type === 'entries') {
    // Entry analysis
    const sortedEntries = [...content].sort((a, b) => b.timestamp - a.timestamp);
    const recentEntries = sortedEntries.slice(0, config.recentCount);
    const olderEntries = sortedEntries.slice(config.recentCount);
    const needingSummaries = olderEntries.filter(entry => !existingSummaries[entry.id]);
    
    if (needingSummaries.length > 0) {
      results.entries = needingSummaries.map(entry => ({
        type: 'entry',
        id: entry.id,
        title: entry.title,
        content: entry.content,
        wordCount: getWordCount(entry.content),
        timestamp: entry.timestamp,
        targetWords: Math.max(10, Math.floor(getWordCount(entry.content) * config.targetCompressionRatio))
      }));
    }
  } else if (config.type === 'meta-summaries') {
    // Meta-summary analysis
    const summaryGroups = groupSummariesForMeta(content, existingSummaries);
    const needingMetaSummaries = summaryGroups.filter(group => !existingSummaries[group.id]);
    
    if (needingMetaSummaries.length > 0) {
      results.metaSummaries = needingMetaSummaries.map(group => ({
        type: 'meta-summary',
        id: group.id,
        title: group.title,
        summaries: group.summaries,
        totalEntries: group.totalEntries,
        dateRange: group.dateRange,
        targetWords: config.maxWords
      }));
    }
  }
  
  return results;
};

// Create AI prompt for summarization
const createAIPrompt = (item, config) => {
  if (item.type === 'character') {
    return `Summarize this character ${item.field} in approximately ${item.targetWords} words. Focus on key details, personality traits, and important background information:

${item.content}`;
  } else if (item.type === 'entry') {
    return `Summarize this D&D journal entry in approximately ${item.targetWords} words. Keep the key events, emotions, and character development:

Title: ${item.title}
Content: ${item.content}`;
  } else if (item.type === 'meta-summary') {
    const summaryText = item.summaries.map(s => `${s.title}: ${s.summary}`).join('\n\n');
    return `Create a meta-summary of these ${item.totalEntries} D&D adventures in approximately ${item.targetWords} words. Focus on overarching themes, character development, and major story arcs:

${summaryText}`;
  }
  
  return '';
};

// Process a single summary item
export const processSummary = async (item, config) => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return null;
  }

  try {
    const prompt = createAIPrompt(item, config);
    const summary = await window.AI.callOpenAI(prompt, Math.max(50, item.targetWords * 2));
    
    return {
      id: item.id || item.field,
      type: item.type,
      originalContent: item.content || item.title,
      summary: summary,
      wordCount: getWordCount(summary),
      timestamp: Date.now(),
      contentHash: item.contentHash || btoa(item.content || item.title).substring(0, 16)
    };
  } catch (error) {
    console.error('Failed to process summary:', error);
    return null;
  }
};

// Process a batch of summary items
export const processBatch = async (items, config, storageManager) => {
  const results = [];
  const existingSummaries = storageManager.load();
  
  for (const item of items) {
    const result = await processSummary(item, config);
    if (result) {
      results.push(result);
      existingSummaries[result.id] = result;
    }
  }
  
  if (results.length > 0) {
    storageManager.save(existingSummaries);
  }
  
  return results;
};

// Load journal data for summarization
const loadJournalData = () => {
  return loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
};

// Generate missing character summaries
export const generateMissingCharacterSummaries = async () => {
  const journalData = loadJournalData();
  const config = { ...SUMMARIZATION_CONFIGS.character, type: 'character' };
  const storageManager = createStorageManager(config.storageKey);
  const existingSummaries = storageManager.load();
  
  const itemsNeedingSummaries = analyzeContent(journalData.character, config, existingSummaries);
  const items = Object.values(itemsNeedingSummaries);
  
  if (items.length > 0) {
    return await processBatch(items, config, storageManager);
  }
  
  return [];
};

// Generate missing entry summaries
export const generateMissingSummaries = async () => {
  const journalData = loadJournalData();
  const config = { ...SUMMARIZATION_CONFIGS.entries, type: 'entries' };
  const storageManager = createStorageManager(config.storageKey);
  const existingSummaries = storageManager.load();
  
  const itemsNeedingSummaries = analyzeContent(journalData.entries, config, existingSummaries);
  const items = itemsNeedingSummaries.entries || [];
  
  if (items.length > 0) {
    return await processBatch(items, config, storageManager);
  }
  
  return [];
};

// Generate missing meta-summaries
export const generateMissingMetaSummaries = async () => {
  const journalData = loadJournalData();
  const config = { ...SUMMARIZATION_CONFIGS.metaSummaries, type: 'meta-summaries' };
  const storageManager = createStorageManager(config.storageKey);
  const existingSummaries = storageManager.load();
  
  const itemsNeedingSummaries = analyzeContent(journalData.entries, config, existingSummaries);
  const items = itemsNeedingSummaries.metaSummaries || [];
  
  if (items.length > 0) {
    return await processBatch(items, config, storageManager);
  }
  
  return [];
};

// Get formatted character data for AI (with summaries)
export const getFormattedCharacterForAI = (character) => {
  const characterSummaries = loadDataWithFallback(STORAGE_KEYS.CHARACTER_SUMMARIES, {});
  
  return {
    ...character,
    backstorySummarized: characterSummaries.backstory ? true : false,
    notesSummarized: characterSummaries.notes ? true : false,
    backstory: characterSummaries.backstory ? characterSummaries.backstory.summary : character.backstory,
    notes: characterSummaries.notes ? characterSummaries.notes.summary : character.notes
  };
};

// Get formatted entries for AI (with summaries)
export const getFormattedEntriesForAI = () => {
  const journalData = loadJournalData();
  const summaries = loadDataWithFallback(STORAGE_KEYS.SUMMARIES, {});
  const metaSummaries = loadDataWithFallback(STORAGE_KEYS.META_SUMMARIES, {});
  
  const sortedEntries = [...journalData.entries].sort((a, b) => b.timestamp - a.timestamp);
  const recentEntries = sortedEntries.slice(0, SUMMARIZATION_CONFIGS.entries.recentCount);
  const olderEntries = sortedEntries.slice(SUMMARIZATION_CONFIGS.entries.recentCount);
  
  const formattedEntries = [];
  
  // Add recent entries in full
  recentEntries.forEach(entry => {
    formattedEntries.push({
      type: 'recent',
      title: entry.title,
      content: entry.content,
      timestamp: entry.timestamp
    });
  });
  
  // Add individual summaries for older entries
  olderEntries.forEach(entry => {
    const summary = summaries[entry.id];
    if (summary) {
      formattedEntries.push({
        type: 'summary',
        title: entry.title,
        content: summary.summary,
        timestamp: entry.timestamp
      });
    } else {
      // Fallback to full entry if no summary available
      formattedEntries.push({
        type: 'recent',
        title: entry.title,
        content: entry.content,
        timestamp: entry.timestamp
      });
    }
  });
  
  // Add meta-summaries for very old entries
  Object.values(metaSummaries).forEach(metaSummary => {
    formattedEntries.push({
      type: 'meta-summary',
      title: metaSummary.originalContent,
      content: metaSummary.summary,
      timestamp: metaSummary.timestamp
    });
  });
  
  return formattedEntries;
};

// Get summary statistics
export const getSummaryStats = () => {
  const journalData = loadJournalData();
  const summaries = loadDataWithFallback(STORAGE_KEYS.SUMMARIES, {});
  const metaSummaries = loadDataWithFallback(STORAGE_KEYS.META_SUMMARIES, {});
  const characterSummaries = loadDataWithFallback(STORAGE_KEYS.CHARACTER_SUMMARIES, {});
  
  const totalEntries = journalData.entries.length;
  const entriesWithSummaries = Object.keys(summaries).length;
  const metaSummaryCount = Object.keys(metaSummaries).length;
  const characterSummaryCount = Object.keys(characterSummaries).length;
  
  const totalOriginalWords = journalData.entries.reduce((sum, entry) => 
    sum + getWordCount(entry.content), 0);
  const totalSummaryWords = Object.values(summaries).reduce((sum, summary) => 
    sum + summary.wordCount, 0);
  
  return {
    totalEntries,
    entriesWithSummaries,
    metaSummaryCount,
    characterSummaryCount,
    totalOriginalWords,
    totalSummaryWords,
    compressionRatio: totalOriginalWords > 0 ? (totalSummaryWords / totalOriginalWords).toFixed(2) : 0
  };
};

// Initialize summarization system
export const initializeSummarization = async () => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return;
  }

  try {
    // Generate any missing summaries
    await generateMissingSummaries();
    await generateMissingMetaSummaries();
    await generateMissingCharacterSummaries();
  } catch (error) {
    console.error('Failed to initialize summarization:', error);
  }
};

// Legacy compatibility functions
export const getEntriesNeedingSummaries = (entries, summaries) => {
  return entries.filter(entry => !summaries[entry.id]);
};

export const groupSummariesForMeta = (entries, summaries) => {
  const entriesWithSummaries = entries.filter(entry => summaries[entry.id]);
  
  if (entriesWithSummaries.length < SUMMARIZATION_CONFIGS.metaSummaries.triggerThreshold) {
    return [];
  }
  
  // Group summaries by date ranges
  const groups = [];
  const groupSize = SUMMARIZATION_CONFIGS.metaSummaries.summariesPerGroup;
  
  for (let i = 0; i < entriesWithSummaries.length; i += groupSize) {
    const group = entriesWithSummaries.slice(i, i + groupSize);
    const groupSummaries = group.map(entry => summaries[entry.id]);
    
    groups.push({
      id: `meta-${i}-${i + group.length}`,
      title: `Adventures ${i + 1}-${i + group.length}`,
      summaries: groupSummaries,
      totalEntries: group.length,
      dateRange: `${formatDate(group[group.length - 1].timestamp)} - ${formatDate(group[0].timestamp)}`
    });
  }
  
  return groups;
};

// Legacy character summary functions
export const getCharacterDetailsNeedingSummaries = (character, characterSummaries) => {
  const config = { ...SUMMARIZATION_CONFIGS.character, type: 'character' };
  return analyzeContent(character, config, characterSummaries);
};

export const generateCharacterDetailSummary = async (detailData) => {
  const config = { ...SUMMARIZATION_CONFIGS.character, type: 'character' };
  return await processSummary(detailData, config);
};

export const loadStoredCharacterSummaries = () => {
  const storageManager = createStorageManager(SUMMARIZATION_CONFIGS.character.storageKey);
  return storageManager.load();
};

export const saveStoredCharacterSummaries = (characterSummaries) => {
  const storageManager = createStorageManager(SUMMARIZATION_CONFIGS.character.storageKey);
  return storageManager.save(characterSummaries);
};

// Helper function for date formatting (import from utils)
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
