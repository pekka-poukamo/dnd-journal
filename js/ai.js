// AI - Simple AI integration for D&D Journal
// Radically simple: one file, direct API calls, no abstractions

import { getYjsState, getSetting } from './yjs.js';
import { PROMPTS } from './prompts.js';
import { buildContext, hasContext } from './context.js';

// Simple cache: just remember the last questions and context
let lastQuestions = null;
let lastContextHash = null;

// Clear the simple cache
export const clearQuestionsCache = () => {
  lastQuestions = null;
  lastContextHash = null;
};

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
      model: 'gpt-4o-mini',
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

// Simple hash of the data that affects questions
const getContextHash = (character, entries) => {
  const data = {
    character: character ? JSON.stringify(character) : '',
    entries: entries ? entries.map(e => e.content + e.timestamp).join('') : ''
  };
  return JSON.stringify(data);
};

// Generate storytelling questions with simple caching
export const generateQuestions = async (character = null, entries = null, forceRegenerate = false) => {
  if (!isAIEnabled() || !hasContext(character, entries)) {
    return null;
  }

  try {
    // Check if we can use cached questions
    const currentHash = getContextHash(character, entries);
    if (!forceRegenerate && lastQuestions && lastContextHash === currentHash) {
      return lastQuestions;
    }

    // Generate new questions
    const context = await buildContext(character, entries, { 
      ensureFullHistory: true,
      maxCharacterLength: 800, // Allow more character detail for better questions
      maxEntryLength: 400 // Allow more entry detail for better questions
    });
    const userPrompt = PROMPTS.storytelling.user(context);
    const questions = await callAI(PROMPTS.storytelling.system, userPrompt);
    
    // Cache the result
    if (questions) {
      lastQuestions = questions;
      lastContextHash = currentHash;
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
    const context = await buildContext(character, entries, { 
      ensureFullHistory: true,
      maxCharacterLength: 800,
      maxEntryLength: 400
    });
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
