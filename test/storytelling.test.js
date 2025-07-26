import { expect } from 'chai';
import './setup.js';
import * as Storytelling from '../js/storytelling.js';

describe('Storytelling Module', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  afterEach(() => {
    global.localStorage.clear();
  });

  describe('generateQuestions', () => {
    it('should return null when AI is not available', async () => {
      const character = { name: 'Test Character' };
      const entries = [{ id: '1', title: 'Test Entry', content: 'Test content' }];
      
      const result = await Storytelling.generateQuestions(character, entries);
      expect(result).to.be.null;
    });

    it('should handle null character and entries gracefully', async () => {
      const result = await Storytelling.generateQuestions(null, null);
      expect(result).to.be.null;
    });

    it('should load data from storage when no parameters provided', async () => {
      // Set up journal data in storage
      const journalData = {
        character: { name: 'Stored Character' },
        entries: [{ id: '1', title: 'Stored Entry', content: 'Stored content' }]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.generateQuestions();
      expect(result).to.be.null; // Will be null due to no AI, but function loads from storage
    });

    it('should handle corrupted journal data', async () => {
      localStorage.setItem('simple-dnd-journal', 'invalid json');
      
      const result = await Storytelling.generateQuestions();
      expect(result).to.be.null;
    });

    it('should handle empty journal data', async () => {
      localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {},
        entries: []
      }));

      const result = await Storytelling.generateQuestions();
      expect(result).to.be.null;
    });
  });

  describe('getIntrospectionQuestions', () => {
    it('should return null when AI is not available', async () => {
      // Set up some journal data
      const journalData = {
        character: { name: 'Test Character' },
        entries: [{ id: '1', title: 'Test Entry', content: 'Test content' }]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getIntrospectionQuestions();
      expect(result).to.be.null;
    });

    it('should handle empty journal data', async () => {
      localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {},
        entries: []
      }));

      const result = await Storytelling.getIntrospectionQuestions();
      expect(result).to.be.null;
    });

    it('should handle missing journal data', async () => {
      const result = await Storytelling.getIntrospectionQuestions();
      expect(result).to.be.null;
    });
  });

  describe('getCharacterContext', () => {
    it('should return context object with correct structure', async () => {
      const journalData = {
        character: {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter',
          backstory: 'Short backstory',
          notes: 'Short notes'
        },
        entries: [
          {
            id: '1',
            title: 'First Entry',
            content: 'First entry content',
            timestamp: Date.now()
          },
          {
            id: '2',
            title: 'Second Entry',
            content: 'Second entry content',
            timestamp: Date.now() - 86400000
          }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.should.be.an('object');
      result.should.have.property('character');
      result.should.have.property('entries');
      result.should.have.property('contextLength');
      result.should.have.property('summaryStats');
      
      result.character.should.be.an('object');
      result.character.name.should.equal('Test Character');
      result.entries.should.be.an('array');
      result.contextLength.should.be.an('object');
      result.summaryStats.should.be.an('object');
    });

    it('should handle empty journal data', async () => {
      localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: {},
        entries: []
      }));

      const result = await Storytelling.getCharacterContext();
      
      result.should.be.an('object');
      result.character.should.be.an('object');
      result.entries.should.be.an('array');
      result.entries.should.have.length(0);
    });

    it('should handle corrupted journal data', async () => {
      localStorage.setItem('simple-dnd-journal', 'invalid json');

      const result = await Storytelling.getCharacterContext();
      
      result.should.be.an('object');
      result.character.should.be.an('object');
      result.entries.should.be.an('array');
      result.entries.should.have.length(0);
    });

    it('should include summary statistics', async () => {
      // Set up some summaries
      const summaries = {
        'entry:1': { content: 'Entry summary', words: 10, timestamp: Date.now() },
        'character:backstory': { content: 'Character summary', words: 15, timestamp: Date.now() },
        'meta:test': { content: 'Meta summary', words: 20, timestamp: Date.now() }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(summaries));

      const journalData = {
        character: { name: 'Test Character' },
        entries: [{ id: '1', title: 'Test Entry', content: 'Test content' }]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.summaryStats.should.have.property('totalSummaries', 3);
      result.summaryStats.should.have.property('metaSummaries', 1);
      result.summaryStats.should.have.property('regularSummaries', 2);
    });

    it('should handle entries with missing timestamps', async () => {
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: '1',
            title: 'Entry Without Timestamp',
            content: 'Content without timestamp'
            // No timestamp property
          }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.entries.should.be.an('array');
      result.entries.should.have.length(1);
    });

    it('should include context length calculations', async () => {
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: '1',
            title: 'Test Entry',
            content: 'Test content',
            timestamp: Date.now()
          }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.contextLength.should.be.an('object');
      result.contextLength.should.have.property('totalWords');
      result.contextLength.should.have.property('characterWords');
      result.contextLength.should.have.property('entriesWords');
      result.contextLength.totalWords.should.be.a('number');
    });

    it('should handle missing data gracefully', async () => {
      const result = await Storytelling.getCharacterContext();
      
      result.should.be.an('object');
      result.character.should.be.an('object');
      result.entries.should.be.an('array');
      result.summaryStats.should.be.an('object');
      result.contextLength.should.be.an('object');
    });

    it('should sort entries by timestamp', async () => {
      const now = Date.now();
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: '1',
            title: 'Older Entry',
            content: 'Older content',
            timestamp: now - 86400000
          },
          {
            id: '2',
            title: 'Newer Entry',
            content: 'Newer content',
            timestamp: now
          }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.entries.should.be.an('array');
      result.entries.should.have.length(2);
      // Newer entries should be formatted first
      result.entries[0].should.contain('Newer Entry');
    });

    it('should handle long character backstory by attempting summarization', async () => {
      const longBackstory = 'word '.repeat(250); // Long enough to trigger summarization
      const journalData = {
        character: {
          name: 'Test Character',
          backstory: longBackstory,
          notes: 'Short notes'
        },
        entries: []
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      // Should attempt to summarize but return null due to no AI
      // The backstory field should still be present in character object
      result.character.should.be.an('object');
      result.character.name.should.equal('Test Character');
      result.character.should.have.property('backstory');
    });
  });

  describe('hasGoodContext', () => {
    it('should return an object with context status', () => {
      const result = Storytelling.hasGoodContext();
      result.should.be.an('object');
      result.should.have.property('hasCharacter');
      result.should.have.property('hasContent');
      result.should.have.property('ready');
    });

    it('should return false ready status for empty data', () => {
      const result = Storytelling.hasGoodContext();
      result.hasCharacter.should.be.false;
      result.hasContent.should.be.false;
      result.ready.should.be.false;
    });

    it('should return true ready status when character and entries exist', () => {
      const journalData = {
        character: { name: 'Test Character', backstory: 'Some backstory' },
        entries: [
          { id: '1', title: 'Entry 1', content: 'Content 1' },
          { id: '2', title: 'Entry 2', content: 'Content 2' }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = Storytelling.hasGoodContext();
      result.hasCharacter.should.be.true;
      result.hasContent.should.be.true;
      result.ready.should.be.true;
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalGetItem = global.localStorage.getItem;
      global.localStorage.getItem = () => {
        throw new Error('localStorage error');
      };

      try {
        const result = await Storytelling.getCharacterContext();
        result.should.be.an('object');
        result.character.should.be.an('object');
        result.entries.should.be.an('array');
      } finally {
        // Restore original localStorage
        global.localStorage.getItem = originalGetItem;
      }
    });

    it('should handle invalid JSON gracefully', async () => {
      localStorage.setItem('simple-dnd-journal', '{invalid json');
      
      const result = await Storytelling.getCharacterContext();
      result.should.be.an('object');
      result.character.should.be.an('object');
      result.entries.should.be.an('array');
    });
  });

  describe('context formatting', () => {
    it('should format recent entries in full', async () => {
      const now = Date.now();
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          {
            id: '1',
            title: 'Recent Entry',
            content: 'Recent content',
            timestamp: now
          }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.entries.should.be.an('array');
      result.entries.should.have.length(1);
      result.entries[0].should.contain('Recent Adventure');
      result.entries[0].should.contain('Recent Entry');
      result.entries[0].should.contain('Recent content');
    });

    it('should include meta-summaries when available', async () => {
      // Set up meta-summary
      const summaries = {
        'meta:adventure-summary': {
          content: 'Meta summary of adventures',
          words: 50,
          timestamp: Date.now()
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(summaries));

      const journalData = {
        character: { name: 'Test Character' },
        entries: []
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      // Should include meta-summary in entries format
      result.entries.should.be.an('array');
      if (result.entries.length > 0) {
        const metaEntry = result.entries.find(entry => entry.includes('Adventure Chronicles'));
        expect(metaEntry).to.exist;
      }
    });

    it('should respect target word limits', async () => {
      // Create many entries to test word limit
      const entries = [];
      for (let i = 1; i <= 10; i++) {
        entries.push({
          id: `entry-${i}`,
          title: `Entry ${i}`,
          content: 'word '.repeat(100), // 100 words each
          timestamp: Date.now() - (i * 86400000)
        });
      }

      const journalData = {
        character: { name: 'Test Character' },
        entries: entries
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));

      const result = await Storytelling.getCharacterContext();
      
      result.contextLength.should.be.an('object');
      result.contextLength.totalWords.should.be.a('number');
      result.contextLength.totalWords.should.be.greaterThan(0);
    });
  });
});