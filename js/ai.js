// AI Module - OpenAI Integration for Introspection and Summarization

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
  loadDataWithFallback, 
  createInitialSettings, 
  getWordCount, 
  STORAGE_KEYS, 
  safeSetToStorage 
} from './utils.js';

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

// Initialize tiktoken encoder (using the lite version with cl100k_base for gpt-3.5-turbo)
const initializeTiktoken = async () => {
  if (tiktokenEncoder) {
    return tiktokenEncoder;
  }
  
  try {
    // Check if js-tiktoken is available globally (loaded via CDN)
    if (typeof window.JsTiktoken === 'undefined') {
      console.warn('js-tiktoken not available, falling back to estimation');
      return null;
    }
    
    // Load the cl100k_base encoding for gpt-3.5-turbo
    const res = await fetch('https://tiktoken.pages.dev/js/cl100k_base.json');
    const cl100k_base = await res.json();
    
    const { Tiktoken } = window.JsTiktoken;
    tiktokenEncoder = new Tiktoken(cl100k_base);
    
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
  return loadDataWithFallback(
    STORAGE_KEYS.SETTINGS, 
    createInitialSettings()
  );
};

// Pure function to check if AI features are available
export const isAIEnabled = () => {
  const settings = loadAISettings();
  return Boolean(settings.enableAIFeatures && settings.apiKey && settings.apiKey.startsWith('sk-'));
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
export const callOpenAI = async (prompt, maxTokens = 400) => {
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
        model: 'gpt-3.5-turbo',
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

  try {
    const wordCount = getWordCount(entry.content);
    const targetLength = Math.max(10, Math.floor(wordCount * 0.3)); // 30% of original length
    
    const prompt = `Summarize this D&D journal entry in approximately ${targetLength} words. Keep the key events, emotions, and character development:

Title: ${entry.title}
Content: ${entry.content}`;

    const summary = await callOpenAI(prompt, 100);
    
    return {
      id: entry.id,
      originalWordCount: wordCount,
      summary: summary,
      summaryWordCount: getWordCount(summary),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Failed to generate entry summary:', error);
    return null;
  }
};

// Load stored summaries
const loadStoredSummaries = () => {
  return loadDataWithFallback(STORAGE_KEYS.SUMMARIES, {});
};

// Save summaries to localStorage
const saveStoredSummaries = (summaries) => {
  safeSetToStorage(STORAGE_KEYS.SUMMARIES, summaries);
};

// Get or generate summary for an entry
export const getEntrySummary = async (entry) => {
  const storedSummaries = loadStoredSummaries();
  
  // Return existing summary if available
  if (storedSummaries[entry.id]) {
    return storedSummaries[entry.id];
  }
  
  // Generate new summary
  const summary = await generateEntrySummary(entry);
  if (summary) {
    storedSummaries[entry.id] = summary;
    saveStoredSummaries(storedSummaries);
  }
  
  return summary;
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
  // Use consistent storage utilities
  const characterSummaries = loadDataWithFallback('simple-dnd-journal-character-summaries', {});
  
  return {
    ...character,
    backstorySummarized: characterSummaries.backstory ? true : false,
    notesSummarized: characterSummaries.notes ? true : false,
    backstory: characterSummaries.backstory ? characterSummaries.backstory.summary : character.backstory,
    notes: characterSummaries.notes ? characterSummaries.notes.summary : character.notes
  };
};

// Format entries for AI processing (with summaries for older entries, full content for recent)
export const getFormattedEntriesForAI = () => {
  // Use consistent storage utilities
  const journalData = loadDataWithFallback(STORAGE_KEYS.JOURNAL, { character: {}, entries: [] });
  const entrySummaries = loadDataWithFallback(STORAGE_KEYS.SUMMARIES, {});
  const metaSummaries = loadDataWithFallback('simple-dnd-journal-meta-summaries', {});
  
  // Get all entry IDs that are already included in meta-summaries to avoid duplication
  const entriesInMetaSummaries = new Set();
  Object.values(metaSummaries).forEach(metaSummary => {
    if (metaSummary.includedSummaryIds) {
      metaSummary.includedSummaryIds.forEach(entryId => {
        // Entry summaries are keyed by entry ID, so the summaryId is the entryId
        entriesInMetaSummaries.add(entryId);
      });
    }
  });
  
  const sortedEntries = [...(journalData.entries || [])].sort((a, b) => b.timestamp - a.timestamp);
  const recentEntries = sortedEntries.slice(0, 5); // Keep 5 most recent entries in full
  const olderEntries = sortedEntries.slice(5);
  
  const formattedEntries = [];
  
  // Add recent entries in full (these are always included regardless of meta-summaries)
  recentEntries.forEach(entry => {
    formattedEntries.push({
      type: 'recent',
      title: entry.title,
      content: entry.content,
      timestamp: entry.timestamp
    });
  });
  
  // Add individual summaries for older entries, but only if they're not already in meta-summaries
  olderEntries.forEach(entry => {
    // Skip entries that are already included in meta-summaries
    if (entriesInMetaSummaries.has(entry.id)) {
      return;
    }
    
    const summary = entrySummaries[entry.id];
    if (summary) {
      formattedEntries.push({
        type: 'summary',
        title: entry.title,
        content: summary.summary,
        timestamp: entry.timestamp
      });
    } else {
      // Fallback to full entry if no summary available
      formattedEntries.push({
        type: 'recent',
        title: entry.title,
        content: entry.content,
        timestamp: entry.timestamp
      });
    }
  });
  
  // Add meta-summaries for very old entries (these replace the individual entries)
  Object.values(metaSummaries).forEach(metaSummary => {
    formattedEntries.push({
      type: 'meta-summary',
      title: metaSummary.title,
      content: metaSummary.summary,
      timestamp: metaSummary.timestamp
    });
  });
  
  return formattedEntries;
};
