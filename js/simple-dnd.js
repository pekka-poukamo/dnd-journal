// Simple D&D Integration - Easy functions for the D&D journal
// Following functional programming principles and style guide

import { summarize, getAllSummaries, getSummary, getStats } from './summarization.js';
import { generateQuestions, getIntrospectionQuestions as getStoryQuestions } from './storytelling.js';
import { loadDataWithFallback, STORAGE_KEYS, createInitialJournalState } from './utils.js';

// =============================================================================
// JOURNAL ENTRY FUNCTIONS
// =============================================================================

// Summarize a journal entry
export const summarizeEntry = async (entry) => {
  if (!entry || !entry.id || !entry.content) return null;
  return await summarize(`entry:${entry.id}`, entry.content);
};

// Summarize character fields
export const summarizeCharacter = async (character) => {
  const results = [];
  
  if (character.backstory) {
    const summary = await summarize('character:backstory', character.backstory);
    if (summary) results.push({ field: 'backstory', summary });
  }
  
  if (character.notes) {
    const summary = await summarize('character:notes', character.notes);
    if (summary) results.push({ field: 'notes', summary });
  }
  
  return results;
};

// Auto-summarize all entries that need it
export const autoSummarizeAll = async () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const results = [];
  
  // Summarize entries
  for (const entry of journal.entries || []) {
    const existing = getSummary(`entry:${entry.id}`);
    if (!existing) {
      const summary = await summarizeEntry(entry);
      if (summary) results.push({ type: 'entry', id: entry.id, summary });
    }
  }
  
  // Summarize character
  const charResults = await summarizeCharacter(journal.character || {});
  results.push(...charResults.map(r => ({ type: 'character', ...r })));
  
  return results;
};

// =============================================================================
// AI STORYTELLING FUNCTIONS
// =============================================================================

// Generate introspection questions  
export const getIntrospectionQuestions = async () => {
  return await generateQuestions();
};

// =============================================================================
// FORMATTED CONTENT FOR AI
// =============================================================================

// Get all content formatted for AI (mix of recent entries + summaries)
export const getContentForAI = () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const entries = journal.entries || [];
  const summaries = getAllSummaries();
  
  // Recent entries in full (last 2)
  const recent = entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 2)
    .map(entry => ({
      type: 'recent',
      title: entry.title,
      content: entry.content
    }));
  
  // Add summaries for context
  const summaryContent = summaries.map(s => ({
    type: s.type === 'meta' ? 'meta-summary' : 'summary',
    content: s.content
  }));
  
  return [...recent, ...summaryContent];
};

// =============================================================================
// STATUS AND STATS
// =============================================================================

// Get simple status
export const getStatus = () => {
  const journal = loadDataWithFallback(STORAGE_KEYS.JOURNAL, createInitialJournalState());
  const stats = getStats();
  const totalEntries = (journal.entries || []).length;
  const summaries = getAllSummaries();
  
  return {
    totalEntries,
    totalSummaries: stats.count,
    totalWords: stats.totalWords,
    healthy: stats.withinTarget,
    needsWork: summaries.length === 0 && totalEntries > 5
  };
};

// =============================================================================
// LEGACY COMPATIBILITY  
// =============================================================================

export const runAutoSummarization = autoSummarizeAll;
export const generateIntrospectionPrompt = getIntrospectionQuestions;
export const getSummaryStats = getStatus;