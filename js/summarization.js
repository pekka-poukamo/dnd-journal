// Summarization - Simple AI summarization with caching
import { getYjsState, setSummary, getSummary, getSetting } from './yjs.js';
import { PROMPTS } from './prompts.js';
import { callOpenAIChat } from './ai-request.js';



// Check if AI is available
const isAIEnabled = () => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const enabled = getSetting(state, 'ai-enabled', false);
  return Boolean(enabled && apiKey);
};

// Simple AI call function (centralized)
const callAI = (prompt, options = {}) => {
  const messages = [{ role: 'user', content: prompt }];
  const response_format = options.jsonMode ? { type: 'json_object' } : undefined;
  return callOpenAIChat(messages, { maxTokens: options.maxTokens || 2500, temperature: options.temperature || 0.3, response_format })
    .then((data) => data.choices[0].message.content.trim())
    .then((content) => {
      if (options.jsonMode) {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('AI response was not valid JSON');
        }
      }
      return content;
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
  
  if (summaryKey.endsWith(':title-gen')) {
    // For title generation keys, `content` is already an instruction prompt
    prompt = content;
    options.maxTokens = Math.min(80, maxWords ? Math.ceil(maxWords * 2) : 80);
    options.temperature = 0.7;
  } else if (summaryKey.startsWith('entry:')) {
    // Short-content safeguard to avoid fabrication
    const text = (content || '').trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    if (wordCount > 0 && wordCount < 6) {
      const fallbackTitle = text.split(/\s+/).slice(0, 12).join(' ');
      const fallbackSubtitle = `In which ${text}`;
      const response = { title: fallbackTitle, subtitle: fallbackSubtitle };
      setSummary(state, summaryKey, JSON.stringify(response));
      return Promise.resolve(response);
    }

    prompt = PROMPTS.summarization.entry(content, maxWords);
    options.jsonMode = true;
    options.temperature = options.temperature ?? 0.9;
  } else if (summaryKey.startsWith('character:')) {
    prompt = PROMPTS.summarization.character(content, maxWords);
  } else if (
    summaryKey.startsWith('journal:part:') ||
    summaryKey === 'journal:recent-summary' ||
    summaryKey.startsWith('journal:parts:so-far')
  ) {
    prompt = PROMPTS.summarization.adventureSummary(content, maxWords);
  } else {
    prompt = `Summarize this content concisely:\n\n${content}`;
  }
  return callAI(prompt, options)
    .then(response => {
      // For entry summaries, response is already an object
      if (summaryKey.startsWith('entry:')) {
        // Validate the structure (title + subtitle only)
        if (response && response.title && response.subtitle) {
          const minimal = { title: String(response.title), subtitle: String(response.subtitle) };
          setSummary(state, summaryKey, JSON.stringify(minimal));
          return minimal;
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