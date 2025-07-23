// Summarization Management - Smart handling of entry summaries

// Get utils reference - works in both browser and test environment
const getUtils = () => {
  if (typeof window !== 'undefined' && window.Utils) return window.Utils;
  if (typeof global !== 'undefined' && global.Utils) return global.Utils;
  try {
    return require('./utils.js');
  } catch (e) {
    try {
      return require('../js/utils.js');
    } catch (e2) {
      // Fallback for tests
      return {
        loadDataWithFallback: (key, fallback) => fallback,
        createInitialJournalState: () => ({ character: {}, entries: [] }),
        getWordCount: (text) => text.trim().split(/\s+/).filter(word => word.length > 0).length,
        STORAGE_KEYS: {
          JOURNAL: 'simple-dnd-journal',
          SUMMARIES: 'simple-dnd-journal-summaries',
          META_SUMMARIES: 'simple-dnd-journal-meta-summaries'
        },
        safeSetToStorage: () => ({ success: true })
      };
    }
  }
};

const utils = getUtils();

// Configuration for meta-summarization
const META_SUMMARY_CONFIG = {
  triggerThreshold: 50, // Start meta-summarization when more than 50 entries
  summariesPerMetaSummary: 10, // Group 10 summaries into 1 meta-summary
  maxMetaSummaryWords: 200 // Maximum words in a meta-summary
};

// Pure function to load journal data
const loadJournalData = () => {
  return utils.loadDataWithFallback(
    utils.STORAGE_KEYS.JOURNAL, 
    utils.createInitialJournalState()
  );
};

// Pure function to load stored summaries
const loadStoredSummaries = () => {
  return utils.loadDataWithFallback(utils.STORAGE_KEYS.SUMMARIES, {});
};

// Save summaries to localStorage
const saveStoredSummaries = (summaries) => {
  utils.safeSetToStorage(utils.STORAGE_KEYS.SUMMARIES, summaries);
};

// Pure function to load stored meta-summaries
const loadStoredMetaSummaries = () => {
  return utils.loadDataWithFallback(utils.STORAGE_KEYS.META_SUMMARIES, {});
};

// Save meta-summaries to localStorage
const saveStoredMetaSummaries = (metaSummaries) => {
  utils.safeSetToStorage(utils.STORAGE_KEYS.META_SUMMARIES, metaSummaries);
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

// Generate meta-summary from a group of summaries
const generateMetaSummary = async (summaryGroup, timeRange) => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return null;
  }

  try {
    const summariesText = summaryGroup
      .map(summary => `• ${summary.summary}`)
      .join('\n');

    const prompt = `Create a meta-summary of these D&D journal entry summaries from ${timeRange}. Capture the key themes, character development, and major events in about ${META_SUMMARY_CONFIG.maxMetaSummaryWords} words:

${summariesText}`;

    const metaSummary = await window.AI.callOpenAI(prompt, META_SUMMARY_CONFIG.maxMetaSummaryWords);
    
    return {
      summary: metaSummary,
      entryCount: summaryGroup.length,
      timeRange: timeRange,
      originalWordCount: summaryGroup.reduce((total, s) => total + s.summaryWordCount, 0),
      metaSummaryWordCount: utils.getWordCount(metaSummary),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Failed to generate meta-summary:', error);
    return null;
  }
};

// Pure function to group summaries for meta-summarization
const groupSummariesForMeta = (entries, summaries) => {
  // Sort entries by date (oldest first for meta-summarization)
  const olderEntries = entries
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, -5); // Exclude recent 5 entries
  
  // Filter entries that have summaries
  const entriesWithSummaries = olderEntries.filter(entry => summaries[entry.id]);
  
  // Group into batches for meta-summarization
  const groups = [];
  for (let i = 0; i < entriesWithSummaries.length; i += META_SUMMARY_CONFIG.summariesPerMetaSummary) {
    const group = entriesWithSummaries.slice(i, i + META_SUMMARY_CONFIG.summariesPerMetaSummary);
    if (group.length === META_SUMMARY_CONFIG.summariesPerMetaSummary) {
      groups.push(group);
    }
  }
  
  return groups;
};

