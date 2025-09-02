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
const callAI = (prompt, options = {}) => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  
  const requestBody = {
    model: 'gpt-4.1',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.maxTokens || 2500,
    temperature: options.temperature || 0.3
  };
  
  // Add JSON mode if requested
  if (options.jsonMode) {
    requestBody.response_format = { type: "json_object" };
  }
  
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    const content = data.choices[0].message.content.trim();
    
    // If JSON mode was requested, parse it
    if (options.jsonMode) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('AI response was not valid JSON');
      }
    } else {
      // Return regular text content
      return content;
    }
  });
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
  let options = {};
  
  if (summaryKey.startsWith('entry:')) {
    prompt = PROMPTS.summarization.entry(content, maxWords);
    options.jsonMode = true;
  } else if (summaryKey.startsWith('character:')) {
    prompt = PROMPTS.summarization.character(content, maxWords);
  } else if (summaryKey.startsWith('journal:adventure-summary')) {
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords);
  } else if (summaryKey.startsWith('journal:meta-summary')) {
    // Old meta-summary no longer supported intentionally
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords);
  } else {
    prompt = `Summarize this content concisely:\n\n${content}`;
  }
  return callAI(prompt, options)
    .then(response => {
      // For entry summaries, response is already an object
      if (summaryKey.startsWith('entry:')) {
        // Validate the structure
        if (response && response.title && response.subtitle && response.summary) {
          // Cache the structured content
          setSummary(state, summaryKey, JSON.stringify(response));
          return response;
        } else {
          throw new Error('Invalid structured content format');
        }
      } else {
        // For non-entry summaries, return as-is
        setSummary(state, summaryKey, response);
        return response;
      }
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