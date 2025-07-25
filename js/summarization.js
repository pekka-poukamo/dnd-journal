// Summarization Module - General purpose summarization tool
// Following functional programming principles and style guide

import { 
  loadDataWithFallback, 
  createInitialJournalState, 
  getWordCount, 
  STORAGE_KEYS,
  generateId
} from './utils.js';

import {
  loadEntrySummaries,
  saveEntrySummary,
  loadMetaSummaries,
  saveMetaSummary,
  loadCharacterSummaries,
  saveCharacterSummary,
  getSummaryStats
} from './summary-storage.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Word count thresholds for auto-summarization (to control AI costs)
export const WORD_THRESHOLDS = {
  ENTRY_SUMMARIZATION: 300,     // Summarize entries over 300 words
  CHARACTER_FIELD: 150,         // Summarize character fields over 150 words
  META_SUMMARY_TRIGGER: 1000,   // Create meta-summaries when total summaries exceed 1000 words
  SUMMARIES_PER_META: 10        // Group 10 summaries per meta-summary
};

// Target word counts for summaries (compression ratios)
export const TARGET_WORDS = {
  ENTRY_SUMMARY: 50,             // Compress entries to ~50 words
  CHARACTER_SUMMARY: 40,         // Compress character fields to ~40 words  
  META_SUMMARY: 100              // Meta-summaries ~100 words
};

// =============================================================================
// CORE SUMMARIZATION FUNCTIONS
// =============================================================================

