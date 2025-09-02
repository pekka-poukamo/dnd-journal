// Context - Unified context building for AI
// Single function for all AI context needs

import { getYjsState, getCharacterData, getEntries, getSummary } from './yjs.js';
import { SO_FAR_LATEST_KEY, RECENT_SUMMARY_KEY, backfillPartsIfMissing, PART_SIZE_DEFAULT } from './parts.js';
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

// Create adventure summary from older entries only
const createAdventureSummary = (entries, config) => {
  const adventureSummaryKey = 'journal:adventure-summary';
  
  // Generate individual entry summaries for all older entries
  const state = getYjsState();
  const entrySummaryPromises = entries.map(entry => {
    const entryKey = `entry:${entry.id}`;

    // Prefer cached structured summaries when available
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
  
  return Promise.all(entrySummaryPromises)
    .then(entrySummaries => {
      if (entrySummaries.length === 0) {
        return '';
      }
      
      const summaryText = entrySummaries.join('\n\n');
      return summarize(adventureSummaryKey, summaryText, config.metaWords);
    })
    .catch(error => {
      console.warn('Failed to generate adventure summary:', error);
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