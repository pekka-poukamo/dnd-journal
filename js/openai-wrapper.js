// OpenAI Wrapper - Simple curried functions for reusable AI calls
// Following functional programming principles and style guide

import { loadDataWithFallback, createInitialSettings, STORAGE_KEYS } from './utils.js';

// =============================================================================
// CORE OPENAI INTERFACE
// =============================================================================

// Get API settings
const getSettings = () => loadDataWithFallback(STORAGE_KEYS.SETTINGS, createInitialSettings());

// Check if API is available
export const isAPIAvailable = () => {
  const settings = getSettings();
  return Boolean(settings.enableAIFeatures && settings.apiKey && settings.apiKey.startsWith('sk-'));
};

// Base OpenAI call function
const callOpenAI = async (systemPrompt, userPrompt, options = {}) => {
  if (!isAPIAvailable()) {
    throw new Error('OpenAI API not available - check settings');
  }

  const settings = getSettings();
  const defaultOptions = {
    model: 'gpt-4.1-mini',
    maxTokens: 400,
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
        'Authorization': `Bearer ${settings.apiKey}`,
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
export const createPromptFunction = (systemPrompt, options = {}) => {
  return async (userPrompt) => {
    return await callOpenAI(systemPrompt, userPrompt, options);
  };
};

// Create a function with no system prompt (for summaries)
export const createSimpleFunction = (options = {}) => {
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
// SPECIALIZED GENERATORS
// =============================================================================

// Generate storytelling function with fixed prompt
export const createStorytellingFunction = (systemPrompt) => {
  return createPromptFunction(systemPrompt, { 
    temperature: 0.8, 
    maxTokens: 400 
  });
};

// Generate summarization function 
export const createSummarizationFunction = () => {
  return createSimpleFunction({ 
    temperature: 0.3, 
    maxTokens: 200 
  });
};

// Generate function with prompt template for dynamic prompts
export const createDynamicFunction = (templateFn, options = {}) => {
  return async (...args) => {
    const prompt = templateFn(...args);
    return await callOpenAI(null, prompt, options);
  };
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Direct call for one-off requests
export const callAI = async (prompt, options = {}) => {
  return await callOpenAI(null, prompt, options);
};

// Call with system prompt for one-off requests
export const callAIWithSystem = async (systemPrompt, userPrompt, options = {}) => {
  return await callOpenAI(systemPrompt, userPrompt, options);
};