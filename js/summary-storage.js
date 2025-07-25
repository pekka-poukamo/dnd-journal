// Summary Storage Module - Dedicated storage operations for summaries
// Following functional programming principles and style guide

import { 
  loadDataWithFallback, 
  safeSetToStorage, 
  STORAGE_KEYS 
} from './utils.js';

// Storage operations for entry summaries
export const loadEntrySummaries = () => {
  return loadDataWithFallback(STORAGE_KEYS.SUMMARIES, {});
};

export const saveEntrySummaries = (summaries) => {
  return safeSetToStorage(STORAGE_KEYS.SUMMARIES, summaries);
};

export const saveEntrySummary = (entryId, summary) => {
  const summaries = loadEntrySummaries();
  const updatedSummaries = { ...summaries, [entryId]: summary };
  return saveEntrySummaries(updatedSummaries);
};

// Storage operations for meta-summaries
export const loadMetaSummaries = () => {
  return loadDataWithFallback(STORAGE_KEYS.META_SUMMARIES, {});
};

export const saveMetaSummaries = (metaSummaries) => {
  return safeSetToStorage(STORAGE_KEYS.META_SUMMARIES, metaSummaries);
};

export const saveMetaSummary = (metaId, metaSummary) => {
  const metaSummaries = loadMetaSummaries();
  const updatedMetaSummaries = { ...metaSummaries, [metaId]: metaSummary };
  return saveMetaSummaries(updatedMetaSummaries);
};

// Storage operations for character summaries
export const loadCharacterSummaries = () => {
  return loadDataWithFallback(STORAGE_KEYS.CHARACTER_SUMMARIES, {});
};

export const saveCharacterSummaries = (characterSummaries) => {
  return safeSetToStorage(STORAGE_KEYS.CHARACTER_SUMMARIES, characterSummaries);
};

export const saveCharacterSummary = (field, summary) => {
  const characterSummaries = loadCharacterSummaries();
  const updatedSummaries = { ...characterSummaries, [field]: summary };
  return saveCharacterSummaries(updatedSummaries);
};

// Get all summary statistics for UI display
export const getSummaryStats = () => {
  const entrySummaries = loadEntrySummaries();
  const metaSummaries = loadMetaSummaries();
  const characterSummaries = loadCharacterSummaries();
  
  // Load journal data to get total entries
  const journalData = (() => {
    try {
      return JSON.parse(localStorage.getItem('simple-dnd-journal') || '{}');
    } catch {
      return { entries: [] };
    }
  })();
  
  const totalEntries = (journalData.entries || []).length;
  const summarizedEntries = Object.keys(entrySummaries).length;
  const recentEntries = Math.min(5, totalEntries); // Show recent entries as last 5
  const pendingSummaries = Math.max(0, totalEntries - recentEntries - summarizedEntries);
  const summaryCompletionRate = totalEntries > 0 ? Math.round((summarizedEntries / Math.max(1, totalEntries - recentEntries)) * 100) : 0;
  
  // Calculate meta-summary stats
  const metaSummaryCount = Object.keys(metaSummaries).length;
  const entriesInMetaSummaries = Object.values(metaSummaries)
    .reduce((sum, meta) => sum + (meta.includedSummaryIds?.length || 0), 0);
  
  return {
    totalEntries,
    recentEntries,
    summarizedEntries,
    pendingSummaries,
    summaryCompletionRate,
    metaSummaries: metaSummaryCount,
    entriesInMetaSummaries,
    metaSummaryActive: metaSummaryCount > 0,
    entrySummaryCount: summarizedEntries,
    metaSummaryCount,
    characterSummaryCount: Object.keys(characterSummaries).length,
    totalSummaries: summarizedEntries + metaSummaryCount + Object.keys(characterSummaries).length
  };
};