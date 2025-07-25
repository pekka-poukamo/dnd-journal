import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';

describe('D&D Journal App', function() {
  beforeEach(function() {
    // Reset localStorage before each test
    global.resetLocalStorage();
    
    // Clear DOM and add necessary elements
    document.body.innerHTML = `
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <button id="add-entry-btn">Add Entry</button>
      <div id="entries-list"></div>
      <div id="character-summary"></div>
      <div id="ai-prompt-text"></div>
      <button id="regenerate-prompt-btn">Regenerate</button>
    `;
    
    // Reset app state to initial values
    App.resetState();
  });

  afterEach(function() {
    // Reset localStorage after each test
    global.resetLocalStorage();
  });

  describe('State Management', function() {
    it('should initialize with default state', function() {
      expect(App.state).to.be.an('object');
      expect(App.state.character).to.be.an('object');
      expect(App.state.entries).to.be.an('array');
      expect(App.state.character.name).to.equal('');
      expect(App.state.entries).to.have.length(0);
    });

    it('should save and load data from localStorage', function() {
      // Set up test data
      App.state.character = {
        name: 'Test Character',
        race: 'Human',
        class: 'Fighter'
      };
      App.state.entries.push({
        id: '1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });

      // Save data
      const saveResult = App.saveData();
      expect(saveResult.success).to.be.true;

      // Load data
      App.loadData();
      expect(App.state.character.name).to.equal('Test Character');
      expect(App.state.entries).to.have.length(1);
    });
  });

  describe('Entry Management', function() {
    it('should add new entries', function() {
      const titleInput = document.getElementById('entry-title');
      const contentTextarea = document.getElementById('entry-content');
      
      titleInput.value = 'Test Entry';
      contentTextarea.value = 'Test content';

      // Add entry
      App.addEntry();

      expect(App.state.entries).to.have.length(1);
      expect(App.state.entries[0].title).to.equal('Test Entry');
      expect(App.state.entries[0].content).to.equal('Test content');
    });

    it('should validate entry data', function() {
      const titleInput = document.getElementById('entry-title');
      const contentTextarea = document.getElementById('entry-content');
      
      // Test empty title
      titleInput.value = '';
      contentTextarea.value = 'Some content';
      App.addEntry();
      expect(App.state.entries).to.have.length(0);

      // Test empty content
      titleInput.value = 'Some title';
      contentTextarea.value = '';
      App.addEntry();
      expect(App.state.entries).to.have.length(0);
    });

    it('should render entries correctly', function() {
      App.state.entries.push({
        id: '1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });

      App.renderEntries();

      const entriesList = document.getElementById('entries-list');
      expect(entriesList.children.length).to.be.greaterThan(0);
    });
  });

  describe('Markdown Parsing', function() {
    it('should parse bold text', function() {
      const result = App.parseMarkdown('This is **bold** text');
      expect(result).to.include('<strong>bold</strong>');
    });

    it('should parse italic text', function() {
      const result = App.parseMarkdown('This is *italic* text');
      expect(result).to.include('<em>italic</em>');
    });

    it('should parse code text', function() {
      const result = App.parseMarkdown('This is `code` text');
      expect(result).to.include('<code>code</code>');
    });

    it('should parse unordered lists', function() {
      const result = App.parseMarkdown('- Item 1\n- Item 2');
      expect(result).to.include('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('should parse ordered lists', function() {
      const result = App.parseMarkdown('1. Item 1\n2. Item 2');
      expect(result).to.include('<ol><li>Item 1</li><li>Item 2</li></ol>');
    });

    it('should handle empty input', function() {
      const result = App.parseMarkdown('');
      expect(result).to.equal('');
    });

    it('should handle null input', function() {
      const result = App.parseMarkdown(null);
      expect(result).to.equal('');
    });
  });

  describe('Character Summary', function() {
    it('should create character summary for empty character', function() {
      const summary = App.createCharacterSummary({});
      expect(summary.name).to.equal('No Character');
      expect(summary.details).to.include('Create a character');
    });

    it('should create character summary for complete character', function() {
      const character = {
        name: 'Gandalf',
        race: 'Wizard',
        class: 'Mage',
        backstory: 'A powerful wizard',
        notes: 'Carries a staff'
      };

      const summary = App.createCharacterSummary(character);
      expect(summary.name).to.equal('Gandalf');
      expect(summary.details).to.include('Wizard');
      expect(summary.details).to.include('Mage');
    });
  });

  describe('AI Integration', function() {
    it('should generate AI prompts', function() {
      App.state.character = {
        name: 'Test Character',
        race: 'Human',
        class: 'Fighter'
      };

      // This should not throw
      expect(() => App.displayAIPrompt()).to.not.throw();
    });

    it('should get entry summaries', function() {
      App.state.entries.push({
        id: '1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });

      const summary = App.getEntrySummary('1');
      // Should return null since AI is not available in test environment
      expect(summary).to.be.null;
    });
  });

  describe('Form Handling', function() {
    it('should get form data correctly', function() {
      const titleInput = document.getElementById('entry-title');
      const contentTextarea = document.getElementById('entry-content');
      
      titleInput.value = 'Test Title';
      contentTextarea.value = 'Test Content';

      const formData = App.getFormData();
      expect(formData.title).to.equal('Test Title');
      expect(formData.content).to.equal('Test Content');
    });

    it('should clear entry form', function() {
      const titleInput = document.getElementById('entry-title');
      const contentTextarea = document.getElementById('entry-content');
      
      titleInput.value = 'Test Title';
      contentTextarea.value = 'Test Content';

      App.clearEntryForm();
      expect(titleInput.value).to.equal('');
      expect(contentTextarea.value).to.equal('');
    });
  });

  describe('Edit Mode', function() {
    it('should enable edit mode for entries', function() {
      App.state.entries.push({
        id: '1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      });

      App.renderEntries();

      const entryDiv = document.querySelector('.entry-card');
      expect(entryDiv).to.exist;

      App.enableEditMode(entryDiv, App.state.entries[0]);

      const editForm = entryDiv.querySelector('.edit-form');
      expect(editForm).to.exist;
    });

    it('should save edits correctly', function() {
      App.state.entries.push({
        id: '1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      });

      App.renderEntries();

      const entryDiv = document.querySelector('.entry-card');
      App.enableEditMode(entryDiv, App.state.entries[0]);

      App.saveEdit(entryDiv, App.state.entries[0], 'Updated Title', 'Updated content');

      expect(App.state.entries[0].title).to.equal('Updated Title');
      expect(App.state.entries[0].content).to.equal('Updated content');
    });

    it('should cancel edits correctly', function() {
      App.state.entries.push({
        id: '1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      });

      App.renderEntries();

      const entryDiv = document.querySelector('.entry-card');
      App.enableEditMode(entryDiv, App.state.entries[0]);

      App.cancelEdit(entryDiv, App.state.entries[0]);

      const editForm = entryDiv.querySelector('.edit-form');
      expect(editForm).to.not.exist;
    });
  });
});
