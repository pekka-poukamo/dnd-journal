// Context - Unified context building for AI
// Single function for all AI context needs

import { getYjsState, getCharacterData, getEntries, getSummary } from './yjs.js';
import { summarize } from './summarization.js';

// Build context string for AI from character and entries
export const buildContext = async (character = null, entries = null, options = {}) => {
  // Use provided data or fall back to Y.js state
  if (!character || !entries) {
    const state = getYjsState();
    character = character || getCharacterData(state);
    entries = entries || getEntries(state);
  }
  
  const defaults = {
    maxEntries: null, // null means include all entries
    maxCharacterLength: 500, // Increased threshold before summarizing
    maxEntryLength: 300, // Increased threshold before summarizing
    useSummaries: true,
    ensureFullHistory: true // New option to ensure complete context
  };
  const config = { ...defaults, ...options };
  
  // Build character context
  const characterName = character?.name || 'unnamed adventurer';
  let characterInfo = `Character: ${characterName}`;
  
  if (character?.race) characterInfo += ` (${character.race})`;
  if (character?.class) characterInfo += ` - ${character.class}`;
  
  // Add backstory (ALWAYS include full content, use summary if too long)
  if (character?.backstory) {
    characterInfo += await buildCharacterSection('backstory', character.backstory, config);
  }
  
  // Add notes (ALWAYS include full content, use summary if too long)
  if (character?.notes) {
    characterInfo += await buildCharacterSection('notes', character.notes, config);
  }
  
  // Build entries context - include ALL entries if ensureFullHistory is true
  let entriesInfo = '';
  if (entries && entries.length > 0) {
    const targetEntries = config.ensureFullHistory || !config.maxEntries 
      ? entries 
      : entries.slice(-config.maxEntries);
    
    if (config.ensureFullHistory && entries.length > 10) {
      // For large histories, create a comprehensive summary
      entriesInfo = await buildFullJournalHistory(entries, config);
    } else {
      // Normal entry listing for smaller histories
      entriesInfo = await buildEntriesSection(targetEntries, config);
    }
  } else {
    entriesInfo = '\n\nNo journal entries yet. This character is just beginning their adventure.';
  }
  
  return characterInfo + entriesInfo;
};

// Build character section (backstory or notes) with intelligent summarization
const buildCharacterSection = async (fieldName, content, config) => {
  const capitalizedName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  
  if (!config.useSummaries) {
    // If summaries disabled, still don't truncate - include full content
    return `\n${capitalizedName}: ${content}`;
  }
  
  // Check if content is too long for direct inclusion
  if (content.length > config.maxCharacterLength) {
    const state = getYjsState();
    const summaryKey = `character:${fieldName}`;
    let summary = getSummary(state, summaryKey);
    
    // Generate summary if needed
    if (!summary) {
      try {
        summary = await summarize(summaryKey, content);
      } catch (error) {
        console.warn(`Failed to generate ${fieldName} summary:`, error);
        // Fallback to full content rather than truncating
        return `\n${capitalizedName}: ${content}`;
      }
    }
    
    return `\n${capitalizedName} (Summary): ${summary}`;
  } else {
    // Content is short enough to include directly
    return `\n${capitalizedName}: ${content}`;
  }
};

// Build comprehensive journal history for large adventure logs
const buildFullJournalHistory = async (entries, config) => {
  const state = getYjsState();
  const metaSummaryKey = 'journal:meta-summary';
  
  // Try to get existing meta-summary
  let metaSummary = getSummary(state, metaSummaryKey);
  
  if (!metaSummary && config.useSummaries) {
    // Generate individual entry summaries for all entries
    const entrySummaries = [];
    
    for (const entry of entries) {
      const entryKey = `entry:${entry.id}`;
      let entrySummary = getSummary(state, entryKey);
      
      if (!entrySummary && entry.content.length > config.maxEntryLength) {
        try {
          entrySummary = await summarize(entryKey, entry.content);
        } catch (error) {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          entrySummary = entry.content; // Use full content if summarization fails
        }
      }
      
      const finalContent = entrySummary || entry.content;
      entrySummaries.push(`${entry.title}: ${finalContent}`);
    }
    
    // Create meta-summary from all entry summaries
    if (entrySummaries.length > 0) {
      try {
        const summaryText = entrySummaries.join('\n\n');
        metaSummary = await summarize(metaSummaryKey, summaryText);
      } catch (error) {
        console.warn('Failed to generate meta-summary:', error);
        // Fallback to recent entries summary
        const recentSummaries = entrySummaries.slice(-5);
        metaSummary = `Recent adventures summary:\n${recentSummaries.join('\n')}`;
      }
    }
  }
  
  if (metaSummary) {
    // Include both meta-summary and recent detailed entries
    const recentEntries = entries.slice(-3);
    const recentSection = await buildEntriesSection(recentEntries, config, 'Recent Detailed Adventures');
    
    return `\n\nAdventure History (Complete): ${metaSummary}${recentSection}`;
  } else {
    // Fallback to normal entry listing
    return await buildEntriesSection(entries, config);
  }
};

// Build entries section with intelligent summarization
const buildEntriesSection = async (entries, config, sectionTitle = 'Adventures') => {
  let entriesInfo = `\n\n${sectionTitle}:`;
  
  for (const entry of entries) {
    if (config.useSummaries && entry.content.length > config.maxEntryLength) {
      const state = getYjsState();
      const entryKey = `entry:${entry.id}`;
      let entrySummary = getSummary(state, entryKey);
      
      if (!entrySummary) {
        try {
          entrySummary = await summarize(entryKey, entry.content);
        } catch (error) {
          console.warn(`Failed to generate summary for entry ${entry.id}:`, error);
          entrySummary = entry.content; // Use full content if summarization fails
        }
      }
      
      entriesInfo += `\n- ${entry.title}: ${entrySummary}`;
    } else {
      // Content is short enough or summaries disabled - include full content
      entriesInfo += `\n- ${entry.title}: ${entry.content}`;
    }
  }
  
  return entriesInfo;
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