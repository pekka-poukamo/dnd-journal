const { expect } = require('chai');
const {
  loadData,
  saveData,
  generateId,
  formatDate,
  addEntry,
  updateCharacter,
  getEntries,
  getCharacter,
  clearData,
  getEntryById,
  deleteEntry,
  STORAGE_KEY
} = require('../js/journal-core.js');

describe('D&D Journal Core', () => {
  let mockStorage;

  beforeEach(() => {
    // Create mock localStorage
    mockStorage = {
      data: {},
      getItem: function(key) {
        return this.data[key] || null;
      },
      setItem: function(key, value) {
        this.data[key] = value;
      },
      removeItem: function(key) {
        delete this.data[key];
      }
    };

    // Clear state before each test
    clearData(mockStorage);
  });

  describe('generateId', () => {
    it('should generate a string ID', () => {
      const id = generateId();
      expect(id).to.be.a('string');
      expect(id).to.not.be.empty;
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).to.not.equal(id2);
      expect(id1).to.match(/^\d+-[a-z0-9]+$/);
      expect(id2).to.match(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('formatDate', () => {
    it('should format timestamp correctly', () => {
      const timestamp = Date.now();
      const formatted = formatDate(timestamp);
      expect(formatted).to.be.a('string');
      expect(formatted).to.match(/^\w{3}\s\d{1,2},\s\d{4},\s\d{1,2}:\d{2}\s[AP]M$/);
    });

    it('should handle different timestamps', () => {
      const date1 = new Date('2023-01-15T10:30:00');
      const date2 = new Date('2023-12-25T23:45:00');
      
      const formatted1 = formatDate(date1.getTime());
      const formatted2 = formatDate(date2.getTime());
      
      expect(formatted1).to.not.equal(formatted2);
    });
  });

  describe('addEntry', () => {
    it('should add a valid entry', () => {
      const entry = addEntry('Test Title', 'Test Content');
      
      expect(entry).to.not.be.null;
      expect(entry.title).to.equal('Test Title');
      expect(entry.content).to.equal('Test Content');
      expect(entry.id).to.be.a('string');
      expect(entry.timestamp).to.be.a('number');
    });

    it('should not add entry with empty title', () => {
      const entry = addEntry('', 'Test Content');
      expect(entry).to.be.null;
    });

    it('should not add entry with empty content', () => {
      const entry = addEntry('Test Title', '');
      expect(entry).to.be.null;
    });

    it('should trim whitespace from title and content', () => {
      const entry = addEntry('  Test Title  ', '  Test Content  ');
      
      expect(entry.title).to.equal('Test Title');
      expect(entry.content).to.equal('Test Content');
    });

    it('should handle optional image parameter', () => {
      const entry = addEntry('Test Title', 'Test Content', 'test.jpg');
      expect(entry.image).to.equal('test.jpg');
    });

    it('should handle empty image parameter', () => {
      const entry = addEntry('Test Title', 'Test Content');
      expect(entry.image).to.equal('');
    });
  });

  describe('updateCharacter', () => {
    it('should update character with valid data', () => {
      const character = updateCharacter('Gandalf', 'Wizard', 'Mage');
      
      expect(character.name).to.equal('Gandalf');
      expect(character.race).to.equal('Wizard');
      expect(character.class).to.equal('Mage');
    });

    it('should handle empty parameters', () => {
      const character = updateCharacter('', '', '');
      
      expect(character.name).to.equal('');
      expect(character.race).to.equal('');
      expect(character.class).to.equal('');
    });

    it('should trim whitespace from inputs', () => {
      const character = updateCharacter('  Gandalf  ', '  Wizard  ', '  Mage  ');
      
      expect(character.name).to.equal('Gandalf');
      expect(character.race).to.equal('Wizard');
      expect(character.class).to.equal('Mage');
    });

    it('should handle null/undefined parameters', () => {
      const character = updateCharacter(null, undefined, '');
      
      expect(character.name).to.equal('');
      expect(character.race).to.equal('');
      expect(character.class).to.equal('');
    });
  });

  describe('getEntries', () => {
    it('should return empty array when no entries exist', () => {
      const entries = getEntries();
      expect(entries).to.be.an('array');
      expect(entries).to.be.empty;
    });

    it('should return entries sorted by newest first', () => {
      // Clear any existing entries
      clearData(mockStorage);
      
      // Add entries with forced timestamps
      const entry1 = addEntry('First Entry', 'Content 1');
      const entry2 = addEntry('Second Entry', 'Content 2');
      const entry3 = addEntry('Third Entry', 'Content 3');
      
      // Manually set timestamps to ensure proper order
      entry1.timestamp = Date.now() - 2000;
      entry2.timestamp = Date.now() - 1000;
      entry3.timestamp = Date.now();
      
      const entries = getEntries();
      
      expect(entries).to.have.length(3);
      expect(entries[0].title).to.equal('Third Entry');
      expect(entries[1].title).to.equal('Second Entry');
      expect(entries[2].title).to.equal('First Entry');
    });
  });

  describe('getCharacter', () => {
    it('should return character object', () => {
      updateCharacter('Gandalf', 'Wizard', 'Mage');
      const character = getCharacter();
      
      expect(character).to.be.an('object');
      expect(character.name).to.equal('Gandalf');
      expect(character.race).to.equal('Wizard');
      expect(character.class).to.equal('Mage');
    });

    it('should return empty character by default', () => {
      const character = getCharacter();
      
      expect(character.name).to.equal('');
      expect(character.race).to.equal('');
      expect(character.class).to.equal('');
    });
  });

  describe('getEntryById', () => {
    it('should return entry when found', () => {
      const entry = addEntry('Test Entry', 'Test Content');
      const found = getEntryById(entry.id);
      
      expect(found).to.deep.equal(entry);
    });

    it('should return undefined when entry not found', () => {
      const found = getEntryById('nonexistent-id');
      expect(found).to.be.undefined;
    });
  });

  describe('deleteEntry', () => {
    it('should delete entry when found', () => {
      const entry = addEntry('Test Entry', 'Test Content');
      const result = deleteEntry(entry.id);
      
      expect(result).to.be.true;
      expect(getEntries()).to.be.empty;
    });

    it('should return false when entry not found', () => {
      const result = deleteEntry('nonexistent-id');
      expect(result).to.be.false;
    });
  });

  describe('saveData and loadData', () => {
    it('should save and load data correctly', () => {
      // Clear any existing data
      clearData(mockStorage);
      
      // Add some test data
      updateCharacter('Gandalf', 'Wizard', 'Mage');
      addEntry('Test Entry', 'Test Content');
      
      // Save data
      const saveResult = saveData(mockStorage);
      expect(saveResult).to.be.true;
      
      // Clear state but keep data in storage
      state = {
        character: { name: '', race: '', class: '' },
        entries: []
      };
      expect(state.character.name).to.equal('');
      expect(state.entries).to.have.length(0);
      
      // Load data
      const loadedState = loadData(mockStorage);
      
      expect(loadedState.character.name).to.equal('Gandalf');
      expect(loadedState.entries).to.have.length(1);
      expect(loadedState.entries[0].title).to.equal('Test Entry');
    });

    it('should handle invalid JSON in storage', () => {
      mockStorage.setItem(STORAGE_KEY, 'invalid json');
      
      const loadedState = loadData(mockStorage);
      expect(loadedState).to.be.an('object');
    });
  });

  describe('clearData', () => {
    it('should clear all data', () => {
      // Add some test data
      updateCharacter('Gandalf', 'Wizard', 'Mage');
      addEntry('Test Entry', 'Test Content');
      
      // Clear data
      clearData(mockStorage);
      
      // Verify data is cleared
      const character = getCharacter();
      const entries = getEntries();
      
      expect(character.name).to.equal('');
      expect(character.race).to.equal('');
      expect(character.class).to.equal('');
      expect(entries).to.be.empty;
    });
  });
});

  describe('Edge Cases and Integration', () => {
    beforeEach(() => {
      // Create mock localStorage
      mockStorage = {
        data: {},
        getItem: function(key) {
          return this.data[key] || null;
        },
        setItem: function(key, value) {
          this.data[key] = value;
        },
        removeItem: function(key) {
          delete this.data[key];
        }
      };

      // Clear state before each test
      clearData(mockStorage);
    });

    it('should handle multiple entries with same timestamp', () => {
      clearData(mockStorage);
      
      const entry1 = addEntry('Entry 1', 'Content 1');
      const entry2 = addEntry('Entry 2', 'Content 2');
      
      // Force same timestamp
      entry1.timestamp = entry2.timestamp;
      
      const entries = getEntries();
      expect(entries).to.have.length(2);
      // With same timestamp, order depends on array order (first added first)
      expect(entries[0].title).to.equal('Entry 1');
      expect(entries[1].title).to.equal('Entry 2');
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const entry = addEntry('Long Entry', longContent);
      
      expect(entry.content).to.equal(longContent);
      expect(entry.content.length).to.equal(10000);
    });

    it('should handle special characters in content', () => {
      const specialContent = '🎲⚔️🛡️✨ Test with emojis and special chars: !@#$%^&*()';
      const entry = addEntry('Special Entry', specialContent);
      
      expect(entry.content).to.equal(specialContent);
    });

    it('should handle empty storage gracefully', () => {
      clearData(mockStorage);
      const loadedState = loadData(mockStorage);
      
      expect(loadedState.character.name).to.equal('');
      expect(loadedState.entries).to.have.length(0);
    });

    it('should handle corrupted storage data', () => {
      mockStorage.setItem(STORAGE_KEY, '{"invalid": "json"');
      
      const loadedState = loadData(mockStorage);
      expect(loadedState).to.be.an('object');
      expect(loadedState.character).to.be.an('object');
      expect(loadedState.entries).to.be.an('array');
    });
  });
