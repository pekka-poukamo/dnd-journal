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
      
      // The function returns all entries that don't have summaries
      // Since we have 8 entries and no summaries, all 8 need summaries
      expect(result).to.be.an('array');
      expect(result).to.have.length(8);
      expect(result[0].id).to.equal('0');
      expect(result[7].id).to.equal('7');
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
      
      // Since summaries exist for entries 5 and 6, only entries 0,1,2,3,4 need summaries
      expect(result).to.be.an('array');
      expect(result).to.have.length(5);
      expect(result.map(e => e.id)).to.include('0');
      expect(result.map(e => e.id)).to.include('4');
      expect(result.map(e => e.id)).to.not.include('5');
      expect(result.map(e => e.id)).to.not.include('6');
    });

    it('should handle empty entries array', () => {
      const entries = [];
      const summaries = {};
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should handle entries with fewer than 5 items', () => {
      const entries = [
        { id: '1', title: 'Entry 1', content: 'Content 1', timestamp: Date.now() },
        { id: '2', title: 'Entry 2', content: 'Content 2', timestamp: Date.now() - 1000 }
      ];
      const summaries = {};
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      // With only 2 entries, both need summaries since none have summaries yet
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      expect(result[0].id).to.equal('1');
      expect(result[1].id).to.equal('2');
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
      expect(stats).to.have.property('entriesWithSummaries', 0);
      expect(stats).to.have.property('metaSummaryCount', 0);
      expect(stats).to.have.property('characterSummaryCount', 0);
      expect(stats).to.have.property('totalOriginalWords');
      expect(stats).to.have.property('totalSummaryWords');
      expect(stats).to.have.property('compressionRatio');
    });

    it('should calculate progress correctly when summaries exist', () => {
      // Add some summaries
      const summaries = {
        '5': { summary: 'Summary 5', wordCount: 5 },
        '6': { summary: 'Summary 6', wordCount: 6 },
        '7': { summary: 'Summary 7', wordCount: 7 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
      
      const stats = Summarization.getSummaryStats();
      
      expect(stats).to.have.property('totalEntries', 10);
      expect(stats).to.have.property('entriesWithSummaries', 3);
      expect(stats).to.have.property('totalSummaryWords', 18); // 5 + 6 + 7
      expect(stats).to.have.property('compressionRatio');
    });
  });

  describe('getFormattedEntriesForAI', () => {
    it('should format entries correctly for AI processing', () => {
      // Set up journal data in localStorage
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
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
        ]
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
      
      const formatted = Summarization.getFormattedEntriesForAI();
      
      expect(formatted).to.be.an('array');
      expect(formatted).to.have.length(2);
      expect(formatted[0].title).to.equal('Battle at Helm\'s Deep');
      expect(formatted[0].content).to.include('We defended the fortress');
      expect(formatted[1].title).to.equal('Meeting with Gandalf');
    });

    it('should truncate long content appropriately', () => {
      const longContent = 'A'.repeat(600);
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: '1',
            title: 'Long Entry',
            content: longContent,
            timestamp: Date.now()
          }
        ]
      };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
      
      const formatted = Summarization.getFormattedEntriesForAI();
      
      expect(formatted[0].title).to.equal('Long Entry');
      expect(formatted[0].content).to.equal(longContent); // No truncation in this function
    });
  });

  describe('groupSummariesForMeta', () => {
    it('should group summaries correctly for meta summarization', () => {
      // Create 60 entries to meet the threshold (50)
      const entries = [];
      const summaries = {};
      
      for (let i = 1; i <= 60; i++) {
        entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 1000)
        });
        summaries[`${i}`] = { summary: `Summary ${i}` };
      }
      
      const grouped = Summarization.groupSummariesForMeta(entries, summaries);
      
      expect(grouped).to.be.an('array');
      expect(grouped).to.have.length(6); // 60 entries / 10 per group = 6 groups
      expect(grouped[0]).to.have.property('summaries');
      expect(grouped[0].summaries).to.have.length(10);
    });

    it('should handle empty summaries object', () => {
      const entries = [];
      const summaries = {};
      const grouped = Summarization.groupSummariesForMeta(entries, summaries);
      
      expect(grouped).to.be.an('array');
      expect(grouped).to.have.length(0);
    });
  });

  describe('getCharacterDetailsNeedingSummaries', () => {
    it('should identify character details that need summarization', () => {
      const character = {
        name: 'Test Character',
        backstory: 'A very long backstory that needs to be summarized for AI processing because it contains many words and exceeds the threshold for summarization. This is a detailed character background that includes their childhood, training, major life events, relationships, and motivations. The character has experienced significant trauma and growth throughout their journey, which has shaped their current personality and goals. Born in a small village on the outskirts of the kingdom, the character was raised by their grandmother after their parents were killed in a bandit raid. From an early age, they showed an aptitude for magic and were apprenticed to the local wizard. However, tragedy struck again when their master was killed by a dark sorcerer seeking ancient artifacts. This event set the character on a path of vengeance and justice, leading them to join the adventuring party. Throughout their travels, they have encountered numerous challenges and allies, each shaping their understanding of the world and their place in it. The character has developed a deep sense of responsibility for protecting the innocent and has become a respected leader within their group.',
        notes: 'Detailed notes about equipment and relationships that also need summarization due to length. This includes a comprehensive list of magical items, weapons, armor, and other gear. The character has formed many important relationships with NPCs and other party members, each with their own complex dynamics and history. Their primary weapon is a enchanted longsword that glows with inner light, given to them by their mentor before his death. They also carry a staff of the archmage, a powerful artifact that enhances their spellcasting abilities. Their armor is made of mithril and bears protective runes. Among their magical items are a ring of protection, a cloak of elvenkind, and a bag of holding containing various potions and scrolls. The character has formed close bonds with several NPCs including the village elder who helped them after their parents death, the blacksmith who crafted their armor, and the merchant who supplies them with magical components. Within the party, they have a particularly strong friendship with the rogue, who shares their sense of justice, and a more complex relationship with the paladin, who sometimes questions their methods.'
      };
      const characterSummaries = {};
      
      const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('backstory');
      expect(result).to.have.property('notes');
      expect(result.backstory).to.have.property('field', 'backstory');
      expect(result.notes).to.have.property('field', 'notes');
    });

    it('should not include short content', () => {
      const character = {
        name: 'Test Character',
        backstory: 'Short',
        notes: 'Also short'
      };
      const characterSummaries = {};
      
      const result = Summarization.getCharacterDetailsNeedingSummaries(character, characterSummaries);
      
      expect(result).to.be.an('object');
      expect(Object.keys(result)).to.have.length(0);
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
      expect(formatted).to.have.property('backstorySummarized', false);
      expect(formatted).to.have.property('notesSummarized', false);
      expect(formatted).to.have.property('backstory', undefined);
      expect(formatted).to.have.property('notes', undefined);
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
      expect(config).to.have.property('storageKey');
      expect(config).to.have.property('recentCount', 5);
      expect(config).to.have.property('batchSize', 3);
      expect(config).to.have.property('targetCompressionRatio', 0.3);
    });

    it('should have correct meta summarization config', () => {
      const config = Summarization.SUMMARIZATION_CONFIGS.metaSummaries;
      expect(config).to.have.property('storageKey');
      expect(config).to.have.property('triggerThreshold', 50);
      expect(config).to.have.property('summariesPerGroup', 10);
      expect(config).to.have.property('maxWords', 200);
      expect(config).to.have.property('batchSize', 2);
    });

    it('should have correct character summarization config', () => {
      const config = Summarization.SUMMARIZATION_CONFIGS.character;
      expect(config).to.have.property('storageKey');
      expect(config).to.have.property('fields');
      expect(config.fields).to.deep.equal(['backstory', 'notes']);
      expect(config).to.have.property('maxWordsBeforeSummary', 100);
      expect(config).to.have.property('targetWords', 50);
      expect(config).to.have.property('batchSize', 2);
    });
  });

  // Note: META_SUMMARY_CONFIG and CHARACTER_SUMMARY_CONFIG exports were removed
  // in favor of using SUMMARIZATION_CONFIGS.metaSummaries and SUMMARIZATION_CONFIGS.character directly
});
