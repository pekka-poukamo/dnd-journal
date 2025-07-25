// D&D Summary Integration - Bridge between D&D journal and content-agnostic summarization
// Following functional programming principles and style guide

import { 
  processContent, 
  processBatchContent,
  autoProcessContent,
  getFormattedContentForAI,
  getSummaryOverview,
  optimizeSummarySystem
} from './summary-manager.js';

import {
  extractJournalEntries,
  extractCharacterData,
  extractCharacterFields,
  formatContentForProcessing,
  findContentNeedingAttention
} from './content-utils.js';

// =============================================================================
// D&D JOURNAL ENTRY SUMMARIZATION
// =============================================================================

// Process a single journal entry for summarization
export const summarizeJournalEntry = async (entry) => {
  if (!entry || !entry.id || !entry.content) {
    return { success: false, reason: 'Invalid entry data' };
  }
  
  return await processContent('entry', entry.id, entry.content);
};

// Auto-summarize all journal entries that need it
export const autoSummarizeJournalEntries = async () => {
  const entries = extractJournalEntries();
  return await autoProcessContent('entry', entries);
};

// Get entries that need summarization
export const getEntriesNeedingSummary = () => {
  const entries = extractJournalEntries();
  const formattedEntries = formatContentForProcessing(entries, 'entry');
  return findContentNeedingAttention(formattedEntries);
};

// =============================================================================
// D&D CHARACTER SUMMARIZATION
// =============================================================================

// Process character fields for summarization
export const summarizeCharacterFields = async () => {
  const character = extractCharacterData();
  const fields = extractCharacterFields(character);
  
  const results = [];
  for (const field of fields) {
    const result = await processContent('character', field.id, field.content);
    if (result.success) {
      results.push({ field: field.fieldName, result });
    }
  }
  
  return results;
};

// Summarize a specific character field
export const summarizeCharacterField = async (fieldName) => {
  const character = extractCharacterData();
  
  if (!character[fieldName] || typeof character[fieldName] !== 'string') {
    return { success: false, reason: 'Field not found or invalid' };
  }
  
  return await processContent('character', fieldName, character[fieldName]);
};

// =============================================================================
// FORMATTED CONTENT FOR AI
// =============================================================================

// Get formatted journal entries for AI storytelling
export const getFormattedEntriesForAI = (maxEntries = 10) => {
  const entries = extractJournalEntries();
  return getFormattedContentForAI('entry', entries, maxEntries);
};

// Get formatted character data for AI storytelling (with summaries if available)
export const getFormattedCharacterForAI = () => {
  const character = extractCharacterData();
  
  // For now, return character as-is since character field summarization
  // is handled differently than entry summarization
  return character;
};

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

// Process all D&D content that needs summarization
export const processAllDnDContent = async () => {
  const results = {
    entries: [],
    character: [],
    errors: []
  };
  
  try {
    // Process journal entries
    const entryResults = await autoSummarizeJournalEntries();
    results.entries = entryResults;
    
    // Process character fields
    const characterResults = await summarizeCharacterFields();
    results.character = characterResults;
    
    // Optimize the summary system after processing
    await optimizeSummarySystem();
    
    return {
      success: true,
      results,
      totalProcessed: entryResults.length + characterResults.length
    };
  } catch (error) {
    results.errors.push(error.message);
    return {
      success: false,
      results,
      error: error.message
    };
  }
};

// Force update all summaries (regenerate even if they exist)
export const regenerateAllSummaries = async () => {
  const entries = extractJournalEntries();
  const character = extractCharacterData();
  
  const contentItems = [
    // Journal entries
    ...entries.map(entry => ({
      type: 'entry',
      id: entry.id,
      content: entry.content,
      forceUpdate: true
    })),
    // Character fields
    ...extractCharacterFields(character).map(field => ({
      type: 'character',
      id: field.id,
      content: field.content,
      forceUpdate: true
    }))
  ];
  
  return await processBatchContent(contentItems);
};

// =============================================================================
// STATISTICS AND HEALTH
// =============================================================================

// Get D&D-specific summary statistics
export const getDnDSummaryStats = () => {
  const overview = getSummaryOverview();
  const entries = extractJournalEntries();
  const character = extractCharacterData();
  const characterFields = extractCharacterFields(character);
  
  return {
    ...overview,
    dndSpecific: {
      totalJournalEntries: entries.length,
      totalCharacterFields: characterFields.length,
      entrySummaries: overview.summariesByType?.entry || 0,
      characterSummaries: overview.summariesByType?.character || 0,
      summaryCompletionRate: entries.length > 0 ? 
        Math.round(((overview.summariesByType?.entry || 0) / entries.length) * 100) : 0
    }
  };
};

// Check if D&D content is properly summarized
export const checkDnDSummaryHealth = () => {
  const stats = getDnDSummaryStats();
  const entries = extractJournalEntries();
  const entriesNeedingSummary = getEntriesNeedingSummary();
  
  const issues = [];
  
  if (entriesNeedingSummary.length > 5) {
    issues.push(`${entriesNeedingSummary.length} journal entries need summarization`);
  }
  
  if (stats.health && !stats.health.withinTargetLength) {
    issues.push('Total summary length exceeds target');
  }
  
  if (stats.dndSpecific.summaryCompletionRate < 50 && entries.length > 10) {
    issues.push('Low summary completion rate for journal entries');
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    stats,
    entriesNeedingSummary: entriesNeedingSummary.length,
    recommendations: generateRecommendations(stats, entriesNeedingSummary)
  };
};

// Generate recommendations for improving summary health
const generateRecommendations = (stats, entriesNeedingSummary) => {
  const recommendations = [];
  
  if (entriesNeedingSummary.length > 0) {
    recommendations.push(`Run auto-summarization to process ${entriesNeedingSummary.length} entries`);
  }
  
  if (stats.health && stats.health.needsOptimization) {
    recommendations.push('Run system optimization to create meta-summaries');
  }
  
  if (stats.dndSpecific.summaryCompletionRate < 80 && stats.dndSpecific.totalJournalEntries > 5) {
    recommendations.push('Consider running batch summarization for better completion rate');
  }
  
  return recommendations;
};

// =============================================================================
// MAINTENANCE FUNCTIONS
// =============================================================================

// Optimize the D&D summary system
export const optimizeDnDSummaries = async () => {
  return await optimizeSummarySystem();
};

// Get a simple status for UI display
export const getSummaryStatus = () => {
  const stats = getDnDSummaryStats();
  const health = checkDnDSummaryHealth();
  
  return {
    totalSummaries: stats.totalSummaries,
    currentLength: stats.currentLength,
    targetLength: stats.targetLength,
    withinTarget: stats.health?.withinTargetLength || false,
    entriesNeedingSummary: health.entriesNeedingSummary,
    healthy: health.healthy,
    needsAttention: !health.healthy || health.entriesNeedingSummary > 3
  };
};

// =============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// =============================================================================

// Functions to maintain compatibility with existing D&D journal code
export const runAutoSummarization = processAllDnDContent;
export const getSummaryStats = getDnDSummaryStats;

// Legacy function for getting entries needing summary (different format)
export const getEntriesNeedingSummarization = () => {
  const entries = extractJournalEntries();
  const entriesNeedingSummary = getEntriesNeedingSummary();
  const needingSummaryIds = new Set(entriesNeedingSummary.map(e => e.id));
  
  return entries.filter(entry => needingSummaryIds.has(entry.id));
};