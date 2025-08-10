// Summarization - Simple AI summarization with caching
import { getYjsState, setSummary, getSummary, getSetting } from './yjs.js';
import { PROMPTS } from './prompts.js';

// Check if AI is available
const isAIEnabled = () => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const enabled = getSetting(state, 'ai-enabled', false);
  return Boolean(enabled && apiKey);
};

// Simple AI call function
const callAI = (prompt) => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.3
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => data.choices[0].message.content.trim());
};

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
  } else if (summaryKey.startsWith('journal:anchor:index:')) {
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords || 800);
  } else if (summaryKey.startsWith('journal:page:')) {
    // Page-based summary (recursive roll-up); use adventure summary prompt
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords || 800);
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