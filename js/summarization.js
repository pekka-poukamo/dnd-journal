// Summarization Management - General framework for handling different types of summaries

// Get utils reference - works in both browser and test environment
const getUtils = () => {
  if (typeof window !== 'undefined' && window.Utils) return window.Utils;
  if (typeof global !== 'undefined' && global.Utils) return global.Utils;
  try {
    return require('./utils.js');
  } catch (e) {
    try {
      return require('../js/utils.js');
    } catch (e2) {
      // Fallback for tests
      return {
        loadDataWithFallback: (key, fallback) => fallback,
        createInitialJournalState: () => ({ character: {}, entries: [] }),
        getWordCount: (text) => text.trim().split(/\s+/).filter(word => word.length > 0).length,
        STORAGE_KEYS: {
          JOURNAL: 'simple-dnd-journal',
          SUMMARIES: 'simple-dnd-journal-summaries',
          META_SUMMARIES: 'simple-dnd-journal-meta-summaries',
          CHARACTER_SUMMARIES: 'simple-dnd-journal-character-summaries'
        },
        safeSetToStorage: () => ({ success: true })
      };
    }
  }
};

const utils = getUtils();

// =============================================================================
// GENERAL SUMMARIZATION FRAMEWORK
// =============================================================================

// Base configuration for different summarization types
const SUMMARIZATION_CONFIGS = {
  entries: {
    storageKey: utils.STORAGE_KEYS.SUMMARIES,
    recentCount: 5, // Keep 5 most recent entries in full
    batchSize: 3,
    targetCompressionRatio: 0.3 // 30% of original length
  },
  
  metaSummaries: {
    storageKey: utils.STORAGE_KEYS.META_SUMMARIES,
    triggerThreshold: 50,
    summariesPerGroup: 10,
    maxWords: 200,
    batchSize: 2
  },
  
  character: {
    storageKey: utils.STORAGE_KEYS.CHARACTER_SUMMARIES,
    fields: ['backstory', 'notes'],
    maxWordsBeforeSummary: 100,
    targetWords: 50,
    batchSize: 2
  }
};

// Generic summary storage operations
const createStorageManager = (storageKey) => ({
  load: () => utils.loadDataWithFallback(storageKey, {}),
  save: (data) => utils.safeSetToStorage(storageKey, data)
});

