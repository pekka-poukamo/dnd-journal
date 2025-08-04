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

// Simple AI call function
const callAI = async (systemPrompt, userPrompt) => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  
  const messages = buildMessages(systemPrompt, userPrompt);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      messages,
      max_tokens: 1200,
      temperature: 0.8
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim();
};

// Generate storytelling questions (uses Yjs for sync)
export const generateQuestions = async (character = null, entries = null, forceRegenerate = false) => {
  if (!isAIEnabled() || !hasContext(character, entries)) {
    return null;
  }

  try {
    const state = getYjsState();
    
    // Return existing questions unless forced to regenerate
    if (!forceRegenerate) {
      const existingQuestions = getSessionQuestions(state);
      if (existingQuestions) {
        return existingQuestions;
      }
    }

    // Generate new questions
    const context = await buildContext(character, entries);
    const userPrompt = PROMPTS.storytelling.user(context);
    const questions = await callAI(PROMPTS.storytelling.system, userPrompt);
    
    // Store in Yjs for sync
    if (questions) {
      setSessionQuestions(state, questions);
    }
    
    return questions;
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return null;
  }
};

// Get prompt preview (for debugging/display)
export const getPromptPreview = async (character = null, entries = null) => {
  if (!isAIEnabled()) {
    return null;
  }

  try {
    const context = await buildContext(character, entries);
    const userPrompt = PROMPTS.storytelling.user(context);
    
    return {
      systemPrompt: PROMPTS.storytelling.system,
      userPrompt: userPrompt,
      context: context
    };
  } catch (error) {
    console.error('Failed to create prompt preview:', error);
    return null;
  }
};
