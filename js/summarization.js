// Simple Summarization - Direct Y.js Integration
import { setSummaryValue as setSummary, getSummaryValue as getSummary } from './yjs.js';
import { createUserPromptFunction, isAPIAvailable } from './openai-wrapper.js';

// Simple summarize function - stores result in Y.js
export const summarize = async (key, content) => {
  if (!await isAPIAvailable()) {
    throw new Error('API not available');
  }
  
  // Check if summary already exists
  const existingSummary = getSummary(key);
  if (existingSummary) {
    return existingSummary;
  }
  
  try {
    const promptFn = createUserPromptFunction();
    const prompt = `Please provide a concise summary of the following text:\n\n${content}`;
    
    const summary = await promptFn(prompt);
    
    // Store in Y.js
    setSummary(key, summary);
    
    return summary;
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  }
};