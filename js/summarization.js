// Simple Summarization - Pure Functional Y.js Integration
import { getYjsState, setSummary, getSummary } from './yjs.js';
import { createUserPromptFunction, isAPIAvailable } from './openai-wrapper.js';

// Simple summarize function - stores result in Y.js
export const summarize = async (content, type = 'general') => {
  // Check if API is available
  if (!isAPIAvailable()) {
    throw new Error('API not available');
  }
  
  const state = getYjsState();
  const summaryKey = `${type}:${Date.now()}`;
  
  // Check if we already have a summary for this content
  const existingSummary = getSummary(state, summaryKey);
  if (existingSummary) {
    return existingSummary;
  }
  
  try {
    // Create prompt based on content type
    const promptTemplate = getPromptTemplate(type);
    const prompt = `${promptTemplate}\n\nContent to summarize:\n${content}`;
    
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

// Get prompt template based on type
const getPromptTemplate = (type) => {
  const templates = {
    general: 'Please provide a concise summary of the following content:',
    character: 'Please summarize this character description, focusing on key traits and background:',
    journal: 'Please summarize this journal entry, highlighting the main events and outcomes:',
    backstory: 'Please create a concise summary of this character backstory:'
  };
  
  return templates[type] || templates.general;
};