// Context - Unified context building for AI
// Single function for all AI context needs

import { getYjsState, getCharacterData, getEntries, getSummary } from './yjs.js';
import { SO_FAR_LATEST_KEY, RECENT_SUMMARY_KEY, backfillPartsIfMissing, PART_SIZE_DEFAULT } from './parts.js';
import { summarize } from './summarization.js';
import { getWordCount } from './utils.js';

// Build context string for AI from character and entries
export const buildContext = (character = null, entries = null) => {
  // Use provided data or fall back to Y.js state
  if (!character || !entries) {
    const state = getYjsState();
    character = character || getCharacterData(state);
    entries = entries || getEntries(state);
  }

  const config = {
    characterWords: 300,
    entryWords: 200,
    metaWords: 1000,
    partSize: 10
  };

  // Build character context string
  let characterInfo = `Character: ${character?.name || 'unnamed adventurer'}`;
  if (character?.race) characterInfo += ` (${character.race})`;
  if (character?.class) characterInfo += ` - ${character.class}`;

  // Prepare async character section calls
  const characterSectionFields = [
    character?.backstory ? ['backstory', character.backstory] : null,
    character?.notes ? ['notes', character.notes] : null
  ].filter(Boolean);

  const characterSectionPromises = characterSectionFields.map(([field, content]) =>
    buildCharacterSection(field, content, config)
  );

  // Prepare async entries context call (Phase 3: use parts summaries when available)
  let entriesPromise;
  if (entries && entries.length > 0) {
    entriesPromise = (async () => {
      const state = getYjsState();
      // Ensure required summaries exist
      await backfillPartsIfMissing(state, PART_SIZE_DEFAULT);
      const soFar = getSummary(state, SO_FAR_LATEST_KEY) || '';
      const recent = getSummary(state, RECENT_SUMMARY_KEY) || '';
      // Only use parts-based summaries; do not fallback to entries list
      let result = '';
      if (soFar) result += `\n\nAdventure So Far: ${soFar}`;
      if (recent) result += `\n\nRecent Adventures: ${recent}`;
      return result || '\n\nNo journal summaries yet.';
    })();
  } else {
    entriesPromise = Promise.resolve('\n\nNo journal entries yet. This character is just beginning their adventure.');
  }

  // Return promise that resolves all async work in parallel
  return Promise.all([
    Promise.all(characterSectionPromises),
    entriesPromise
  ])
  .then(([characterSections, entriesInfo]) => {
    return characterInfo + characterSections.join('') + entriesInfo;
  });
};

// Build character section (backstory or notes) with intelligent summarization
const buildCharacterSection = (fieldName, content, config) => {
  const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  
  // Check if content is too long for direct inclusion
  if (getWordCount(content) > config.characterWords) {
    const summaryKey = `character:${fieldName}`;
    
    return summarize(summaryKey, content, config.characterWords)
      .then(summary => `\n${capitalizedName} (Summary): ${summary}`)
      .catch(error => {
        console.warn(`Failed to generate ${fieldName} summary:`, error);
        return `\n${capitalizedName}: ${content}`;
      });
  } else {
    // Content is short enough to include directly
    return Promise.resolve(`\n${capitalizedName}: ${content}`);
  }
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