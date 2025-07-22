// Summarization Management - Smart handling of entry summaries
const STORAGE_KEY = 'simple-dnd-journal';
const SUMMARIES_KEY = 'simple-dnd-journal-summaries';
const META_SUMMARIES_KEY = 'simple-dnd-journal-meta-summaries';

// Configuration for meta-summarization
const META_SUMMARY_CONFIG = {
  triggerThreshold: 50, // Start meta-summarization when more than 50 entries
  summariesPerMetaSummary: 10, // Group 10 summaries into 1 meta-summary
  maxMetaSummaryWords: 200 // Maximum words in a meta-summary
};

// Pure function to load journal data
const loadJournalData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { character: {}, entries: [] };
  } catch (error) {
    console.error('Failed to load journal data:', error);
    return { character: {}, entries: [] };
  }
};

// Pure function to load stored summaries
const loadStoredSummaries = () => {
  try {
    const stored = localStorage.getItem(SUMMARIES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('Failed to load summaries:', error);
    return {};
  }
};

// Save summaries to localStorage
const saveStoredSummaries = (summaries) => {
  try {
    localStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
  } catch (error) {
    console.error('Failed to save summaries:', error);
  }
};

// Pure function to load stored meta-summaries
const loadStoredMetaSummaries = () => {
  try {
    const stored = localStorage.getItem(META_SUMMARIES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('Failed to load meta-summaries:', error);
    return {};
  }
};

// Save meta-summaries to localStorage
const saveStoredMetaSummaries = (metaSummaries) => {
  try {
    localStorage.setItem(META_SUMMARIES_KEY, JSON.stringify(metaSummaries));
  } catch (error) {
    console.error('Failed to save meta-summaries:', error);
  }
};

// Pure function to determine which entries need summaries
const getEntriesNeedingSummaries = (entries, summaries) => {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  
  // Keep the 5 most recent entries in full
  const recentEntries = sortedEntries.slice(0, 5);
  const olderEntries = sortedEntries.slice(5);
  
  // Find older entries that don't have summaries yet
  const needingSummaries = olderEntries.filter(entry => !summaries[entry.id]);
  
  return {
    recentEntries,
    olderEntries,
    needingSummaries
  };
};

// Generate summaries for entries that need them
const generateMissingSummaries = async () => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return;
  }

  const journalData = loadJournalData();
  const summaries = loadStoredSummaries();
  
  const { needingSummaries } = getEntriesNeedingSummaries(journalData.entries, summaries);
  
  // Generate summaries for up to 3 entries at a time to avoid overwhelming the API
  const batchSize = 3;
  const batch = needingSummaries.slice(0, batchSize);
  
  for (const entry of batch) {
    try {
      const summary = await window.AI.getEntrySummary(entry);
      if (summary) {
        summaries[entry.id] = summary;
      }
    } catch (error) {
      console.error(`Failed to generate summary for entry ${entry.id}:`, error);
    }
  }
  
  saveStoredSummaries(summaries);
  
  return {
    generated: batch.length,
    remaining: needingSummaries.length - batch.length
  };
};

// Get formatted entries for AI prompts (mix of full entries and summaries)
const getFormattedEntriesForAI = () => {
  const journalData = loadJournalData();
  const summaries = loadStoredSummaries();
  
  const { recentEntries, olderEntries } = getEntriesNeedingSummaries(journalData.entries, summaries);
  
  // Use full content for recent entries
  const recentFormatted = recentEntries.map(entry => ({
    title: entry.title,
    content: entry.content,
    timestamp: entry.timestamp,
    type: 'full'
  }));
  
  // Use summaries for older entries
  const olderFormatted = olderEntries
    .filter(entry => summaries[entry.id])
    .map(entry => ({
      title: entry.title,
      content: summaries[entry.id].summary,
      timestamp: entry.timestamp,
      type: 'summary',
      originalWordCount: summaries[entry.id].originalWordCount,
      summaryWordCount: summaries[entry.id].summaryWordCount
    }));
  
  return [...recentFormatted, ...olderFormatted];
};

// Get summary statistics
const getSummaryStats = () => {
  const journalData = loadJournalData();
  const summaries = loadStoredSummaries();
  
  const { recentEntries, olderEntries, needingSummaries } = getEntriesNeedingSummaries(journalData.entries, summaries);
  
  const summarizedCount = olderEntries.filter(entry => summaries[entry.id]).length;
  
  return {
    totalEntries: journalData.entries.length,
    recentEntries: recentEntries.length,
    olderEntries: olderEntries.length,
    summarizedEntries: summarizedCount,
    pendingSummaries: needingSummaries.length,
    summaryCompletionRate: olderEntries.length > 0 ? (summarizedCount / olderEntries.length) * 100 : 100
  };
};

// Initialize summarization (generate missing summaries in background)
const initializeSummarization = async () => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return;
  }

  try {
    const result = await generateMissingSummaries();
    if (result && result.generated > 0) {
      console.log(`Generated ${result.generated} summaries, ${result.remaining} remaining`);
    }
  } catch (error) {
    console.error('Failed to initialize summarization:', error);
  }
};

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getEntriesNeedingSummaries,
    generateMissingSummaries,
    getFormattedEntriesForAI,
    getSummaryStats,
    initializeSummarization
  };
} else if (typeof global !== 'undefined') {
  // For testing
  global.getEntriesNeedingSummaries = getEntriesNeedingSummaries;
  global.generateMissingSummaries = generateMissingSummaries;
  global.getFormattedEntriesForAI = getFormattedEntriesForAI;
  global.getSummaryStats = getSummaryStats;
  global.initializeSummarization = initializeSummarization;
} else {
  // For browser
  window.Summarization = {
    getEntriesNeedingSummaries,
    generateMissingSummaries,
    getFormattedEntriesForAI,
    getSummaryStats,
    initializeSummarization
  };
}
