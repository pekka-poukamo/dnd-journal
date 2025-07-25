// Storytelling - D&D narrative questions using summaries when relevant
// Following functional programming principles and style guide

import { loadDataWithFallback, STORAGE_KEYS, createInitialJournalState } from './utils.js';
import { createStorytellingFunction, isAPIAvailable } from './openai-wrapper.js';
import { getAllSummaries, getSummariesByPattern } from './summarization.js';

// =============================================================================
// STORYTELLING CONFIGURATION
// =============================================================================

const STORYTELLING_PROMPT = `You are a D&D storytelling companion. Create exactly 4 introspective questions as a numbered list:

1. A pivotal moment that shaped who they are
2. A current internal conflict they're wrestling with  
3. How recent events might change their path
4. An unexpected question that explores hidden depths

Make questions specific to their character and adventures.`;

// =============================================================================
// AI FUNCTION (CURRIED)
// =============================================================================

// Create storytelling function with fixed prompt and settings
const callStorytelling = createStorytellingFunction(STORYTELLING_PROMPT);

// =============================================================================
// CONTENT FORMATTING FOR AI
// =============================================================================

// Get formatted entries for AI context (mix of recent + summaries)
const getFormattedEntries = (entries) => {
  // Get recent entries (last 2 in full)
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const recentEntries = sortedEntries.slice(0, 2);
  
  // Get entry summaries
  const entrySummaries = getSummariesByPattern('^entry:');
  
  // Get meta-summaries
  const allSummaries = getAllSummaries();
  const metaSummaries = allSummaries.filter(s => s.type === 'meta');
  
  const formattedContent = [];
  
  // Add recent entries in full
  recentEntries.forEach(entry => {
    formattedContent.push(`Recent: ${entry.title} - ${entry.content.substring(0, 300)}...`);
  });
  
  // Add individual summaries
  entrySummaries.slice(0, 3).forEach(summary => {
    formattedContent.push(`Summary: ${summary.content}`);
  });
  
  // Add meta-summaries for broader context
  metaSummaries.slice(0, 2).forEach(meta => {
    formattedContent.push(`Adventures: ${meta.content}`);
  });
  
  return formattedContent;
};

// Get formatted character with summaries if available
const getFormattedCharacter = (character) => {
  // Get character field summaries
  const charSummaries = getSummariesByPattern('^character:');
  
  const formatted = { ...character };
  
  // Replace long fields with summaries if available
  charSummaries.forEach(summary => {
    const field = summary.key.replace('character:', '');
    if (character[field] && character[field].length > 200) {
      formatted[field] = `${summary.content} (summarized)`;
    }
  });
  
  return formatted;
};

// =============================================================================
// STORYTELLING FUNCTIONS
// =============================================================================

// Generate introspection questions for character
export const generateQuestions = async (character = null, entries = null) => {
  if (!isAPIAvailable()) return null;

  // Load from storage if not provided
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const finalCharacter = character || journal.character || {};
  const finalEntries = entries || journal.entries || [];

  // Format character info
  const formattedChar = getFormattedCharacter(finalCharacter);
  const charInfo = formattedChar.name ? 
    `${formattedChar.name}, a ${formattedChar.race || 'character'} ${formattedChar.class || 'adventurer'}` :
    'your character';
    
  const backstory = formattedChar.backstory ? `\n\nBackground: ${formattedChar.backstory}` : '';
  const notes = formattedChar.notes ? `\n\nNotes: ${formattedChar.notes}` : '';
  
  // Format entries with summaries
  const formattedEntries = getFormattedEntries(finalEntries);
  const entriesContext = formattedEntries.length > 0 ? 
    `\n\nAdventures:\n${formattedEntries.join('\n')}` : '';

  const prompt = `Character: ${charInfo}${backstory}${notes}${entriesContext}

Create 4 introspective questions for this character.`;

  try {
    return await callStorytelling(prompt);
  } catch (error) {
    console.error('Failed to generate questions:', error);
    return null;
  }
};

// Get introspection questions using current journal data
export const getIntrospectionQuestions = async () => {
  return await generateQuestions();
};

// =============================================================================
// CONTEXT UTILITIES
// =============================================================================

// Get all available context for character (for debugging/preview)
export const getCharacterContext = () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const character = journal.character || {};
  const entries = journal.entries || [];
  
  return {
    character: getFormattedCharacter(character),
    entries: getFormattedEntries(entries),
    summaryStats: {
      totalSummaries: getAllSummaries().length,
      entrySummaries: getSummariesByPattern('^entry:').length,
      characterSummaries: getSummariesByPattern('^character:').length,
      metaSummaries: getAllSummaries().filter(s => s.type === 'meta').length
    }
  };
};

// Check if storytelling has good context
export const hasGoodContext = () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const summaries = getAllSummaries();
  
  const hasCharacter = Boolean(journal.character?.name);
  const hasContent = (journal.entries?.length || 0) > 0 || summaries.length > 0;
  
  return {
    hasCharacter,
    hasContent,
    ready: hasCharacter && hasContent
  };
};

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

export const generateIntrospectionQuestions = generateQuestions;
export const generateIntrospectionPrompt = getIntrospectionQuestions;