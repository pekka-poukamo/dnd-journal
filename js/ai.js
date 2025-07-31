// AI Module - Pure Functional Y.js Integration

// ================================
// NARRATIVE INTROSPECTION SYSTEM
// ================================
//
// This module provides a unified approach to AI-generated character introspection
// focused on great storytelling and discovering unexpected character depths.
//
// FORMAT: 3+1 Questions
// - 3 Core Narrative Questions: Pivotal moments, current conflicts, future paths
// - 1 Unobvious Question: Surprising, unconventional question for deeper insight
//
// INTEGRATION WITH SUMMARIES:
// The AI automatically uses generated summaries when available, providing context from:
// - Recent full entries (most recent adventures)
// - Individual entry summaries (older entries)  
// - Meta-summaries (grouped summaries of many older entries)
//
// This ensures the AI has relevant context while encouraging compelling narratives
// and helping players discover unexpected character depths.
//
// ================================

import { 
  createInitialSettings, 
  getWordCount,
  sortEntriesByDate,
  formatDate
} from './utils.js';
import { getYjsState, getSummary, setSummary, getSetting, getSummariesMap, getEntries } from './yjs.js';
import { getEncoding } from 'js-tiktoken';

// Unified narrative-focused system prompt with unobvious question element
export const NARRATIVE_INTROSPECTION_PROMPT = `You are a D&D storytelling companion who helps players discover compelling narratives and unexpected character depths.

Present exactly 4 questions as a simple numbered list without headings:

1. A pivotal moment, memory, or relationship that has shaped who they are
2. A current internal conflict, dilemma, or aspiration they're wrestling with  
3. How recent events might change their path or reveal something new about them
4. An unobvious, surprising question that explores an unconventional perspective, hidden motivation, or unexpected character truth

Make questions specific to the character's situation and recent adventures. Focus on narrative depth and emotional truth.`;

// ================================
// END SYSTEM PROMPT CONFIGURATIONS
// ================================

// Global tiktoken encoder - will be loaded asynchronously
let tiktokenEncoder = null;

// Initialize tiktoken encoder using the cl100k_base encoding for gpt-3.5-turbo and gpt-4
const initializeTiktoken = async () => {
  if (tiktokenEncoder) {
    return tiktokenEncoder;
  }
  
  try {
    // Use the npm-installed js-tiktoken with ES modules
    tiktokenEncoder = getEncoding('cl100k_base');
    return tiktokenEncoder;
  } catch (error) {
    console.warn('Failed to initialize tiktoken:', error);
    return null;
  }
};

// Accurate token count using tiktoken or fallback estimation
export const estimateTokenCount = async (text) => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  const encoder = await initializeTiktoken();
  if (encoder) {
    try {
      return encoder.encode(text).length;
    } catch (error) {
      console.warn('Tiktoken encoding failed, using fallback:', error);
    }
  }
  
  // Fallback to simple estimation (4 characters per token)
  return Math.ceil(text.length / 4);
};

// Calculate total tokens for a set of messages
export const calculateTotalTokens = async (messages) => {
  if (!Array.isArray(messages)) {
    return 0;
  }
  
  let total = 0;
  for (const message of messages) {
    const contentTokens = await estimateTokenCount(message.content || '');
    // Add small overhead for message structure (role, etc.)
    total += contentTokens + 4;
  }
  
  return total;
};

// Pure function to load settings
export const loadAISettings = () => {
  const state = getYjsState();
  return {
    apiKey: getSetting(state, 'openai-api-key', ''),
    enableAIFeatures: getSetting(state, 'ai-enabled', false)
  };
};

// Pure function to check if AI features are available
export const isAIEnabled = () => {
  const state = getYjsState();
  const apiKey = getSetting(state, 'openai-api-key', '');
  const enabled = getSetting(state, 'ai-enabled', false);
  return Boolean(enabled && apiKey);
};

