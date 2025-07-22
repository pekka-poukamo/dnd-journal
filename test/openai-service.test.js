const { should } = require('./setup');
const OpenAIService = require('../js/openai-service');

// Mock fetch for testing
let mockFetch = async (url, options) => {
  const body = JSON.parse(options.body);
  
  // Mock different responses based on the request
  if (body.messages[0].content.includes('summarizer')) {
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Mock summary of the adventure'
          }
        }]
      })
    };
  } else {
    return {
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Mock AI generated prompt for roleplay'
          }
        }]
      })
    };
  }
};

global.fetch = mockFetch;

describe('OpenAI Service', () => {
  let service;
  
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
    service = new OpenAIService();
    // Reset fetch mock
    global.fetch = mockFetch;
  });

  describe('Configuration Management', () => {
    it('should initialize with default settings', () => {
      (service.apiKey === null || service.apiKey === undefined).should.be.true;
      service.model.should.equal('gpt-3.5-turbo');
      service.isConfigured().should.be.false;
    });

    it('should save and load settings', () => {
      const testApiKey = 'sk-test-key-123';
      const testModel = 'gpt-4';
      
      service.saveSettings(testApiKey, testModel);
      
      service.apiKey.should.equal(testApiKey);
      service.model.should.equal(testModel);
      service.isConfigured().should.be.true;
      
      // Create new instance to test persistence
      const newService = new OpenAIService();
      newService.apiKey.should.equal(testApiKey);
      newService.model.should.equal(testModel);
    });

    it('should handle corrupted settings gracefully', () => {
      global.localStorage.setItem('dnd-journal-ai-settings', 'invalid-json');
      
      const newService = new OpenAIService();
      should.not.exist(newService.apiKey);
      newService.model.should.equal('gpt-3.5-turbo');
    });
  });

  describe('Word Count and Summary Length Calculation', () => {
    it('should count words correctly', () => {
      service.getWordCount('hello world').should.equal(2);
      service.getWordCount('  hello   world  ').should.equal(2);
      service.getWordCount('').should.equal(0);
      service.getWordCount('single').should.equal(1);
    });

    it('should calculate summary length logarithmically', () => {
      service.calculateSummaryLength(5).should.equal(10); // Minimum
      service.calculateSummaryLength(10).should.equal(10); // Minimum boundary
      service.calculateSummaryLength(100).should.be.greaterThan(10);
      service.calculateSummaryLength(1000).should.equal(100); // Maximum
      service.calculateSummaryLength(2000).should.equal(100); // Maximum boundary
    });

    it('should scale summary length reasonably', () => {
      const length50 = service.calculateSummaryLength(50);
      const length200 = service.calculateSummaryLength(200);
      const length500 = service.calculateSummaryLength(500);
      
      length50.should.be.lessThan(length200);
      length200.should.be.lessThan(length500);
      
      // Should be between 10 and 100
      length50.should.be.at.least(10).and.at.most(100);
      length200.should.be.at.least(10).and.at.most(100);
      length500.should.be.at.least(10).and.at.most(100);
    });
  });

  describe('Character Summary Generation', () => {
    it('should handle empty character', () => {
      const summary = service.generateCharacterSummary({});
      summary.should.equal('Unknown adventurer');
    });

    it('should generate summary with name only', () => {
      const character = { name: 'Aragorn' };
      const summary = service.generateCharacterSummary(character);
      summary.should.equal('Aragorn');
    });

    it('should generate summary with race and class', () => {
      const character = { 
        name: 'Legolas', 
        race: 'Elf', 
        class: 'Ranger' 
      };
      const summary = service.generateCharacterSummary(character);
      summary.should.equal('Legolas, a Elf Ranger');
    });

    it('should handle missing race or class', () => {
      const characterWithRace = { 
        name: 'Gimli', 
        race: 'Dwarf' 
      };
      service.generateCharacterSummary(characterWithRace)
        .should.equal('Gimli, a Dwarf');

      const characterWithClass = { 
        name: 'Gandalf', 
        class: 'Wizard' 
      };
      service.generateCharacterSummary(characterWithClass)
        .should.equal('Gandalf, a Wizard');
    });
  });

  describe('Entry Grouping', () => {
    it('should group entries correctly', () => {
      const entries = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        title: `Entry ${i}`,
        content: `Content ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      const groups = service.groupEntriesForSummary(entries);
      
      groups.should.have.length(3); // 12 entries / 5 per group = 3 groups
      groups[0].should.have.length(5);
      groups[1].should.have.length(5);
      groups[2].should.have.length(2);
    });

    it('should handle small entry sets', () => {
      const entries = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        title: `Entry ${i}`,
        content: `Content ${i}`
      }));

      const groups = service.groupEntriesForSummary(entries);
      groups.should.have.length(1);
      groups[0].should.have.length(3);
    });
  });

  describe('Journal History Compression', () => {
    beforeEach(() => {
      service.saveSettings('sk-test-key', 'gpt-3.5-turbo');
    });

    it('should handle empty entries', async () => {
      const result = await service.compressJournalHistory([]);
      result.should.equal('No journal entries yet.');
    });

    it('should handle null entries', async () => {
      const result = await service.compressJournalHistory(null);
      result.should.equal('No journal entries yet.');
    });

    it('should include recent entries in full detail', async () => {
      const entries = [
        {
          id: '1',
          title: 'Recent Adventure',
          content: 'This is a recent adventure with lots of detail',
          timestamp: Date.now()
        },
        {
          id: '2', 
          title: 'Another Recent',
          content: 'Another recent adventure',
          timestamp: Date.now() - 1000
        }
      ];

      const result = await service.compressJournalHistory(entries);
      
      result.should.include('Recent Adventures:');
      result.should.include('Recent Adventure');
      result.should.include('Another Recent');
    });

    it('should truncate very long recent entries', async () => {
      const longContent = 'A'.repeat(500); // 500 character content
      const entries = [{
        id: '1',
        title: 'Long Entry',
        content: longContent,
        timestamp: Date.now()
      }];

      const result = await service.compressJournalHistory(entries);
      
      result.should.include('Long Entry');
      result.should.include('...'); // Should be truncated
    });

    it('should attempt AI summarization for older entries when configured', async () => {
      const entries = Array.from({ length: 8 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content for entry ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      const result = await service.compressJournalHistory(entries);
      
      result.should.include('Recent Adventures:');
      result.should.include('Earlier Adventures Summary:');
      result.should.include('Mock summary'); // From our mock
    });

    it('should fallback gracefully when not configured', async () => {
      service.apiKey = null; // Remove API key
      
      const entries = Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content for entry ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      const result = await service.compressJournalHistory(entries);
      
      result.should.include('Recent Adventures:');
      result.should.include('Earlier Adventures (3 entries): Various adventures and encounters.');
    });
  });

  describe('AI Summary Generation', () => {
    beforeEach(() => {
      service.saveSettings('sk-test-key', 'gpt-3.5-turbo');
    });

    it('should generate summary for single entry', async () => {
      const entry = {
        title: 'Test Adventure',
        content: 'This is a test adventure with some content'
      };

      const summary = await service.generateEntrySummary(entry);
      summary.should.be.a('string');
      summary.should.include('Mock summary');
    });

    it('should handle API errors gracefully', async () => {
      // Mock fetch to return error
      global.fetch = async () => ({
        ok: false,
        status: 500
      });

      const entry = {
        title: 'Test Adventure',
        content: 'This is a test adventure'
      };

      const summary = await service.generateEntrySummary(entry);
      should.not.exist(summary);
    });

    it('should generate group summaries', async () => {
      const entryGroup = [
        {
          title: 'Adventure 1',
          content: 'First adventure content',
          timestamp: Date.now()
        },
        {
          title: 'Adventure 2', 
          content: 'Second adventure content',
          timestamp: Date.now() - 1000
        }
      ];

      const summary = await service.generateGroupSummary(entryGroup);
      if (summary) {
        summary.should.be.a('string');
        summary.should.include('Mock summary');
      } else {
        should.not.exist(summary);
      }
    });

    it('should handle different entry set sizes', async () => {
      // Small set - should use individual summaries
      const smallEntries = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      const smallResult = await service.getEntrySummaries(smallEntries);
      smallResult.should.be.an('array');

      // Large set - should use group summaries
      const largeEntries = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      const largeResult = await service.getEntrySummaries(largeEntries);
      largeResult.should.be.an('array');
    });
  });

  describe('Prompt Generation', () => {
    beforeEach(() => {
      service.saveSettings('sk-test-key', 'gpt-4');
    });

    it('should require API configuration', async () => {
      service.apiKey = null;
      
      try {
        await service.generatePrompt('introspective', {}, []);
        should.fail('Should have thrown error');
      } catch (error) {
        error.message.should.include('not configured');
      }
    });

    it('should generate introspective prompts', async () => {
      const character = { name: 'Test Character', race: 'Human', class: 'Fighter' };
      const entries = [];

      const prompt = await service.generatePrompt('introspective', character, entries);
      
      prompt.should.be.a('string');
      prompt.should.include('Mock AI generated prompt');
    });

    it('should generate action prompts', async () => {
      const character = { name: 'Test Character' };
      const entries = [];

      const prompt = await service.generatePrompt('action', character, entries);
      
      prompt.should.be.a('string');
      prompt.should.include('Mock AI generated prompt');
    });

    it('should generate surprise prompts', async () => {
      const character = { name: 'Test Character' };
      const entries = [];

      const prompt = await service.generatePrompt('surprise', character, entries);
      
      prompt.should.be.a('string');
      prompt.should.include('Mock AI generated prompt');
    });

    it('should handle API errors in prompt generation', async () => {
      // Mock fetch to return error
      global.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      const character = { name: 'Test Character' };
      
      try {
        await service.generatePrompt('introspective', character, []);
        should.fail('Should have thrown error');
      } catch (error) {
        error.message.should.include('OpenAI API error');
      }
    });

    it('should use character information in prompts', async () => {
      const character = { name: 'Hero', race: 'Elf', class: 'Wizard' };
      const entries = [];

      // Mock fetch to capture the request
      let capturedRequest = null;
      global.fetch = async (url, options) => {
        capturedRequest = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Test prompt response' } }]
          })
        };
      };

      await service.generatePrompt('introspective', character, entries);
      
      capturedRequest.should.not.be.null;
      const systemMessage = capturedRequest.messages[0].content;
      systemMessage.should.include('Hero, a Elf Wizard');
    });
  });

  describe('Summary Caching', () => {
    beforeEach(() => {
      service.saveSettings('sk-test-key', 'gpt-3.5-turbo');
      // Clear cache before each test
      service.clearSummaryCache();
    });

    it('should cache generated summaries', async () => {
      const entry = {
        id: '1',
        title: 'Test Adventure',
        content: 'This is a test adventure with some content',
        timestamp: Date.now()
      };

      // First call should generate and cache
      const summary1 = await service.generateEntrySummary(entry);
      summary1.should.be.a('string');

      // Second call should use cache (mock won't be called again)
      let fetchCalled = false;
      const originalFetch = global.fetch;
      global.fetch = async () => {
        fetchCalled = true;
        return originalFetch.apply(this, arguments);
      };

      const summary2 = await service.generateEntrySummary(entry);
      summary2.should.equal(summary1);
      fetchCalled.should.be.false; // Should not call API again

      global.fetch = originalFetch;
    });

    it('should cache group summaries', async () => {
      const entryGroup = [
        {
          id: '1',
          title: 'Adventure 1',
          content: 'First adventure content',
          timestamp: Date.now()
        },
        {
          id: '2',
          title: 'Adventure 2',
          content: 'Second adventure content',
          timestamp: Date.now() - 1000
        }
      ];

      // First call should generate and cache
      const summary1 = await service.generateGroupSummary(entryGroup);
      if (summary1) {
        summary1.should.be.a('string');

        // Second call should use cache
        const summary2 = await service.generateGroupSummary(entryGroup);
        summary2.should.equal(summary1);
      }
    });

    it('should generate new summary when entry content changes', async () => {
      const entry1 = {
        id: '1',
        title: 'Test Adventure',
        content: 'Original content',
        timestamp: Date.now()
      };

      const entry2 = {
        id: '1',
        title: 'Test Adventure',
        content: 'Modified content', // Changed content
        timestamp: Date.now()
      };

      const summary1 = await service.generateEntrySummary(entry1);
      const summary2 = await service.generateEntrySummary(entry2);

      // Should generate new summary for modified content
      summary1.should.be.a('string');
      summary2.should.be.a('string');
      // Cache keys should be different due to content change
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();
      stats.should.have.property('totalEntries');
      stats.should.have.property('individualSummaries');
      stats.should.have.property('groupSummaries');
      stats.should.have.property('cacheSize');
      
      stats.totalEntries.should.be.a('number');
      stats.individualSummaries.should.be.a('number');
      stats.groupSummaries.should.be.a('number');
      stats.cacheSize.should.be.a('number');
    });

    it('should clear cache successfully', () => {
      // Add some fake cached data
      const fakeSummaries = { 'test_key': 'test summary' };
      service.saveCachedSummaries(fakeSummaries);
      
      // Verify it exists
      const beforeStats = service.getCacheStats();
      beforeStats.totalEntries.should.be.greaterThan(0);
      
      // Clear cache
      const result = service.clearSummaryCache();
      result.should.be.true;
      
      // Verify it's cleared
      const afterStats = service.getCacheStats();
      afterStats.totalEntries.should.equal(0);
    });

    it('should cleanup old summaries', async () => {
      // Create some fake cached summaries
      const oldSummaries = {
        'old_entry_123': 'old summary',
        'current_entry_456': 'current summary',
        'group_old_789': 'old group summary'
      };
      service.saveCachedSummaries(oldSummaries);

      const currentEntries = [
        {
          id: 'current',
          title: 'Current Entry',
          content: 'Current content',
          timestamp: Date.now()
        }
      ];

      // Run cleanup
      service.cleanupOldSummaries(currentEntries);

      // Check that old summaries were removed
      const stats = service.getCacheStats();
      // Should have fewer entries after cleanup
      stats.totalEntries.should.be.lessThan(3);
    });

    it('should generate cache keys correctly', () => {
      const entry = {
        id: '123',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: 1234567890
      };

      const key1 = service.generateCacheKey(entry);
      const key2 = service.generateCacheKey(entry);
      
      key1.should.equal(key2); // Same entry should generate same key
      key1.should.be.a('string');
      key1.should.include('123'); // Should include entry ID
    });

    it('should analyze summarization needs correctly', () => {
      const entries = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content for entry ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      const analysis = service.analyzeSummarizationNeeds(entries);
      
      analysis.should.have.property('needsSummaries');
      analysis.should.have.property('totalOlderEntries');
      analysis.should.have.property('estimatedCost');
      analysis.should.have.property('hasCache');
      analysis.should.have.property('cacheHitRatio');
      
      analysis.totalOlderEntries.should.equal(12); // 15 total - 3 recent
      analysis.needsSummaries.should.equal(12); // No cache, so all need summaries
      analysis.estimatedCost.should.be.greaterThan(0);
      analysis.hasCache.should.be.false;
      analysis.cacheHitRatio.should.equal('0.0');
    });

    it('should handle empty entries in analysis', () => {
      const analysis = service.analyzeSummarizationNeeds([]);
      
      analysis.needsSummaries.should.equal(0);
      analysis.estimatedCost.should.equal(0);
      analysis.hasCache.should.be.false;
    });

    it('should calculate cache hit ratio correctly', () => {
      // Create some entries
      const entries = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content ${i}`,
        timestamp: Date.now() - i * 1000
      }));

      // Cache summaries for half of the older entries
      const cachedSummaries = {};
      const olderEntries = entries.slice(3); // Skip 3 recent entries
      olderEntries.slice(0, 3).forEach(entry => {
        const key = service.generateCacheKey(entry);
        cachedSummaries[key] = 'cached summary';
      });
      service.saveCachedSummaries(cachedSummaries);

      const analysis = service.analyzeSummarizationNeeds(entries);
      
      analysis.totalOlderEntries.should.equal(7); // 10 total - 3 recent
      analysis.needsSummaries.should.equal(4); // 7 older - 3 cached
      parseFloat(analysis.cacheHitRatio).should.be.approximately(42.9, 0.1); // 3/7 ≈ 42.9%
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors in saveSettings', () => {
      // Mock localStorage to throw error
      const originalSetItem = global.localStorage.setItem;
      global.localStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      // Should not throw
      (() => {
        service.saveSettings('test-key', 'gpt-4');
      }).should.not.throw();

      // Restore original
      global.localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage errors in loadSettings', () => {
      global.localStorage.setItem('dnd-journal-ai-settings', 'valid-json');
      
      // Mock getItem to throw error
      const originalGetItem = global.localStorage.getItem;
      global.localStorage.getItem = () => {
        throw new Error('Storage access denied');
      };

      // Should not throw and should use defaults
      const newService = new OpenAIService();
      should.not.exist(newService.apiKey);
      newService.model.should.equal('gpt-3.5-turbo');

      // Restore original
      global.localStorage.getItem = originalGetItem;
    });

    it('should handle network errors gracefully', async () => {
      service.saveSettings('sk-test-key', 'gpt-3.5-turbo');
      
      // Mock fetch to throw network error
      global.fetch = async () => {
        throw new Error('Network error');
      };

      const entry = {
        title: 'Test Entry',
        content: 'Test content'
      };

      const summary = await service.generateEntrySummary(entry);
      should.not.exist(summary);
    });
  });
});