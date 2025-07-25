// Summary Engine - Content-agnostic summary generation
// Following functional programming principles and style guide

// =============================================================================
// CONFIGURATION
// =============================================================================

export const SUMMARY_CONFIG = {
  // Default target word counts
  DEFAULT_TARGET_WORDS: 50,
  META_SUMMARY_TARGET_WORDS: 100,
  
  // Thresholds for auto-summarization
  MIN_WORDS_FOR_SUMMARY: 200,
  META_SUMMARY_TRIGGER_COUNT: 10,
  
  // Summary compression ratios
  COMPRESSION_RATIOS: {
    MINIMAL: 0.1,   // 10% of original
    MODERATE: 0.2,  // 20% of original  
    GENEROUS: 0.3   // 30% of original
  }
};

// =============================================================================
// CORE SUMMARY GENERATION
// =============================================================================

// Pure function to calculate target words based on content length
export const calculateTargetWords = (contentWordCount, ratio = SUMMARY_CONFIG.COMPRESSION_RATIOS.MODERATE) => {
  const calculated = Math.floor(contentWordCount * ratio);
  return Math.max(10, Math.min(calculated, SUMMARY_CONFIG.DEFAULT_TARGET_WORDS));
};

// Pure function to create summary metadata
export const createSummaryMetadata = (originalContent, summaryContent, contentKey) => ({
  key: contentKey,
  originalWordCount: getWordCount(originalContent),
  summaryWordCount: getWordCount(summaryContent),
  compressionRatio: getWordCount(summaryContent) / getWordCount(originalContent),
  contentHash: generateContentHash(originalContent),
  timestamp: Date.now()
});

// Pure function to generate content hash for change detection
const generateContentHash = (content) => {
  // Simple hash for content change detection
  return btoa(content).substring(0, 16);
};

// Pure function to get word count
const getWordCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// =============================================================================
// AI INTEGRATION
// =============================================================================

// Generate summary using AI
export const generateSummary = async (contentKey, content, targetWords = null) => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return null;
  }

  const wordCount = getWordCount(content);
  const finalTargetWords = targetWords || calculateTargetWords(wordCount);
  
  try {
    // Dynamic import to avoid circular dependencies
    const aiModule = await import('./ai-storytelling.js');
    
    if (!aiModule.isAIAvailable()) {
      return null;
    }

    const prompt = createSummaryPrompt(content, finalTargetWords);
    const summaryText = await aiModule.callAIForSummary(prompt, finalTargetWords * 2);
    
    if (!summaryText) {
      return null;
    }

    const metadata = createSummaryMetadata(content, summaryText, contentKey);
    
    return {
      content: summaryText,
      metadata
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return null;
  }
};

// Generate meta-summary from multiple summaries
export const generateMetaSummary = async (summaries, metaKey) => {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return null;
  }

  // Combine all summary content
  const combinedContent = summaries
    .map(summary => summary.content || summary)
    .join('\n\n');
  
  const targetWords = SUMMARY_CONFIG.META_SUMMARY_TARGET_WORDS;
  
  try {
    const aiModule = await import('./ai-storytelling.js');
    
    if (!aiModule.isAIAvailable()) {
      return null;
    }

    const prompt = createMetaSummaryPrompt(combinedContent, targetWords);
    const metaSummaryText = await aiModule.callAIForSummary(prompt, targetWords * 2);
    
    if (!metaSummaryText) {
      return null;
    }

    const metadata = createSummaryMetadata(combinedContent, metaSummaryText, metaKey);
    
    return {
      content: metaSummaryText,
      metadata: {
        ...metadata,
        includedSummaryKeys: summaries.map(s => s.metadata?.key || s.key),
        summaryCount: summaries.length,
        type: 'meta-summary'
      }
    };
  } catch (error) {
    console.error('Failed to generate meta-summary:', error);
    return null;
  }
};

// =============================================================================
// PROMPT GENERATION
// =============================================================================

// Pure function to create summary prompt
const createSummaryPrompt = (content, targetWords) => {
  return `Summarize the following text in approximately ${targetWords} words. Focus on the key information and main points.

Content:
${content}`;
};

// Pure function to create meta-summary prompt
const createMetaSummaryPrompt = (combinedContent, targetWords) => {
  return `Create a comprehensive summary of the following summaries in approximately ${targetWords} words. Identify common themes and key developments.

Summaries:
${combinedContent}`;
};

// =============================================================================
// CONTENT ANALYSIS
// =============================================================================

// Pure function to check if content needs summarization
export const needsSummarization = (content, minWords = SUMMARY_CONFIG.MIN_WORDS_FOR_SUMMARY) => {
  return getWordCount(content) >= minWords;
};

// Pure function to check if content has changed
export const hasContentChanged = (content, existingHash) => {
  return generateContentHash(content) !== existingHash;
};

// Pure function to check if meta-summary should be created
export const shouldCreateMetaSummary = (summaryCount) => {
  return summaryCount >= SUMMARY_CONFIG.META_SUMMARY_TRIGGER_COUNT;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Pure function to validate summary data
export const isValidSummary = (summary) => {
  return summary && 
         summary.content && 
         typeof summary.content === 'string' && 
         summary.content.trim().length > 0 &&
         summary.metadata &&
         summary.metadata.key;
};

// Pure function to calculate total words in summaries
export const calculateTotalSummaryWords = (summaries) => {
  return summaries.reduce((total, summary) => {
    const wordCount = summary.metadata?.summaryWordCount || getWordCount(summary.content || '');
    return total + wordCount;
  }, 0);
};

// Pure function to group summaries for meta-summarization
export const groupSummariesForMeta = (summaries, groupSize = SUMMARY_CONFIG.META_SUMMARY_TRIGGER_COUNT) => {
  const groups = [];
  for (let i = 0; i < summaries.length; i += groupSize) {
    groups.push(summaries.slice(i, i + groupSize));
  }
  return groups;
};