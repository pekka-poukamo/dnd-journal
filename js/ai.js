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

// Check if AI is available (server-driven)
export const isAIEnabled = () => {
  // Assume enabled; caller may optionally check /ai/status elsewhere for UI
  return true;
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

// Simple AI call function via server proxy
const callAI = (systemPrompt, userPrompt) => {
  const state = getYjsState();
  const journalName = getSetting(state, 'journal-name', '') || undefined;
  const messages = buildMessages(systemPrompt, userPrompt);

  // Use same-origin server
  const isBrowser = typeof window !== 'undefined' && window.location && window.location.origin;
  const baseOrigin = isBrowser && (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ? window.location.origin
    : 'http://localhost:1234';

  return fetch(`${baseOrigin}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens: 2500, temperature: 0.8, room: journalName })
  })
  .then(response => {
    if (!response.ok) {
      return response.json()
        .then(errorData => {
          throw new Error(errorData.error || `HTTP ${response.status}`);
        })
        .catch(() => {
          throw new Error(`HTTP ${response.status}`);
        });
    }
    return response.json();
  })
  .then(data => data.content);
};

// Generate storytelling questions (uses Yjs for sync)
export const generateQuestions = (character = null, entries = null, forceRegenerate = false) => {
  if (!hasContext(character, entries)) {
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
