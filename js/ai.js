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
import { callOpenAIChat } from './ai-request.js';

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

// Simple AI call function (centralized)
const callAI = (systemPrompt, userPrompt) => {
  const messages = buildMessages(systemPrompt, userPrompt);
  return callOpenAIChat(messages, { temperature: 0.8 })
    .then((data) => data.choices[0]?.message?.content?.trim());
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
      return callAI(PROMPTS.storytelling.system, userPrompt);
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
