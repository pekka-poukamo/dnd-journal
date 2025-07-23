// AI Module - OpenAI Integration for Introspection and Summarization

// ================================
// SYSTEM PROMPT CONFIGURATIONS
// ================================
//
// This module provides three different approaches to AI-generated character introspection.
// Each system prompt creates three questions that help players explore different aspects
// of their D&D character's development and inner world.
//
// TO CHANGE THE ACTIVE PROMPT: 
// Simply modify the ACTIVE_SYSTEM_PROMPT constant below to use a different option.
//
// INTEGRATION WITH SUMMARIES:
// The AI automatically uses generated summaries when available, providing context from:
// - Recent full entries (most recent adventures)
// - Individual entry summaries (older entries)  
// - Meta-summaries (grouped summaries of many older entries)
//
// This ensures the AI has relevant context while keeping prompts concise.
//
// ================================

// Three different system prompt options for character introspection
const SYSTEM_PROMPT_OPTIONS = {
  // Option 1: Philosophical & Introspective
  PHILOSOPHICAL: `You are a wise D&D companion helping with deep character introspection. You ask three thoughtful questions that help the player explore their character's inner world. 

Present exactly three questions that encourage reflection on:
1. The character's emotional state and internal conflicts
2. Their growth, goals, or changing perspectives  
3. Their relationships, values, or place in the world

Format as numbered questions (1., 2., 3.) and keep each question concise but meaningful. Focus on the character's internal experience rather than external actions.`,

  // Option 2: Narrative & Story-Driven  
  NARRATIVE: `You are a storytelling D&D companion helping players deepen their character's narrative. You present three engaging questions that build character depth through story exploration.

Present exactly three questions that explore:
1. A pivotal moment or memory that shaped the character
2. A current challenge, dilemma, or aspiration they face
3. How recent events might change their future path

Format as numbered questions (1., 2., 3.) and make them specific to the character's recent adventures. Help the player discover untold stories and motivations.`,

  // Option 3: Practical & Character Development
  PRACTICAL: `You are a helpful D&D companion focused on practical character development. You ask three targeted questions that help players understand and develop their character.

Present exactly three questions about:
1. How the character is feeling about their recent experiences
2. What they've learned or how they've changed recently
3. What they're planning, hoping for, or worried about next

Format as numbered questions (1., 2., 3.) and make them relevant to the character's current situation. Keep questions accessible and easy to answer.`
};

// Current active system prompt (easily changeable)
const ACTIVE_SYSTEM_PROMPT = SYSTEM_PROMPT_OPTIONS.PHILOSOPHICAL;

// ================================
// END SYSTEM PROMPT CONFIGURATIONS
// ================================

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
        createInitialSettings: () => ({ apiKey: '', enableAIFeatures: false }),
        getWordCount: (text) => text.trim().split(/\s+/).filter(word => word.length > 0).length,
        STORAGE_KEYS: { SETTINGS: 'simple-dnd-journal-settings', SUMMARIES: 'simple-dnd-journal-summaries' },
        safeSetToStorage: () => ({ success: true })
      };
    }
  }
};

const utils = getUtils();

// Pure function to load settings
const loadAISettings = () => {
  return utils.loadDataWithFallback(
    utils.STORAGE_KEYS.SETTINGS, 
    utils.createInitialSettings()
  );
};

// Pure function to check if AI features are available
const isAIEnabled = () => {
  const settings = loadAISettings();
  return Boolean(settings.enableAIFeatures && settings.apiKey && settings.apiKey.startsWith('sk-'));
};

// Pure function to create introspection prompt
const createIntrospectionPrompt = (character, formattedEntries) => {
  const characterInfo = character.name ? 
    `${character.name}, a ${character.race || 'character'} ${character.class || 'adventurer'}` :
    'your character';
    
  const backstoryContext = character.backstory ? 
    `\n\nCharacter Background: ${character.backstory}` : '';
    
  // Format entries using the summarization system's formatted entries
  const entriesContext = formattedEntries.length > 0 ? 
    `\n\nJourney Context:\n${formattedEntries.map(entry => {
      const prefix = entry.type === 'meta-summary' ? 'Adventures Summary' :
                     entry.type === 'summary' ? 'Entry Summary' : 'Recent Entry';
      const content = entry.content.length > 150 ? entry.content.substring(0, 150) + '...' : entry.content;
      return `- ${prefix}: ${entry.title} - ${content}`;
    }).join('\n')}` : '';

  return `Character: ${characterInfo}${backstoryContext}${entriesContext}

Please ask three introspective questions that would help the player deepen their understanding of this character's inner world and development.`;
};

