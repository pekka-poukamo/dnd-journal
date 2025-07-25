// Summary Manager - High-level orchestration for intelligent summarization
// Following functional programming principles and style guide

import { 
  generateSummary, 
  generateMetaSummary,
  needsSummarization,
  hasContentChanged,
  shouldCreateMetaSummary,
  calculateTotalSummaryWords,
  groupSummariesForMeta,
  SUMMARY_CONFIG 
} from './summary-engine.js';

import {
  loadSummary,
  saveSummary,
  deleteSummary,
  loadAllSummaries,
  loadMetaSummary,
  saveMetaSummary,
  deleteMetaSummary,
  loadAllMetaSummaries,
  generateSummaryKey,
  generateMetaSummaryKey,
  getStorageStats,
  getSummariesByPattern,
  getSummariesByType
} from './summary-store.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export const MANAGER_CONFIG = {
  // Target total word count for all summaries combined
  TARGET_TOTAL_WORDS: 500,
  
  // Maximum summaries before meta-summarization triggers
  MAX_SUMMARIES_BEFORE_META: 15,
  
  // How often to check for meta-summary opportunities
  META_CHECK_INTERVAL: 5,
  
  // Recent entries to keep in full (never summarize immediately)
  RECENT_ENTRIES_TO_PRESERVE: 3
};

// =============================================================================
// CORE SUMMARIZATION ORCHESTRATION
// =============================================================================

// Process content for summarization with intelligent management
export const processContent = async (contentType, contentId, content, forceUpdate = false) => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return { success: false, reason: 'Invalid content' };
  }

  const key = generateSummaryKey(contentType, contentId);
  const existingSummary = loadSummary(key);
  
  // Check if summarization is needed
  if (!forceUpdate && existingSummary) {
    const hasChanged = hasContentChanged(content, existingSummary.metadata?.contentHash);
    if (!hasChanged) {
      return { success: true, summary: existingSummary, action: 'unchanged' };
    }
  }
  
  // Check if content meets summarization threshold
  if (!needsSummarization(content)) {
    return { success: false, reason: 'Content too short for summarization' };
  }
  
  try {
    // Generate new summary
    const summaryResult = await generateSummary(key, content);
    
    if (!summaryResult) {
      return { success: false, reason: 'Failed to generate summary' };
    }
    
    // Save the summary
    const saveResult = saveSummary(key, summaryResult);
    
    if (!saveResult.success) {
      return { success: false, reason: 'Failed to save summary' };
    }
    
    // Check if we need to manage total summary length
    await manageOverallSummaryLength();
    
    return { 
      success: true, 
      summary: summaryResult, 
      action: existingSummary ? 'updated' : 'created' 
    };
  } catch (error) {
    return { success: false, reason: error.message };
  }
};

// Intelligent management of overall summary length
const manageOverallSummaryLength = async () => {
  const stats = getStorageStats();
  
  // If we're under the target, no action needed
  if (stats.totalSummaryWords <= MANAGER_CONFIG.TARGET_TOTAL_WORDS) {
    return { action: 'none', reason: 'Within target length' };
  }
  
  // If we have too many individual summaries, create meta-summaries
  if (stats.totalSummaries >= MANAGER_CONFIG.MAX_SUMMARIES_BEFORE_META) {
    return await createMetaSummariesForOptimization();
  }
  
  return { action: 'none', reason: 'No optimization needed' };
};

// Create meta-summaries to optimize storage and maintain target length
const createMetaSummariesForOptimization = async () => {
  const summariesByType = getSummariesByType();
  const results = [];
  
  // Process each content type separately
  for (const [type, summaries] of Object.entries(summariesByType)) {
    if (summaries.length >= SUMMARY_CONFIG.META_SUMMARY_TRIGGER_COUNT) {
      // Sort by timestamp (oldest first for chronological grouping)
      const sortedSummaries = summaries.sort((a, b) => 
        (a.metadata?.timestamp || 0) - (b.metadata?.timestamp || 0)
      );
      
      // Group summaries for meta-summarization
      const groups = groupSummariesForMeta(sortedSummaries);
      
      for (const group of groups) {
        if (group.length >= SUMMARY_CONFIG.META_SUMMARY_TRIGGER_COUNT) {
          const metaResult = await createMetaSummaryFromGroup(type, group);
          if (metaResult.success) {
            results.push(metaResult);
          }
        }
      }
    }
  }
  
  return { action: 'meta-created', results };
};

// Create meta-summary from a group of summaries
const createMetaSummaryFromGroup = async (contentType, summaries) => {
  try {
    const metaKey = generateMetaSummaryKey(`${contentType}-meta`);
    
    // Generate meta-summary
    const metaSummaryResult = await generateMetaSummary(summaries, metaKey);
    
    if (!metaSummaryResult) {
      return { success: false, reason: 'Failed to generate meta-summary' };
    }
    
    // Save meta-summary
    const saveResult = saveMetaSummary(metaKey, metaSummaryResult);
    
    if (!saveResult.success) {
      return { success: false, reason: 'Failed to save meta-summary' };
    }
    
    // Remove the original summaries that are now represented by the meta-summary
    const keysToRemove = summaries.map(s => s.key);
    for (const key of keysToRemove) {
      deleteSummary(key);
    }
    
    return { 
      success: true, 
      metaSummary: metaSummaryResult,
      summarizedCount: summaries.length,
      action: 'meta-created'
    };
  } catch (error) {
    return { success: false, reason: error.message };
  }
};

// =============================================================================
// BATCH PROCESSING
// =============================================================================

