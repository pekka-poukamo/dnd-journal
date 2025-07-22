// OpenAI Service for D&D Journal
class OpenAIService {
  constructor() {
    this.apiKey = null;
    this.model = 'gpt-3.5-turbo';
    this.loadSettings();
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const settings = localStorage.getItem('dnd-journal-ai-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.apiKey = parsed.apiKey || null;
        this.model = parsed.model || 'gpt-3.5-turbo';
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  }

  // Save settings to localStorage
  saveSettings(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model;
    try {
      localStorage.setItem('dnd-journal-ai-settings', JSON.stringify({
        apiKey: this.apiKey,
        model: this.model
      }));
    } catch (error) {
      console.error('Failed to save AI settings:', error);
    }
  }

  // Check if API key is configured
  isConfigured() {
    return this.apiKey && this.apiKey.trim().length > 0;
  }

  // Compress journal entries using nested summaries
  compressJournalHistory(entries) {
    if (!entries || entries.length === 0) return "No journal entries yet.";

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    
    // Take last 5 entries in full detail
    const recentEntries = sortedEntries.slice(0, 5);
    const olderEntries = sortedEntries.slice(5);

    let compressed = "";

    // Recent entries (full detail)
    if (recentEntries.length > 0) {
      compressed += "Recent Adventures:\n";
      recentEntries.forEach((entry, index) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        compressed += `${index + 1}. ${entry.title} (${date}): ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n`;
      });
    }

    // Older entries (summarized)
    if (olderEntries.length > 0) {
      compressed += `\nEarlier Adventures (${olderEntries.length} entries): `;
      const themes = this.extractThemes(olderEntries);
      compressed += themes.join(', ') + '.';
    }

    return compressed;
  }

  // Extract themes from older entries for compression
  extractThemes(entries) {
    const themes = new Set();
    const keywords = ['battle', 'fight', 'combat', 'dungeon', 'dragon', 'treasure', 'magic', 
                     'tavern', 'town', 'village', 'forest', 'mountain', 'cave', 'quest', 
                     'npc', 'character', 'friend', 'ally', 'enemy', 'mystery', 'discovery'];

    entries.forEach(entry => {
      const text = (entry.title + ' ' + entry.content).toLowerCase();
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          themes.add(keyword);
        }
      });
    });

    return Array.from(themes).slice(0, 8); // Limit to 8 themes
  }

  // Generate character summary
  generateCharacterSummary(character) {
    if (!character.name) return "Unknown adventurer";
    
    let summary = `${character.name}`;
    if (character.race && character.class) {
      summary += `, a ${character.race} ${character.class}`;
    } else if (character.race) {
      summary += `, a ${character.race}`;
    } else if (character.class) {
      summary += `, a ${character.class}`;
    }
    
    return summary;
  }

  // Generate AI prompt based on type
  async generatePrompt(type, character, journalHistory) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const characterSummary = this.generateCharacterSummary(character);
    const compressedHistory = this.compressJournalHistory(journalHistory);

    const systemPrompt = `You are a creative D&D dungeon master assistant. Generate engaging roleplay prompts that encourage character introspection and development. Consider the character's background and recent adventures.

Character: ${characterSummary}
Journal History: ${compressedHistory}

Generate a prompt that encourages deep character development and interesting roleplay opportunities.`;

    let userPrompt = '';
    
    switch (type) {
      case 'introspective':
        userPrompt = `Create an introspective prompt that encourages the character to reflect on their recent experiences, moral choices, or personal growth. Make it thoughtful and character-driven.`;
        break;
      case 'action':
        userPrompt = `Create an action-oriented prompt that presents a challenging situation requiring the character to make important decisions or take decisive action. Include potential consequences.`;
        break;
      case 'surprise':
        userPrompt = `Create a completely unexpected and left-field prompt that could dramatically change the character's perspective or situation. Think outside the box - perhaps involving time travel, alternate dimensions, meeting their future/past self, discovering a shocking truth about their past, or an encounter that challenges their fundamental beliefs. Be creative and surprising!`;
        break;
      default:
        userPrompt = `Create an engaging roleplay prompt for character development.`;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || 'No prompt generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenAIService;
} else {
  window.OpenAIService = OpenAIService;
}