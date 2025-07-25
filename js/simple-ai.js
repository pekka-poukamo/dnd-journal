// Simple AI - Focused only on D&D storytelling questions
// Following functional programming principles and style guide

import { loadDataWithFallback, createInitialSettings, STORAGE_KEYS } from './utils.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const STORYTELLING_PROMPT = `You are a D&D storytelling companion. Create exactly 4 introspective questions as a numbered list:

1. A pivotal moment that shaped who they are
2. A current internal conflict they're wrestling with  
3. How recent events might change their path
4. An unexpected question that explores hidden depths

Make questions specific to their character and adventures.`;

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

// Check if AI is available
export const isAIAvailable = () => {
  const settings = loadDataWithFallback(STORAGE_KEYS.SETTINGS, createInitialSettings());
  return Boolean(settings.enableAIFeatures && settings.apiKey && settings.apiKey.startsWith('sk-'));
};

// Call OpenAI for storytelling
export const callAIForStorytelling = async (prompt, maxTokens = 400) => {
  const settings = loadDataWithFallback(STORAGE_KEYS.SETTINGS, createInitialSettings());
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: STORYTELLING_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.8
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim();
};

// Call OpenAI for summaries (no system prompt)
export const callAIForSummary = async (prompt, maxTokens = 200) => {
  const settings = loadDataWithFallback(STORAGE_KEYS.SETTINGS, createInitialSettings());
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim();
};

// =============================================================================
// D&D STORYTELLING
// =============================================================================

export const generateQuestions = async (character, entries) => {
  if (!isAIAvailable()) return null;

  // Format character info
  const charInfo = character.name ? 
    `${character.name}, a ${character.race || 'character'} ${character.class || 'adventurer'}` :
    'your character';
    
  const backstory = character.backstory ? `\n\nBackground: ${character.backstory}` : '';
  const notes = character.notes ? `\n\nNotes: ${character.notes}` : '';
  
  // Format recent entries (just take last 3 in full)
  const recentEntries = entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3)
    .map(entry => `- ${entry.title}: ${entry.content.substring(0, 200)}...`)
    .join('\n');
    
  const entriesContext = recentEntries ? `\n\nRecent Adventures:\n${recentEntries}` : '';

  const prompt = `Character: ${charInfo}${backstory}${notes}${entriesContext}

Create 4 introspective questions for this character.`;

  try {
    return await callAIForStorytelling(prompt);
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return null;
  }
};

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

export const isAIEnabled = isAIAvailable;
export const generateIntrospectionQuestions = generateQuestions;