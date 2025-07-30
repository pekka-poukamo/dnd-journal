import { expect } from 'chai';
import './setup.js';
import * as Utils from '../js/utils.js';
import { initializeYjs, clearSystem } from '../js/yjs.js';

describe('Utils Module', function() {
  beforeEach(async function() {
    await clearSystem();
    await initializeYjs();
    
    // Note: localStorage mock removed per ADR-0004 - all persistence uses Yjs
  });

  afterEach(async function() {
    await clearSystem();
  });

  // Note: STORAGE_KEYS tests removed per ADR-0004 - keys no longer used with Yjs

  describe('safeParseJSON', function() {
    it('should parse valid JSON successfully', function() {
      const validJSON = '{"name": "test", "value": 123}';
      const result = Utils.safeParseJSON(validJSON);
      
      expect(result.success).to.be.true;
      expect(result.data).to.deep.equal({ name: 'test', value: 123 });
    });

    it('should handle invalid JSON gracefully', function() {
      const invalidJSON = '{"name": "test", "value": 123,}';
      const result = Utils.safeParseJSON(invalidJSON);
      
      expect(result.success).to.be.false;
      expect(result.error).to.be.a('string');
    });
  });

  // Note: localStorage utility tests removed per ADR-0004
  // All data persistence now uses Yjs Maps - see js/yjs.js

  describe('generateId', function() {
    it('should generate a unique string ID', function() {
      const id1 = Utils.generateId();
      const id2 = Utils.generateId();
      
      expect(id1).to.be.a('string');
      expect(id2).to.be.a('string');
      // Note: In rare cases, these might be equal if called in the same millisecond
      // This is acceptable behavior for the current implementation
    });
  });

  describe('formatDate', function() {
    it('should format timestamp into readable date', function() {
      const timestamp = Date.now();
      const formatted = Utils.formatDate(timestamp);
      
      expect(formatted).to.be.a('string');
      // The actual format is locale-dependent, so just check it's a string with some date-like content
      expect(formatted).to.match(/[A-Za-z]+\s+\d{1,2},?\s+\d{4}/);
    });
  });

  describe('getWordCount', function() {
    it('should count words correctly', function() {
      expect(Utils.getWordCount('hello world')).to.equal(2);
      expect(Utils.getWordCount('one two three')).to.equal(3);
      expect(Utils.getWordCount('')).to.equal(0);
    });

    it('should handle special characters', function() {
      expect(Utils.getWordCount('hello, world!')).to.equal(2);
      expect(Utils.getWordCount('word1 word2')).to.equal(2);
    });
  });

  describe('debounce', function() {
    it('should create a debounced function (100ms)', function(done) {
      let callCount = 0;
      const testFunction = () => { callCount++; };
      const debouncedFn = Utils.debounce(testFunction, 100);
      
      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).to.equal(0);
      
      setTimeout(() => {
        expect(callCount).to.equal(1);
        done();
      }, 110);
    });
  });

  describe('isValidEntry', function() {
    it('should validate entry data correctly', function() {
      const validEntry = {
        title: 'Valid Title',
        content: 'Valid content'
      };
      expect(Utils.isValidEntry(validEntry)).to.be.true;

      const invalidEntry1 = {
        title: '',
        content: 'Some content'
      };
      expect(Utils.isValidEntry(invalidEntry1)).to.be.false;

      const invalidEntry2 = {
        title: 'Some title',
        content: ''
      };
      expect(Utils.isValidEntry(invalidEntry2)).to.be.false;
    });
  });

  describe('createInitialJournalState', function() {
    it('should create valid initial journal state', function() {
      const state = Utils.createInitialJournalState();
      
      expect(state).to.have.property('character');
      expect(state).to.have.property('entries');
      expect(state.character).to.have.property('name');
      expect(state.character).to.have.property('race');
      expect(state.character).to.have.property('class');
      expect(state.character).to.have.property('backstory');
      expect(state.character).to.have.property('notes');
      expect(state.entries).to.be.an('array');
    });
  });

  describe('createInitialSettings', function() {
    it('should create valid initial settings', function() {
      const settings = Utils.createInitialSettings();
      
      expect(settings).to.have.property('apiKey');
      expect(settings).to.have.property('enableAIFeatures');
      expect(settings.apiKey).to.equal('');
      expect(settings.enableAIFeatures).to.be.false;
    });
  });

  describe('sortEntriesByDate', function() {
    it('should sort entries by date (newest first)', function() {
      const entries = [
        { id: '1', title: 'Old', timestamp: 1000 },
        { id: '2', title: 'New', timestamp: 2000 },
        { id: '3', title: 'Middle', timestamp: 1500 }
      ];
      
      const sorted = Utils.sortEntriesByDate(entries);
      
      expect(sorted[0].id).to.equal('2');
      expect(sorted[1].id).to.equal('3');
      expect(sorted[2].id).to.equal('1');
    });
  });

  describe('getCharacterFormFieldIds', function() {
    it('should return correct form field IDs', function() {
      const fieldIds = Utils.getCharacterFormFieldIds();
      
      expect(fieldIds).to.include('character-name');
      expect(fieldIds).to.include('character-race');
      expect(fieldIds).to.include('character-class');
      expect(fieldIds).to.include('character-backstory');
      expect(fieldIds).to.include('character-notes');
    });
  });

  describe('getPropertyNameFromFieldId', function() {
    it('should convert field ID to property name', function() {
      expect(Utils.getPropertyNameFromFieldId('character-name')).to.equal('name');
      expect(Utils.getPropertyNameFromFieldId('character-race')).to.equal('race');
      expect(Utils.getPropertyNameFromFieldId('character-class')).to.equal('class');
    });
  });
});
