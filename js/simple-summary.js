// Simple Summary - Radically simple content-agnostic summarization
// Following functional programming principles and style guide

import { loadDataWithFallback, safeSetToStorage, generateId } from './utils.js';

// =============================================================================
// SIMPLE CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'simple-summaries';
const TARGET_TOTAL_WORDS = 400;
const WORDS_PER_SUMMARY = 30;
const META_TRIGGER = 10; // Create meta-summary after 10 summaries

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

// Load all summaries
const loadSummaries = () => loadDataWithFallback(STORAGE_KEY, {});

// Save all summaries
const saveSummaries = (summaries) => safeSetToStorage(STORAGE_KEY, summaries);

// Count words in text
const countWords = (text) => text.trim().split(/\s+/).filter(w => w.length > 0).length;

// Check if AI is available
const isAIReady = async () => {
  try {
    const aiModule = await import('./ai-storytelling.js');
    return aiModule.isAIAvailable();
  } catch {
    return false;
  }
};

// Call AI for summary
const callAI = async (text, targetWords) => {
  const aiModule = await import('./ai-storytelling.js');
  const prompt = `Summarize in ${targetWords} words: ${text}`;
  return await aiModule.callAIForSummary(prompt, targetWords * 2);
};

// =============================================================================
// MAIN FUNCTION - SUMMARIZE CONTENT
// =============================================================================

export const summarize = async (key, text) => {
  if (!text || countWords(text) < 100) {
    return null; // Too short to summarize
  }

  if (!await isAIReady()) {
    return null; // AI not available
  }

  try {
    // Generate summary
    const summary = await callAI(text, WORDS_PER_SUMMARY);
    
    // Store it
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

// =============================================================================
// META-SUMMARY LOGIC
// =============================================================================

const createMetaIfNeeded = async (summaries) => {
  const entries = Object.entries(summaries);
  const regularSummaries = entries.filter(([key]) => !key.startsWith('meta:'));
  
  // If we have too many regular summaries, create meta-summary
  if (regularSummaries.length >= META_TRIGGER) {
    const oldest = regularSummaries
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)
      .slice(0, 5); // Take 5 oldest
    
    const combinedText = oldest.map(([, summary]) => summary.content).join(' ');
    const metaSummary = await callAI(combinedText, WORDS_PER_SUMMARY * 2);
    
    if (metaSummary) {
      // Add meta-summary
      const metaKey = `meta:${generateId()}`;
      summaries[metaKey] = {
        content: metaSummary,
        words: countWords(metaSummary),
        timestamp: Date.now(),
        replaces: oldest.map(([key]) => key)
      };
      
      // Remove the old summaries
      oldest.forEach(([key]) => delete summaries[key]);
    }
  }
};

// =============================================================================
// GET ALL CONTENT
// =============================================================================

export const getAllSummaries = () => {
  const summaries = loadSummaries();
  return Object.entries(summaries)
    .map(([key, data]) => ({
      key,
      content: data.content,
      type: key.startsWith('meta:') ? 'meta' : 'regular'
    }))
    .sort((a, b) => (summaries[b.key]?.timestamp || 0) - (summaries[a.key]?.timestamp || 0));
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getSummary = (key) => {
  const summaries = loadSummaries();
  return summaries[key]?.content || null;
};

export const getStats = () => {
  const summaries = loadSummaries();
  const entries = Object.values(summaries);
  const totalWords = entries.reduce((sum, s) => sum + (s.words || 0), 0);
  
  return {
    count: entries.length,
    totalWords,
    withinTarget: totalWords <= TARGET_TOTAL_WORDS
  };
};

export const clearAll = () => {
  saveSummaries({});
  return true;
};