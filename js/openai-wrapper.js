// OpenAI Wrapper - Pure OpenAI interface with currying
// Following functional programming principles and style guide

import { getYjsState, getSetting } from './yjs.js';

// =============================================================================
// CORE OPENAI INTERFACE
// =============================================================================

// Check if API is available
export const isAPIAvailable = () => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const enabled = getSetting(state, 'ai-enabled', false);
  return Boolean(enabled && typeof apiKey === 'string' && apiKey.trim().length > 0 && apiKey.startsWith('sk-'));
};

// Base OpenAI call function
const callOpenAI = async (systemPrompt, userPrompt, options = {}) => {
  if (!isAPIAvailable()) {
    throw new Error('OpenAI API not available - check settings');
  }

  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const defaultOptions = {
    model: 'gpt-4.1-mini',
    maxTokens: 1200, // Increased from 400
    temperature: 0.7
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  const messages = systemPrompt 
    ? [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    : [{ role: 'user', content: userPrompt }];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: finalOptions.model,
        messages,
        max_tokens: finalOptions.maxTokens,
        temperature: finalOptions.temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim();
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
};

// =============================================================================
// CURRIED FUNCTION GENERATORS
// =============================================================================

// Create a function with a fixed system prompt
export const createSystemPromptFunction = (systemPrompt, options = {}) => {
  return async (userPrompt) => {
    return await callOpenAI(systemPrompt, userPrompt, options);
  };
};

// Create a function with no system prompt
export const createUserPromptFunction = (options = {}) => {
  return async (userPrompt) => {
    return await callOpenAI(null, userPrompt, options);
  };
};

// Create a function with a prompt template
export const createTemplateFunction = (promptTemplate, options = {}) => {
  return async (...args) => {
    const userPrompt = promptTemplate(...args);
    return await callOpenAI(null, userPrompt, options);
  };
};

// =============================================================================
// DIRECT CALL FUNCTIONS
// =============================================================================

// Direct call with user prompt only
export const callAI = async (prompt, options = {}) => {
  return await callOpenAI(null, prompt, options);
};

// Direct call with system and user prompts
export const callAIWithSystem = async (systemPrompt, userPrompt, options = {}) => {
  return await callOpenAI(systemPrompt, userPrompt, options);
};