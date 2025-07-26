// Storytelling - D&D narrative questions using summaries when relevant
// Following functional programming principles and style guide

import { loadDataWithFallback, STORAGE_KEYS, createInitialJournalState } from './utils.js';
import { createSystemPromptFunction, isAPIAvailable } from './openai-wrapper.js';
import { getAllSummaries, summarize } from './summarization.js';

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
const callStorytelling = createSystemPromptFunction(STORYTELLING_PROMPT, { 
  temperature: 0.8, 
  maxTokens: 400 
});

// =============================================================================
// CONTENT FORMATTING FOR AI
// =============================================================================

// Get comprehensive formatted entries for AI context
const getFormattedEntries = async (entries) => {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const formattedContent = [];
  let wordCount = 0;
  const targetWords = 1500; // Leave room for character info
  
  // Add recent entries in full (last 3)
  const recentEntries = sortedEntries.slice(0, 3);
  recentEntries.forEach(entry => {
    const content = `Recent Adventure: ${entry.title}\n${entry.content}`;
    formattedContent.push(content);
    wordCount += content.split(/\s+/).length;
  });
  
  // Add summaries for older entries using their IDs
  const olderEntries = sortedEntries.slice(3);
  for (const entry of olderEntries) {
    if (wordCount < targetWords && entry.id) {
      const summary = await summarize(`entry:${entry.id}`, entry.content);
      if (summary) {
        const content = `Past Adventure: ${entry.title} - ${summary}`;
        formattedContent.push(content);
        wordCount += content.split(/\s+/).length;
      }
    }
  }
  
  // Add meta-summaries for broader historical context
  const allSummaries = getAllSummaries();
  const metaSummaries = allSummaries.filter(s => s.type === 'meta');
  metaSummaries.forEach(meta => {
    if (wordCount < targetWords) {
      const content = `Adventure Chronicles: ${meta.content}`;
      formattedContent.push(content);
      wordCount += content.split(/\s+/).length;
    }
  });
  
  return formattedContent;
};

// Get formatted character with automatic summarization for long fields
const getFormattedCharacter = async (character) => {
  const formatted = { ...character };
  
  // Auto-summarize long character fields
  const fieldsToCheck = ['backstory', 'notes'];
  
  for (const field of fieldsToCheck) {
    if (character[field] && character[field].length > 200) {
      const summaryKey = `character:${field}`;
      const summary = await summarize(summaryKey, character[field]);
      if (summary) {
        formatted[field] = `${summary} (summarized)`;
      }
    }
  }
  
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

  // Format character info with auto-summarization
  const formattedChar = await getFormattedCharacter(finalCharacter);
  const charInfo = formattedChar.name ? 
    `${formattedChar.name}, a ${formattedChar.race || 'character'} ${formattedChar.class || 'adventurer'}` :
    'your character';
    
  const backstory = formattedChar.backstory ? `\n\nCharacter Background:\n${formattedChar.backstory}` : '';
  const notes = formattedChar.notes ? `\n\nCharacter Notes:\n${formattedChar.notes}` : '';
  
  // Format entries with comprehensive summaries
  const formattedEntries = await getFormattedEntries(finalEntries);
  const entriesContext = formattedEntries.length > 0 ? 
    `\n\n=== ADVENTURE HISTORY ===\n${formattedEntries.join('\n\n')}` : '';

  const prompt = `Character: ${charInfo}${backstory}${notes}${entriesContext}

Create 4 introspective questions for this character based on their complete history and development.`;

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
export const getCharacterContext = async () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const character = journal.character || {};
  const entries = journal.entries || [];
  
  const formattedCharacter = await getFormattedCharacter(character);
  const formattedEntries = await getFormattedEntries(entries);
  
  // Calculate total context length
  const characterText = JSON.stringify(formattedCharacter);
  const entriesText = formattedEntries.join(' ');
  const totalWords = (characterText + entriesText).split(/\s+/).length;
  
  return {
    character: formattedCharacter,
    entries: formattedEntries,
    contextLength: {
      totalWords,
      characterWords: characterText.split(/\s+/).length,
      entriesWords: entriesText.split(/\s+/).length
    },
    summaryStats: {
      totalSummaries: getAllSummaries().length,
      metaSummaries: getAllSummaries().filter(s => s.type === 'meta').length,
      regularSummaries: getAllSummaries().filter(s => s.type === 'regular').length
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