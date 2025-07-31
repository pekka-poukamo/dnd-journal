// Simple Storytelling - Direct Y.js Integration
import { getCharacterData, getEntries } from './yjs.js';
import { createSystemPromptFunction, isAPIAvailable } from './openai-wrapper.js';
import { summarize } from './summarization.js';

const STORYTELLING_PROMPT = `You are a D&D storytelling companion. Create exactly 4 introspective questions as a numbered list:

1. A pivotal moment that shaped who they are
2. A current internal conflict they're wrestling with  
3. How recent events might change their path
4. An unexpected question that explores hidden depths

Make questions specific to their character and adventures.`;

// Create storytelling function
const callStorytelling = createSystemPromptFunction(STORYTELLING_PROMPT, { 
  temperature: 0.8, 
  maxTokens: 800
});

// Generate introspection questions for character
export const generateQuestions = async () => {
  if (!await isAPIAvailable()) return null;

  try {
    // Get data directly from Y.js
    const character = getCharacterData();
    const entries = getEntries();

    // Create simple character info
    const charInfo = character.name ? 
      `${character.name}, a ${character.race || 'character'} ${character.class || 'adventurer'}` :
      'An unnamed adventurer';

    // Create simple recent entries context (last 3 entries)
    const recentEntries = entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map(entry => `${entry.title}: ${entry.content.substring(0, 200)}...`)
      .join('\n\n');

    // Simple prompt
    const userPrompt = `Character: ${charInfo}

${character.backstory ? `Background: ${character.backstory.substring(0, 300)}...` : ''}

Recent Adventures:
${recentEntries || 'No recent adventures recorded.'}

Generate 4 introspective questions for this character.`;

    return await callStorytelling(userPrompt);
  } catch (error) {
    console.error('Storytelling generation failed:', error);
    return null;
  }
};



// Simple context check
export const hasGoodContext = () => {
  const character = getCharacterData();
  const entries = getEntries();
  return Boolean(character.name || character.backstory || entries.length > 0);
};

// Simple character context
export const getCharacterContext = async () => {
  const character = getCharacterData();
  const entries = getEntries();
  
  return {
    character,
    entries,
    hasContent: hasGoodContext()
  };
};