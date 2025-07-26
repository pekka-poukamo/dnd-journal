// Summarization - Pure content summarization with auto meta-summaries
// Following functional programming principles and style guide

import { loadDataWithFallback, safeSetToStorage, generateId, createInitialJournalState, STORAGE_KEYS } from './utils.js';
import { createUserPromptFunction, createTemplateFunction, isAPIAvailable } from './openai-wrapper.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'simple-summaries';
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
// STORAGE FUNCTIONS
// =============================================================================

const loadSummaries = () => loadDataWithFallback(STORAGE_KEY, {});
const saveSummaries = (summaries) => safeSetToStorage(STORAGE_KEY, summaries);

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
  if (wordCount < 200) return 0; // Don't summarize short text
  
  // Target: 20 * ln(wordCount) words
  return Math.max(150, Math.floor(20 * Math.log(wordCount)));
};

const shouldSummarize = (text) => countWords(text) >= 200; // Increased from 100

// =============================================================================
// CORE SUMMARIZATION
// =============================================================================

// Summarize any content with a key
export const summarize = async (key, text, targetLength = null) => {
  if (!shouldSummarize(text)) return null;

  // Check cache first
  const summaries = loadSummaries();
  const existing = summaries[key];
  if (existing) {
    return existing.content;
  }

  // Only check AI availability if we need to generate new content
  if (!isAPIAvailable()) return null;

  try {
    // Use logarithmic scaling by default, or provided targetLength
    const summaryLength = targetLength || calculateLogTargetLength(text);
    const prompt = `Summarize in ${summaryLength} words: ${text}`;
    const summary = await callSummarize(prompt);
    
    if (!summary) return null;

    // Store the summary
    summaries[key] = {
      content: summary,
      words: countWords(summary),
      timestamp: Date.now()
    };
    
    // Check if we need meta-summary
    await createMetaIfNeeded(summaries);
    
    saveSummaries(summaries);
    return summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    return null;
  }
};

// Create meta-summary when needed
const createMetaIfNeeded = async (summaries) => {
  const entries = Object.entries(summaries);
  const regularSummaries = entries.filter(([key]) => !key.startsWith('meta:'));
  
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
        summaries[metaKey] = {
          content: metaSummary,
          words: countWords(metaSummary),
          timestamp: Date.now(),
          replaces: oldest.map(([key]) => key)
        };
        
        // Remove original summaries
        oldest.forEach(([key]) => delete summaries[key]);
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
  const summaries = loadSummaries();
  return summaries[key]?.content || null;
};

// Get all summaries formatted for AI context
export const getAllSummaries = () => {
  const summaries = loadSummaries();
  return Object.entries(summaries)
    .map(([key, data]) => ({
      key,
      content: data.content,
      type: key.startsWith('meta:') ? 'meta' : 'regular',
      timestamp: data.timestamp || 0
    }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

// Get summaries by key pattern
export const getSummariesByPattern = (pattern) => {
  const summaries = loadSummaries();
  const regex = new RegExp(pattern);
  
  return Object.entries(summaries)
    .filter(([key]) => regex.test(key))
    .map(([key, data]) => ({ key, content: data.content }));
};

// =============================================================================
// STATISTICS
// =============================================================================

export const getStats = () => {
  const summaries = loadSummaries();
  const entries = Object.values(summaries);
  const totalWords = entries.reduce((sum, s) => sum + (s.words || 0), 0);
  
  return {
    count: entries.length,
    totalWords,
    withinTarget: totalWords <= TARGET_TOTAL_WORDS,
    metaSummaries: entries.filter(s => s.replaces).length
  };
};

// =============================================================================
// MAINTENANCE
// =============================================================================

export const clearAll = () => {
  saveSummaries({});
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
