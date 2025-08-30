// Summarization - Simple AI summarization with caching
import { getYjsState, setSummary, getSummary } from './yjs.js';
import { PROMPTS } from './prompts.js';
import { isAIEnabled, callChatCompletion } from './ai.js';

// Shared call via AI module wrapper
const callAI = (prompt) => callChatCompletion(null, prompt);

// Summarize content with caching
export const summarize = (summaryKey, content, maxWords = null) => {
  const state = getYjsState();
  
  // Check cache first
  const existingSummary = getSummary(state, summaryKey);
  if (existingSummary) {
    return Promise.resolve(existingSummary);
  }
  
  // Validate content
  if (!content || content.trim() === '') {
    return Promise.reject(new Error('Content is required for summarization'));
  }
  
  // Check if AI is available
  if (!isAIEnabled()) {
    return Promise.reject(new Error('AI not available - check settings'));
  }
  
  // Generate prompt with appropriate word count
  let prompt;
  if (summaryKey.startsWith('entry:')) {
    prompt = PROMPTS.summarization.entry(content, maxWords || 400);
  } else if (summaryKey.startsWith('character:')) {
    prompt = PROMPTS.summarization.character(content, maxWords || 500);
  } else if (summaryKey.startsWith('journal:adventure-summary')) {
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords || 750);
  } else if (summaryKey.startsWith('journal:meta-summary')) {
    // Old meta-summary no longer supported intentionally
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords || 750);
  } else {
    prompt = `Summarize this content concisely:\n\n${content}`;
  }
  
  return callAI(prompt)
    .then(summary => {
      // Cache the result
      setSummary(state, summaryKey, summary);
      return summary;
    })
    .catch(error => {
      console.error('Summarization failed:', error);
      throw error;
    });
};

// Clear cache for specific key
export const clearSummary = (summaryKey) => {
  const state = getYjsState();
  state.summariesMap.delete(summaryKey);
};

// Clear all summaries
export const clearAllSummaries = () => {
  const state = getYjsState();
  state.summariesMap.clear();
};