// General purpose summarization function
export const generateSummary = async (content, targetWords, type = 'content') => {
  // Check if AI is available via dynamic import
  try {
    const aiModule = await import('./ai.js');
    if (!aiModule.isAIEnabled()) {
      return null;
    }

    const prompt = createSummaryPrompt(content, targetWords, type);
    const summary = await aiModule.callOpenAI(prompt, targetWords * 2);
    
    return {
      summary: summary,
      originalWordCount: getWordCount(content),
      summaryWordCount: getWordCount(summary),
      timestamp: Date.now(),
      contentHash: btoa(content).substring(0, 16)
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return null;
  }
};

// Create appropriate AI prompt based on content type
const createSummaryPrompt = (content, targetWords, type) => {
  const basePrompt = `Summarize the following ${type} in approximately ${targetWords} words.`;
  
  switch (type) {
    case 'entry':
      return `${basePrompt} Keep the key events, emotions, and character development:\n\n${content}`;
    case 'character-backstory':
      return `${basePrompt} Focus on key background details, personality traits, and important history:\n\n${content}`;
    case 'character-notes':
      return `${basePrompt} Focus on important character details, relationships, and equipment:\n\n${content}`;
    case 'meta-summary':
      return `${basePrompt} Focus on overarching themes, character development, and major story arcs from these D&D adventures:\n\n${content}`;
    default:
      return `${basePrompt}\n\n${content}`;
  }
};

// =============================================================================
// CONTENT ANALYSIS FUNCTIONS
// =============================================================================

// Check if content needs summarization based on word count
export const needsSummarization = (content, threshold = WORD_THRESHOLDS.ENTRY_SUMMARIZATION) => {
  return getWordCount(content) > threshold;
};

// Get entries that need summarization
export const getEntriesNeedingSummary = (entries) => {
  const existingSummaries = loadEntrySummaries();
  
  return entries.filter(entry => {
    const hasExistingSummary = existingSummaries[entry.id];
    const needsSummary = needsSummarization(entry.content, WORD_THRESHOLDS.ENTRY_SUMMARIZATION);
    return needsSummary && !hasExistingSummary;
  });
};

// Get character fields that need summarization
export const getCharacterFieldsNeedingSummary = (character) => {
  if (!character || typeof character !== 'object') {
    return [];
  }
  
  const existingSummaries = loadCharacterSummaries();
  const fieldsNeedingSummary = [];
  
  ['backstory', 'notes'].forEach(field => {
    if (character[field] && needsSummarization(character[field], WORD_THRESHOLDS.CHARACTER_FIELD)) {
      const contentHash = btoa(character[field]).substring(0, 16);
      const existing = existingSummaries[field];
      
      // Check if content has changed since last summary
      if (!existing || existing.contentHash !== contentHash) {
        fieldsNeedingSummary.push({
          field,
          content: character[field],
          contentHash
        });
      }
    }
  });
  
  return fieldsNeedingSummary;
};

// Check if meta-summaries should be created
export const shouldCreateMetaSummaries = () => {
  const entrySummaries = loadEntrySummaries();
  const existingMeta = loadMetaSummaries();
  
  const summaryEntries = Object.values(entrySummaries);
  const totalWords = summaryEntries.reduce((sum, s) => sum + s.summaryWordCount, 0);
  
  // Create meta-summaries if we exceed word threshold and have enough summaries
  if (totalWords > WORD_THRESHOLDS.META_SUMMARY_TRIGGER && summaryEntries.length >= WORD_THRESHOLDS.SUMMARIES_PER_META) {
    // Check how many summaries are not yet included in meta-summaries
    const processedSummaryIds = new Set();
    Object.values(existingMeta).forEach(meta => {
      meta.includedSummaryIds?.forEach(id => processedSummaryIds.add(id));
    });
    
    const unprocessedSummaries = summaryEntries.filter(s => !processedSummaryIds.has(s.id));
    return unprocessedSummaries.length >= WORD_THRESHOLDS.SUMMARIES_PER_META;
  }
  
  return false;
};

// =============================================================================
// BATCH PROCESSING FUNCTIONS
// =============================================================================

// Process a single entry for summarization
export const processEntrySummary = async (entry) => {
  if (!entry || !entry.id || !entry.content) {
    return null;
  }
  
  const summaryData = await generateSummary(entry.content, TARGET_WORDS.ENTRY_SUMMARY, 'entry');
  
  if (summaryData) {
    const summary = {
      id: entry.id,
      originalTitle: entry.title,
      ...summaryData
    };
    
    saveEntrySummary(entry.id, summary);
    return summary;
  }
  
  return null;
};

// Process a single character field for summarization
export const processCharacterFieldSummary = async (fieldData) => {
  if (!fieldData || !fieldData.field || !fieldData.content) {
    return null;
  }
  
  const type = `character-${fieldData.field}`;
  const summaryData = await generateSummary(fieldData.content, TARGET_WORDS.CHARACTER_SUMMARY, type);
  
  if (summaryData) {
    const summary = {
      field: fieldData.field,
      ...summaryData
    };
    
    saveCharacterSummary(fieldData.field, summary);
    return summary;
  }
  
  return null;
};

// Create meta-summary from existing summaries
export const processMetaSummary = async () => {
  const entrySummaries = loadEntrySummaries();
  const existingMeta = loadMetaSummaries();
  
  // Get summaries not yet included in meta-summaries
  const processedSummaryIds = new Set();
  Object.values(existingMeta).forEach(meta => {
    meta.includedSummaryIds?.forEach(id => processedSummaryIds.add(id));
  });
  
  const unprocessedSummaries = Object.values(entrySummaries)
    .filter(s => !processedSummaryIds.has(s.id))
    .sort((a, b) => a.timestamp - b.timestamp); // Oldest first for chronological grouping
  
  if (unprocessedSummaries.length >= WORD_THRESHOLDS.SUMMARIES_PER_META) {
    const summariesToProcess = unprocessedSummaries.slice(0, WORD_THRESHOLDS.SUMMARIES_PER_META);
    const combinedContent = summariesToProcess
      .map(s => `${s.originalTitle}: ${s.summary}`)
      .join('\n\n');
    
    const metaSummaryData = await generateSummary(combinedContent, TARGET_WORDS.META_SUMMARY, 'meta-summary');
    
    if (metaSummaryData) {
      const metaId = generateId();
      const metaSummary = {
        id: metaId,
        title: `Adventures Summary (${summariesToProcess.length} entries)`,
        includedSummaryIds: summariesToProcess.map(s => s.id),
        dateRange: {
          start: summariesToProcess[0].timestamp,
          end: summariesToProcess[summariesToProcess.length - 1].timestamp
        },
        ...metaSummaryData
      };
      
      saveMetaSummary(metaId, metaSummary);
      return metaSummary;
    }
  }
  
  return null;
};

// =============================================================================
// AUTO-SUMMARIZATION FUNCTIONS
// =============================================================================

// Auto-summarize entries that exceed word threshold
export const autoSummarizeEntries = async () => {
  const journalData = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const entriesNeedingSummary = getEntriesNeedingSummary(journalData.entries);
  
  const results = [];
  for (const entry of entriesNeedingSummary) {
    const result = await processEntrySummary(entry);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
};

// Auto-summarize character fields that exceed word threshold
export const autoSummarizeCharacter = async () => {
  const journalData = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const fieldsNeedingSummary = getCharacterFieldsNeedingSummary(journalData.character);
  
  const results = [];
  for (const fieldData of fieldsNeedingSummary) {
    const result = await processCharacterFieldSummary(fieldData);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
};

// Auto-create meta-summaries when threshold is reached
export const autoCreateMetaSummaries = async () => {
  if (shouldCreateMetaSummaries()) {
    return await processMetaSummary();
  }
  return null;
};

// Run all auto-summarization processes
export const runAutoSummarization = async () => {
  try {
    const entryResults = await autoSummarizeEntries();
    const characterResults = await autoSummarizeCharacter();
    const metaResult = await autoCreateMetaSummaries();
    
    return {
      entrySummaries: entryResults,
      characterSummaries: characterResults,
      metaSummary: metaResult,
      totalProcessed: entryResults.length + characterResults.length + (metaResult ? 1 : 0)
    };
  } catch (error) {
    console.error('Auto-summarization failed:', error);
    return {
      entrySummaries: [],
      characterSummaries: [],
      metaSummary: null,
      totalProcessed: 0,
      error: error.message
    };
  }
};

// =============================================================================
// EXPORT ADDITIONAL FUNCTIONS FOR COMPATIBILITY
// =============================================================================

// Export storage functions for external use
export { getSummaryStats } from './summary-storage.js';
