const { expect } = require('chai');
require('./setup');

// Load the summarization module
const Summarization = require('../js/summarization');

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
      
      // Add some summaries
      const summaries = {
        '7': { summary: 'Summary 7', originalWordCount: 20, summaryWordCount: 8 },
        '8': { summary: 'Summary 8', originalWordCount: 25, summaryWordCount: 10 },
        '9': { summary: 'Summary 9', originalWordCount: 30, summaryWordCount: 12 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
    });

    it('should calculate summary statistics correctly', () => {
      const stats = Summarization.getSummaryStats();
      
      expect(stats.totalEntries).to.equal(10);
      expect(stats.recentEntries).to.equal(5);
      expect(stats.olderEntries).to.equal(5);
      expect(stats.summarizedEntries).to.equal(3);
      expect(stats.pendingSummaries).to.equal(2);
      expect(stats.summaryCompletionRate).to.equal(60); // 3/5 * 100
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
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          { id: '1', title: 'Recent 1', content: 'Recent content 1', timestamp: Date.now() },
          { id: '2', title: 'Recent 2', content: 'Recent content 2', timestamp: Date.now() - 1000 },
          { id: '3', title: 'Recent 3', content: 'Recent content 3', timestamp: Date.now() - 2000 },
          { id: '4', title: 'Recent 4', content: 'Recent content 4', timestamp: Date.now() - 3000 },
          { id: '5', title: 'Recent 5', content: 'Recent content 5', timestamp: Date.now() - 4000 },
          { id: '6', title: 'Old 1', content: 'Old content 1', timestamp: Date.now() - 5000 },
          { id: '7', title: 'Old 2', content: 'Old content 2', timestamp: Date.now() - 6000 }
        ]
      };
      
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
      
      const summaries = {
        '6': { summary: 'Summary of old content 1', originalWordCount: 15, summaryWordCount: 6 },
        '7': { summary: 'Summary of old content 2', originalWordCount: 18, summaryWordCount: 7 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
    });

    it('should format entries with recent full content and older summaries', () => {
      const formatted = Summarization.getFormattedEntriesForAI();
      
      expect(formatted).to.have.length(7);
      
      // Check recent entries (should be full content)
      const recentEntries = formatted.filter(entry => entry.type === 'full');
      expect(recentEntries).to.have.length(5);
      expect(recentEntries[0].content).to.equal('Recent content 1');
      
      // Check older entries (should be summaries)
      const summaryEntries = formatted.filter(entry => entry.type === 'summary');
      expect(summaryEntries).to.have.length(2);
      expect(summaryEntries[0].content).to.equal('Summary of old content 1');
      expect(summaryEntries[0]).to.have.property('originalWordCount');
      expect(summaryEntries[0]).to.have.property('summaryWordCount');
    });

    it('should handle missing summaries gracefully', () => {
      // Remove one summary
      const summaries = {
        '6': { summary: 'Summary of old content 1', originalWordCount: 15, summaryWordCount: 6 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
      
      const formatted = Summarization.getFormattedEntriesForAI();
      
      // Should only include entries with summaries for older entries
      const summaryEntries = formatted.filter(entry => entry.type === 'summary');
      expect(summaryEntries).to.have.length(1);
      expect(summaryEntries[0].title).to.equal('Old 1');
    });
  });

  describe('Meta-Summarization', () => {
    beforeEach(() => {
      // Create a large dataset with 60 entries to trigger meta-summarization
      const journalData = {
        character: { name: 'Test Character' },
        entries: []
      };
      
      const summaries = {};
      
      // Create 60 entries (55 older + 5 recent)
      for (let i = 0; i < 60; i++) {
        const entry = {
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content for entry ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000) // Each day older
        };
        journalData.entries.push(entry);
        
        // Add summaries for older entries (skip the 5 most recent)
        if (i >= 5) {
          summaries[entry.id] = {
            summary: `Summary for entry ${i}`,
            originalWordCount: 15 + i,
            summaryWordCount: 8 + Math.floor(i / 2)
          };
        }
      }
      
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
      global.localStorage.removeItem('simple-dnd-journal-meta-summaries');
    });

    describe('groupSummariesForMeta', () => {
      it('should group summaries into batches for meta-summarization', () => {
        const journalData = JSON.parse(global.localStorage.getItem('simple-dnd-journal'));
        const summaries = JSON.parse(global.localStorage.getItem('simple-dnd-journal-summaries'));
        
        const groups = Summarization.groupSummariesForMeta(journalData.entries, summaries);
        
        // Should create groups of 10 entries each (excluding recent 5)
        // 55 older entries with summaries, grouped into batches of 10 = 5 complete groups
        expect(groups).to.have.length(5);
        groups.forEach(group => {
          expect(group).to.have.length(10);
        });
      });

      it('should exclude incomplete groups', () => {
        // Create smaller dataset with only 7 older entries (less than group size of 10)
        const journalData = {
          character: {},
          entries: []
        };
        
        const summaries = {};
        
        for (let i = 0; i < 12; i++) { // 7 older + 5 recent
          const entry = {
            id: `${i}`,
            title: `Entry ${i}`,
            content: `Content ${i}`,
            timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
          };
          journalData.entries.push(entry);
          
          if (i >= 5) {
            summaries[entry.id] = { summary: `Summary ${i}` };
          }
        }
        
        const groups = Summarization.groupSummariesForMeta(journalData.entries, summaries);
        
        // Should create no complete groups (only 7 entries, need 10 for a group)
        expect(groups).to.have.length(0);
      });
    });

    describe('getSummaryStats with meta-summarization', () => {
      it('should indicate meta-summarization is active for large datasets', () => {
        const stats = Summarization.getSummaryStats();
        
        expect(stats.metaSummaryActive).to.be.true;
        expect(stats.totalEntries).to.equal(60);
        expect(stats.possibleMetaSummaries).to.equal(5);
        expect(stats.metaSummaries).to.equal(0); // No meta-summaries generated yet
      });

      it('should indicate meta-summarization is inactive for small datasets', () => {
        // Create small dataset
        const smallData = {
          character: {},
          entries: [
            { id: '1', title: 'Entry 1', content: 'Content 1', timestamp: Date.now() }
          ]
        };
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify(smallData));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.metaSummaryActive).to.be.false;
        expect(stats.totalEntries).to.equal(1);
      });
    });

    describe('getFormattedEntriesForAI with meta-summaries', () => {
      it('should use meta-summaries when available', () => {
        const journalData = JSON.parse(global.localStorage.getItem('simple-dnd-journal'));
        const summaries = JSON.parse(global.localStorage.getItem('simple-dnd-journal-summaries'));
        
        // First, determine what the actual groups would be
        const groups = Summarization.groupSummariesForMeta(journalData.entries, summaries);
        expect(groups.length).to.be.greaterThan(0); // Ensure we have groups
        
        // Create meta-summary for the first group
        const firstGroup = groups[0];
        const groupKey = `${firstGroup[0].id}-${firstGroup[firstGroup.length - 1].id}`;
        
        const metaSummaries = {};
        metaSummaries[groupKey] = {
          summary: 'Meta-summary of first group',
          entryCount: 10,
          timeRange: '2023-01-01 - 2023-01-10',
          originalWordCount: 100,
          metaSummaryWordCount: 50
        };
        global.localStorage.setItem('simple-dnd-journal-meta-summaries', JSON.stringify(metaSummaries));
        
        const formatted = Summarization.getFormattedEntriesForAI();
        
        // Should include meta-summaries
        const metaSummaryEntries = formatted.filter(entry => entry.type === 'meta-summary');
        expect(metaSummaryEntries).to.have.length(1);
        expect(metaSummaryEntries[0].title).to.include('Adventures (10 entries)');
        expect(metaSummaryEntries[0].content).to.equal('Meta-summary of first group');
      });

      it('should fall back to individual summaries when meta-summaries are not available', () => {
        const formatted = Summarization.getFormattedEntriesForAI();
        
        // Should include individual summaries for older entries
        const summaryEntries = formatted.filter(entry => entry.type === 'summary');
        expect(summaryEntries.length).to.be.greaterThan(0);
        
        // Should not include any meta-summaries
        const metaSummaryEntries = formatted.filter(entry => entry.type === 'meta-summary');
        expect(metaSummaryEntries).to.have.length(0);
      });
    });
  });

  describe('Character Summarization', () => {
    describe('getCharacterDetailsNeedingSummaries', () => {
      it('should identify character details that need summarization', () => {
        const character = {
          name: 'Gimli',
          race: 'Dwarf',
          class: 'Fighter',
          backstory: 'A very long backstory that goes on and on with many words. It tells the tale of a brave dwarf warrior who fought many battles and had many adventures throughout his long life. This backstory continues to describe various events and relationships that shaped the character into who they are today. It contains detailed descriptions of family members, important locations, and key events that would be important for understanding the character but is quite lengthy and would benefit from summarization when used in AI prompts to save on token usage while preserving the essential information. The character has traveled to many distant lands and formed numerous alliances with other adventurers. They have faced countless challenges and overcome great adversities that have shaped their personality and worldview. This extensive background provides rich context for understanding their motivations and behavior in current adventures.',
          notes: 'Short notes about equipment'
        };
        const characterSummaries = {};
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(result).to.have.property('backstory');
        expect(result.backstory.field).to.equal('backstory');
        expect(result.backstory.wordCount).to.be.above(100);
        expect(result).to.not.have.property('notes');
      });

      it('should not require summarization for short character details', () => {
        const character = {
          name: 'Legolas',
          race: 'Elf',
          class: 'Ranger',
          backstory: 'A brief backstory.',
          notes: 'Short notes.'
        };
        const characterSummaries = {};
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(Object.keys(result)).to.have.length(0);
      });

      it('should detect changes in character details', () => {
        const character = {
          backstory: 'This is a very long original backstory that needs summarization. It contains many detailed descriptions of the character\'s past, including their family history, childhood experiences, and formative events. The backstory describes various relationships and conflicts that shaped the character. It also includes information about their training, skills, and personal motivations that drive their current adventures. The character has lived through many significant historical events and has developed unique perspectives based on these experiences. They have formed deep relationships with mentors, allies, and even former enemies who have influenced their development. Their skills were honed through years of dedicated practice and real-world application in dangerous situations. This comprehensive background helps explain their current abilities, personality traits, and decision-making patterns in new adventures.'
        };
        const characterSummaries = {
          backstory: {
            summary: 'Old summary',
            contentHash: 'oldHash123'
          }
        };
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(result).to.have.property('backstory');
        expect(result.backstory.contentHash).to.not.equal('oldHash123');
      });

      it('should not require new summary if content unchanged', () => {
        const backstoryContent = 'This is a very long backstory that needs summarization. It contains many detailed descriptions of the character\'s past, including their family history, childhood experiences, and formative events. The backstory describes various relationships and conflicts that shaped the character. It also includes information about their training, skills, and personal motivations that drive their current adventures. The character has lived through many significant historical events and has developed unique perspectives based on these experiences. They have formed deep relationships with mentors, allies, and even former enemies who have influenced their development. Their skills were honed through years of dedicated practice and real-world application in dangerous situations.';
        const character = { backstory: backstoryContent };
        const contentHash = btoa(backstoryContent).substring(0, 16);
        const characterSummaries = {
          backstory: {
            summary: 'Existing summary',
            contentHash: contentHash
          }
        };
        
        const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
        
        expect(Object.keys(result)).to.have.length(0);
      });
    });

    describe('getFormattedCharacterForAI', () => {
      it('should use original text for short character details', () => {
        const character = {
          name: 'Aragorn',
          backstory: 'Short backstory',
          notes: 'Brief notes'
        };
        
        const result = Summarization.getFormattedCharacterForAI(character);
        
        expect(result.backstory).to.equal('Short backstory');
        expect(result.notes).to.equal('Brief notes');
        expect(result.backstorySummarized).to.be.undefined;
        expect(result.notesSummarized).to.be.undefined;
      });

      it('should use summaries for long character details when available', () => {
        const character = {
          name: 'Boromir',
          backstory: 'This is a very long backstory that needs summarization. It contains many detailed descriptions of the character\'s past, including their family history, childhood experiences, and formative events. The backstory describes various relationships and conflicts that shaped the character. It also includes information about their training, skills, and personal motivations that drive their current adventures. The character has lived through many significant historical events and has developed unique perspectives based on these experiences. They have formed deep relationships with mentors, allies, and even former enemies who have influenced their development. Throughout their journeys, they have encountered countless challenges that tested not only their physical abilities but also their moral compass and intellectual capabilities. Each adventure has left its mark on their personality, teaching them valuable lessons about friendship, sacrifice, courage, and the complex nature of good and evil in the world.',
                      notes: 'These are very detailed notes about the character that go on and on with extensive descriptions of equipment, relationships, goals, and other important details that would be useful for AI prompts but are quite lengthy and would benefit from summarization. The character carries numerous magical items acquired during their adventures, each with its own history and significance. They have established complex relationships with various factions and individuals throughout their journeys. Their personal goals have evolved over time as they have gained experience and wisdom through their many adventures and encounters with different cultures and belief systems. The character maintains detailed records of all their interactions, including tactical assessments of potential allies and enemies, strategic notes about various locations visited, and comprehensive inventories of magical items with their properties and origins. They also keep track of ongoing political situations, local customs in different regions, and important contacts who might provide assistance or information in future endeavors.'
        };
        
        // Mock character summaries in localStorage
        const characterSummaries = {
          backstory: {
            summary: 'Brief backstory summary',
            originalWordCount: 50,
            summaryWordCount: 10
          },
          notes: {
            summary: 'Brief notes summary',
            originalWordCount: 40,
            summaryWordCount: 8
          }
        };
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(characterSummaries));
        
        const result = Summarization.getFormattedCharacterForAI(character);
        
        expect(result.backstory).to.equal('Brief backstory summary');
        expect(result.notes).to.equal('Brief notes summary');
        expect(result.backstorySummarized).to.be.true;
        expect(result.notesSummarized).to.be.true;
      });

      it('should preserve original long text when no summary available', () => {
        const longBackstory = 'This is a very long backstory that needs summarization. It contains many detailed descriptions of the character\'s past, including their family history, childhood experiences, and formative events. The backstory describes various relationships and conflicts that shaped the character. It also includes information about their training, skills, and personal motivations that drive their current adventures. The character has lived through many significant historical events and has developed unique perspectives based on these experiences. They have formed deep relationships with mentors, allies, and even former enemies who have influenced their development.';
        const character = {
          name: 'Frodo',
          backstory: longBackstory
        };
        
        const result = Summarization.getFormattedCharacterForAI(character);
        
        expect(result.backstory).to.equal(longBackstory);
        expect(result.backstorySummarized).to.be.undefined;
      });
    });

    describe('getSummaryStats character integration', () => {
      it('should include character summary statistics', () => {
        const character = {
          backstory: 'This is a very long backstory that needs summarization. It contains many detailed descriptions of the character\'s past, including their family history, childhood experiences, and formative events. The backstory describes various relationships and conflicts that shaped the character. It also includes information about their training, skills, and personal motivations that drive their current adventures. The character has lived through many significant historical events and has developed unique perspectives based on these experiences. They have formed deep relationships with mentors, allies, and even former enemies who have influenced their development.'
        };
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
          character: character,
          entries: []
        }));
        
        const characterSummaries = {
          backstory: {
            summary: 'Brief summary',
            originalWordCount: 50
          }
        };
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(characterSummaries));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.characterSummaries).to.equal(1);
        expect(stats.characterSummaryFields).to.include('backstory');
        expect(stats.characterFieldsNeedingSummaries).to.equal(0); // Already summarized
      });

      it('should detect character fields needing summaries', () => {
        const character = {
          backstory: 'This is a very long backstory that needs summarization. It contains many detailed descriptions of the character\'s past, including their family history, childhood experiences, and formative events. The backstory describes various relationships and conflicts that shaped the character. The character has lived through many significant historical events and has developed unique perspectives based on these experiences. They have formed deep relationships with mentors, allies, and even former enemies who have influenced their development. Throughout their journeys, they have encountered countless challenges that tested not only their physical abilities but also their moral compass and intellectual capabilities. Each adventure has left its mark on their personality, teaching them valuable lessons about friendship, sacrifice, courage, and the complex nature of good and evil in the world.',
          notes: 'These are very detailed notes about the character that go on and on with extensive descriptions of equipment, relationships, goals, and other important details. The character carries numerous magical items acquired during their adventures, each with its own history and significance. They have established complex relationships with various factions and individuals throughout their journeys. Their personal goals have evolved over time as they have gained experience and wisdom through their many adventures and encounters with different cultures and belief systems. The character maintains detailed records of all their interactions, including tactical assessments of potential allies and enemies, strategic notes about various locations visited, and comprehensive inventories of magical items with their properties and origins. They also keep track of ongoing political situations, local customs in different regions, and important contacts who might provide assistance or information in future endeavors.'
        };
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
          character: character,
          entries: []
        }));
        
        const stats = Summarization.getSummaryStats();
        
        expect(stats.characterSummaries).to.equal(0);
        expect(stats.characterFieldsNeedingSummaries).to.equal(2); // Both backstory and notes need summaries
      });
    });
  });
});
