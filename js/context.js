// Context - Unified context building for AI
// Single function for all AI context needs

import { getYjsState, getCharacterData, getEntries, getSummary } from './yjs.js';
import { summarize } from './summarization.js';
import { formatDate, getWordCount } from './utils.js';

// Build context string for AI from character and entries
export const buildContext = async (character = null, entries = null) => {
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

  // Await all async work in parallel
  const [characterSections, entriesInfo] = await Promise.all([
    Promise.all(characterSectionPromises),
    entriesPromise
  ]);

  // Combine all context
  return characterInfo + characterSections.join('') + entriesInfo;
};

// Build character section (backstory or notes) with intelligent summarization
const buildCharacterSection = async (fieldName, content, config) => {
  const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

  // Check if content is too long for direct inclusion
  if (getWordCount(content) > config.characterWords) {
    const state = getYjsState();
    const summaryKey = `character:${fieldName}`;
    let summary = getSummary(state, summaryKey);

    // Generate summary if needed
    if (!summary) {
      summary = await summarize(summaryKey, content, config.characterWords)
        .catch(error => {
          console.warn(`Failed to generate ${fieldName} summary:`, error);
          // Fallback to full content rather than truncating
          return null;
        });
      if (!summary) {
        return `\n${capitalizedName}: ${content}`;
      }
    }

    return `\n${capitalizedName}: ${summary}`;
  } else {
    // Content is short enough to include directly
    return `\n${capitalizedName}: ${content}`;
  }
};

// Create entries info section with intelligent summarization
const createEntriesInfo = async (entries, config, sectionTitle = 'Adventures') => {
  const state = getYjsState();

  const entryInfoPromises = entries.map(async (entry) => {
    const entryLabel = formatDate(entry.timestamp);

    if (getWordCount(entry.content) > config.entryWords) {
      const entryKey = `entry:${entry.id}`;
      let entrySummary = getSummary(state, entryKey);

      if (!entrySummary) {
        entrySummary = await summarize(entryKey, entry.content, config.entryWords)
          .catch(error => {
            console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
            return entry.content; // Use full content if summarization fails
          });
      }

      return `\n- ${entryLabel}: ${entrySummary}`;
    } else {
      // Content is short enough - include full content
      return `\n- ${entryLabel}: ${entry.content}`;
    }
  });

  const entryInfos = await Promise.all(entryInfoPromises);
  return `\n\n${sectionTitle}:` + entryInfos.join('');
};

// Create meta-summary from all entries
const createMetaSummary = async (entries, config) => {
  const state = getYjsState();
  const metaSummaryKey = 'journal:meta-summary';

  // Try to get existing meta-summary
  let metaSummary = getSummary(state, metaSummaryKey);

  if (!metaSummary) {
    // Generate individual entry summaries for all entries
    const entrySummaries = await Promise.all(
      entries.map(async (entry) => {
        const entryKey = `entry:${entry.id}`;
        let entrySummary = getSummary(state, entryKey);

        if (!entrySummary && getWordCount(entry.content) > config.entryWords) {
          entrySummary = await summarize(entryKey, entry.content, config.entryWords)
            .catch(error => {
              console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
              return entry.content; // Use full content if summarization fails
            });
        }

        const finalContent = entrySummary || entry.content;
        const entryLabel = formatDate(entry.timestamp);
        return `${entryLabel}: ${finalContent}`;
      })
    );

    // Create meta-summary from all entry summaries
    if (entrySummaries.length > 0) {
      const summaryText = entrySummaries.join('\n\n');
      metaSummary = await summarize(metaSummaryKey, summaryText, config.metaWords)
        .catch(error => {
          console.warn('Failed to generate meta-summary:', error);
          // Fallback to recent entries summary
          const recentSummaries = entrySummaries.slice(-5);
          return `Recent adventures summary:\n${recentSummaries.join('\n')}`;
        });
    }
  }

  return metaSummary || '';
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