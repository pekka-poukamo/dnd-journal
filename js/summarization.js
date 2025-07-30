// Summarization - AI-powered content summarization
// Following functional programming principles and style guide

import { getWordCount, safeParseJSON } from './utils.js';
import { summariesMap, getSummary, saveSummary, getAllSummaries, clearAllSummaries } from './yjs.js';
import { isAPIAvailable, callOpenAI, NARRATIVE_INTROSPECTION_PROMPT } from './openai-wrapper.js';

// Pure function to calculate logarithmic summary length based on content length
export const calculateSummaryLength = (contentWords) => {
  if (contentWords <= 0) return 0;
  if (contentWords < 150) return 0; // Too short to summarize
  
  // Logarithmic scaling: more content = longer summaries, but with diminishing returns
  // Base length of 50 words, then log scaling
  const baseLength = 50;
  const scaleFactor = 25;
  const logComponent = Math.log(contentWords / 100) * scaleFactor;
  
  return Math.round(Math.max(baseLength, baseLength + logComponent));
};

// Pure function to generate system prompt for summarization
export const createSummarizationSystemPrompt = (targetLength) => `You are a professional content summarizer for D&D journal entries. 

SUMMARIZATION RULES:
1. Create a ${targetLength}-word summary of the provided content
2. Focus on key narrative elements: actions, decisions, character development, plot points
3. Maintain chronological order of events
4. Use past tense, third person perspective
5. Preserve important names, locations, and story elements
6. Be concise but comprehensive
7. Do NOT add commentary or analysis - only summarize what happened

Return ONLY the summary text, no additional formatting or commentary.`;

// Pure function to create user prompt for summarization
export const createSummarizationUserPrompt = (content) => 
  `Please summarize the following D&D journal content:\n\n${content}`;

// Validate content for summarization
export const isContentSuitable = (content) => {
  if (!content || typeof content !== 'string') return false;
  
  const wordCount = getWordCount(content.trim());
  return wordCount >= 150; // Minimum threshold for useful summarization
};

// Check if summary already exists for given key
export const summaryExists = (summaryKey) => {
  try {
    if (!summariesMap) return false;
    
    const existingSummary = summariesMap.get(summaryKey);
    return Boolean(existingSummary?.get?.('content') || existingSummary?.content);
  } catch (error) {
    console.warn('Error checking summary existence:', error);
    return false;
  }
};

// Store summary in Yjs
export const storeSummary = (summaryKey, summaryData) => {
  try {
    if (!summariesMap) {
      console.warn('Yjs summaries map not available');
      return false;
    }
    
    // Store summary data directly - the saveSummary function handles the structure
    saveSummary(summaryKey, summaryData);
    
    console.log(`Summary stored for ${summaryKey}: ${summaryData.words} words`);
    return true;
  } catch (error) {
    console.error('Error storing summary:', error);
    return false;
  }
};

// Generate AI summary for content
export const generateSummary = async (content, targetLength) => {
  if (!isAPIAvailable()) {
    throw new Error('AI API not available');
  }
  
  const systemPrompt = createSummarizationSystemPrompt(targetLength);
  const userPrompt = createSummarizationUserPrompt(content);
  
  try {
    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);
    
    const summaryContent = response.trim();
    const summaryWords = getWordCount(summaryContent);
    const originalWords = getWordCount(content);
    
    return {
      content: summaryContent,
      words: summaryWords,
      originalWords: originalWords,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
};

// Main summarization function
export const summarize = async (summaryKey, content) => {
  // Validate inputs
  if (!summaryKey || typeof summaryKey !== 'string') {
    throw new Error('Invalid summary key');
  }
  
  if (!isContentSuitable(content)) {
    console.log('Content too short for summarization (minimum 150 words required)');
    return null;
  }
  
  // Check if summary already exists
  if (summaryExists(summaryKey)) {
    console.log(`Summary already exists for ${summaryKey}`);
    return null;
  }
  
  try {
    const originalWords = getWordCount(content);
    const targetLength = calculateSummaryLength(originalWords);
    
    if (targetLength === 0) {
      console.log('Content too short for meaningful summarization');
      return null;
    }
    
    console.log(`Generating ${targetLength}-word summary for ${originalWords}-word content`);
    
    const summaryData = await generateSummary(content, targetLength);
    const stored = storeSummary(summaryKey, summaryData);
    
    if (stored) {
      console.log(`Successfully created summary: ${summaryData.words}/${targetLength} words`);
      return summaryData.content;
    } else {
      throw new Error('Failed to store summary');
    }
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  }
};

// Get existing summary by key (re-export from yjs-direct)
export { getSummary };

// Get all summaries (re-export from yjs-direct)
export { getAllSummaries };

// Clear all summaries (re-export from yjs-direct)
export { clearAllSummaries };

// Utility function to check if running in test environment
export const isTestEnvironment = () => 
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
  (typeof global !== 'undefined' && global.describe && global.it) ||
  (typeof document !== 'undefined' && document.location && document.location.href === 'http://localhost/');

// Get formatted entries for AI analysis (used by storytelling features)
export const getFormattedEntriesForAI = () => {
  try {
    // This would need to be implemented using direct access to journalMap
    // For now, return empty array as this function needs journal data access
    console.warn('getFormattedEntriesForAI needs to be updated to use direct journal access');
    return [];
  } catch (error) {
    console.error('Error getting formatted entries for AI:', error);
    return [];
  }
};