// Generic content analyzer - determines if content needs summarization
const analyzeContent = (content, config, existingSummaries = {}) => {
  const results = {};
  
  if (config.type === 'character') {
    // Character field analysis
    config.fields.forEach(field => {
      if (content[field]) {
        const wordCount = utils.getWordCount(content[field]);
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
    
    results.analysis = {
      recentEntries,
      olderEntries,
      needingSummaries,
      total: content.length
    };
  } else if (config.type === 'metaSummaries') {
    // Meta-summary grouping analysis
    const olderEntries = content
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, -config.recentCount);
    
    const entriesWithSummaries = olderEntries.filter(entry => existingSummaries[entry.id]);
    
    // Group entries by chunking - functional approach
    const groups = Array.from(
      { length: Math.floor(entriesWithSummaries.length / config.summariesPerGroup) },
      (_, i) => entriesWithSummaries.slice(i * config.summariesPerGroup, (i + 1) * config.summariesPerGroup)
    ).filter(group => group.length === config.summariesPerGroup);
    
    results.groups = groups;
  }
  
  return results;
};

// Generic AI prompt creator
const createAIPrompt = (item, config) => {
  if (config.type === 'character') {
    const fieldName = item.field === 'backstory' ? 'backstory' : 'notes';
    return `Summarize this D&D character's ${fieldName} in approximately ${item.targetWords} words. Keep the most important personality traits, key events, relationships, and defining characteristics:

${item.content}`;
  } else if (config.type === 'entries') {
    const wordCount = utils.getWordCount(item.content);
    const targetLength = Math.max(10, Math.floor(wordCount * config.targetCompressionRatio));
    
    return `Summarize this D&D journal entry in approximately ${targetLength} words. Keep the key events, emotions, and character development:

Title: ${item.title}
Content: ${item.content}`;
  } else if (config.type === 'metaSummaries') {
    const summariesText = item.summaries.map(s => `• ${s.summary}`).join('\n');
    
    return `Create a meta-summary of these D&D journal entry summaries from ${item.timeRange}. Capture the key themes, character development, and major events in about ${config.maxWords} words:

${summariesText}`;
  }
  
  return '';
};

// Generic summary processor
const processSummary = async (item, config) => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return null;
  }

  try {
    const prompt = createAIPrompt(item, config);
    const maxTokens = config.type === 'metaSummaries' ? config.maxWords : 
                     config.type === 'character' ? 80 : 100;
    
    const summary = await window.AI.callOpenAI(prompt, maxTokens);
    
    if (config.type === 'character') {
      return {
        field: item.field,
        originalWordCount: item.wordCount,
        summary: summary,
        summaryWordCount: utils.getWordCount(summary),
        contentHash: item.contentHash,
        timestamp: Date.now()
      };
    } else if (config.type === 'entries') {
      return {
        id: item.id,
        originalWordCount: item.wordCount || utils.getWordCount(item.content),
        summary: summary,
        summaryWordCount: utils.getWordCount(summary),
        timestamp: Date.now()
      };
    } else if (config.type === 'metaSummaries') {
      return {
        summary: summary,
        entryCount: item.entryCount,
        timeRange: item.timeRange,
        originalWordCount: item.originalWordCount,
        metaSummaryWordCount: utils.getWordCount(summary),
        timestamp: Date.now()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to generate ${config.type} summary:`, error);
    return null;
  }
};

// Generic batch processor
const processBatch = async (items, config, storageManager) => {
  const results = { generated: 0, remaining: Math.max(0, items.length - config.batchSize) };
  const batch = items.slice(0, config.batchSize);
  const existingSummaries = storageManager.load();
  
  // Process batch using functional approach
  const processedResults = await Promise.all(
    batch.map(async (item) => {
      try {
        const summary = await processSummary(item, config);
        if (summary) {
          if (config.type === 'character') {
            return { success: true, key: item.field, summary };
          } else if (config.type === 'entries') {
            return { success: true, key: item.id, summary };
          } else if (config.type === 'metaSummaries') {
            return { success: true, key: item.groupKey, summary };
                 }
         return { success: true, key: null, summary: null };
       } catch (error) {
         console.error(`Failed to process ${config.type} item:`, error);
         return { success: false, error };
       }
     })
   );
   
   // Apply results to existingSummaries
   processedResults
     .filter(result => result.success && result.summary)
     .forEach(result => {
       existingSummaries[result.key] = result.summary;
       results.generated++;
     });
   
   if (results.generated > 0) {
     storageManager.save(existingSummaries);
   }
  
  return results;
};

// =============================================================================
// SPECIFIC SUMMARIZATION IMPLEMENTATIONS
// =============================================================================

// Pure function to load journal data
const loadJournalData = () => {
  return utils.loadDataWithFallback(
    utils.STORAGE_KEYS.JOURNAL, 
    utils.createInitialJournalState()
  );
};

// Character summarization
const generateMissingCharacterSummaries = async () => {
  const config = { ...SUMMARIZATION_CONFIGS.character, type: 'character' };
  const storageManager = createStorageManager(config.storageKey);
  const journalData = loadJournalData();
  
  const analysis = analyzeContent(journalData.character, config, storageManager.load());
  const itemsToProcess = Object.values(analysis);
  
  if (itemsToProcess.length === 0) {
    return { generated: 0, remaining: 0 };
  }
  
  return await processBatch(itemsToProcess, config, storageManager);
};

// Entry summarization
const generateMissingSummaries = async () => {
  const config = { ...SUMMARIZATION_CONFIGS.entries, type: 'entries' };
  const storageManager = createStorageManager(config.storageKey);
  const journalData = loadJournalData();
  
  const analysis = analyzeContent(journalData.entries, config, storageManager.load());
  const itemsToProcess = analysis.analysis ? analysis.analysis.needingSummaries : [];
  
  if (itemsToProcess.length === 0) {
    await generateMissingMetaSummaries();
    await generateMissingCharacterSummaries();
    return { generated: 0, remaining: 0 };
  }
  
  const results = await processBatch(itemsToProcess, config, storageManager);
  
  // After generating regular summaries, check for meta-summaries and character summaries
  await generateMissingMetaSummaries();
  await generateMissingCharacterSummaries();
  
  return results;
};

// Meta-summarization
const generateMissingMetaSummaries = async () => {
  const journalData = loadJournalData();
  
  if (journalData.entries.length < SUMMARIZATION_CONFIGS.metaSummaries.triggerThreshold) {
    return { generated: 0, remaining: 0 };
  }
  
  const config = { 
    ...SUMMARIZATION_CONFIGS.metaSummaries, 
    type: 'metaSummaries',
    recentCount: SUMMARIZATION_CONFIGS.entries.recentCount
  };
  const storageManager = createStorageManager(config.storageKey);
  const summaryStorageManager = createStorageManager(SUMMARIZATION_CONFIGS.entries.storageKey);
  
  const analysis = analyzeContent(journalData.entries, config, summaryStorageManager.load());
  const metaSummaries = storageManager.load();
  
  // Find groups that don't have meta-summaries yet
  const itemsToProcess = analysis.groups
    .filter(group => {
      const groupKey = `${group[0].id}-${group[group.length - 1].id}`;
      return !metaSummaries[groupKey];
    })
    .map(group => {
      const firstEntry = group[0];
      const lastEntry = group[group.length - 1];
      const timeRange = `${new Date(firstEntry.timestamp).toLocaleDateString()} - ${new Date(lastEntry.timestamp).toLocaleDateString()}`;
      const summaries = summaryStorageManager.load();
      const summaryGroup = group.map(entry => summaries[entry.id]);
      
      return {
        groupKey: `${firstEntry.id}-${lastEntry.id}`,
        summaries: summaryGroup,
        timeRange: timeRange,
        entryCount: group.length,
        originalWordCount: summaryGroup.reduce((total, s) => total + s.summaryWordCount, 0)
      };
    });
  
  return await processBatch(itemsToProcess, config, storageManager);
};

// =============================================================================
// FORMATTING AND OUTPUT FUNCTIONS
// =============================================================================

// Get formatted character for AI prompts
const getFormattedCharacterForAI = (character) => {
  const config = SUMMARIZATION_CONFIGS.character;
  const storageManager = createStorageManager(config.storageKey);
  const characterSummaries = storageManager.load();
  const formattedCharacter = { ...character };
  
  config.fields.forEach(field => {
    if (character[field]) {
      const wordCount = utils.getWordCount(character[field]);
      if (wordCount > config.maxWordsBeforeSummary && characterSummaries[field]) {
        formattedCharacter[field] = characterSummaries[field].summary;
        formattedCharacter[`${field}Summarized`] = true;
      }
    }
  });
  
  return formattedCharacter;
};

// Get formatted entries for AI prompts
const getFormattedEntriesForAI = () => {
  const journalData = loadJournalData();
  const entriesConfig = SUMMARIZATION_CONFIGS.entries;
  const metaConfig = SUMMARIZATION_CONFIGS.metaSummaries;
  
  const summaryStorage = createStorageManager(entriesConfig.storageKey);
  const metaStorage = createStorageManager(metaConfig.storageKey);
  
  const summaries = summaryStorage.load();
  const metaSummaries = metaStorage.load();
  
  const analysis = analyzeContent(journalData.entries, { ...entriesConfig, type: 'entries' }, summaries);
  if (!analysis.analysis) return [];
  
  const { recentEntries, olderEntries } = analysis.analysis;
  
  // Use full content for recent entries
  const recentFormatted = recentEntries.map(entry => ({
    title: entry.title,
    content: entry.content,
    timestamp: entry.timestamp,
    type: 'full'
  }));
  
  // For older entries, use meta-summaries where available, otherwise individual summaries
  const metaAnalysis = analyzeContent(journalData.entries, { 
    ...metaConfig, 
    type: 'metaSummaries',
    recentCount: entriesConfig.recentCount 
  }, summaries);
  
  const entriesInMetaSummaries = new Set();
  
  // Add meta-summaries first using functional approach
  const metaSummaryFormatted = metaAnalysis.groups
    ? metaAnalysis.groups
        .map(group => {
          const groupKey = `${group[0].id}-${group[group.length - 1].id}`;
          const metaSummary = metaSummaries[groupKey];
          
          if (metaSummary) {
            // Mark entries as covered by meta-summary
            group.forEach(entry => entriesInMetaSummaries.add(entry.id));
            
            return {
              title: `Adventures (${metaSummary.entryCount} entries): ${metaSummary.timeRange}`,
              content: metaSummary.summary,
              timestamp: group[0].timestamp,
              type: 'meta-summary',
              entryCount: metaSummary.entryCount,
              originalWordCount: metaSummary.originalWordCount,
              metaSummaryWordCount: metaSummary.metaSummaryWordCount
            };
          }
          return null;
        })
        .filter(item => item !== null)
    : [];
  
  // Add individual summaries for entries not covered by meta-summaries
  const individualSummaryFormatted = olderEntries
    .filter(entry => summaries[entry.id] && !entriesInMetaSummaries.has(entry.id))
    .map(entry => ({
      title: entry.title,
      content: summaries[entry.id].summary,
      timestamp: entry.timestamp,
      type: 'summary',
      originalWordCount: summaries[entry.id].originalWordCount,
      summaryWordCount: summaries[entry.id].summaryWordCount
    }));
  
  const allFormatted = [...recentFormatted, ...metaSummaryFormatted, ...individualSummaryFormatted];
  return allFormatted.sort((a, b) => b.timestamp - a.timestamp);
};

// Get comprehensive summary statistics
const getSummaryStats = () => {
  const journalData = loadJournalData();
  const entriesConfig = SUMMARIZATION_CONFIGS.entries;
  const metaConfig = SUMMARIZATION_CONFIGS.metaSummaries;
  const characterConfig = SUMMARIZATION_CONFIGS.character;
  
  const summaryStorage = createStorageManager(entriesConfig.storageKey);
  const metaStorage = createStorageManager(metaConfig.storageKey);
  const characterStorage = createStorageManager(characterConfig.storageKey);
  
  const summaries = summaryStorage.load();
  const metaSummaries = metaStorage.load();
  const characterSummaries = characterStorage.load();
  
  // Entry statistics
  const entryAnalysis = analyzeContent(journalData.entries, { ...entriesConfig, type: 'entries' }, summaries);
  const { recentEntries = [], olderEntries = [], needingSummaries = [] } = entryAnalysis.analysis || {};
  const summarizedCount = olderEntries.filter(entry => summaries[entry.id]).length;
  
  // Meta-summary statistics
  const metaAnalysis = analyzeContent(journalData.entries, { 
    ...metaConfig, 
    type: 'metaSummaries',
    recentCount: entriesConfig.recentCount 
  }, summaries);
  const metaSummaryCount = Object.keys(metaSummaries).length;
  const possibleMetaSummaries = metaAnalysis.groups ? metaAnalysis.groups.length : 0;
  
  const entriesInMetaSummaries = new Set();
  if (metaAnalysis.groups) {
    metaAnalysis.groups.forEach(group => {
      const groupKey = `${group[0].id}-${group[group.length - 1].id}`;
      if (metaSummaries[groupKey]) {
        group.forEach(entry => entriesInMetaSummaries.add(entry.id));
      }
    });
  }
  
  // Character statistics
  const characterAnalysis = analyzeContent(journalData.character, { ...characterConfig, type: 'character' }, characterSummaries);
  const characterFieldsNeedingSummaries = Object.keys(characterAnalysis);
  
  return {
    totalEntries: journalData.entries.length,
    recentEntries: recentEntries.length,
    olderEntries: olderEntries.length,
    summarizedEntries: summarizedCount,
    pendingSummaries: needingSummaries.length,
    summaryCompletionRate: olderEntries.length > 0 ? (summarizedCount / olderEntries.length) * 100 : 100,
    metaSummaries: metaSummaryCount,
    possibleMetaSummaries: possibleMetaSummaries,
    entriesInMetaSummaries: entriesInMetaSummaries.size,
    metaSummaryActive: journalData.entries.length >= metaConfig.triggerThreshold,
    characterSummaries: Object.keys(characterSummaries).length,
    characterFieldsNeedingSummaries: characterFieldsNeedingSummaries.length,
    characterSummaryFields: Object.keys(characterSummaries)
  };
};

// Initialize summarization (generate missing summaries in background)
const initializeSummarization = async () => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return;
  }

  try {
    const result = await generateMissingSummaries();
    if (result && result.generated > 0) {
      // Summarization completed
    }
  } catch (error) {
    console.error('Failed to initialize summarization:', error);
  }
};

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

// Keep these for backward compatibility with existing code
const getEntriesNeedingSummaries = (entries, summaries) => {
  const config = { ...SUMMARIZATION_CONFIGS.entries, type: 'entries' };
  const analysis = analyzeContent(entries, config, summaries);
  return analysis.analysis || { recentEntries: [], olderEntries: [], needingSummaries: [] };
};

const groupSummariesForMeta = (entries, summaries) => {
  const config = { 
    ...SUMMARIZATION_CONFIGS.metaSummaries, 
    type: 'metaSummaries',
    recentCount: SUMMARIZATION_CONFIGS.entries.recentCount 
  };
  const analysis = analyzeContent(entries, config, summaries);
  return analysis.groups || [];
};

const getCharacterDetailsNeedingSummaries = (character, characterSummaries) => {
  const config = { ...SUMMARIZATION_CONFIGS.character, type: 'character' };
  return analyzeContent(character, config, characterSummaries);
};

const generateCharacterDetailSummary = async (detailData) => {
  const config = { ...SUMMARIZATION_CONFIGS.character, type: 'character' };
  return await processSummary(detailData, config);
};

const loadStoredCharacterSummaries = () => {
  const storageManager = createStorageManager(SUMMARIZATION_CONFIGS.character.storageKey);
  return storageManager.load();
};

const saveStoredCharacterSummaries = (characterSummaries) => {
  const storageManager = createStorageManager(SUMMARIZATION_CONFIGS.character.storageKey);
  return storageManager.save(characterSummaries);
};

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // New general framework
    SUMMARIZATION_CONFIGS,
    analyzeContent,
    processSummary,
    processBatch,
    createStorageManager,
    
    // Main functions
    generateMissingSummaries,
    generateMissingMetaSummaries,
    generateMissingCharacterSummaries,
    getFormattedEntriesForAI,
    getFormattedCharacterForAI,
    getSummaryStats,
    initializeSummarization,
    
    // Legacy compatibility
    getEntriesNeedingSummaries,
    groupSummariesForMeta,
    getCharacterDetailsNeedingSummaries,
    generateCharacterDetailSummary,
    loadStoredCharacterSummaries,
    saveStoredCharacterSummaries,
    
    // For testing
    META_SUMMARY_CONFIG: SUMMARIZATION_CONFIGS.metaSummaries,
    CHARACTER_SUMMARY_CONFIG: SUMMARIZATION_CONFIGS.character
  };
} else if (typeof global !== 'undefined') {
  // For testing
  global.SUMMARIZATION_CONFIGS = SUMMARIZATION_CONFIGS;
  global.analyzeContent = analyzeContent;
  global.processSummary = processSummary;
  global.processBatch = processBatch;
  global.createStorageManager = createStorageManager;
  global.generateMissingSummaries = generateMissingSummaries;
  global.generateMissingMetaSummaries = generateMissingMetaSummaries;
  global.generateMissingCharacterSummaries = generateMissingCharacterSummaries;
  global.getFormattedEntriesForAI = getFormattedEntriesForAI;
  global.getFormattedCharacterForAI = getFormattedCharacterForAI;
  global.getSummaryStats = getSummaryStats;
  global.initializeSummarization = initializeSummarization;
  global.getEntriesNeedingSummaries = getEntriesNeedingSummaries;
  global.groupSummariesForMeta = groupSummariesForMeta;
  global.getCharacterDetailsNeedingSummaries = getCharacterDetailsNeedingSummaries;
  global.generateCharacterDetailSummary = generateCharacterDetailSummary;
  global.loadStoredCharacterSummaries = loadStoredCharacterSummaries;
  global.saveStoredCharacterSummaries = saveStoredCharacterSummaries;
  global.META_SUMMARY_CONFIG = SUMMARIZATION_CONFIGS.metaSummaries;
  global.CHARACTER_SUMMARY_CONFIG = SUMMARIZATION_CONFIGS.character;
} else {
  // For browser
  window.Summarization = {
    SUMMARIZATION_CONFIGS,
    analyzeContent,
    processSummary,
    processBatch,
    createStorageManager,
    generateMissingSummaries,
    generateMissingMetaSummaries,
    generateMissingCharacterSummaries,
    getFormattedEntriesForAI,
    getFormattedCharacterForAI,
    getSummaryStats,
    initializeSummarization,
    getEntriesNeedingSummaries,
    groupSummariesForMeta,
    getCharacterDetailsNeedingSummaries,
    generateCharacterDetailSummary,
    loadStoredCharacterSummaries,
    saveStoredCharacterSummaries,
    META_SUMMARY_CONFIG: SUMMARIZATION_CONFIGS.metaSummaries,
    CHARACTER_SUMMARY_CONFIG: SUMMARIZATION_CONFIGS.character
  };
}
