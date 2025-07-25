import { expect } from 'chai';
import './setup.js';
import * as Summarization from '../js/summarization.js';

describe('Summarization Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
  });

  describe('getEntriesNeedingSummaries', () => {
    it('should identify recent and older entries correctly', () => {
      const entries = [];
      const summaries = {};
      
      // Create 8 entries with different timestamps
      for (let i = 0; i < 8; i++) {
        entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000) // Each day older
        });
      }
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(5);
      expect(result.olderEntries).to.have.length(3);
      expect(result.needingSummaries).to.have.length(3);
    });

    it('should exclude older entries that already have summaries', () => {
      const entries = [];
      const summaries = {};
      
      // Create 7 entries
      for (let i = 0; i < 7; i++) {
        entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
        });
      }
      
      // Add summaries for the first two older entries
      summaries['5'] = { summary: 'Summary 5' };
      summaries['6'] = { summary: 'Summary 6' };
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(5);
      expect(result.olderEntries).to.have.length(2);
      expect(result.needingSummaries).to.have.length(0);
    });

    it('should handle empty entries array', () => {
      const entries = [];
      const summaries = {};
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(0);
      expect(result.olderEntries).to.have.length(0);
      expect(result.needingSummaries).to.have.length(0);
    });

    it('should handle entries with fewer than 5 items', () => {
      const entries = [
        { id: '1', title: 'Entry 1', content: 'Content 1', timestamp: Date.now() },
        { id: '2', title: 'Entry 2', content: 'Content 2', timestamp: Date.now() - 1000 }
      ];
      const summaries = {};
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(2);
      expect(result.olderEntries).to.have.length(0);
      expect(result.needingSummaries).to.have.length(0);
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
      const stats = Summarization.getSummaryStats();
      
      expect(stats).to.have.property('totalEntries', 10);
      expect(stats).to.have.property('summarizedEntries', 0);
      expect(stats).to.have.property('pendingSummaries', 3);
      expect(stats).to.have.property('summaryProgress', 0);
    });

    it('should calculate progress correctly when summaries exist', () => {
      // Add some summaries
      const summaries = {
        '5': { summary: 'Summary 5' },
        '6': { summary: 'Summary 6' },
        '7': { summary: 'Summary 7' }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
      
      const stats = Summarization.getSummaryStats();
      
      expect(stats).to.have.property('totalEntries', 10);
      expect(stats).to.have.property('summarizedEntries', 3);
      expect(stats).to.have.property('pendingSummaries', 0);
      expect(stats).to.have.property('summaryProgress', 30);
    });
  });

  describe('getFormattedEntriesForAI', () => {
    it('should format entries correctly for AI processing', () => {
      const entries = [
        {
          id: '1',
          title: 'Battle at Helm\'s Deep',
          content: 'We defended the fortress against overwhelming odds.',
          timestamp: Date.now()
        },
        {
          id: '2',
          title: 'Meeting with Gandalf',
          content: 'The wizard shared important information about the ring.',
          timestamp: Date.now() - 1000
        }
      ];
      
      const formatted = Summarization.getFormattedEntriesForAI(entries);
      
      expect(formatted).to.be.an('array');
      expect(formatted).to.have.length(2);
      expect(formatted[0]).to.include('Battle at Helm\'s Deep');
      expect(formatted[0]).to.include('We defended the fortress');
      expect(formatted[1]).to.include('Meeting with Gandalf');
    });

    it('should truncate long content appropriately', () => {
      const longContent = 'A'.repeat(600);
      const entries = [
        {
          id: '1',
          title: 'Long Entry',
          content: longContent,
          timestamp: Date.now()
        }
      ];
      
      const formatted = Summarization.getFormattedEntriesForAI(entries);
      
      expect(formatted[0]).to.include('Long Entry');
      expect(formatted[0]).to.include('...');
      expect(formatted[0].length).to.be.lessThan(longContent.length);
    });
  });

  describe('groupSummariesForMeta', () => {
    it('should group summaries correctly for meta summarization', () => {
      const summaries = {
        '1': { summary: 'Summary 1', timestamp: Date.now() },
        '2': { summary: 'Summary 2', timestamp: Date.now() - 1000 },
        '3': { summary: 'Summary 3', timestamp: Date.now() - 2000 }
      };
      
      const grouped = Summarization.groupSummariesForMeta(summaries);
      
      expect(grouped).to.be.an('array');
      expect(grouped).to.have.length(3);
      expect(grouped[0]).to.include('Summary 1');
      expect(grouped[1]).to.include('Summary 2');
      expect(grouped[2]).to.include('Summary 3');
    });

    it('should handle empty summaries object', () => {
      const grouped = Summarization.groupSummariesForMeta({});
      
      expect(grouped).to.be.an('array');
      expect(grouped).to.have.length(0);
    });
  });

  describe('getCharacterDetailsNeedingSummaries', () => {
    it('should identify character details that need summarization', () => {
      const character = {
        name: 'Test Character',
        backstory: 'A very long backstory that needs to be summarized for AI processing',
        notes: 'Detailed notes about equipment and relationships'
      };
      
      const result = Summarization.getCharacterDetailsNeedingSummaries(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      expect(result).to.include('backstory');
      expect(result).to.include('notes');
    });

    it('should not include short content', () => {
      const character = {
        name: 'Test Character',
        backstory: 'Short',
        notes: 'Also short'
      };
      
      const result = Summarization.getCharacterDetailsNeedingSummaries(character);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  });

  describe('getFormattedCharacterForAI', () => {
    it('should format character data for AI processing', () => {
      const character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        backstory: 'Heir to the throne of Gondor',
        notes: 'Carries Andúril, the sword of kings'
      };
      
      const formatted = Summarization.getFormattedCharacterForAI(character);
      
      expect(formatted).to.be.an('object');
      expect(formatted).to.have.property('name', 'Aragorn');
      expect(formatted).to.have.property('race', 'Human');
      expect(formatted).to.have.property('class', 'Ranger');
      expect(formatted).to.have.property('backstory', 'Heir to the throne of Gondor');
      expect(formatted).to.have.property('notes', 'Carries Andúril, the sword of kings');
    });

    it('should handle missing character properties', () => {
      const character = {
        name: 'Test Character'
      };
      
      const formatted = Summarization.getFormattedCharacterForAI(character);
      
      expect(formatted).to.have.property('name', 'Test Character');
      expect(formatted).to.have.property('race', '');
      expect(formatted).to.have.property('class', '');
      expect(formatted).to.have.property('backstory', '');
      expect(formatted).to.have.property('notes', '');
    });
  });

  describe('SUMMARIZATION_CONFIGS', () => {
    it('should have required configuration properties', () => {
      expect(Summarization.SUMMARIZATION_CONFIGS).to.have.property('entries');
      expect(Summarization.SUMMARIZATION_CONFIGS).to.have.property('metaSummaries');
      expect(Summarization.SUMMARIZATION_CONFIGS).to.have.property('character');
    });

    it('should have correct entry summarization config', () => {
      const config = Summarization.SUMMARIZATION_CONFIGS.entries;
      expect(config).to.have.property('maxLength', 150);
      expect(config).to.have.property('includeTitle', true);
    });

    it('should have correct meta summarization config', () => {
      const config = Summarization.SUMMARIZATION_CONFIGS.metaSummaries;
      expect(config).to.have.property('maxLength', 200);
      expect(config).to.have.property('groupSize', 5);
    });

    it('should have correct character summarization config', () => {
      const config = Summarization.SUMMARIZATION_CONFIGS.character;
      expect(config).to.have.property('maxLength', 100);
      expect(config).to.have.property('fields', ['backstory', 'notes']);
    });
  });

  describe('META_SUMMARY_CONFIG', () => {
    it('should export meta summary configuration', () => {
      expect(Summarization.META_SUMMARY_CONFIG).to.deep.equal(Summarization.SUMMARIZATION_CONFIGS.metaSummaries);
    });
  });

  describe('CHARACTER_SUMMARY_CONFIG', () => {
    it('should export character summary configuration', () => {
      expect(Summarization.CHARACTER_SUMMARY_CONFIG).to.deep.equal(Summarization.SUMMARIZATION_CONFIGS.character);
    });
  });
});
