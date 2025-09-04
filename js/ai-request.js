// Centralized OpenAI Chat Completions request helper
import { getYjsState, getSetting } from './yjs.js';

export const callOpenAIChat = (messages, options = {}) => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const model = options.model || 'gpt-4o-mini';
  const maxTokens = options.maxTokens || 2500;
  const temperature = options.temperature ?? 0.7;
  const responseFormat = options.response_format;

  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature
  };
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(async (response) => {
    if (!response.ok) {
      try {
        const err = await response.json();
        const message = err?.error?.message || `${response.statusText}`;
        throw new Error(`HTTP ${response.status}: ${message}`);
      } catch (_) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    return response.json();
  });
};
