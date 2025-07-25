// AI Storytelling Module - Focused on D&D narrative and question generation
// Following functional programming principles and style guide

import { 
  loadDataWithFallback, 
  createInitialSettings, 
  STORAGE_KEYS 
} from './utils.js';

import { getFormattedContentForAI } from './summary-manager.js';

// =============================================================================
// NARRATIVE INTROSPECTION CONFIGURATION
// =============================================================================

// System prompt focused on storytelling and character development
export const NARRATIVE_SYSTEM_PROMPT = `You are a D&D storytelling companion who helps players discover compelling narratives and unexpected character depths.

Present exactly 4 questions as a simple numbered list without headings:

1. A pivotal moment, memory, or relationship that has shaped who they are
2. A current internal conflict, dilemma, or aspiration they're wrestling with  
3. How recent events might change their path or reveal something new about them
4. An unobvious, surprising question that explores an unconventional perspective, hidden motivation, or unexpected character truth

Make questions specific to the character's situation and recent adventures. Focus on narrative depth and emotional truth.`;

// =============================================================================
// AI AVAILABILITY AND CONFIGURATION
// =============================================================================

// Pure function to load AI settings
export const loadAISettings = () => {
  return loadDataWithFallback(STORAGE_KEYS.SETTINGS, createInitialSettings());
};

// Pure function to check if AI features are available
export const isAIAvailable = () => {
  const settings = loadAISettings();
  return Boolean(settings.enableAIFeatures && settings.apiKey && settings.apiKey.startsWith('sk-'));
};

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

// Global tiktoken encoder - loaded asynchronously
let tiktokenEncoder = null;

// Initialize tiktoken encoder for accurate token counting
const initializeTiktoken = async () => {
  if (tiktokenEncoder) {
    return tiktokenEncoder;
  }
  
  try {
    if (typeof window.JsTiktoken === 'undefined') {
      console.warn('js-tiktoken not available, falling back to estimation');
      return null;
    }
    
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

// =============================================================================
// CORE AI COMMUNICATION
// =============================================================================

// Call OpenAI API for storytelling questions
export const callAIForStorytelling = async (prompt, maxTokens = 400) => {
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
            content: NARRATIVE_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.8 // Higher temperature for creative storytelling
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'Unable to generate response';
  } catch (error) {
    console.error('Failed to call OpenAI API for storytelling:', error);
    throw error;
  }
};

// Call OpenAI API for summarization (no system prompt, lower temperature)
export const callAIForSummary = async (prompt, maxTokens = 400) => {
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
        temperature: 0.3 // Lower temperature for consistent summarization
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API call failed for summary:', error);
    throw error;
  }
};

// =============================================================================
// D&D CHARACTER INTROSPECTION
// =============================================================================

// Pure function to create introspection prompt from character and journal data
export const createIntrospectionPrompt = (character, journalEntries) => {
  // Format character information
  const characterInfo = character.name ? 
    `${character.name}, a ${character.race || 'character'} ${character.class || 'adventurer'}` :
    'your character';
    
  const backstoryContext = character.backstory ? 
    `\n\nCharacter Background: ${character.backstory}` : '';
    
  const notesContext = character.notes ? 
    `\n\nAdditional Character Details: ${character.notes}` : '';
    
  // Format journal entries using the summary manager's intelligent formatting
  const formattedEntries = getFormattedContentForAI('entry', journalEntries);
  const entriesContext = formattedEntries.length > 0 ? 
    `\n\nJourney Context:\n${formattedEntries.map(entry => {
      const prefix = entry.type === 'meta-summary' ? 'Adventures Summary' :
                     entry.type === 'summary' ? 'Entry Summary' : 'Recent Entry';
      // Limit context length for better AI processing
      const content = entry.content.length > 500 ? entry.content.substring(0, 500) + '...' : entry.content;
      return `- ${prefix}: ${entry.title} - ${content}`;
    }).join('\n')}` : '';

  return `Character: ${characterInfo}${backstoryContext}${notesContext}${entriesContext}

Please create 4 introspective questions (3 core narrative + 1 unobvious) that would help this player discover compelling stories and unexpected depths in their character.`;
};

// Generate introspection questions for D&D character
export const generateIntrospectionQuestions = async (character, journalEntries) => {
  if (!isAIAvailable()) {
    return null;
  }

  try {
    const promptText = createIntrospectionPrompt(character, journalEntries);
    const response = await callAIForStorytelling(promptText);
    
    return response;
  } catch (error) {
    console.error('Failed to generate introspection questions:', error);
    return null;
  }
};

// =============================================================================
// PROMPT PREVIEW AND DEBUGGING
// =============================================================================

// Get the prompt that would be sent to AI (for preview/debugging)
export const getIntrospectionPromptForPreview = async (character, journalEntries) => {
  if (!isAIAvailable()) {
    return null;
  }

  try {
    const userPrompt = createIntrospectionPrompt(character, journalEntries);
    
    const messages = [
      {
        role: 'system',
        content: NARRATIVE_SYSTEM_PROMPT
      },
      {
        role: 'user', 
        content: userPrompt
      }
    ];
    
    const totalTokens = await calculateTotalTokens(messages);
    
    return {
      systemPrompt: NARRATIVE_SYSTEM_PROMPT,
      userPrompt: userPrompt,
      messages: messages,
      totalTokens: totalTokens
    };
  } catch (error) {
    console.error('Failed to create prompt for preview:', error);
    return null;
  }
};

// Helper function for UI to describe the prompting approach
export const getPromptDescription = () => {
  return 'Narrative-focused introspection with 3 core questions + 1 unobvious question';
};

// =============================================================================
// COMPATIBILITY FUNCTIONS FOR MIGRATION
// =============================================================================

// Legacy function names for backward compatibility during migration
export const isAIEnabled = isAIAvailable;
export const callOpenAI = callAIForStorytelling;
export const callOpenAIForSummarization = callAIForSummary;
export const generateIntrospectionPrompt = generateIntrospectionQuestions;