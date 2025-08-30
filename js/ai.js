// AI - Simple AI integration for D&D Journal
// Radically simple: one file, direct API calls, no abstractions

import { 
  getYjsState, 
  getSetting, 
  getSessionQuestions, 
  setSessionQuestions, 
  clearSessionQuestions 
} from './yjs.js';
import { PROMPTS } from './prompts.js';
import { buildContext, hasContext } from './context.js';

// Check if AI is available
export const isAIEnabled = () => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const enabled = getSetting(state, 'ai-enabled', false);
  return Boolean(enabled && apiKey);
};

// Build messages array for OpenAI API
export const buildMessages = (systemPrompt, userPrompt) => {
  return systemPrompt 
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    : [{ role: 'user', content: userPrompt }];
};

// Simple AI call function with timeout to avoid hanging UI
export const callChatCompletion = (systemPrompt, userPrompt, timeoutMs = 20000) => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  
  const messages = buildMessages(systemPrompt, userPrompt);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages,
      max_tokens: 2500,
      temperature: 0.8
    }),
    signal: controller.signal
  })
  .then(response => {
    clearTimeout(timeoutId);
    if (!response.ok) {
      return response.json()
        .then(errorData => {
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        })
        .catch(() => {
          throw new Error(`HTTP ${response.status}`);
        });
    }
    return response.json();
  })
  .then(data => data.choices[0]?.message?.content?.trim())
  .catch(error => {
    // Normalize abort errors
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out while contacting AI service');
    }
    throw error;
  });
};

// Generate storytelling questions (uses Yjs for sync)
export const generateQuestions = (character = null, entries = null, forceRegenerate = false) => {
  if (!isAIEnabled() || !hasContext(character, entries)) {
    return Promise.resolve(null);
  }

  const state = getYjsState();
  
  // Return existing questions unless forced to regenerate
  if (!forceRegenerate) {
    const existingQuestions = getSessionQuestions(state);
    if (existingQuestions) {
      return Promise.resolve(existingQuestions);
    }
  }

  // Generate new questions - defer promise resolution by returning the chain
  return buildContext(character, entries)
    .then(context => {
      const userPrompt = PROMPTS.storytelling.user(context);
      return callChatCompletion(PROMPTS.storytelling.system, userPrompt);
    })
    .then(questions => {
      // Store in Yjs for sync
      if (questions) {
        setSessionQuestions(state, questions);
      }
      return questions;
    })
    .catch(error => {
      console.error('Failed to generate questions:', error);
      return null;
    });
};

// Get prompt preview (for debugging/display)
export const getPromptPreview = (character = null, entries = null) => {
  if (!isAIEnabled()) {
    return Promise.resolve(null);
  }

  return buildContext(character, entries)
    .then(context => {
      const userPrompt = PROMPTS.storytelling.user(context);
      
      return {
        systemPrompt: PROMPTS.storytelling.system,
        userPrompt: userPrompt,
        context: context
      };
    })
    .catch(error => {
      console.error('Failed to create prompt preview:', error);
      return null;
    });
};
