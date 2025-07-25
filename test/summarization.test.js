import { expect } from 'chai';
import './setup.js';
import * as Summarization from '../js/summarization.js';
import * as SummaryStorage from '../js/summary-storage.js';

describe('Summarization Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
  });

  describe('WORD_THRESHOLDS', () => {
    it('should have sensible word count thresholds', () => {
      expect(Summarization.WORD_THRESHOLDS).to.have.property('ENTRY_SUMMARIZATION', 300);
      expect(Summarization.WORD_THRESHOLDS).to.have.property('CHARACTER_FIELD', 150);
      expect(Summarization.WORD_THRESHOLDS).to.have.property('META_SUMMARY_TRIGGER', 1000);
      expect(Summarization.WORD_THRESHOLDS).to.have.property('SUMMARIES_PER_META', 10);
    });
  });

  describe('TARGET_WORDS', () => {
    it('should have appropriate target word counts', () => {
      expect(Summarization.TARGET_WORDS).to.have.property('ENTRY_SUMMARY', 50);
      expect(Summarization.TARGET_WORDS).to.have.property('CHARACTER_SUMMARY', 40);
      expect(Summarization.TARGET_WORDS).to.have.property('META_SUMMARY', 100);
    });
  });

  describe('needsSummarization', () => {
    it('should identify content that needs summarization', () => {
      const shortContent = 'word '.repeat(200); // 200 words
      const longContent = 'word '.repeat(400); // 400 words
      
      expect(Summarization.needsSummarization(shortContent)).to.be.false;
      expect(Summarization.needsSummarization(longContent)).to.be.true;
    });

    it('should use custom threshold', () => {
      const content = 'word '.repeat(100); // 100 words
      
      expect(Summarization.needsSummarization(content, 50)).to.be.true;
      expect(Summarization.needsSummarization(content, 150)).to.be.false;
    });
  });

  describe('generateSummary', () => {
    it('should return null when AI import fails', async () => {
      // The function should handle import errors gracefully
      const result = await Summarization.generateSummary('test content', 50, 'entry');
      expect(result).to.be.null;
    });

    it('should handle different content types', async () => {
      // Test with different content types (should still return null in test environment)
      const testCases = ['entry', 'character-backstory', 'character-notes', 'meta-summary'];
      
      for (const type of testCases) {
        const result = await Summarization.generateSummary('test content', 50, type);
        expect(result).to.be.null; // AI not available in test environment
      }
    });

    it('should handle empty or invalid content', async () => {
      const result1 = await Summarization.generateSummary('', 50, 'entry');
      const result2 = await Summarization.generateSummary(null, 50, 'entry');
      
      expect(result1).to.be.null;
      expect(result2).to.be.null;
    });
  });

  describe('processEntrySummary', () => {
    it('should return null when AI is not available', async () => {
      const entry = {
        id: 'test-entry',
        title: 'Test Entry',
        content: 'word '.repeat(100),
        timestamp: Date.now()
      };

      const result = await Summarization.processEntrySummary(entry);
      expect(result).to.be.null; // AI not available in test environment
    });

    it('should handle invalid entry data', async () => {
      const invalidEntries = [
        null,
        undefined,
        {},
        { id: 'test' }, // missing content
        { content: 'test' } // missing id
      ];

      for (const entry of invalidEntries) {
        const result = await Summarization.processEntrySummary(entry);
        expect(result).to.be.null;
      }
    });
  });

  describe('processCharacterFieldSummary', () => {
    it('should return null when AI is not available', async () => {
      const fieldData = {
        field: 'backstory',
        content: 'word '.repeat(100),
        contentHash: 'testhash'
      };

      const result = await Summarization.processCharacterFieldSummary(fieldData);
      expect(result).to.be.null; // AI not available in test environment
    });

    it('should handle invalid field data', async () => {
      const invalidFieldData = [
        null,
        undefined,
        {},
        { field: 'backstory' }, // missing content
        { content: 'test' }, // missing field
        { field: 'backstory', content: '' } // empty content
      ];

      for (const fieldData of invalidFieldData) {
        const result = await Summarization.processCharacterFieldSummary(fieldData);
        expect(result).to.be.null;
      }
    });
  });

  describe('processMetaSummary', () => {
    it('should return null when not enough summaries exist', async () => {
      // Create only a few summaries (not enough for meta-summary)
      for (let i = 1; i <= 5; i++) {
        SummaryStorage.saveEntrySummary(`entry-${i}`, {
          id: `entry-${i}`,
          originalTitle: `Entry ${i}`,
          summary: `Summary ${i}`,
          summaryWordCount: 50,
          timestamp: Date.now()
        });
      }

      const result = await Summarization.processMetaSummary();
      expect(result).to.be.null;
    });

    it('should return null when AI is not available', async () => {
      // Create enough summaries but AI unavailable in test environment
      for (let i = 1; i <= 12; i++) {
        SummaryStorage.saveEntrySummary(`entry-${i}`, {
          id: `entry-${i}`,
          originalTitle: `Entry ${i}`,
          summary: `Summary ${i}`,
          summaryWordCount: 50,
          timestamp: Date.now()
        });
      }

      const result = await Summarization.processMetaSummary();
      expect(result).to.be.null; // AI not available in test environment
    });

    it('should handle no existing summaries', async () => {
      const result = await Summarization.processMetaSummary();
      expect(result).to.be.null;
    });
  });

  describe('autoSummarizeEntries', () => {
    beforeEach(() => {
      // Set up journal data
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: 'short-entry',
            title: 'Short Entry',
            content: 'word '.repeat(200), // Under threshold
            timestamp: Date.now()
          },
          {
            id: 'long-entry',
            title: 'Long Entry',
            content: 'word '.repeat(400), // Over threshold
            timestamp: Date.now() - 1000
          }
        ]
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
    });

    it('should return empty array when AI is not available', async () => {
      const results = await Summarization.autoSummarizeEntries();
      expect(results).to.be.an('array').with.length(0); // AI not available in test environment
    });

    it('should return empty array when no entries need summarization', async () => {
      // All entries are below threshold
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: 'short-entry-1',
            title: 'Short Entry 1',
            content: 'word '.repeat(100),
            timestamp: Date.now()
          },
          {
            id: 'short-entry-2',
            title: 'Short Entry 2',
            content: 'word '.repeat(150),
            timestamp: Date.now() - 1000
          }
        ]
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const results = await Summarization.autoSummarizeEntries();
      expect(results).to.be.an('array').with.length(0);
    });

    it('should handle empty journal data', async () => {
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {},
        entries: []
      }));

      const results = await Summarization.autoSummarizeEntries();
      expect(results).to.be.an('array').with.length(0);
    });

    it('should handle corrupted journal data', async () => {
      global.localStorage.setItem('simple-dnd-journal', 'invalid json');

      const results = await Summarization.autoSummarizeEntries();
      expect(results).to.be.an('array').with.length(0);
    });
  });

  describe('autoSummarizeCharacter', () => {
    beforeEach(() => {
      // Set up journal data with character
      const journalData = {
        character: {
          name: 'Test Character',
          backstory: 'word '.repeat(200), // Over CHARACTER_FIELD threshold of 150
          notes: 'word '.repeat(100), // Under threshold
          race: 'Human'
        },
        entries: []
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
    });

    it('should return empty array when AI is not available', async () => {
      const results = await Summarization.autoSummarizeCharacter();
      expect(results).to.be.an('array').with.length(0); // AI not available in test environment
    });

    it('should return empty array when no character fields need summarization', async () => {
      // All fields are below threshold
      const journalData = {
        character: {
          name: 'Test Character',
          backstory: 'word '.repeat(100), // Under threshold
          notes: 'word '.repeat(50), // Under threshold
          race: 'Human'
        },
        entries: []
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const results = await Summarization.autoSummarizeCharacter();
      expect(results).to.be.an('array').with.length(0);
    });

    it('should handle empty character data', async () => {
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {},
        entries: []
      }));

      const results = await Summarization.autoSummarizeCharacter();
      expect(results).to.be.an('array').with.length(0);
    });

    it('should handle missing character fields', async () => {
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {
          name: 'Test Character',
          race: 'Human'
          // No backstory or notes
        },
        entries: []
      }));

      const results = await Summarization.autoSummarizeCharacter();
      expect(results).to.be.an('array').with.length(0);
    });
  });

  describe('autoCreateMetaSummaries', () => {
    it('should return null when threshold is not met', async () => {
      // Create few summaries (not enough)
      for (let i = 1; i <= 5; i++) {
        SummaryStorage.saveEntrySummary(`entry-${i}`, {
          id: `entry-${i}`,
          originalTitle: `Entry ${i}`,
          summary: 'word '.repeat(50),
          summaryWordCount: 50,
          timestamp: Date.now()
        });
      }

      const result = await Summarization.autoCreateMetaSummaries();
      expect(result).to.be.null;
    });

    it('should return null when AI is not available even with enough summaries', async () => {
      // Create enough summaries to trigger meta-summary
      for (let i = 1; i <= 12; i++) {
        SummaryStorage.saveEntrySummary(`entry-${i}`, {
          id: `entry-${i}`,
          originalTitle: `Entry ${i}`,
          summary: 'word '.repeat(100), // 100 words each
          summaryWordCount: 100,
          timestamp: Date.now() - (i * 1000)
        });
      }

      const result = await Summarization.autoCreateMetaSummaries();
      expect(result).to.be.null; // AI not available in test environment
    });

    it('should return null when no summaries exist', async () => {
      const result = await Summarization.autoCreateMetaSummaries();
      expect(result).to.be.null;
    });
  });

  describe('runAutoSummarization', () => {
    beforeEach(() => {
      // Set up comprehensive journal data
      const journalData = {
        character: {
          name: 'Test Character',
          backstory: 'word '.repeat(200), // Over threshold
          notes: 'word '.repeat(100), // Under threshold
        },
        entries: [
          {
            id: 'long-entry',
            title: 'Long Entry',
            content: 'word '.repeat(400), // Over threshold
            timestamp: Date.now()
          }
        ]
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
    });

    it('should return empty results when AI is not available', async () => {
      const result = await Summarization.runAutoSummarization();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('entrySummaries').that.is.an('array').with.length(0);
      expect(result).to.have.property('characterSummaries').that.is.an('array').with.length(0);
      expect(result).to.have.property('metaSummary').that.is.null;
      expect(result).to.have.property('totalProcessed', 0);
      expect(result).to.not.have.property('error'); // No error, just no AI
    });

    it('should handle empty journal data', async () => {
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {},
        entries: []
      }));

      const result = await Summarization.runAutoSummarization();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('entrySummaries').that.is.an('array').with.length(0);
      expect(result).to.have.property('characterSummaries').that.is.an('array').with.length(0);
      expect(result).to.have.property('metaSummary').that.is.null;
      expect(result).to.have.property('totalProcessed', 0);
    });

    it('should handle corrupted journal data gracefully', async () => {
      global.localStorage.setItem('simple-dnd-journal', 'invalid json');

      const result = await Summarization.runAutoSummarization();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('entrySummaries').that.is.an('array').with.length(0);
      expect(result).to.have.property('characterSummaries').that.is.an('array').with.length(0);
      expect(result).to.have.property('metaSummary').that.is.null;
      expect(result).to.have.property('totalProcessed', 0);
    });
  });

  describe('getEntriesNeedingSummary', () => {
    it('should identify entries needing summarization', () => {
      const entries = [
        {
          id: '1',
          title: 'Short Entry',
          content: 'word '.repeat(200), // Under threshold
          timestamp: Date.now()
        },
        {
          id: '2',
          title: 'Long Entry',
          content: 'word '.repeat(400), // Over threshold
          timestamp: Date.now() - 1000
        }
      ];
      
      const result = Summarization.getEntriesNeedingSummary(entries);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0].id).to.equal('2');
    });

    it('should exclude entries that already have summaries', () => {
      const entries = [
        {
          id: '1',
          title: 'Long Entry 1',
          content: 'word '.repeat(400),
          timestamp: Date.now()
        },
        {
          id: '2', 
          title: 'Long Entry 2',
          content: 'word '.repeat(400),
          timestamp: Date.now() - 1000
        }
      ];
      
      // Add summary for entry 1
      SummaryStorage.saveEntrySummary('1', {
        id: '1',
        summary: 'Existing summary',
        originalWordCount: 400,
        summaryWordCount: 50,
        timestamp: Date.now()
      });
      
      const result = Summarization.getEntriesNeedingSummary(entries);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0].id).to.equal('2');
    });
  });

  describe('getCharacterFieldsNeedingSummary', () => {
    it('should identify character fields needing summarization', () => {
      const character = {
        name: 'Test Character',
        backstory: 'word '.repeat(200), // Over threshold of 150
        notes: 'word '.repeat(100), // Under threshold
        race: 'Human'
      };
      
      const result = Summarization.getCharacterFieldsNeedingSummary(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0].field).to.equal('backstory');
      expect(result[0].content).to.equal(character.backstory);
      expect(result[0]).to.have.property('contentHash');
    });

    it('should identify both backstory and notes when they exceed threshold', () => {
      const character = {
        name: 'Test Character',
        backstory: 'word '.repeat(200), // Over threshold of 150
        notes: 'word '.repeat(200), // Over threshold of 150
        race: 'Human'
      };
      
      const result = Summarization.getCharacterFieldsNeedingSummary(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      
      const fields = result.map(r => r.field);
      expect(fields).to.include('backstory');
      expect(fields).to.include('notes');
    });

    it('should exclude fields that already have summaries with same content', () => {
      const character = {
        backstory: 'word '.repeat(200)
      };
      
      const contentHash = btoa(character.backstory).substring(0, 16);
      
      // Add existing summary with same content hash
      SummaryStorage.saveCharacterSummary('backstory', {
        field: 'backstory',
        summary: 'Existing summary',
        contentHash: contentHash,
        timestamp: Date.now()
      });
      
      const result = Summarization.getCharacterFieldsNeedingSummary(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should include fields when content has changed', () => {
      const character = {
        backstory: 'word '.repeat(200)
      };
      
      const oldContentHash = 'oldhash123456789';
      
      // Add existing summary with different content hash
      SummaryStorage.saveCharacterSummary('backstory', {
        field: 'backstory',
        summary: 'Old summary',
        contentHash: oldContentHash,
        timestamp: Date.now()
      });
      
      const result = Summarization.getCharacterFieldsNeedingSummary(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0].field).to.equal('backstory');
    });

    it('should handle empty character object', () => {
      const result = Summarization.getCharacterFieldsNeedingSummary({});
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should handle null character', () => {
      const result = Summarization.getCharacterFieldsNeedingSummary(null);
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should handle undefined character', () => {
      const result = Summarization.getCharacterFieldsNeedingSummary(undefined);
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should only process backstory and notes fields', () => {
      const character = {
        name: 'word '.repeat(200), // Should be ignored
        race: 'word '.repeat(200), // Should be ignored
        class: 'word '.repeat(200), // Should be ignored
        backstory: 'word '.repeat(200), // Should be processed
        notes: 'word '.repeat(200), // Should be processed
        someOtherField: 'word '.repeat(200) // Should be ignored
      };
      
      const result = Summarization.getCharacterFieldsNeedingSummary(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      
      const fields = result.map(r => r.field);
      expect(fields).to.include('backstory');
      expect(fields).to.include('notes');
      expect(fields).to.not.include('name');
      expect(fields).to.not.include('race');
      expect(fields).to.not.include('class');
      expect(fields).to.not.include('someOtherField');
    });
  });

  describe('shouldCreateMetaSummaries', () => {
    it('should not create meta-summaries when under threshold', () => {
      // Create some entry summaries but not enough
      for (let i = 1; i <= 5; i++) {
        SummaryStorage.saveEntrySummary(`${i}`, {
          id: `${i}`,
          summary: 'Test summary',
          summaryWordCount: 50,
          timestamp: Date.now()
        });
      }
      
      const result = Summarization.shouldCreateMetaSummaries();
      expect(result).to.be.false;
    });

    it('should create meta-summaries when threshold is exceeded', () => {
      // Create enough entry summaries to exceed word threshold
      for (let i = 1; i <= 12; i++) {
        SummaryStorage.saveEntrySummary(`${i}`, {
          id: `${i}`,
          summary: 'word '.repeat(100), // 100 words each (1200 total > 1000 threshold)
          summaryWordCount: 100,
          timestamp: Date.now() - (i * 1000)
        });
      }
      
      const result = Summarization.shouldCreateMetaSummaries();
      expect(result).to.be.true;
    });

    it('should not create meta-summaries when not enough unprocessed summaries', () => {
      // Create enough summaries for meta-summary
      for (let i = 1; i <= 12; i++) {
        SummaryStorage.saveEntrySummary(`${i}`, {
          id: `${i}`,
          summary: 'word '.repeat(100),
          summaryWordCount: 100,
          timestamp: Date.now()
        });
      }
      
      // Create meta-summary that includes most of them
      SummaryStorage.saveMetaSummary('meta-1', {
        id: 'meta-1',
        title: 'Existing Meta Summary',
        summary: 'Existing meta summary',
        includedSummaryIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        timestamp: Date.now()
      });
      
      const result = Summarization.shouldCreateMetaSummaries();
      expect(result).to.be.false; // Only 2 unprocessed summaries left (11, 12)
    });

    it('should handle no existing summaries', () => {
      const result = Summarization.shouldCreateMetaSummaries();
      expect(result).to.be.false;
    });

    it('should handle word threshold exactly at limit', () => {
      // Create summaries with exactly 1000 words total
      for (let i = 1; i <= 10; i++) {
        SummaryStorage.saveEntrySummary(`${i}`, {
          id: `${i}`,
          summary: 'word '.repeat(100), // 100 words each = 1000 total
          summaryWordCount: 100,
          timestamp: Date.now()
        });
      }
      
      const result = Summarization.shouldCreateMetaSummaries();
      expect(result).to.be.false; // Should be > 1000, not >= 1000
    });

    it('should handle word threshold just over limit', () => {
      // Create summaries with 1001 words total
      for (let i = 1; i <= 10; i++) {
        SummaryStorage.saveEntrySummary(`${i}`, {
          id: `${i}`,
          summary: i === 1 ? 'word '.repeat(101) : 'word '.repeat(100),
          summaryWordCount: i === 1 ? 101 : 100,
          timestamp: Date.now()
        });
      }
      
      const result = Summarization.shouldCreateMetaSummaries();
      expect(result).to.be.true; // 1001 words > 1000 threshold
    });
  });

  describe('getSummaryStats', () => {
    beforeEach(() => {
      // Mock journal data
      const journalData = {
        character: { name: 'Test Character' },
        entries: []
      };
      
      // Create 10 entries
      for (let i = 0; i < 10; i++) {
        journalData.entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
        });
      }
      
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
    });

    it('should return correct summary statistics', () => {
      const stats = SummaryStorage.getSummaryStats();
      
      expect(stats).to.have.property('totalEntries', 10);
      expect(stats).to.have.property('recentEntries', 5);
      expect(stats).to.have.property('summarizedEntries', 0);
      expect(stats).to.have.property('pendingSummaries', 5);
      expect(stats).to.have.property('summaryCompletionRate');
      expect(stats).to.have.property('metaSummaryActive', false);
    });

    it('should calculate progress correctly when summaries exist', () => {
      // Add some summaries
      for (let i = 5; i <= 7; i++) {
        SummaryStorage.saveEntrySummary(`${i}`, {
          id: `${i}`,
          summary: `Summary ${i}`,
          summaryWordCount: 50,
          timestamp: Date.now()
        });
      }
      
      const stats = SummaryStorage.getSummaryStats();
      
      expect(stats).to.have.property('totalEntries', 10);
      expect(stats).to.have.property('summarizedEntries', 3);
      expect(stats).to.have.property('pendingSummaries', 2); // 10 total - 5 recent - 3 summarized
      expect(stats.summaryCompletionRate).to.equal(60); // 3/5 eligible entries
    });
  });

  describe('Storage Integration', () => {
    it('should save and load entry summaries', () => {
      const summary = {
        id: 'test-entry',
        summary: 'Test summary content',
        originalWordCount: 300,
        summaryWordCount: 50,
        timestamp: Date.now()
      };
      
      SummaryStorage.saveEntrySummary('test-entry', summary);
      const loaded = SummaryStorage.loadEntrySummaries();
      
      expect(loaded).to.have.property('test-entry');
      expect(loaded['test-entry']).to.deep.equal(summary);
    });

    it('should save and load character summaries', () => {
      const summary = {
        field: 'backstory',
        summary: 'Character backstory summary',
        originalWordCount: 200,
        summaryWordCount: 40,
        timestamp: Date.now()
      };
      
      SummaryStorage.saveCharacterSummary('backstory', summary);
      const loaded = SummaryStorage.loadCharacterSummaries();
      
      expect(loaded).to.have.property('backstory');
      expect(loaded.backstory).to.deep.equal(summary);
    });

    it('should save and load meta-summaries', () => {
      const metaSummary = {
        id: 'meta-1',
        title: 'Adventures Summary (10 entries)',
        summary: 'Meta summary of adventures',
        includedSummaryIds: ['1', '2', '3'],
        timestamp: Date.now()
      };
      
      SummaryStorage.saveMetaSummary('meta-1', metaSummary);
      const loaded = SummaryStorage.loadMetaSummaries();
      
      expect(loaded).to.have.property('meta-1');
      expect(loaded['meta-1']).to.deep.equal(metaSummary);
    });

    it('should clear all summaries', () => {
      // Set up test data
      const entrySummary = {
        id: 'test-entry',
        summary: 'Test summary',
        originalWordCount: 100,
        summaryWordCount: 20,
        timestamp: Date.now()
      };
      
      const characterSummary = {
        field: 'backstory',
        summary: 'Character summary',
        originalWordCount: 150,
        summaryWordCount: 30,
        timestamp: Date.now()
      };
      
      const metaSummary = {
        id: 'meta-1',
        title: 'Meta summary',
        summary: 'Meta summary content',
        includedSummaryIds: ['test-entry'],
        timestamp: Date.now()
      };
      
      // Save test data
      SummaryStorage.saveEntrySummary('test-entry', entrySummary);
      SummaryStorage.saveCharacterSummary('backstory', characterSummary);
      SummaryStorage.saveMetaSummary('meta-1', metaSummary);
      
      // Verify data exists
      expect(SummaryStorage.loadEntrySummaries()).to.have.property('test-entry');
      expect(SummaryStorage.loadCharacterSummaries()).to.have.property('backstory');
      expect(SummaryStorage.loadMetaSummaries()).to.have.property('meta-1');
      
      // Clear all summaries
      const result = SummaryStorage.clearAllSummaries();
      
      // Verify clearing was successful
      expect(result).to.have.property('success', true);
      expect(result).to.have.property('results');
      expect(result.results.entrySummaries).to.be.true;
      expect(result.results.metaSummaries).to.be.true;
      expect(result.results.characterSummaries).to.be.true;
      
      // Verify all summaries are cleared
      expect(SummaryStorage.loadEntrySummaries()).to.deep.equal({});
      expect(SummaryStorage.loadCharacterSummaries()).to.deep.equal({});
      expect(SummaryStorage.loadMetaSummaries()).to.deep.equal({});
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage gracefully', () => {
      // Corrupt the storage
      global.localStorage.setItem('simple-dnd-journal-summaries', 'invalid json');
      
      const summaries = SummaryStorage.loadEntrySummaries();
      expect(summaries).to.deep.equal({});
    });

    it('should handle missing localStorage keys gracefully', () => {
      const summaries = SummaryStorage.loadEntrySummaries();
      const characterSummaries = SummaryStorage.loadCharacterSummaries();
      const metaSummaries = SummaryStorage.loadMetaSummaries();
      
      expect(summaries).to.deep.equal({});
      expect(characterSummaries).to.deep.equal({});
      expect(metaSummaries).to.deep.equal({});
    });
  });
});
