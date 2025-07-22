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

  // Compress journal entries using AI-powered nested summaries
  async compressJournalHistory(entries) {
    if (!entries || entries.length === 0) return "No journal entries yet.";

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    
    // Take last 3 entries in full detail (reduced to save tokens)
    const recentEntries = sortedEntries.slice(0, 3);
    const olderEntries = sortedEntries.slice(3);

    let compressed = "";

    // Recent entries (full detail but truncated if very long)
    if (recentEntries.length > 0) {
      compressed += "Recent Adventures:\n";
      recentEntries.forEach((entry, index) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        const truncatedContent = entry.content.length > 300 ? 
          entry.content.substring(0, 300) + '...' : entry.content;
        compressed += `${index + 1}. ${entry.title} (${date}): ${truncatedContent}\n`;
      });
    }

    // Older entries (AI summarized if we have API access)
    if (olderEntries.length > 0) {
      if (this.isConfigured()) {
        try {
          const summaries = await this.getEntrySummaries(olderEntries);
          if (summaries.length > 0) {
            compressed += `\nEarlier Adventures Summary:\n${summaries.join('\n')}`;
          } else {
            compressed += `\nEarlier Adventures (${olderEntries.length} entries): Various adventures and encounters.`;
          }
        } catch (error) {
          console.warn('Failed to generate AI summaries, using fallback:', error);
          compressed += `\nEarlier Adventures (${olderEntries.length} entries): Various adventures and encounters.`;
        }
      } else {
        compressed += `\nEarlier Adventures (${olderEntries.length} entries): Various adventures and encounters.`;
      }
    }

    return compressed;
  }

  // Calculate summary length based on word count (logarithmic scaling)
  calculateSummaryLength(wordCount) {
    if (wordCount <= 10) return 10; // Minimum summary length
    if (wordCount >= 1000) return 100; // Maximum summary length
    
    // Logarithmic scaling: roughly log base 2 of word count * 10
    const logWordCount = Math.log2(wordCount);
    return Math.max(10, Math.min(100, Math.round(logWordCount * 10)));
  }

  // Get word count of text
  getWordCount(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Generate AI summary for a single entry
  async generateEntrySummary(entry) {
    const wordCount = this.getWordCount(entry.content);
    const summaryLength = this.calculateSummaryLength(wordCount);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Use cheaper model for summaries
          messages: [
            {
              role: 'system',
              content: 'You are a D&D journal summarizer. Create concise, informative summaries that capture the key events, characters, and outcomes.'
            },
            {
              role: 'user',
              content: `Summarize this D&D journal entry in approximately ${summaryLength} words. Focus on key events, decisions, and outcomes:\n\nTitle: ${entry.title}\nContent: ${entry.content}`
            }
          ],
          max_tokens: Math.round(summaryLength * 1.5), // Allow some buffer
          temperature: 0.3 // Lower temperature for more consistent summaries
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.warn('Failed to generate summary for entry:', entry.title, error);
      return null;
    }
  }

  // Get summaries for multiple entries with intelligent grouping
  async getEntrySummaries(entries) {
    const summaries = [];
    
    // If we have many entries, group them to avoid too many API calls
    if (entries.length > 10) {
      // Group entries and create meta-summaries
      const groups = this.groupEntriesForSummary(entries);
      
      for (const group of groups) {
        try {
          const groupSummary = await this.generateGroupSummary(group);
          if (groupSummary) {
            summaries.push(groupSummary);
          }
        } catch (error) {
          console.warn('Failed to generate group summary:', error);
        }
      }
    } else {
      // Individual summaries for smaller sets
      for (const entry of entries.slice(0, 8)) { // Limit to 8 to control costs
        try {
          const summary = await this.generateEntrySummary(entry);
          if (summary) {
            const date = new Date(entry.timestamp).toLocaleDateString();
            summaries.push(`${entry.title} (${date}): ${summary}`);
          }
        } catch (error) {
          console.warn('Failed to generate summary:', error);
        }
      }
    }

    return summaries;
  }

  // Group entries for batch summarization
  groupEntriesForSummary(entries) {
    const groups = [];
    const groupSize = 5; // Group 5 entries at a time
    
    for (let i = 0; i < entries.length; i += groupSize) {
      groups.push(entries.slice(i, i + groupSize));
    }
    
    return groups;
  }

  // Generate summary for a group of entries
  async generateGroupSummary(entryGroup) {
    const groupText = entryGroup.map(entry => 
      `${entry.title}: ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}`
    ).join('\n\n');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a D&D journal summarizer. Create a cohesive summary of multiple related journal entries, focusing on major plot points and character development.'
            },
            {
              role: 'user',
              content: `Summarize these ${entryGroup.length} D&D journal entries in 2-3 sentences, capturing the main storyline and outcomes:\n\n${groupText}`
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content?.trim();
      
      if (summary) {
        const startDate = new Date(entryGroup[entryGroup.length - 1].timestamp).toLocaleDateString();
        const endDate = new Date(entryGroup[0].timestamp).toLocaleDateString();
        return `${startDate} to ${endDate}: ${summary}`;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to generate group summary:', error);
      return null;
    }
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