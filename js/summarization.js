// Summarization - Pure content summarization with auto meta-summaries
// Following functional programming principles and style guide

import { loadDataWithFallback, safeSetToStorage, generateId } from './utils.js';
import { createUserPromptFunction, createTemplateFunction, isAPIAvailable } from './openai-wrapper.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'simple-summaries';
const TARGET_TOTAL_WORDS = 400;
const WORDS_PER_SUMMARY = 30;
const META_TRIGGER = 10;

// =============================================================================
// AI FUNCTIONS (CURRIED)
// =============================================================================

// Create summarization function (no system prompt, low temperature)
const callSummarize = createUserPromptFunction({ 
  temperature: 0.3, 
  maxTokens: 200 
});

// Create meta-summarization function with template
const createMetaSummaryPrompt = (combinedText, targetWords) => 
  `Summarize these summaries in ${targetWords} words, focusing on key themes: ${combinedText}`;

const callMetaSummarize = createTemplateFunction(createMetaSummaryPrompt, {
  temperature: 0.3,
  maxTokens: 200
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

const shouldSummarize = (text) => countWords(text) >= 100;

// =============================================================================
// CORE SUMMARIZATION
// =============================================================================

// Summarize any content with a key
export const summarize = async (key, text) => {
  if (!shouldSummarize(text)) return null;
  if (!isAPIAvailable()) return null;

  try {
    const prompt = `Summarize in ${WORDS_PER_SUMMARY} words: ${text}`;
    const summary = await callSummarize(prompt);
    
    if (!summary) return null;

    // Store the summary
    const summaries = loadSummaries();
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
    const oldest = regularSummaries
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, 5);
    
    const combinedText = oldest.map(([, summary]) => summary.content).join(' ');
    const targetWords = WORDS_PER_SUMMARY * 2;
    
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
      timestamp: data.timestamp
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
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
