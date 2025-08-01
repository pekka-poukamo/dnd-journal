import { expect } from 'chai';
import './setup.js';
import * as Utils from '../js/utils.js';
import * as YjsModule from '../js/yjs.js';

describe('Utils Module', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    
    // Initialize Y.js for tests
    await YjsModule.initYjs();
  });

  afterEach(function() {
    // Clean up after each test
    YjsModule.resetYjs();
  });

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

  describe('generateId', function() {
    it('should generate string identifiers', function() {
      const id1 = Utils.generateId();
      const id2 = Utils.generateId();
      
      expect(id1).to.be.a('string');
      expect(id2).to.be.a('string');
      expect(id1.length).to.be.greaterThan(0);
      // Note: IDs might be the same if called in same millisecond
    });
  });

  describe('formatDate', function() {
    it('should format timestamps as readable dates', function() {
      const timestamp = 1642723200000; // January 21, 2022
      const formatted = Utils.formatDate(timestamp);
      
      expect(formatted).to.be.a('string');
      expect(formatted).to.include('2022');
    });

    it('should handle current timestamp', function() {
      const now = Date.now();
      const formatted = Utils.formatDate(now);
      
      expect(formatted).to.be.a('string');
      expect(formatted.length).to.be.greaterThan(0);
    });

    it('should handle Date objects', function() {
      const date = new Date(2022, 0, 21); // January 21, 2022
      const formatted = Utils.formatDate(date);
      
      expect(formatted).to.be.a('string');
      expect(formatted).to.include('2022');
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
    it('should delay function execution', function(done) {
      let callCount = 0;
      const debouncedFn = Utils.debounce(() => {
        callCount++;
      }, 100);
      
      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not have executed yet
      expect(callCount).to.equal(0);
      
      // Wait for debounce delay
      setTimeout(() => {
        expect(callCount).to.equal(1);
        done();
      }, 150);
    });

    it('should pass arguments to debounced function', function(done) {
      let capturedArgs = null;
      const debouncedFn = Utils.debounce((...args) => {
        capturedArgs = args;
      }, 50);
      
      debouncedFn('test', 123, { key: 'value' });
      
      setTimeout(() => {
        expect(capturedArgs).to.deep.equal(['test', 123, { key: 'value' }]);
        done();
      }, 100);
    });
  });

  describe('isValidEntry', function() {
    it('should validate complete entries', function() {
      const validEntry = {
        title: 'Test Entry',
        content: 'This is test content'
      };
      
      expect(Utils.isValidEntry(validEntry)).to.be.true;
    });

    it('should reject entries with empty title or content', function() {
      const invalidEntries = [
        { title: '', content: 'Content' },
        { title: 'Title', content: '' },
        { title: '   ', content: 'Content' },
        { title: 'Title', content: '   ' }
      ];
      
      invalidEntries.forEach(entry => {
        expect(Utils.isValidEntry(entry)).to.be.false;
      });
    });

    it('should handle entries with valid whitespace-trimmed content', function() {
      const validEntry = {
        title: '  Valid Title  ',
        content: '  Valid content  '
      };
      
      expect(Utils.isValidEntry(validEntry)).to.be.true;
    });
  });

  describe('createInitialJournalState', function() {
    it('should create valid initial journal state', function() {
      const state = Utils.createInitialJournalState();
      
      expect(state).to.have.property('character');
      expect(state).to.have.property('entries');
      expect(state.character).to.have.property('name', '');
      expect(state.character).to.have.property('race', '');
      expect(state.character).to.have.property('class', '');
      expect(state.character).to.have.property('backstory', '');
      expect(state.character).to.have.property('notes', '');
      expect(state.entries).to.be.an('array');
      expect(state.entries).to.have.length(0);
    });
  });

  describe('createInitialSettings', function() {
    it('should create valid initial settings', function() {
      const settings = Utils.createInitialSettings();
      
      expect(settings).to.have.property('apiKey', '');
      expect(settings).to.have.property('enableAIFeatures', false);
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

    it('should not mutate original array', function() {
      const entries = [
        { id: '1', timestamp: 1000 },
        { id: '2', timestamp: 2000 }
      ];
      const original = [...entries];
      
      Utils.sortEntriesByDate(entries);
      
      expect(entries).to.deep.equal(original);
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
      expect(Utils.getPropertyNameFromFieldId('character-backstory')).to.equal('backstory');
      expect(Utils.getPropertyNameFromFieldId('character-notes')).to.equal('notes');
    });
  });

  describe('parseMarkdown', function() {
    it('should convert markdown to HTML', function() {
      const markdown = '# Header\n\nThis is **bold** text.';
      const html = Utils.parseMarkdown(markdown);
      
      expect(html).to.include('<h1>Header</h1>');
      expect(html).to.include('<strong>bold</strong>');
    });

    it('should handle empty content', function() {
      const html = Utils.parseMarkdown('');
      expect(html).to.equal('');
    });

    it('should handle null content', function() {
      const html = Utils.parseMarkdown(null);
      expect(html).to.equal('');
    });

    it('should handle basic formatting', function() {
      const markdown = 'This is **bold** and *italic* text with `code`.';
      const html = Utils.parseMarkdown(markdown);
      
      expect(html).to.include('<strong>bold</strong>');
      expect(html).to.include('<em>italic</em>');
      expect(html).to.include('<code>code</code>');
    });

    it('should handle lists', function() {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const html = Utils.parseMarkdown(markdown);
      
      expect(html).to.include('<ul>');
      expect(html).to.include('<li>Item 1</li>');
      expect(html).to.include('<li>Item 2</li>');
      expect(html).to.include('<li>Item 3</li>');
    });

    it('should handle headers', function() {
      const markdown = '# H1\n## H2\n### H3';
      const html = Utils.parseMarkdown(markdown);
      
      expect(html).to.include('<h1>H1</h1>');
      expect(html).to.include('<h2>H2</h2>');
      expect(html).to.include('<h3>H3</h3>');
    });

    it('should handle paragraphs and line breaks', function() {
      const markdown = 'Paragraph 1\n\nParagraph 2\nLine break';
      const html = Utils.parseMarkdown(markdown);
      
      expect(html).to.include('<p>');
      expect(html).to.include('</p>');
      expect(html).to.include('<br>');
    });
  });

  describe('formatAIPromptText', function() {
    it('should convert line breaks to <br> tags', function() {
      const text = 'Line 1\nLine 2\nLine 3';
      const html = Utils.formatAIPromptText(text);
      
      expect(html).to.equal('Line 1<br>Line 2<br>Line 3');
    });

    it('should convert double line breaks to double <br> tags', function() {
      const text = 'Paragraph 1\n\nParagraph 2';
      const html = Utils.formatAIPromptText(text);
      
      expect(html).to.equal('Paragraph 1<br><br>Paragraph 2');
    });

    it('should format numbered list items', function() {
      const text = '1. First question\n2. Second question\n3. Third question';
      const html = Utils.formatAIPromptText(text);
      
      expect(html).to.include('<strong>1. </strong>First question');
      expect(html).to.include('<strong>2. </strong>Second question');
      expect(html).to.include('<strong>3. </strong>Third question');
    });

    it('should handle empty content', function() {
      const html = Utils.formatAIPromptText('');
      expect(html).to.equal('');
    });

    it('should handle null content', function() {
      const html = Utils.formatAIPromptText(null);
      expect(html).to.equal('');
    });

    it('should trim whitespace', function() {
      const text = '  Some content with spaces  ';
      const html = Utils.formatAIPromptText(text);
      
      expect(html).to.equal('Some content with spaces');
    });

    it('should handle complex formatting', function() {
      const text = '1. What is your character\'s greatest fear?\n\n2. How has their past shaped them?\n\n3. What drives them forward?';
      const html = Utils.formatAIPromptText(text);
      
      expect(html).to.include('<strong>1. </strong>What is your character\'s greatest fear?');
      expect(html).to.include('<br><br>');
      expect(html).to.include('<strong>2. </strong>How has their past shaped them?');
      expect(html).to.include('<strong>3. </strong>What drives them forward?');
    });
  });
});