// Generate missing meta-summaries
const generateMissingMetaSummaries = async () => {
  if (!window.AI || !window.AI.isAIEnabled()) {
    return;
  }

  const journalData = loadJournalData();
  
  // Only proceed if we have enough entries
  if (journalData.entries.length < META_SUMMARY_CONFIG.triggerThreshold) {
    return { generated: 0, remaining: 0 };
  }

  const summaries = loadStoredSummaries();
  const metaSummaries = loadStoredMetaSummaries();
  
  const summaryGroups = groupSummariesForMeta(journalData.entries, summaries);
  
  // Find groups that don't have meta-summaries yet
  const needingMetaSummaries = summaryGroups.filter(group => {
    const groupKey = `${group[0].id}-${group[group.length - 1].id}`;
    return !metaSummaries[groupKey];
  });
  
  // Generate meta-summaries for up to 2 groups at a time
  const batchSize = 2;
  const batch = needingMetaSummaries.slice(0, batchSize);
  
  for (const group of batch) {
    try {
      const firstEntry = group[0];
      const lastEntry = group[group.length - 1];
      const timeRange = `${new Date(firstEntry.timestamp).toLocaleDateString()} - ${new Date(lastEntry.timestamp).toLocaleDateString()}`;
      
      const summaryGroup = group.map(entry => summaries[entry.id]);
      const metaSummary = await generateMetaSummary(summaryGroup, timeRange);
      
      if (metaSummary) {
        const groupKey = `${firstEntry.id}-${lastEntry.id}`;
        metaSummaries[groupKey] = metaSummary;
      }
    } catch (error) {
      console.error('Failed to generate meta-summary for group:', error);
    }
  }
  
  saveStoredMetaSummaries(metaSummaries);
  
  return {
    generated: batch.length,
    remaining: needingMetaSummaries.length - batch.length
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
  
  // After generating regular summaries, check if we need meta-summaries
  await generateMissingMetaSummaries();
  
  return {
    generated: batch.length,
    remaining: needingSummaries.length - batch.length
  };
};

// Get formatted entries for AI prompts (mix of full entries, summaries, and meta-summaries)
const getFormattedEntriesForAI = () => {
  const journalData = loadJournalData();
  const summaries = loadStoredSummaries();
  const metaSummaries = loadStoredMetaSummaries();
  
  const { recentEntries, olderEntries } = getEntriesNeedingSummaries(journalData.entries, summaries);
  
  // Use full content for recent entries
  const recentFormatted = recentEntries.map(entry => ({
    title: entry.title,
    content: entry.content,
    timestamp: entry.timestamp,
    type: 'full'
  }));
  
  // For older entries, use meta-summaries where available, otherwise individual summaries
  const summaryGroups = groupSummariesForMeta(journalData.entries, summaries);
  const entriesInMetaSummaries = new Set();
  
  // Add meta-summaries first
  const metaSummaryFormatted = [];
  for (const group of summaryGroups) {
    const groupKey = `${group[0].id}-${group[group.length - 1].id}`;
    if (metaSummaries[groupKey]) {
      const metaSummary = metaSummaries[groupKey];
      metaSummaryFormatted.push({
        title: `Adventures (${metaSummary.entryCount} entries): ${metaSummary.timeRange}`,
        content: metaSummary.summary,
        timestamp: group[0].timestamp, // Use first entry's timestamp for sorting
        type: 'meta-summary',
        entryCount: metaSummary.entryCount,
        originalWordCount: metaSummary.originalWordCount,
        metaSummaryWordCount: metaSummary.metaSummaryWordCount
      });
      
      // Mark these entries as covered by meta-summary
      group.forEach(entry => entriesInMetaSummaries.add(entry.id));
    }
  }
  
  // Add individual summaries for entries not covered by meta-summaries
  const individualSummaryFormatted = olderEntries
    .filter(entry => summaries[entry.id] && !entriesInMetaSummaries.has(entry.id))
    .map(entry => ({
      title: entry.title,
      content: summaries[entry.id].summary,
      timestamp: entry.timestamp,
      type: 'summary',
      originalWordCount: summaries[entry.id].originalWordCount,
      summaryWordCount: summaries[entry.id].summaryWordCount
    }));
  
  // Combine and sort by timestamp
  const allFormatted = [...recentFormatted, ...metaSummaryFormatted, ...individualSummaryFormatted];
  return allFormatted.sort((a, b) => b.timestamp - a.timestamp);
};

// Get summary statistics
const getSummaryStats = () => {
  const journalData = loadJournalData();
  const summaries = loadStoredSummaries();
  const metaSummaries = loadStoredMetaSummaries();
  
  const { recentEntries, olderEntries, needingSummaries } = getEntriesNeedingSummaries(journalData.entries, summaries);
  
  const summarizedCount = olderEntries.filter(entry => summaries[entry.id]).length;
  
  // Meta-summary statistics
  const summaryGroups = groupSummariesForMeta(journalData.entries, summaries);
  const metaSummaryCount = Object.keys(metaSummaries).length;
  const possibleMetaSummaries = summaryGroups.length;
  
  const entriesInMetaSummaries = new Set();
  summaryGroups.forEach(group => {
    const groupKey = `${group[0].id}-${group[group.length - 1].id}`;
    if (metaSummaries[groupKey]) {
      group.forEach(entry => entriesInMetaSummaries.add(entry.id));
    }
  });
  
  return {
    totalEntries: journalData.entries.length,
    recentEntries: recentEntries.length,
    olderEntries: olderEntries.length,
    summarizedEntries: summarizedCount,
    pendingSummaries: needingSummaries.length,
    summaryCompletionRate: olderEntries.length > 0 ? (summarizedCount / olderEntries.length) * 100 : 100,
    metaSummaries: metaSummaryCount,
    possibleMetaSummaries: possibleMetaSummaries,
    entriesInMetaSummaries: entriesInMetaSummaries.size,
    metaSummaryActive: journalData.entries.length >= META_SUMMARY_CONFIG.triggerThreshold
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
    generateMissingMetaSummaries,
    groupSummariesForMeta,
    getFormattedEntriesForAI,
    getSummaryStats,
    initializeSummarization,
    META_SUMMARY_CONFIG
  };
} else if (typeof global !== 'undefined') {
  // For testing
  global.getEntriesNeedingSummaries = getEntriesNeedingSummaries;
  global.generateMissingSummaries = generateMissingSummaries;
  global.generateMissingMetaSummaries = generateMissingMetaSummaries;
  global.groupSummariesForMeta = groupSummariesForMeta;
  global.getFormattedEntriesForAI = getFormattedEntriesForAI;
  global.getSummaryStats = getSummaryStats;
  global.initializeSummarization = initializeSummarization;
  global.META_SUMMARY_CONFIG = META_SUMMARY_CONFIG;
} else {
  // For browser
  window.Summarization = {
    getEntriesNeedingSummaries,
    generateMissingSummaries,
    generateMissingMetaSummaries,
    groupSummariesForMeta,
    getFormattedEntriesForAI,
    getSummaryStats,
    initializeSummarization,
    META_SUMMARY_CONFIG
  };
}
