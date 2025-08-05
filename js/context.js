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
    metaWords: 1000
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

  // Prepare async entries context call
  let entriesPromise;
  if (entries && entries.length > 0) {
    if (entries.length > 10) {
      // Parallel meta-summary and recent entries
      entriesPromise = Promise.all([
        createMetaSummary(entries, config),
        createEntriesInfo(entries.slice(-5), config, 'Recent Detailed Adventures')
      ]).then(([metaSummary, recentEntries]) =>
        `\n\nAdventure History: ${metaSummary}${recentEntries}`
      );
    } else {
      entriesPromise = createEntriesInfo(entries, config);
    }
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
    const entryLabel = formatDate(entry.timestamp);
    
    if (getWordCount(entry.content) > config.entryWords) {
      const entryKey = `entry:${entry.id}`;
      
      return summarize(entryKey, entry.content, config.entryWords)
        .then(entrySummary => `\n- ${entryLabel}: ${entrySummary}`)
        .catch(error => {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          return `\n- ${entryLabel}: ${entry.content}`;
        });
    } else {
      // Content is short enough - include full content
      return Promise.resolve(`\n- ${entryLabel}: ${entry.content}`);
    }
  });
  
  return Promise.all(entryPromises)
    .then(entryInfos => `\n\n${sectionTitle}:` + entryInfos.join(''));
};

// Create meta-summary from all entries
const createMetaSummary = (entries, config) => {
  const metaSummaryKey = 'journal:meta-summary';
  
  // Generate individual entry summaries for all entries
  const entrySummaryPromises = entries.map(entry => {
    const entryLabel = formatDate(entry.timestamp);
    
    if (getWordCount(entry.content) > config.entryWords) {
      const entryKey = `entry:${entry.id}`;
      
      return summarize(entryKey, entry.content, config.entryWords)
        .then(entrySummary => `${entryLabel}: ${entrySummary}`)
        .catch(error => {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          return `${entryLabel}: ${entry.content}`;
        });
    } else {
      return Promise.resolve(`${entryLabel}: ${entry.content}`);
    }
  });
  
  return Promise.all(entrySummaryPromises)
    .then(entrySummaries => {
      if (entrySummaries.length === 0) {
        return '';
      }
      
      const summaryText = entrySummaries.join('\n\n');
      return summarize(metaSummaryKey, summaryText, config.metaWords);
    })
    .catch(error => {
      console.warn('Failed to generate meta-summary:', error);
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