// Process multiple pieces of content in batch
export const processBatchContent = async (contentItems) => {
  const results = [];
  
  for (const item of contentItems) {
    const result = await processContent(item.type, item.id, item.content, item.forceUpdate);
    results.push({ ...item, result });
  }
  
  return results;
};

// Auto-process content based on rules
export const autoProcessContent = async (contentType, allContent) => {
  const results = [];
  
  // Sort content by timestamp to preserve recent entries
  const sortedContent = [...allContent].sort((a, b) => b.timestamp - a.timestamp);
  
  // Skip recent entries (preserve in full)
  const contentToProcess = sortedContent.slice(MANAGER_CONFIG.RECENT_ENTRIES_TO_PRESERVE);
  
  for (const content of contentToProcess) {
    if (needsSummarization(content.content || content.text)) {
      const result = await processContent(contentType, content.id, content.content || content.text);
      if (result.success) {
        results.push(result);
      }
    }
  }
  
  return results;
};

// =============================================================================
// RETRIEVAL AND FORMATTING
// =============================================================================

// Get formatted content for AI consumption (mix of full content and summaries)
export const getFormattedContentForAI = (contentType, allContent, maxItems = 10) => {
  const sortedContent = [...allContent].sort((a, b) => b.timestamp - a.timestamp);
  const formattedContent = [];
  
  // Always include recent items in full
  const recentItems = sortedContent.slice(0, MANAGER_CONFIG.RECENT_ENTRIES_TO_PRESERVE);
  recentItems.forEach(item => {
    formattedContent.push({
      key: generateSummaryKey(contentType, item.id),
      type: 'full',
      content: item.content || item.text,
      title: item.title,
      timestamp: item.timestamp
    });
  });
  
  // For older items, use summaries if available
  const olderItems = sortedContent.slice(MANAGER_CONFIG.RECENT_ENTRIES_TO_PRESERVE);
  olderItems.forEach(item => {
    const key = generateSummaryKey(contentType, item.id);
    const summary = loadSummary(key);
    
    if (summary) {
      formattedContent.push({
        key,
        type: 'summary',
        content: summary.content,
        title: item.title,
        timestamp: item.timestamp,
        originalWordCount: summary.metadata?.originalWordCount
      });
    } else {
      // Fallback to full content if no summary
      formattedContent.push({
        key,
        type: 'full',
        content: item.content || item.text,
        title: item.title,
        timestamp: item.timestamp
      });
    }
  });
  
  // Add meta-summaries for very old content
  const metaSummaries = loadAllMetaSummaries();
  Object.entries(metaSummaries).forEach(([key, metaSummary]) => {
    if (key.startsWith(`${contentType}-meta`)) {
      formattedContent.push({
        key,
        type: 'meta-summary',
        content: metaSummary.content,
        title: metaSummary.metadata?.title || 'Summary Collection',
        timestamp: metaSummary.metadata?.timestamp,
        summaryCount: metaSummary.metadata?.summaryCount
      });
    }
  });
  
  return formattedContent.slice(0, maxItems);
};

// Get all summaries for a specific content type
export const getAllSummariesForType = (contentType) => {
  const pattern = `^${contentType}:`;
  return getSummariesByPattern(pattern);
};

// =============================================================================
// SUMMARY STATISTICS AND HEALTH
// =============================================================================

// Get comprehensive summary statistics
export const getSummaryOverview = () => {
  const stats = getStorageStats();
  const summariesByType = getSummariesByType();
  
  // Calculate efficiency metrics
  const efficiencyRatio = stats.storageEfficiency;
  const compressionHealth = stats.averageCompressionRatio;
  const isWithinTarget = stats.totalSummaryWords <= MANAGER_CONFIG.TARGET_TOTAL_WORDS;
  
  return {
    ...stats,
    summariesByType: Object.keys(summariesByType).reduce((acc, type) => {
      acc[type] = summariesByType[type].length;
      return acc;
    }, {}),
    health: {
      withinTargetLength: isWithinTarget,
      compressionEfficiency: compressionHealth,
      storageEfficiency: efficiencyRatio,
      needsOptimization: !isWithinTarget || stats.totalSummaries > MANAGER_CONFIG.MAX_SUMMARIES_BEFORE_META
    },
    targetLength: MANAGER_CONFIG.TARGET_TOTAL_WORDS,
    currentLength: stats.totalSummaryWords
  };
};

// Check if the summary system is healthy and optimized
export const checkSummaryHealth = () => {
  const overview = getSummaryOverview();
  const issues = [];
  
  if (!overview.health.withinTargetLength) {
    issues.push(`Total summary length (${overview.currentLength}) exceeds target (${overview.targetLength})`);
  }
  
  if (overview.health.needsOptimization) {
    issues.push(`Too many individual summaries (${overview.totalSummaries}), consider meta-summarization`);
  }
  
  if (overview.health.compressionEfficiency < 0.1) {
    issues.push('Poor compression efficiency, summaries may be too long');
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    overview
  };
};

// =============================================================================
// MAINTENANCE AND OPTIMIZATION
// =============================================================================

// Force optimization of the summary system
export const optimizeSummarySystem = async () => {
  const healthCheck = checkSummaryHealth();
  
  if (healthCheck.healthy) {
    return { success: true, action: 'none', message: 'System already optimized' };
  }
  
  try {
    // Force meta-summarization if needed
    const optimizationResult = await createMetaSummariesForOptimization();
    
    // Re-check health after optimization
    const newHealthCheck = checkSummaryHealth();
    
    return {
      success: true,
      action: 'optimized',
      before: healthCheck,
      after: newHealthCheck,
      optimizationResult
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      healthCheck
    };
  }
};