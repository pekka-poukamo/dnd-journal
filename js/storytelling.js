// Simple Storytelling - Pure Functional Y.js Integration
import { getYjsState, getCharacterData, getEntries } from './yjs.js';
import { createSystemPromptFunction, isAPIAvailable } from './openai-wrapper.js';
import { summarize } from './summarization.js';

// Generate introspection questions using AI
export const generateQuestions = async (character, entries) => {
  if (!isAPIAvailable()) {
    return null;
  }
  
  try {
    const contextSummary = await buildContextSummary(character, entries);
    const prompt = `Based on this D&D character and their recent adventures, suggest 3-5 introspective questions they might ask themselves. Focus on character development, moral dilemmas, relationships, and future goals.

${contextSummary}

Please provide thoughtful questions that would help develop this character's personality and story arc.`;

    const generateQuestions = createSystemPromptFunction(
      'You are a skilled D&D storyteller who helps players develop rich character narratives through introspective questions.'
    );
    
    const result = await generateQuestions(prompt);
    return result.choices?.[0]?.message?.content?.trim() || null;
    
  } catch (error) {
    console.error('Question generation failed:', error);
    return null;
  }
};

// Build context summary from character and entries
const buildContextSummary = async (character, entries) => {
  const characterName = character?.name || 'unnamed adventurer';
  
  // Character summary
  let characterSummary = `Character: ${characterName}`;
  if (character?.race) characterSummary += ` (${character.race})`;
  if (character?.class) characterSummary += ` - ${character.class}`;
  
  if (character?.backstory) {
    try {
      const backstorySummary = await summarize(character.backstory, 'character');
      characterSummary += `\nBackstory: ${backstorySummary}`;
    } catch {
      characterSummary += `\nBackstory: ${character.backstory.substring(0, 200)}...`;
    }
  }
  
  // Recent entries summary
  let entriesSummary = '';
  if (entries && entries.length > 0) {
    const recentEntries = entries.slice(-3); // Last 3 entries
    entriesSummary = '\nRecent Adventures:\n';
    
    for (const entry of recentEntries) {
      try {
        const entrySummary = await summarize(entry.content, 'journal');
        entriesSummary += `- ${entry.title}: ${entrySummary}\n`;
      } catch {
        entriesSummary += `- ${entry.title}: ${entry.content.substring(0, 100)}...\n`;
      }
    }
  } else {
    entriesSummary = '\nNo journal entries yet. This character is just beginning their adventure.';
  }
  
  return characterSummary + entriesSummary;
};

// Simple context check
export const hasGoodContext = () => {
  const state = getYjsState();
  const character = getCharacterData(state);
  const entries = getEntries(state);
  return Boolean(character.name || character.backstory || entries.length > 0);
};

// Simple character context
export const getCharacterContext = async () => {
  const state = getYjsState();
  const character = getCharacterData(state);
  const entries = getEntries(state);
  
  return {
    character,
    entries,
    hasContent: hasGoodContext()
  };
};