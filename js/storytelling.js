// Storytelling - D&D narrative questions using summaries when relevant
// Following functional programming principles and style guide

import { createInitialJournalState } from './utils.js';
import { getCharacter, getEntries } from './yjs.js';
import { createSystemPromptFunction, isAPIAvailable } from './openai-wrapper.js';
import { getAllSummaries, summarize } from './summarization.js';
import { getFormattedCharacterForAI } from './character.js';

// =============================================================================
// STORYTELLING CONFIGURATION
// =============================================================================

const STORYTELLING_PROMPT = `You are a D&D storytelling companion. Create exactly 4 introspective questions as a numbered list:

1. A pivotal moment that shaped who they are
2. A current internal conflict they're wrestling with  
3. How recent events might change their path
4. An unexpected question that explores hidden depths

Format as numbered list. Make questions thought-provoking and character-specific.`;

// =============================================================================
// CONTEXT BUILDERS - PURE FUNCTIONS
// =============================================================================

// Get character data for storytelling context
const getCharacterContext = () => {
  try {
    const character = getCharacter();
    
    if (!character.name && !character.race && !character.class && !character.backstory) {
      return 'Character: No character information available yet.';
    }
    
    const parts = [];
    if (character.name) parts.push(`Name: ${character.name}`);
    if (character.race) parts.push(`Race: ${character.race}`);
    if (character.class) parts.push(`Class: ${character.class}`);
    if (character.backstory) parts.push(`Background: ${character.backstory}`);
    if (character.notes) parts.push(`Notes: ${character.notes}`);
    
    return `Character: ${parts.join(', ')}`;
  } catch (error) {
    console.error('Error getting character context:', error);
    return 'Character: Information unavailable.';
  }
};

// Get recent entries for storytelling context
const getRecentEntriesContext = () => {
  try {
    const entries = getEntries();
    
    if (!entries || entries.length === 0) {
      return 'Recent Adventures: No journal entries yet.';
    }
    
    // Get the 3 most recent entries
    const recentEntries = entries
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 3);
    
    const entriesText = recentEntries
      .map(entry => `"${entry.title}": ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}`)
      .join('\n\n');
    
    return `Recent Adventures:\n${entriesText}`;
  } catch (error) {
    console.error('Error getting entries context:', error);
    return 'Recent Adventures: Information unavailable.';
  }
};

// Get summaries context for storytelling
const getSummariesContext = () => {
  try {
    const summaries = getAllSummaries();
    
    if (!summaries || Object.keys(summaries).length === 0) {
      return 'Adventure Summaries: None available yet.';
    }
    
    const summaryTexts = Object.entries(summaries)
      .filter(([key, summary]) => summary && summary.content)
      .slice(0, 5) // Limit to 5 most relevant summaries
      .map(([key, summary]) => {
        const summaryType = key.startsWith('character:') ? 'Character' : 'Adventure';
        return `${summaryType} Summary: ${summary.content}`;
      })
      .join('\n\n');
    
    return summaryTexts || 'Adventure Summaries: None available yet.';
  } catch (error) {
    console.error('Error getting summaries context:', error);
    return 'Adventure Summaries: Information unavailable.';
  }
};

// Build complete storytelling context
export const buildStorytellingContext = () => {
  const character = getCharacterContext();
  const recentEntries = getRecentEntriesContext();
  const summaries = getSummariesContext();
  
  return `${character}\n\n${recentEntries}\n\n${summaries}`;
};

// =============================================================================
// STORYTELLING API
// =============================================================================

// Create storytelling prompt function
const createStorytellingPrompt = createSystemPromptFunction(STORYTELLING_PROMPT);

// Generate storytelling questions
export const generateStorytellingQuestions = async () => {
  if (!isAPIAvailable()) {
    return null;
  }
  
  try {
    const context = buildStorytellingContext();
    const questions = await createStorytellingPrompt(context);
    
    return questions;
  } catch (error) {
    console.error('Error generating storytelling questions:', error);
    return null;
  }
};

// Get storytelling questions (with caching)
export const getStorytellingQuestions = async () => {
  try {
    return await generateStorytellingQuestions();
  } catch (error) {
    console.error('Error getting storytelling questions:', error);
    return null;
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Check if enough content exists for storytelling
export const hasEnoughContentForStorytelling = () => {
  try {
    const character = getCharacter();
    const entries = getEntries();
    
    // Need either character backstory or at least one journal entry
    const hasCharacterStory = character.backstory && character.backstory.trim().length > 50;
    const hasJournalEntries = entries && entries.length > 0;
    
    return hasCharacterStory || hasJournalEntries;
  } catch (error) {
    console.error('Error checking content for storytelling:', error);
    return false;
  }
};

// Get storytelling stats
export const getStorytellingStats = () => {
  try {
    const character = getCharacter();
    const entries = getEntries();
    const summaries = getAllSummaries();
    
    return {
      hasCharacter: Boolean(character.name || character.backstory),
      entryCount: entries ? entries.length : 0,
      summaryCount: summaries ? Object.keys(summaries).length : 0,
      readyForStorytelling: hasEnoughContentForStorytelling()
    };
  } catch (error) {
    console.error('Error getting storytelling stats:', error);
    return {
      hasCharacter: false,
      entryCount: 0,
      summaryCount: 0,
      readyForStorytelling: false
    };
  }
};