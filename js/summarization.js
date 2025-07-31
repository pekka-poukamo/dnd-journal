// Simple Summarization - Pure Functional Y.js Integration
import { getYjsState, setSummary, getSummary } from './yjs.js';
import { createUserPromptFunction, isAPIAvailable } from './openai-wrapper.js';

// Simple summarize function - stores result in Y.js
export const summarize = (state, summaryKey, content) => {
  // Check if we already have a summary for this key
  const existingSummary = getSummary(state, summaryKey);
  if (existingSummary) {
    return existingSummary;
  }
  
  // Validate content before attempting to create new summary
  if (!content || content.trim() === '') {
    throw new Error('Content is required for summarization');
  }
  
  // For new summaries that require API calls, return a Promise
  return createNewSummary(state, summaryKey, content);
};

// Helper function for creating new summaries (async)
const createNewSummary = async (state, summaryKey, content) => {
  // Check if API is available for new summaries
  if (!isAPIAvailable()) {
    throw new Error('API not available');
  }
  
  try {
    // Create a simple summarization prompt
    const prompt = `Please provide a concise summary of the following content:\n\n${content}`;
    
    // Call OpenAI
    const callAI = createUserPromptFunction();
    const result = await callAI(prompt, {
      maxTokens: 150,
      temperature: 0.3
    });
    
    const summary = result.choices[0]?.message?.content?.trim();
    if (summary) {
      // Store in Y.js
      setSummary(state, summaryKey, summary);
      return summary;
    }
    
    throw new Error('No summary generated');
    
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
};