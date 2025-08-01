// Context - Unified context building for AI
// Single function for all AI context needs

import { getYjsState, getCharacterData, getEntries, getSummary } from './yjs.js';

// Build context string for AI from character and entries
export const buildContext = async (character = null, entries = null, options = {}) => {
  // Use provided data or fall back to Y.js state
  if (!character || !entries) {
    const state = getYjsState();
    character = character || getCharacterData(state);
    entries = entries || getEntries(state);
  }
  
  const defaults = {
    maxEntries: 3,
    maxCharacterLength: 200,
    maxEntryLength: 200,
    useSummaries: true
  };
  const config = { ...defaults, ...options };
  
  // Build character context
  const characterName = character?.name || 'unnamed adventurer';
  let characterInfo = `Character: ${characterName}`;
  
  if (character?.race) characterInfo += ` (${character.race})`;
  if (character?.class) characterInfo += ` - ${character.class}`;
  
  // Add backstory (with summaries if available)
  if (character?.backstory) {
    if (config.useSummaries) {
      const state = getYjsState();
      const backstorySummary = getSummary(state, 'character:backstory');
      if (backstorySummary) {
        characterInfo += `\nBackstory: ${backstorySummary}`;
      } else {
        characterInfo += `\nBackstory: ${character.backstory.substring(0, config.maxCharacterLength)}${character.backstory.length > config.maxCharacterLength ? '...' : ''}`;
      }
    } else {
      characterInfo += `\nBackstory: ${character.backstory.substring(0, config.maxCharacterLength)}${character.backstory.length > config.maxCharacterLength ? '...' : ''}`;
    }
  }
  
  // Add notes (with summaries if available)  
  if (character?.notes) {
    if (config.useSummaries) {
      const state = getYjsState();
      const notesSummary = getSummary(state, 'character:notes');
      if (notesSummary) {
        characterInfo += `\nNotes: ${notesSummary}`;
      } else {
        characterInfo += `\nNotes: ${character.notes.substring(0, config.maxCharacterLength)}${character.notes.length > config.maxCharacterLength ? '...' : ''}`;
      }
    } else {
      characterInfo += `\nNotes: ${character.notes.substring(0, config.maxCharacterLength)}${character.notes.length > config.maxCharacterLength ? '...' : ''}`;
    }
  }
  
  // Build entries context
  let entriesInfo = '';
  if (entries && entries.length > 0) {
    const recentEntries = entries.slice(-config.maxEntries);
    entriesInfo = '\n\nRecent Adventures:';
    
    for (const entry of recentEntries) {
      if (config.useSummaries) {
        const state = getYjsState();
        const entrySummary = getSummary(state, `entry:${entry.id}`);
        if (entrySummary) {
          entriesInfo += `\n- ${entry.title}: ${entrySummary}`;
        } else {
          entriesInfo += `\n- ${entry.title}: ${entry.content.substring(0, config.maxEntryLength)}${entry.content.length > config.maxEntryLength ? '...' : ''}`;
        }
      } else {
        entriesInfo += `\n- ${entry.title}: ${entry.content.substring(0, config.maxEntryLength)}${entry.content.length > config.maxEntryLength ? '...' : ''}`;
      }
    }
  } else {
    entriesInfo = '\n\nNo journal entries yet. This character is just beginning their adventure.';
  }
  
  return characterInfo + entriesInfo;
};

// Check if we have enough context for meaningful AI generation
export const hasContext = (character = null, entries = null) => {
  if (!character || !entries) {
    const state = getYjsState();
    character = character || getCharacterData(state);
    entries = entries || getEntries(state);
  }
  return Boolean(character?.name || character?.backstory || character?.notes || entries?.length > 0);
};

// Get character and entries data (utility function)
export const getContextData = (character = null, entries = null) => {
  if (!character || !entries) {
    const state = getYjsState();
    character = character || getCharacterData(state);
    entries = entries || getEntries(state);
  }
  
  return {
    character,
    entries,
    hasContent: hasContext(character, entries)
  };
};