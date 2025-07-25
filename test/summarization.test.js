const { expect } = require('chai');
require('./setup');

// Load the summarization module - now available globally from test compatibility layer
const Summarization = global.Summarization;

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
      
      // Mock summaries for older entries
      const summaries = {};
      for (let i = 5; i < 10; i++) {
        summaries[`${i}`] = {
          summary: `Summary ${i}`,
          wordCount: 10
        };
      }
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
    });

    it('should calculate summary statistics correctly', () => {
      const stats = Summarization.getSummaryStats();
      
      expect(stats.totalEntries).to.equal(10);
      expect(stats.recentEntries).to.equal(5);
      expect(stats.olderEntries).to.equal(5);
      expect(stats.summarizedEntries).to.equal(5);
      expect(stats.pendingSummaries).to.equal(0);
      expect(stats.summaryCompletionRate).to.equal(100);
    });

    it('should handle no entries', () => {
      global.localStorage.removeItem('simple-dnd-journal');
      
      const stats = Summarization.getSummaryStats();
      
      expect(stats.totalEntries).to.equal(0);
      expect(stats.recentEntries).to.equal(0);
      expect(stats.olderEntries).to.equal(0);
      expect(stats.summarizedEntries).to.equal(0);
      expect(stats.pendingSummaries).to.equal(0);
      expect(stats.summaryCompletionRate).to.equal(100);
    });
  });

  describe('getFormattedEntriesForAI', () => {
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
      
      // Mock summaries for older entries
      const summaries = {};
      for (let i = 5; i < 10; i++) {
        summaries[`${i}`] = {
          summary: `Summary ${i}`,
          wordCount: 10
        };
      }
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
    });

    it('should format entries with recent full content and older summaries', () => {
      const formatted = Summarization.getFormattedEntriesForAI();
      
      expect(formatted).to.have.length(10);
      
      // First 5 should be recent entries with full content
      for (let i = 0; i < 5; i++) {
        expect(formatted[i].type).to.equal('full');
        expect(formatted[i].content).to.equal(`Content ${i}`);
      }
      
      // Last 5 should be summaries
      for (let i = 5; i < 10; i++) {
        expect(formatted[i].type).to.equal('summary');
        expect(formatted[i].content).to.equal(`Summary ${i}`);
      }
    });

    it('should handle missing summaries gracefully', () => {
      global.localStorage.removeItem('simple-dnd-journal-summaries');
      
      const formatted = Summarization.getFormattedEntriesForAI();
      
      expect(formatted).to.have.length(10);
      
      // All should be full entries when no summaries exist
      formatted.forEach(entry => {
        expect(entry.type).to.equal('full');
      });
    });
  });

  describe('Meta-Summarization', () => {
    describe('groupSummariesForMeta', () => {
      it('should group summaries into batches for meta-summarization', () => {
        const entries = [];
        const summaries = {};
        
        // Create 50 entries (enough to trigger meta-summarization)
        for (let i = 0; i < 50; i++) {
          entries.push({
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          });
          
          // Add summaries for all entries
          summaries[`${i}`] = {
            summary: `Summary ${i}`,
            wordCount: 10
          };
        }
        
        const groups = Summarization.groupSummariesForMeta(entries, summaries);
        
        expect(groups).to.have.length(5); // 50 entries / 10 per group
        
        groups.forEach((group, index) => {
          expect(group.summaries).to.have.length(10);
          expect(group.entryCount).to.equal(10);
          expect(group.timeRange).to.be.a('string');
        });
      });

      it('should exclude incomplete groups', () => {
        const entries = [];
        const summaries = {};
        
        // Create 25 entries (not enough for complete groups)
        for (let i = 0; i < 25; i++) {
          entries.push({
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          });
          
          summaries[`${i}`] = {
            summary: `Summary ${i}`,
            wordCount: 10
          };
        }
        
        const groups = Summarization.groupSummariesForMeta(entries, summaries);
        
        expect(groups).to.have.length(0); // No complete groups
      });
    });

    describe('getSummaryStats with meta-summarization', () => {
      it('should indicate meta-summarization is active for large datasets', () => {
        const journalData = {
          character: { name: 'Test Character' },
          entries: []
        };
        
        // Create 60 entries (enough to trigger meta-summarization)
        for (let i = 0; i < 60; i++) {
          journalData.entries.push({
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          });
        }
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.metaSummaryActive).to.be.true;
        expect(stats.possibleMetaSummaries).to.be.greaterThan(0);
      });

      it('should indicate meta-summarization is inactive for small datasets', () => {
        const journalData = {
          character: { name: 'Test Character' },
          entries: []
        };
        
        // Create 30 entries (not enough to trigger meta-summarization)
        for (let i = 0; i < 30; i++) {
          journalData.entries.push({
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          });
        }
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.metaSummaryActive).to.be.false;
        expect(stats.possibleMetaSummaries).to.equal(0);
      });
    });

    describe('getFormattedEntriesForAI with meta-summaries', () => {
      it('should use meta-summaries when available', () => {
        const journalData = {
          character: { name: 'Test Character' },
          entries: []
        };
        
        // Create 60 entries
        for (let i = 0; i < 60; i++) {
          journalData.entries.push({
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          });
        }
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
        
        // Mock meta-summaries
        const metaSummaries = {
          'meta-0-10': {
            summary: 'Meta summary 1',
            entryCount: 10,
            timeRange: 'Jan 1 - Jan 10'
          },
          'meta-10-20': {
            summary: 'Meta summary 2',
            entryCount: 10,
            timeRange: 'Jan 11 - Jan 20'
          }
        };
        global.localStorage.setItem('simple-dnd-journal-meta-summaries', JSON.stringify(metaSummaries));
        
        const formatted = Summarization.getFormattedEntriesForAI();
        
        // Should include meta-summaries
        const metaEntries = formatted.filter(entry => entry.type === 'meta-summary');
        expect(metaEntries).to.have.length(2);
      });

      it('should fall back to individual summaries when meta-summaries are not available', () => {
        const journalData = {
          character: { name: 'Test Character' },
          entries: []
        };
        
        // Create 60 entries
        for (let i = 0; i < 60; i++) {
          journalData.entries.push({
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          });
        }
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
        
        // Mock individual summaries but no meta-summaries
        const summaries = {};
        for (let i = 5; i < 60; i++) {
          summaries[`${i}`] = {
            summary: `Summary ${i}`,
            wordCount: 10
          };
        }
        global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
        
        const formatted = Summarization.getFormattedEntriesForAI();
        
        // Should use individual summaries
        const summaryEntries = formatted.filter(entry => entry.type === 'summary');
        expect(summaryEntries.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Character Summarization', () => {
    describe('getCharacterDetailsNeedingSummaries', () => {
      it('should identify character details that need summarization', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.',
          notes: 'Short notes'
        };
        
        const characterSummaries = {};
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(result).to.have.property('backstory');
        expect(result.backstory).to.have.property('type', 'character');
        expect(result.backstory).to.have.property('field', 'backstory');
        expect(result).to.not.have.property('notes'); // Short notes don't need summarization
      });

      it('should not require summarization for short character details', () => {
        const character = {
          name: 'Test Character',
          backstory: 'Short backstory',
          notes: 'Short notes'
        };
        
        const characterSummaries = {};
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(result).to.be.empty;
      });

      it('should detect changes in character details', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.'
        };
        
        const characterSummaries = {
          backstory: {
            summary: 'Old summary',
            contentHash: 'oldhash'
          }
        };
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(result).to.have.property('backstory');
        expect(result.backstory.contentHash).to.not.equal('oldhash');
      });

      it('should not require new summary if content unchanged', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.'
        };
        
        const contentHash = btoa(character.backstory).substring(0, 16);
        const characterSummaries = {
          backstory: {
            summary: 'Existing summary',
            contentHash: contentHash
          }
        };
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(result).to.be.empty;
      });
    });

    describe('getFormattedCharacterForAI', () => {
      it('should use original text for short character details', () => {
        const character = {
          name: 'Test Character',
          backstory: 'Short backstory',
          notes: 'Short notes'
        };
        
        const formatted = Summarization.getFormattedCharacterForAI(character);
        
        expect(formatted.backstory).to.equal('Short backstory');
        expect(formatted.notes).to.equal('Short notes');
        expect(formatted.backstorySummarized).to.be.undefined;
        expect(formatted.notesSummarized).to.be.undefined;
      });

      it('should use summaries for long character details when available', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.',
          notes: 'Short notes'
        };
        
        const characterSummaries = {
          backstory: {
            summary: 'Summarized backstory'
          }
        };
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(characterSummaries));
        
        const formatted = Summarization.getFormattedCharacterForAI(character);
        
        expect(formatted.backstory).to.equal('Summarized backstory');
        expect(formatted.backstorySummarized).to.be.true;
        expect(formatted.notes).to.equal('Short notes');
        expect(formatted.notesSummarized).to.be.undefined;
      });

      it('should preserve original long text when no summary available', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.',
          notes: 'Short notes'
        };
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify({}));
        
        const formatted = Summarization.getFormattedCharacterForAI(character);
        
        expect(formatted.backstory).to.equal(character.backstory);
        expect(formatted.backstorySummarized).to.be.false;
        expect(formatted.notes).to.equal('Short notes');
        expect(formatted.notesSummarized).to.be.false;
      });
    });

    describe('getSummaryStats character integration', () => {
      it('should include character summary statistics', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.'
        };
        
        const journalData = {
          character: character,
          entries: []
        };
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
        
        const characterSummaries = {
          backstory: {
            summary: 'Summarized backstory'
          }
        };
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(characterSummaries));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.characterSummaries).to.equal(1);
        expect(stats.characterFieldsNeedingSummaries).to.equal(0);
      });

      it('should detect character fields needing summaries', () => {
        const character = {
          name: 'Test Character',
          backstory: 'A very long backstory that exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.',
          notes: 'A very long notes section that also exceeds the word limit and should be summarized because it contains many details about the character\'s past, their motivations, and their relationships with other characters in the world.'
        };
        
        const journalData = {
          character: character,
          entries: []
        };
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify({}));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.characterFieldsNeedingSummaries).to.equal(2); // backstory and notes
      });
    });
  });
});
