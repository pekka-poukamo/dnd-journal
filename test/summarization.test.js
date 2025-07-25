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