// Call OpenAI API for text generation
const callOpenAI = async (prompt, maxTokens = 150) => {
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
            content: ACTIVE_SYSTEM_PROMPT
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
const generateIntrospectionPrompt = async (character, entries) => {
  if (!isAIEnabled()) {
    return null;
  }

  try {
    // Use formatted entries that include summaries for older entries
    let formattedEntries;
    if (window.Summarization) {
      formattedEntries = window.Summarization.getFormattedEntriesForAI();
    } else {
      // Fallback: Get last 5 entries for context
      formattedEntries = entries
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
    }

    const promptText = createIntrospectionPrompt(character, formattedEntries);
    const response = await callOpenAI(promptText);
    
    return response;
  } catch (error) {
    console.error('Failed to generate introspection prompt:', error);
    return null;
  }
};



// Generate entry summary
const generateEntrySummary = async (entry) => {
  if (!isAIEnabled()) {
    return null;
  }

  try {
    const wordCount = utils.getWordCount(entry.content);
    const targetLength = Math.max(10, Math.floor(wordCount * 0.3)); // 30% of original length
    
    const prompt = `Summarize this D&D journal entry in approximately ${targetLength} words. Keep the key events, emotions, and character development:

Title: ${entry.title}
Content: ${entry.content}`;

    const summary = await callOpenAI(prompt, 100);
    
    return {
      id: entry.id,
      originalWordCount: wordCount,
      summary: summary,
      summaryWordCount: utils.getWordCount(summary),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Failed to generate entry summary:', error);
    return null;
  }
};

// Load stored summaries
const loadStoredSummaries = () => {
  return utils.loadDataWithFallback(utils.STORAGE_KEYS.SUMMARIES, {});
};

// Save summaries to localStorage
const saveStoredSummaries = (summaries) => {
  utils.safeSetToStorage(utils.STORAGE_KEYS.SUMMARIES, summaries);
};

// Get or generate summary for an entry
const getEntrySummary = async (entry) => {
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

// Helper functions for system prompt management
const getAvailablePromptOptions = () => Object.keys(SYSTEM_PROMPT_OPTIONS);
const getCurrentPromptType = () => {
  // Find which prompt option is currently active
  for (const [key, value] of Object.entries(SYSTEM_PROMPT_OPTIONS)) {
    if (value === ACTIVE_SYSTEM_PROMPT) return key;
  }
  return 'CUSTOM';
};
const getPromptDescription = (promptType) => {
  const descriptions = {
    PHILOSOPHICAL: 'Deep introspection focused on emotions, growth, and values',
    NARRATIVE: 'Story-driven questions exploring character development through narrative',
    PRACTICAL: 'Accessible questions about feelings, learning, and future plans'
  };
  return descriptions[promptType] || 'Custom prompt configuration';
};

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadAISettings,
    isAIEnabled,
    createIntrospectionPrompt,
    generateIntrospectionPrompt,
    generateEntrySummary,
    getEntrySummary,
    callOpenAI,
    SYSTEM_PROMPT_OPTIONS,
    getAvailablePromptOptions,
    getCurrentPromptType,
    getPromptDescription
  };
} else if (typeof global !== 'undefined') {
  // For testing
  global.loadAISettings = loadAISettings;
  global.isAIEnabled = isAIEnabled;
  global.createIntrospectionPrompt = createIntrospectionPrompt;
  global.generateIntrospectionPrompt = generateIntrospectionPrompt;
  global.generateEntrySummary = generateEntrySummary;
  global.getEntrySummary = getEntrySummary;
  global.callOpenAI = callOpenAI;
  global.SYSTEM_PROMPT_OPTIONS = SYSTEM_PROMPT_OPTIONS;
  global.getAvailablePromptOptions = getAvailablePromptOptions;
  global.getCurrentPromptType = getCurrentPromptType;
  global.getPromptDescription = getPromptDescription;
} else {
  // For browser
  window.AI = {
    loadAISettings,
    isAIEnabled,
    createIntrospectionPrompt,
    generateIntrospectionPrompt,
    generateEntrySummary,
    getEntrySummary,
    callOpenAI,
    SYSTEM_PROMPT_OPTIONS,
    getAvailablePromptOptions,
    getCurrentPromptType,
    getPromptDescription
  };
}
