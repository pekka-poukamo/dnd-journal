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
    entryWords: 200,
    metaWords: 1000,
    partSize: 20
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

  // Prepare async entries context call using stable parts and recent summary
  let entriesPromise;
  if (entries && entries.length > 0) {
    const { closedParts, openPart } = partitionEntries(entries, config.partSize);
    const latestClosedPartIndex = closedParts.length;
    const latestClosedPart = latestClosedPartIndex > 0 ? closedParts[latestClosedPartIndex - 1] : null;

    const adventureSoFarPromise = latestClosedPart
      ? createPartSummary(latestClosedPart, config, latestClosedPartIndex)
      : Promise.resolve('');

    const recentSummaryPromise = openPart && openPart.length > 0
      ? createRecentSummary(openPart, config)
      : Promise.resolve('');

    entriesPromise = Promise.all([adventureSoFarPromise, recentSummaryPromise])
      .then(([adventureSoFar, recentSummary]) => {
        let result = '';
        if (adventureSoFar) {
          result += `\n\nAdventure So Far (Part ${latestClosedPartIndex}): ${adventureSoFar}`;
        }
        if (recentSummary) {
          result += `\n\nRecent Adventures: ${recentSummary}`;
        }
        if (!result) {
          result = '\n\nNo journal entries yet. This character is just beginning their adventure.';
        }
        return result;
      });
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

// Create entries info section with intelligent summarization
const createEntriesInfo = (entries, config, sectionTitle = 'Adventures') => {
  const state = getYjsState();
  const entryPromises = entries.map(entry => {
    const entryKey = `entry:${entry.id}`;

    // Prefer cached structured summaries when available
    const cached = getSummary(state, entryKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.summary) {
          return Promise.resolve(`\n- ${parsed.summary}`);
        }
      } catch {}
      return Promise.resolve(`\n- ${cached}`);
    }

    // Remove dates; include only content or summary
    if (getWordCount(entry.content) > config.entryWords) {
      return summarize(entryKey, entry.content, config.entryWords)
        .then(result => {
          if (result && typeof result === 'object' && result.summary) {
            return `\n- ${result.summary}`;
          }
          return `\n- ${result}`;
        })
        .catch(error => {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          return `\n- ${entry.content}`;
        });
    }

    // Content is short enough - include full content
    return Promise.resolve(`\n- ${entry.content}`);
  });
  
  return Promise.all(entryPromises)
    .then(entryInfos => `\n\n${sectionTitle}:` + entryInfos.join(''));
};

// Partition entries into stable closed parts and an open recent part
const partitionEntries = (entries, partSize) => {
  const total = entries.length;
  const numClosedParts = Math.floor(total / partSize);
  const closedParts = [];
  for (let i = 0; i < numClosedParts; i++) {
    const start = i * partSize;
    const end = start + partSize;
    closedParts.push(entries.slice(start, end));
  }
  const openPart = entries.slice(numClosedParts * partSize);
  return { closedParts, openPart };
};

// Build combined text from entries (uses cached entry summaries when available)
const buildCombinedEntryText = (entries, config) => {
  const state = getYjsState();
  const entryPromises = entries.map(entry => {
    const entryKey = `entry:${entry.id}`;

    const cached = getSummary(state, entryKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.summary) {
          return Promise.resolve(`${parsed.summary}`);
        }
      } catch {}
      return Promise.resolve(`${cached}`);
    }

    if (getWordCount(entry.content) > config.entryWords) {
      return summarize(entryKey, entry.content, config.entryWords)
        .then(result => {
          if (result && typeof result === 'object' && result.summary) {
            return `${result.summary}`;
          }
          return `${result}`;
        })
        .catch(error => {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          return `${entry.content}`;
        });
    }

    return Promise.resolve(`${entry.content}`);
  });

  return Promise.all(entryPromises).then(parts => parts.join('\n\n'));
};

// Create a stable part summary (~1000 words), cached under journal:part:<index>
const createPartSummary = (entries, config, partIndex) => {
  return buildCombinedEntryText(entries, config)
    .then(summaryText => summarize(`journal:part:${partIndex}`, summaryText, config.metaWords))
    .catch(error => {
      console.warn(`Failed to generate part summary ${partIndex}:`, error);
      return '';
    });
};

// Create a ~1000-word recent summary (open part). This is not stable and may be cleared on changes.
const createRecentSummary = (entries, config) => {
  return buildCombinedEntryText(entries, config)
    .then(summaryText => summarize('journal:recent-summary', summaryText, config.metaWords))
    .catch(error => {
      console.warn('Failed to generate recent summary:', error);
      return '';
    });
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