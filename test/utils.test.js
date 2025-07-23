const { expect } = require('chai');
require('./setup');

// Load the utils module
const Utils = require('../js/utils');

describe('Utils Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
  });

  describe('STORAGE_KEYS', () => {
    it('should contain all required storage keys', () => {
      expect(Utils.STORAGE_KEYS).to.have.property('JOURNAL', 'simple-dnd-journal');
      expect(Utils.STORAGE_KEYS).to.have.property('SETTINGS', 'simple-dnd-journal-settings');
      expect(Utils.STORAGE_KEYS).to.have.property('SUMMARIES', 'simple-dnd-journal-summaries');
      expect(Utils.STORAGE_KEYS).to.have.property('META_SUMMARIES', 'simple-dnd-journal-meta-summaries');
    });
  });

  describe('safeParseJSON', () => {
    it('should parse valid JSON successfully', () => {
      const validJson = '{"test": "value"}';
      const result = Utils.safeParseJSON(validJson);
      
      expect(result.success).to.be.true;
      expect(result.data).to.deep.equal({ test: 'value' });
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'invalid json';
      const result = Utils.safeParseJSON(invalidJson);
      
      expect(result.success).to.be.false;
      expect(result.error).to.be.a('string');
    });
  });

  describe('safeGetFromStorage', () => {
    it('should return data when key exists', () => {
      const testData = { test: 'value' };
      global.localStorage.setItem('test-key', JSON.stringify(testData));
      
      const result = Utils.safeGetFromStorage('test-key');
      
      expect(result.success).to.be.true;
      expect(result.data).to.deep.equal(testData);
    });

    it('should return null when key does not exist', () => {
      const result = Utils.safeGetFromStorage('nonexistent-key');
      
      expect(result.success).to.be.true;
      expect(result.data).to.be.null;
    });

    it('should handle corrupted data gracefully', () => {
      global.localStorage.setItem('test-key', 'invalid json');
      
      const result = Utils.safeGetFromStorage('test-key');
      
      expect(result.success).to.be.false;
      expect(result.error).to.be.a('string');
    });
  });

  describe('safeSetToStorage', () => {
    it('should save data successfully', () => {
      const testData = { test: 'value' };
      
      const result = Utils.safeSetToStorage('test-key', testData);
      
      expect(result.success).to.be.true;
      
      const stored = JSON.parse(global.localStorage.getItem('test-key'));
      expect(stored).to.deep.equal(testData);
    });
  });

  describe('loadDataWithFallback', () => {
    it('should return stored data when available', () => {
      const testData = { test: 'value' };
      global.localStorage.setItem('test-key', JSON.stringify(testData));
      
      const result = Utils.loadDataWithFallback('test-key', { fallback: 'data' });
      
      expect(result).to.deep.equal(testData);
    });

    it('should return fallback when no data exists', () => {
      const fallbackData = { fallback: 'data' };
      
      const result = Utils.loadDataWithFallback('nonexistent-key', fallbackData);
      
      expect(result).to.deep.equal(fallbackData);
    });

    it('should return fallback when data is corrupted', () => {
      global.localStorage.setItem('test-key', 'invalid json');
      const fallbackData = { fallback: 'data' };
      
      const result = Utils.loadDataWithFallback('test-key', fallbackData);
      
      expect(result).to.deep.equal(fallbackData);
    });
  });

  describe('generateId', () => {
    it('should generate a unique string ID', () => {
      const id1 = Utils.generateId();
      // Small delay to ensure different timestamps
      const start = Date.now();
      while (Date.now() === start) {
        // wait for next millisecond
      }
      const id2 = Utils.generateId();
      
      expect(id1).to.be.a('string');
      expect(id2).to.be.a('string');
      expect(id1).to.not.equal(id2);
    });
  });

  describe('formatDate', () => {
    it('should format timestamp into readable date', () => {
      const timestamp = 1640995200000; // Jan 1, 2022
      const formatted = Utils.formatDate(timestamp);
      
      expect(formatted).to.be.a('string');
      expect(formatted).to.include('2022');
    });
  });

  describe('getWordCount', () => {
    it('should count words correctly', () => {
      expect(Utils.getWordCount('hello world')).to.equal(2);
      expect(Utils.getWordCount('  hello   world  ')).to.equal(2);
      expect(Utils.getWordCount('')).to.equal(0);
      expect(Utils.getWordCount('   ')).to.equal(0);
      expect(Utils.getWordCount('single')).to.equal(1);
    });

    it('should handle special characters', () => {
      expect(Utils.getWordCount('hello, world!')).to.equal(2);
      expect(Utils.getWordCount('one-two three')).to.equal(2);
    });
  });

  describe('debounce', () => {
    it('should create a debounced function', (done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = Utils.debounce(fn, 50);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not have called yet
      expect(callCount).to.equal(0);
      
      setTimeout(() => {
        // Should have called once after delay
        expect(callCount).to.equal(1);
        done();
      }, 60);
    });
  });

  describe('isValidEntry', () => {
    it('should validate entry data correctly', () => {
      expect(Utils.isValidEntry({ title: 'Test', content: 'Content' })).to.be.true;
      expect(Utils.isValidEntry({ title: '', content: 'Content' })).to.be.false;
      expect(Utils.isValidEntry({ title: 'Test', content: '' })).to.be.false;
      expect(Utils.isValidEntry({ title: '  ', content: 'Content' })).to.be.false;
      expect(Utils.isValidEntry({ title: 'Test', content: '  ' })).to.be.false;
    });
  });

  describe('createInitialJournalState', () => {
    it('should create valid initial journal state', () => {
      const state = Utils.createInitialJournalState();
      
      expect(state).to.have.property('character');
      expect(state).to.have.property('entries');
      expect(state.character).to.have.property('name', '');
      expect(state.character).to.have.property('race', '');
      expect(state.character).to.have.property('class', '');
      expect(state.entries).to.be.an('array').that.is.empty;
    });
  });

  describe('createInitialSettings', () => {
    it('should create valid initial settings', () => {
      const settings = Utils.createInitialSettings();
      
      expect(settings).to.have.property('apiKey', '');
      expect(settings).to.have.property('enableAIFeatures', false);
    });
  });

  describe('sortEntriesByDate', () => {
    it('should sort entries by date (newest first)', () => {
      const entries = [
        { id: '1', timestamp: 1000 },
        { id: '2', timestamp: 3000 },
        { id: '3', timestamp: 2000 }
      ];
      
      const sorted = Utils.sortEntriesByDate(entries);
      
      expect(sorted).to.have.length(3);
      expect(sorted[0].id).to.equal('2');
      expect(sorted[1].id).to.equal('3');
      expect(sorted[2].id).to.equal('1');
      
      // Should not mutate original array
      expect(entries[0].id).to.equal('1');
    });
  });

  describe('getCharacterFormFieldIds', () => {
    it('should return correct form field IDs', () => {
      const ids = Utils.getCharacterFormFieldIds();
      
      expect(ids).to.include('character-name');
      expect(ids).to.include('character-race');
      expect(ids).to.include('character-class');
      expect(ids).to.include('character-backstory');
      expect(ids).to.include('character-notes');
    });
  });

  describe('getPropertyNameFromFieldId', () => {
    it('should convert field ID to property name', () => {
      expect(Utils.getPropertyNameFromFieldId('character-name')).to.equal('name');
      expect(Utils.getPropertyNameFromFieldId('character-race')).to.equal('race');
      expect(Utils.getPropertyNameFromFieldId('character-class')).to.equal('class');
    });
  });
});