// Pure function to create introspection prompt
export const createIntrospectionPrompt = (character, formattedEntries) => {
  // Use formatted character that may include summarized backstory/notes
  const formattedCharacter = getFormattedCharacterForAI(character);
  
  const characterInfo = formattedCharacter.name ? 
    `${formattedCharacter.name}, a ${formattedCharacter.race || 'character'} ${formattedCharacter.class || 'adventurer'}` :
    'your character';
    
  const backstoryContext = formattedCharacter.backstory ? 
    `\n\nCharacter Background: ${formattedCharacter.backstory}${formattedCharacter.backstorySummarized ? ' (summarized)' : ''}` : '';
    
  const notesContext = formattedCharacter.notes ? 
    `\n\nAdditional Character Details: ${formattedCharacter.notes}${formattedCharacter.notesSummarized ? ' (summarized)' : ''}` : '';
    
  // Format entries using the summarization system's formatted entries
  const entriesContext = formattedEntries.length > 0 ? 
    `\n\nJourney Context:\n${formattedEntries.map(entry => {
      const prefix = entry.type === 'meta-summary' ? 'Adventures Summary' :
                     entry.type === 'summary' ? 'Entry Summary' : 'Recent Entry';
      // Increase context length for better AI understanding - allow up to 500 characters per entry
      const content = entry.content.length > 500 ? entry.content.substring(0, 500) + '...' : entry.content;
      return `- ${prefix}: ${entry.title} - ${content}`;
    }).join('\n')}` : '';

  return `Character: ${characterInfo}${backstoryContext}${notesContext}${entriesContext}

Please create 4 introspective questions (3 core narrative + 1 unobvious) that would help this player discover compelling stories and unexpected depths in their character.`;
};

