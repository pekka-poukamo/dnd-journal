// AI Module - OpenAI Integration for Introspection and Summarization

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
const createIntrospectionPrompt = (character, recentEntries) => {
  const characterInfo = character.name ? 
    `${character.name}, a ${character.race || 'character'} ${character.class || 'adventurer'}` :
    'your character';
    
  const backstoryContext = character.backstory ? 
    `\n\nCharacter Background: ${character.backstory}` : '';
    
  const entriesContext = recentEntries.length > 0 ? 
    `\n\nRecent Adventures:\n${recentEntries.map(entry => `- ${entry.title}: ${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}`).join('\n')}` :
    '';

  return `Based on the journey of ${characterInfo}${backstoryContext}${entriesContext}

What thoughts, emotions, or realizations might ${character.name || 'your character'} be having right now? What internal conflicts, growth, or questions about their path forward could they be pondering?`;
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
            content: 'You are a thoughtful D&D companion helping with character introspection. Respond in character voice, first person, as if the character is reflecting internally. Keep responses concise but meaningful.'
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

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadAISettings,
    isAIEnabled,
    createIntrospectionPrompt,
    generateIntrospectionPrompt,
    generateEntrySummary,
    getEntrySummary,
    callOpenAI
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
} else {
  // For browser
  window.AI = {
    loadAISettings,
    isAIEnabled,
    createIntrospectionPrompt,
    generateIntrospectionPrompt,
    generateEntrySummary,
    getEntrySummary,
    callOpenAI
  };
}
