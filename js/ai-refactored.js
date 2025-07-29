// AI - Refactored AI Module with Extracted Components
// Following functional programming principles and style guide

// Import extracted modules
import { estimateTokenCount, calculateTotalTokens } from './token-estimation.js';
import { 
  createIntrospectionPrompt, 
  createSummarizationPrompt,
  createIntrospectionMessages,
  createSummarizationMessages,
  getPromptDescription,
  NARRATIVE_INTROSPECTION_PROMPT
} from './ai-prompts.js';

// Import utilities and settings
import { getWordCount } from './utils.js';
import { handleError, createSuccess, safeExecute } from './error-handling.js';
import { loadSettingsFromSystem, isAIEnabled, hasValidApiKey } from './settings-data.js';
import { getSummaryByKey, storeSummary } from './summarization.js';
import { getSystem } from './yjs.js';

// ================================
// AI AVAILABILITY AND SETTINGS
// ================================

// Pure function to check if AI features are available
export const isAIAvailable = () => {
  return isAIEnabled() && hasValidApiKey();
};

// Function to load AI settings
export const loadAISettings = () => {
  const result = loadSettingsFromSystem();
  if (!result.success) {
    return {
      apiKey: '',
      enableAIFeatures: false
    };
  }
  
  return {
    apiKey: result.data.apiKey || '',
    enableAIFeatures: result.data.enableAIFeatures || false
  };
};

// ================================
// OPENAI API COMMUNICATION
// ================================

// Function to call OpenAI API for general purposes
export const callOpenAI = async (prompt, maxTokens = 1000) => {
  if (!isAIAvailable()) {
    throw new Error('AI features are not available - check API key and settings');
  }
  
  return safeExecute(async () => {
    const settings = loadAISettings();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }, 'OpenAI API call');
};

// Function to call OpenAI API for summarization (lower temperature)
export const callOpenAIForSummarization = async (prompt, maxTokens = 500) => {
  if (!isAIAvailable()) {
    throw new Error('AI features are not available - check API key and settings');
  }
  
  return safeExecute(async () => {
    const settings = loadAISettings();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3  // Lower temperature for more consistent summarization
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }, 'OpenAI summarization API call');
};

// ================================
// HIGH-LEVEL AI FUNCTIONS
// ================================

// Function to generate introspection prompt
export const generateIntrospectionPrompt = async (character, entries) => {
  if (!isAIAvailable()) {
    return null;
  }

  try {
    // Use formatted entries that include summaries for older entries
    const formattedEntries = getFormattedEntriesForAI();
    const promptText = createIntrospectionPrompt(character, formattedEntries);
    
    const result = await callOpenAI(promptText);
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Failed to generate introspection prompt:', error);
    return null;
  }
};

// Function to generate entry summary
export const generateEntrySummary = async (entry) => {
  if (!isAIAvailable()) {
    return null;
  }

  // Return null for empty or very short content
  if (!entry.content || entry.content.trim().length < 50) {
    return null;
  }

  try {
    const wordCount = getWordCount(entry.content);
    const targetLength = Math.max(100, Math.min(300, Math.floor(wordCount * 0.25)));
    
    const prompt = createSummarizationPrompt(entry, targetLength);
    if (!prompt) {
      return null;
    }
    
    const result = await callOpenAIForSummarization(prompt, targetLength * 4);
    
    if (result.success) {
      return {
        id: entry.id,
        originalWordCount: wordCount,
        summary: result.data,
        summaryWordCount: getWordCount(result.data),
        timestamp: Date.now()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error generating entry summary:', error);
    return null;
  }
};

// Function to get or generate summary for an entry
export const getEntrySummary = async (entry) => {
  // Check for existing summary using summarization module API
  const existingSummary = getSummaryByKey(entry.id);
  if (existingSummary) {
    return existingSummary;
  }
  
  // Generate new summary
  const summary = await generateEntrySummary(entry);
  if (summary) {
    // Store using summarization module API - automatically persisted via Yjs
    storeSummary(entry.id, summary);
  }
  
  return summary;
};

// ================================
// PREVIEW AND INFORMATION FUNCTIONS
// ================================

// Function to get the prompt that would be sent to AI (for preview purposes)
export const getIntrospectionPromptForPreview = async (character, entries) => {
  if (!isAIAvailable()) {
    return null;
  }

  try {
    // Use the exact same logic as generateIntrospectionPrompt but return the prompt instead of calling API
    const formattedEntries = getFormattedEntriesForAI();
    const userPrompt = createIntrospectionPrompt(character, formattedEntries);
    
    const messages = createIntrospectionMessages(character, formattedEntries);
    const totalTokens = await calculateTotalTokens(messages);
    
    return {
      systemPrompt: NARRATIVE_INTROSPECTION_PROMPT,
      user: userPrompt,
      messages: messages,
      totalTokens: totalTokens
    };
  } catch (error) {
    console.error('Failed to create prompt for preview:', error);
    return null;
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

// Function to get formatted entries for AI (with summaries integration)
export const getFormattedEntriesForAI = () => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.journalMap) {
      return [];
    }

    const entriesArray = yjsSystem.journalMap.get('entries');
    if (!entriesArray) {
      return [];
    }

    const entries = entriesArray.toArray().map(entryMap => ({
      id: entryMap.get('id'),
      title: entryMap.get('title'),
      content: entryMap.get('content'),
      timestamp: entryMap.get('timestamp')
    }));

    // Sort by timestamp (newest first)
    const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
    
    // Add summaries to older entries (entries beyond the first 3)
    return sortedEntries.map((entry, index) => {
      if (index >= 3) {
        const summary = getSummaryByKey(entry.id);
        if (summary) {
          return {
            ...entry,
            summary: summary.summary
          };
        }
      }
      return entry;
    });
  } catch (error) {
    console.error('Failed to get formatted entries:', error);
    return [];
  }
};

// Export compatibility functions
export { 
  isAIEnabled,
  hasValidApiKey,
  estimateTokenCount,
  calculateTotalTokens,
  getPromptDescription
};