// Call OpenAI API for text generation
export const callOpenAI = async (prompt, maxTokens = 1200) => {
  const settings = loadAISettings();
  
  if (!settings.apiKey) {
    throw new Error('No API key configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: NARRATIVE_INTROSPECTION_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'Unable to generate response';
  } catch (error) {
          console.error('Failed to call OpenAI API:', error);
    throw error;
  }
};

// Call OpenAI API specifically for summarization (without narrative system prompt)
export const callOpenAIForSummarization = async (prompt, maxTokens = 1200) => {
  const settings = loadAISettings();
  
  if (!settings.apiKey) {
    throw new Error('No API key configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    throw error;
  }
};

// Generate introspection prompt
export const generateIntrospectionPrompt = async (character, entries) => {
  if (!isAIEnabled()) {
    return null;
  }

  try {
    // Use formatted entries that include summaries for older entries
    const formattedEntries = getFormattedEntriesForAI();
    const promptText = createIntrospectionPrompt(character, formattedEntries);
    const response = await callOpenAI(promptText);
    
    return response;
  } catch (error) {
    console.error('Failed to generate introspection prompt:', error);
    return null;
  }
};

// Generate entry summary
export const generateEntrySummary = async (entry) => {
  if (!isAIEnabled()) {
    return null;
  }

  // Return null for empty or very short content
  if (!entry.content || entry.content.trim().length < 50) {
    return null;
  }

  try {
    const wordCount = getWordCount(entry.content);
    // Use proportional word count based on original length, with much higher targets
    const targetLength = Math.max(100, Math.min(300, Math.floor(wordCount * 0.25))); // 25% of original, min 100, max 300 words
    
    const prompt = `Summarize this text in approximately ${targetLength} words, capturing the key events, decisions, and character developments.

Title: ${entry.title}
Content: ${entry.content}`;

    const summary = await callOpenAIForSummarization(prompt, targetLength * 4); // Much higher token limit
    
    return {
      id: entry.id,
      originalWordCount: wordCount,
      summary: summary,
      summaryWordCount: getWordCount(summary),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error generating entry summary:', error);
    return null;
  }
};

// Summaries are now accessed through the summarization module API

// Get existing summary for an entry (read-only, no generation)
export const getEntrySummary = (state, entryId) => {
  return getSummary(state, entryId);
};

// Helper function for prompt information
export const getPromptDescription = () => {
  return 'Narrative-focused introspection with 3 core questions + 1 unobvious question';
};

// Get the prompt that would be sent to AI (for preview purposes - reuses exact same logic as generateIntrospectionPrompt)
export const getIntrospectionPromptForPreview = async (character, entries) => {
  if (!isAIEnabled()) {
    return null;
  }

  try {
    // Use the exact same logic as generateIntrospectionPrompt but return the prompt instead of calling API
    const formattedEntries = getFormattedEntriesForAI();
    const userPrompt = createIntrospectionPrompt(character, formattedEntries);
    
    const messages = [
      {
        role: 'system',
        content: NARRATIVE_INTROSPECTION_PROMPT
      },
      {
        role: 'user', 
        content: userPrompt
      }
    ];
    
    const totalTokens = await calculateTotalTokens(messages);
    
    return {
      systemPrompt: NARRATIVE_INTROSPECTION_PROMPT,
      userPrompt: userPrompt,
      messages: messages,
      totalTokens: totalTokens
    };
  } catch (error) {
    console.error('Failed to create prompt for preview:', error);
    return null;
  }
};

// =============================================================================
// AI-SPECIFIC FORMATTING FUNCTIONS
// =============================================================================

// Format character data for AI processing (with summaries if available)
export const getFormattedCharacterForAI = (character) => {
  // Get character summaries from Y.js directly
  const characterSummaries = {};
  
  try {
    const state = getYjsState();
    // Collect character-related summaries from Y.js summariesMap
    const summariesMap = getSummariesMap(state);
    if (summariesMap) {
      summariesMap.forEach((value, key) => {
        if (key.startsWith('character:')) {
          const field = key.replace('character:', '');
          characterSummaries[field] = value;
        }
      });
    }
  } catch (error) {
    // Y.js not initialized or summaries not available
    console.debug('Could not access summaries for character formatting:', error);
  }
  
  const processField = (fieldName, originalValue) => {
    const summary = characterSummaries[fieldName];
    return summary || originalValue || '';
  };

  return {
    name: character.name || 'unnamed adventurer',
    race: processField('race', character.race),
    class: processField('class', character.class),
    backstory: processField('backstory', character.backstory),
    notes: processField('notes', character.notes)
  };
};

// Format entries for AI processing (with summaries for older entries, full content for recent)
export const getFormattedEntriesForAI = () => {
  try {
    const state = getYjsState();
    // Get entries directly from Y.js
    const entries = getEntries(state);
  
  if (!entries || entries.length === 0) {
    return 'No journal entries yet. This character is just beginning their adventure.';
  }
  
    // Sort entries by timestamp (newest first) - entries should already be sorted from getEntries()
    const sortedEntries = sortEntriesByDate(entries);
    
    // Use last 5 entries for context, with full content for recent ones and summaries for older ones
    const recentEntries = sortedEntries.slice(0, 5);
    
    return recentEntries.map((entry, index) => {
      const summary = getSummary(state, `entry:${entry.id}`);
      let content;
      
      if (index < 2 && !summary) {
        // Most recent 2 entries: use full content if no summary available
        content = entry.content;
      } else if (summary) {
        // Use summary if available
        content = `[Summary: ${summary}]`;
      } else {
        // Fallback to full content for older entries without summaries
        content = entry.content;
      }
      
      const formattedDate = formatDate ? formatDate(entry.timestamp) : new Date(entry.timestamp).toLocaleDateString();
      return `**${entry.title}** (${formattedDate})\n${content}`;
    }).join('\n\n');
  } catch (error) {
    console.debug('Could not format entries for AI:', error);
    return 'No journal entries available.';
  }
};
