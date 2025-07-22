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

  // Load cached summaries from localStorage
  loadCachedSummaries() {
    try {
      const cached = localStorage.getItem('dnd-journal-ai-summaries');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to load cached summaries:', error);
      return {};
    }
  }

  // Save cached summaries to localStorage
  saveCachedSummaries(summaries) {
    try {
      localStorage.setItem('dnd-journal-ai-summaries', JSON.stringify(summaries));
    } catch (error) {
      console.error('Failed to save cached summaries:', error);
    }
  }

  // Generate cache key for an entry
  generateCacheKey(entry) {
    // Use entry ID, title, content hash, and timestamp to detect changes
    const contentHash = this.simpleHash(entry.title + entry.content);
    return `${entry.id}_${contentHash}_${entry.timestamp}`;
  }

  // Simple hash function for cache keys
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Generate cache key for a group of entries
  generateGroupCacheKey(entryGroup) {
    const groupHash = entryGroup.map(entry => this.generateCacheKey(entry)).join('_');
    return this.simpleHash(groupHash);
  }

  // Clean up old cached summaries to prevent localStorage bloat
  cleanupOldSummaries(currentEntries) {
    try {
      const cachedSummaries = this.loadCachedSummaries();
      const currentCacheKeys = new Set();
      
      // Generate all current valid cache keys
      currentEntries.forEach(entry => {
        currentCacheKeys.add(this.generateCacheKey(entry));
      });
      
      // Generate group cache keys for current groupings
      if (currentEntries.length > 10) {
        const groups = this.groupEntriesForSummary(currentEntries.slice(3)); // Skip recent entries
        groups.forEach(group => {
          currentCacheKeys.add(`group_${this.generateGroupCacheKey(group)}`);
        });
      }
      
      // Remove cached summaries that are no longer valid
      let cleanedCount = 0;
      const cleanedSummaries = {};
      
      Object.keys(cachedSummaries).forEach(key => {
        if (currentCacheKeys.has(key) || currentCacheKeys.has(key.replace('group_', ''))) {
          cleanedSummaries[key] = cachedSummaries[key];
        } else {
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        this.saveCachedSummaries(cleanedSummaries);
        console.log(`Cleaned up ${cleanedCount} old cached summaries`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old summaries:', error);
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

  // Clear all cached summaries
  clearSummaryCache() {
    try {
      localStorage.removeItem('dnd-journal-ai-summaries');
      console.log('Cleared all cached summaries');
      return true;
    } catch (error) {
      console.error('Failed to clear summary cache:', error);
      return false;
    }
  }

  // Get cache statistics
  getCacheStats() {
    try {
      const cachedSummaries = this.loadCachedSummaries();
      const totalEntries = Object.keys(cachedSummaries).length;
      const groupSummaries = Object.keys(cachedSummaries).filter(key => key.startsWith('group_')).length;
      const individualSummaries = totalEntries - groupSummaries;
      
      return {
        totalEntries,
        individualSummaries,
        groupSummaries,
        cacheSize: JSON.stringify(cachedSummaries).length
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalEntries: 0, individualSummaries: 0, groupSummaries: 0, cacheSize: 0 };
    }
  }

  // Analyze entries to estimate summarization costs
  analyzeSummarizationNeeds(entries) {
    if (!entries || entries.length === 0) {
      return { needsSummaries: 0, estimatedCost: 0, hasCache: false };
    }

    const cachedSummaries = this.loadCachedSummaries();
    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    const olderEntries = sortedEntries.slice(3); // Skip recent entries

    let needsSummaries = 0;
    olderEntries.forEach(entry => {
      const cacheKey = this.generateCacheKey(entry);
      if (!cachedSummaries[cacheKey]) {
        needsSummaries++;
      }
    });

    // Rough cost estimation (very approximate)
    // Individual entries: ~$0.001-0.002 each for GPT-3.5
    // Group summaries: fewer calls but more tokens
    let estimatedCost = 0;
    if (olderEntries.length > 10) {
      // Group summarization
      const groups = this.groupEntriesForSummary(olderEntries);
      const groupsNeedingSummaries = groups.filter(group => {
        const groupKey = `group_${this.generateGroupCacheKey(group)}`;
        return !cachedSummaries[groupKey];
      });
      estimatedCost = groupsNeedingSummaries.length * 0.003; // Rough estimate
    } else {
      estimatedCost = needsSummaries * 0.002; // Rough estimate for individual summaries
    }

    return {
      needsSummaries,
      totalOlderEntries: olderEntries.length,
      estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimals
      hasCache: Object.keys(cachedSummaries).length > 0,
      cacheHitRatio: olderEntries.length > 0 ? 
        ((olderEntries.length - needsSummaries) / olderEntries.length * 100).toFixed(1) : 0
    };
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
    
    // Clean up old cached summaries periodically (every 10th call)
    if (Math.random() < 0.1) {
      this.cleanupOldSummaries(sortedEntries);
    }
    
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

  // Generate AI summary for a single entry (with caching)
  async generateEntrySummary(entry) {
    // Check cache first
    const cacheKey = this.generateCacheKey(entry);
    const cachedSummaries = this.loadCachedSummaries();
    
    if (cachedSummaries[cacheKey]) {
      console.log('Using cached summary for entry:', entry.title);
      return cachedSummaries[cacheKey];
    }

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
      const summary = data.choices[0]?.message?.content?.trim() || null;
      
      // Cache the summary
      if (summary) {
        cachedSummaries[cacheKey] = summary;
        this.saveCachedSummaries(cachedSummaries);
        console.log('Generated and cached new summary for entry:', entry.title);
      }
      
      return summary;
    } catch (error) {
      console.warn('Failed to generate summary for entry:', entry.title, error);
      return null;
    }
  }

  // Get summaries for multiple entries with intelligent grouping and progressive loading
  async getEntrySummaries(entries, progressCallback = null) {
    const summaries = [];
    const cachedSummaries = this.loadCachedSummaries();
    
    // Check how many entries need new summaries
    const entriesNeedingSummaries = entries.filter(entry => {
      const cacheKey = this.generateCacheKey(entry);
      return !cachedSummaries[cacheKey];
    });
    
    // If many entries need summarization, warn user about potential costs
    if (entriesNeedingSummaries.length > 20) {
      console.warn(`About to generate ${entriesNeedingSummaries.length} new summaries. This may incur API costs.`);
    }
    
    // If we have many entries, group them to avoid too many API calls
    if (entries.length > 10) {
      // Group entries and create meta-summaries
      const groups = this.groupEntriesForSummary(entries);
      
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        try {
          const groupSummary = await this.generateGroupSummary(group);
          if (groupSummary) {
            summaries.push(groupSummary);
          }
          
          // Call progress callback if provided
          if (progressCallback) {
            progressCallback(i + 1, groups.length, 'group');
          }
        } catch (error) {
          console.warn('Failed to generate group summary:', error);
        }
      }
    } else {
      // Individual summaries for smaller sets
      const entriesToProcess = entries.slice(0, 8); // Limit to 8 to control costs
      
      for (let i = 0; i < entriesToProcess.length; i++) {
        const entry = entriesToProcess[i];
        try {
          const summary = await this.generateEntrySummary(entry);
          if (summary) {
            const date = new Date(entry.timestamp).toLocaleDateString();
            summaries.push(`${entry.title} (${date}): ${summary}`);
          }
          
          // Call progress callback if provided
          if (progressCallback) {
            progressCallback(i + 1, entriesToProcess.length, 'individual');
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

  // Generate summary for a group of entries (with caching)
  async generateGroupSummary(entryGroup) {
    // Check cache first
    const cacheKey = `group_${this.generateGroupCacheKey(entryGroup)}`;
    const cachedSummaries = this.loadCachedSummaries();
    
    if (cachedSummaries[cacheKey]) {
      console.log('Using cached group summary for', entryGroup.length, 'entries');
      return cachedSummaries[cacheKey];
    }

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
        const fullSummary = `${startDate} to ${endDate}: ${summary}`;
        
        // Cache the group summary
        cachedSummaries[cacheKey] = fullSummary;
        this.saveCachedSummaries(cachedSummaries);
        console.log('Generated and cached new group summary for', entryGroup.length, 'entries');
        
        return fullSummary;
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