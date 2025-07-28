// Summarization - Pure content summarization with auto meta-summaries
// Following functional programming principles and style guide

import { loadDataWithFallback, safeSetToStorage, generateId, createInitialJournalState, STORAGE_KEYS } from './utils.js';
import { createUserPromptFunction, createTemplateFunction, isAPIAvailable } from './openai-wrapper.js';
import { getSystem, Y } from './yjs.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const TARGET_TOTAL_WORDS = 2000; // Increased from 400
const WORDS_PER_SUMMARY = 150; // Increased from 30
const META_TRIGGER = 10;

// =============================================================================
// AI FUNCTIONS (CURRIED)
// =============================================================================

// Create summarization function (no system prompt, low temperature)
const callSummarize = createUserPromptFunction({ 
  temperature: 0.3, 
  maxTokens: 800 // Increased from 200
});

// Create meta-summarization function with template
const createMetaSummaryPrompt = (combinedText, targetWords) => 
  `Summarize these summaries in ${targetWords} words, focusing on key themes: ${combinedText}`;

const callMetaSummarize = createTemplateFunction(createMetaSummaryPrompt, {
  temperature: 0.3,
  maxTokens: 1200 // Increased from 200
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

// Calculate target summary length based on logarithm of original text word count
const calculateLogTargetLength = (text) => {
  const wordCount = countWords(text);
  if (wordCount < 150) return 0; // Match shouldSummarize threshold
  
  // Target: 20 * ln(wordCount) words
  return Math.max(150, Math.floor(20 * Math.log(wordCount)));
};

const shouldSummarize = (text) => countWords(text) >= 150; // Match minimum summary length

// =============================================================================
// CORE SUMMARIZATION
// =============================================================================

// Summarize any content with a key
export const summarize = async (key, text, targetLength = null) => {
  if (!shouldSummarize(text)) return null;

  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return null;

  // Check cache first
  const existing = yjsSystem.summariesMap.get(key);
  if (existing) {
    return existing.get('content');
  }

  // Only check AI availability if we need to generate new content
  if (!isAPIAvailable()) return null;

  try {
    // Use logarithmic scaling by default, or provided targetLength
    const summaryLength = targetLength || calculateLogTargetLength(text);
    const prompt = `Summarize in ${summaryLength} words: ${text}`;
    const summary = await callSummarize(prompt);
    
    if (!summary) return null;

    // Store the summary directly in Yjs
    const summaryMap = new Y.Map();
    summaryMap.set('content', summary);
    summaryMap.set('words', countWords(summary));
    summaryMap.set('timestamp', Date.now());
    yjsSystem.summariesMap.set(key, summaryMap);
    
    // Check if we need meta-summary
    await createMetaIfNeeded();
    
    return summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    return null;
  }
};

// Create meta-summary when needed
const createMetaIfNeeded = async () => {
  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return;

  // Get all regular summaries (not meta summaries)
  const regularSummaries = [];
  yjsSystem.summariesMap.forEach((summaryMap, key) => {
    if (!key.startsWith('meta:')) {
      regularSummaries.push([key, {
        content: summaryMap.get('content'),
        timestamp: summaryMap.get('timestamp') || 0
      }]);
    }
  });
  
  if (regularSummaries.length >= META_TRIGGER) {
    const oldest = [...regularSummaries]
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, 5);
    
    const combinedText = oldest.map(([, summary]) => summary.content).join(' ');
    // Use logarithmic scaling for meta-summary length
    const targetWords = calculateLogTargetLength(combinedText);
    
    try {
      const metaSummary = await callMetaSummarize(combinedText, targetWords);
      
      if (metaSummary) {
        const metaKey = `meta:${generateId()}`;
        const metaSummaryMap = new Y.Map();
        metaSummaryMap.set('content', metaSummary);
        metaSummaryMap.set('words', countWords(metaSummary));
        metaSummaryMap.set('timestamp', Date.now());
        metaSummaryMap.set('replaces', oldest.map(([key]) => key));
        yjsSystem.summariesMap.set(metaKey, metaSummaryMap);
        
        // Remove original summaries
        oldest.forEach(([key]) => yjsSystem.summariesMap.delete(key));
      }
    } catch (error) {
      console.error('Meta-summarization failed:', error);
    }
  }
};

// =============================================================================
// RETRIEVAL FUNCTIONS
// =============================================================================

// Get a specific summary
export const getSummary = (key) => {
  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return null;
  
  const summaryMap = yjsSystem.summariesMap.get(key);
  return summaryMap ? summaryMap.get('content') : null;
};

// Get all summaries formatted for AI context
export const getAllSummaries = () => {
  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return [];

  const summaries = [];
  yjsSystem.summariesMap.forEach((summaryMap, key) => {
    summaries.push({
      key,
      content: summaryMap.get('content'),
      type: key.startsWith('meta:') ? 'meta' : 'regular',
      timestamp: summaryMap.get('timestamp') || 0
    });
  });
  
  return summaries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

// Get summaries by key pattern
export const getSummariesByPattern = (pattern) => {
  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return [];

  const regex = new RegExp(pattern);
  const results = [];
  
  yjsSystem.summariesMap.forEach((summaryMap, key) => {
    if (regex.test(key)) {
      results.push({
        key,
        content: summaryMap.get('content')
      });
    }
  });
  
  return results;
};

// =============================================================================
// STATISTICS
// =============================================================================

export const getStats = () => {
  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return { count: 0, totalWords: 0, withinTarget: true, metaSummaries: 0 };

  let count = 0;
  let totalWords = 0;
  let metaSummaries = 0;
  
  yjsSystem.summariesMap.forEach((summaryMap, key) => {
    count++;
    totalWords += summaryMap.get('words') || 0;
    if (summaryMap.has('replaces')) {
      metaSummaries++;
    }
  });
  
  return {
    count,
    totalWords,
    withinTarget: totalWords <= TARGET_TOTAL_WORDS,
    metaSummaries
  };
};

// =============================================================================
// MAINTENANCE
// =============================================================================

export const clearAll = () => {
  const yjsSystem = getSystem();
  if (!yjsSystem?.summariesMap) return false;
  
  yjsSystem.summariesMap.clear();
  return true;
};

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

// Legacy function for settings page compatibility
export const getSummaryStats = () => {
  const stats = getStats();
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const totalEntries = (journal.entries || []).length;
  const recentEntries = Math.min(totalEntries, 5); // Consider last 5 entries as recent
  
  return {
    totalEntries,
    recentEntries,
    summarizedEntries: stats.count,
    pendingSummaries: Math.max(0, recentEntries - stats.count),
    summaryCompletionRate: recentEntries > 0 ? Math.round((stats.count / recentEntries) * 100) : 0,
    metaSummaryActive: stats.metaSummaries > 0
  };
};

// Legacy function for auto-summarization - simplified for new architecture
export const autoSummarizeEntries = async () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const entries = journal.entries || [];
  const results = [];
  
  // Only summarize recent entries that need it
  const recentEntries = entries
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5); // Last 5 entries
  
  for (const entry of recentEntries) {
    if (entry.content && countWords(entry.content) >= 200) { // Use word count instead of character length
      const summary = await summarize(entry.id, entry.content);
      if (summary) {
        results.push({
          id: entry.id,
          title: entry.title,
          summary: summary,
          status: 'success'
        });
      }
    }
  }
  
  return results;
};

// Legacy function for full auto-summarization run
export const runAutoSummarization = async () => {
  try {
    const entrySummaries = await autoSummarizeEntries();
    
    return {
      entrySummaries,
      characterSummaries: [], // Character summarization handled by storytelling module
      metaSummary: null, // Meta-summaries are automatic
      totalProcessed: entrySummaries.length
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
