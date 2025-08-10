// Context - Unified context building for AI
// Single function for all AI context needs

import { getYjsState, getCharacterData, getEntries, getSummary } from './yjs.js';
import { summarize } from './summarization.js';
import { formatDate, getWordCount } from './utils.js';

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
    entryWords: 200
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

  // Prepare async entries context call (anchor-based)
  let entriesPromise;
  if (entries && entries.length > 0) {
    entriesPromise = buildEntriesWithLatestAnchorSeq(entries, config);
  } else {
    entriesPromise = Promise.resolve('\n\nNo journal entries yet. This character is just beginning their adventure.');
  }

  // Return promise that resolves all async work in parallel
  return Promise.all([
    Promise.all(characterSectionPromises),
    entriesPromise
  ])
  .then(([characterSections, entriesInfo]) => {
    // Combine all context
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

// Create entries info section with intelligent summarization
const createEntriesInfo = (entries, config, sectionTitle = 'Adventures') => {
  const entryPromises = entries.map(entry => {
    // Remove dates; include only content or summary
    if (getWordCount(entry.content) > config.entryWords) {
      const entryKey = `entry:${entry.id}`;
      return summarize(entryKey, entry.content, config.entryWords)
        .then(entrySummary => `\n- ${entrySummary}`)
        .catch(error => {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          return `\n- ${entry.content}`;
        });
    } else {
      // Content is short enough - include full content
      return Promise.resolve(`\n- ${entry.content}`);
    }
  });
  
  return Promise.all(entryPromises)
    .then(entryInfos => `\n\n${sectionTitle}:` + entryInfos.join(''));
};

// Anchor-based entries composition using anchor seq pointer
const buildEntriesWithLatestAnchorSeq = (entries, config) => {
  const state = getYjsState();
  const latestSeq = state.settingsMap.get('latest-anchor-seq') || 0;
  const key = latestSeq > 0 ? `journal:anchor:seq:${latestSeq}` : null;
  const anchorText = key ? getSummary(state, key) : null;
  const tail = latestSeq > 0 ? entries.filter(e => (e.seq || 0) > latestSeq) : entries;
  const anchorBlock = anchorText ? `\n\nAdventure So Far (Anchor upto ${latestSeq}): ${anchorText}` : '';
  return createEntriesInfo(tail, config, anchorText ? 'Recent Adventures' : 'Adventures')
    .then(tailBlock => `${anchorBlock}${tailBlock}`);
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