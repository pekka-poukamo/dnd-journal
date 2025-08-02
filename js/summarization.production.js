// Summarization - Simple AI summarization with caching
import { getYjsState, setSummary, getSummary, getSetting } from './yjs.production.js';
import { PROMPTS } from './prompts.js';

// Check if AI is available
const isAIEnabled = () => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const enabled = getSetting(state, 'ai-enabled', false);
  return Boolean(enabled && apiKey);
};

// Simple AI call function
const callAI = async (prompt) => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};

// Summarize content with caching
export const summarize = async (summaryKey, content) => {
  const state = getYjsState();
  
  // Check cache first
  const existingSummary = getSummary(state, summaryKey);
  if (existingSummary) {
    return existingSummary;
  }
  
  // Validate content
  if (!content || content.trim() === '') {
    throw new Error('Content is required for summarization');
  }
  
  // Check if AI is available
  if (!isAIEnabled()) {
    throw new Error('AI not available - check settings');
  }
  
  try {
    // Determine prompt type and generate summary
    let prompt;
    if (summaryKey.startsWith('entry:')) {
      prompt = PROMPTS.summarization.entry(content);
    } else if (summaryKey.startsWith('character:')) {
      prompt = PROMPTS.summarization.character(content);
    } else if (summaryKey.startsWith('journal:meta-summary')) {
      prompt = PROMPTS.summarization.metaSummary(content);
    } else {
      prompt = `Summarize this content concisely:\n\n${content}`;
    }
    
    const summary = await callAI(prompt);
    
    // Cache the result
    setSummary(state, summaryKey, summary);
    return summary;
    
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  }
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