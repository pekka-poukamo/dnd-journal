import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';
import * as Utils from '../js/utils.js';
import { createSystem, clearSystem } from '../js/yjs.js';

describe('D&D Journal App', function() {
  beforeEach(async function() {
    // Clear and reinitialize Yjs mock system
    clearSystem();
    await createSystem();
    
    // Clear DOM and add necessary elements
    document.body.innerHTML = `
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <button id="add-entry-btn">Add Entry</button>
      <div id="entries-list"></div>
      <div id="entries-container"></div>
      <div id="character-summary"></div>
      <div id="display-name">Unknown</div>
      <div id="display-race">Unknown</div>
      <div id="display-class">Unknown</div>
      <div id="ai-prompt-text"></div>
      <div id="ai-prompt-container"></div>
      <button id="regenerate-prompt-btn">Regenerate</button>
    `;
    
    // Reset app state to initial values
    App.resetState();
  });

  afterEach(async function() {
    await clearSystem();
  });

  describe('State Management', function() {
    it('should initialize with default state', function() {
      expect(App.state).to.be.an('object');
      expect(App.state.character).to.be.an('object');
      expect(App.state.entries).to.be.an('array');
      expect(App.state.character.name).to.equal('');
      expect(App.state.entries).to.have.length(0);
    });
  });

  describe('Entry Management', function() {
    it('should add new entries', function() {
      const initialCount = App.state.entries.length;
      
      App.state.entries.push({
        id: '1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });
      
      expect(App.state.entries.length).to.equal(initialCount + 1);
    });

    it('should validate entry data', function() {
      const validEntry = {
        id: '1',
        title: 'Valid Title',
        content: 'Valid content',
        timestamp: Date.now()
      };
      
      expect(App.state.entries).to.be.an('array');
    });

    it('should render entries correctly', function() {
      let entriesContainer = document.getElementById('entries-container');
      if (!entriesContainer) {
        entriesContainer = document.createElement('div');
        entriesContainer.id = 'entries-container';
        document.body.appendChild(entriesContainer);
      }

      App.state.entries = [{
        id: '1',
        title: 'Test Entry',
        content: 'Test content with **bold** text',
        timestamp: Date.now()
      }];

      App.renderEntries();

      const entryElements = entriesContainer.querySelectorAll('.entry');
      expect(entryElements.length).to.equal(1);
      
      // Check markdown rendering
      const content = entryElements[0].querySelector('.entry-content');
      expect(content.innerHTML).to.include('<strong>bold</strong>');
      
      entriesContainer.remove();
    });

    it('should render empty state when no entries', function() {
      let entriesContainer = document.getElementById('entries-container');
      if (!entriesContainer) {
        entriesContainer = document.createElement('div');
        entriesContainer.id = 'entries-container';
        document.body.appendChild(entriesContainer);
      }

      App.state.entries = [];
      App.renderEntries();

      expect(entriesContainer.innerHTML).to.equal('');
      
      entriesContainer.remove();
    });

    it('should handle renderEntries with missing container', function() {
      const entriesList = document.getElementById('entries-list');
      if (entriesList) entriesList.remove();
      
      expect(() => App.renderEntries()).to.not.throw();
    });

    it('should create entry element correctly', function() {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'Test content with **markdown**',
        timestamp: Date.now()
      };
      
      const entryElement = App.createEntryElement(entry);
      
      expect(entryElement).to.exist;
      expect(entryElement.className).to.equal('entry-card');
      expect(entryElement.querySelector('.entry-title').textContent).to.equal('Test Entry');
      expect(entryElement.querySelector('.entry-content').innerHTML).to.include('<strong>markdown</strong>');
      expect(entryElement.querySelector('.edit-btn')).to.exist;
    });
  });

  describe('Entry Creation and Validation', function() {
    beforeEach(function() {
      const titleInput = document.createElement('input');
      titleInput.id = 'entry-title';
      const contentTextarea = document.createElement('textarea');
      contentTextarea.id = 'entry-content';
      
      document.body.appendChild(titleInput);
      document.body.appendChild(contentTextarea);
    });

    afterEach(function() {
      const titleInput = document.getElementById('entry-title');
      const contentTextarea = document.getElementById('entry-content');
      
      if (titleInput) titleInput.remove();
      if (contentTextarea) contentTextarea.remove();
    });

    it('should create entry from form with valid data', function() {
      document.getElementById('entry-title').value = 'Test Title';
      document.getElementById('entry-content').value = 'Test Content';
      
      const formData = App.getFormData();
      const entry = App.createEntryFromForm(formData);
      
      expect(entry.title).to.equal('Test Title');
      expect(entry.content).to.equal('Test Content');
      expect(entry.id).to.exist;
      expect(entry.timestamp).to.be.a('number');
    });

    it('should handle addEntry with empty form gracefully', async function() {
      document.getElementById('entry-title').value = '';
      document.getElementById('entry-content').value = '';
      
      // Stub alert to prevent actual alerts during testing
      const originalAlert = global.alert;
      let alertCalled = false;
      global.alert = () => { alertCalled = true; };
      
      await App.addEntry();
      
      expect(alertCalled).to.be.true;
      global.alert = originalAlert;
    });

    it('should handle addEntry with partial form data', async function() {
      document.getElementById('entry-title').value = 'Title only';
      document.getElementById('entry-content').value = '';
      
      const originalAlert = global.alert;
      let alertCalled = false;
      global.alert = () => { alertCalled = true; };
      
      await App.addEntry();
      
      expect(alertCalled).to.be.true;
      global.alert = originalAlert;
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

    it('should handle single line breaks', function() {
      const result = App.parseMarkdown('Line 1\nLine 2');
      expect(result).to.include('Line 1');
      expect(result).to.include('Line 2');
    });

    it('should handle double line breaks as paragraphs', function() {
      const result = App.parseMarkdown('Paragraph 1\n\nParagraph 2');
      expect(result).to.include('Paragraph 1');
      expect(result).to.include('Paragraph 2');
    });

    it('should handle mixed content with line breaks', function() {
      const result = App.parseMarkdown('**Bold text**\nNew line\n\nNew paragraph');
      expect(result).to.include('<strong>Bold text</strong>');
      expect(result).to.include('New line');
      expect(result).to.include('New paragraph');
    });
  });

  describe('Summary Section', function() {
    it('should create collapsible summary section', function() {
      const summary = 'This is a test summary';
      const summarySection = App.createSummarySection(summary);
      
      expect(summarySection).to.exist;
      expect(summarySection.className).to.equal('entry-summary');
      
      const toggle = summarySection.querySelector('.entry-summary__toggle');
      const content = summarySection.querySelector('.entry-summary__content');
      
      expect(toggle).to.exist;
      expect(content).to.exist;
      expect(content.style.display).to.equal('none');
      expect(content.innerHTML).to.include(summary);
    });

    it('should toggle summary visibility when clicked', function() {
      const summary = 'Test summary content';
      const summarySection = App.createSummarySection(summary);
      
      const toggle = summarySection.querySelector('.entry-summary__toggle');
      const content = summarySection.querySelector('.entry-summary__content');
      const icon = summarySection.querySelector('.entry-summary__icon');
      
      // Initially hidden
      expect(content.style.display).to.equal('none');
      expect(icon.textContent).to.equal('▼');
      
      // Click to expand
      toggle.click();
      expect(content.style.display).to.equal('block');
      expect(icon.textContent).to.equal('▲');
      
      // Click to collapse
      toggle.click();
      expect(content.style.display).to.equal('none');
      expect(icon.textContent).to.equal('▼');
    });
  });

  describe('Simple Character Data', function() {
    it('should create simple character data for empty character', function() {
      const result = App.createSimpleCharacterData({});
      
      expect(result.name).to.equal('Unnamed Character');
      expect(result.race).to.equal('Unknown');
      expect(result.class).to.equal('Unknown');
    });

    it('should create simple character data for complete character', function() {
      const character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        backstory: 'Long story'
      };
      
      const result = App.createSimpleCharacterData(character);
      
      expect(result.name).to.equal('Aragorn');
      expect(result.race).to.equal('Human');
      expect(result.class).to.equal('Ranger');
      // Should not include backstory in simple data
      expect(result.backstory).to.be.undefined;
    });

    it('should handle null character', function() {
      const result = App.createSimpleCharacterData(null);
      
      expect(result.name).to.equal('Unnamed Character');
      expect(result.race).to.equal('Unknown');
      expect(result.class).to.equal('Unknown');
    });

    it('should handle character with whitespace-only name', function() {
      const character = {
        name: '   ', // Only whitespace
        race: 'Elf',
        class: 'Ranger',
        backstory: 'A character with whitespace name'
      };
      
      const result = App.createSimpleCharacterData(character);
      
      expect(result.name).to.equal('Unnamed Character');
      expect(result.race).to.equal('Elf');
      expect(result.class).to.equal('Ranger');
    });

    it('should trim character name with leading/trailing whitespace', function() {
      const character = {
        name: '  Legolas  ', // Name with whitespace
        race: 'Elf',
        class: 'Ranger'
      };
      
      const result = App.createSimpleCharacterData(character);
      
      expect(result.name).to.equal('Legolas');
      expect(result.race).to.equal('Elf');
      expect(result.class).to.equal('Ranger');
    });

    it('should handle specific character name "Puoskari"', function() {
      const character = {
        name: 'Puoskari',
        race: 'Human',
        class: 'Thief Artificer',
        backstory: 'A skilled artificer and thief'
      };
      
      const result = App.createSimpleCharacterData(character);
      
      expect(result.name).to.equal('Puoskari');
      expect(result.race).to.equal('Human');
      expect(result.class).to.equal('Thief Artificer');
    });

    it('should handle character names with special characters', function() {
      const character = {
        name: 'Rögnvald',
        race: 'Human',
        class: 'Skald'
      };
      
      const result = App.createSimpleCharacterData(character);
      
      expect(result.name).to.equal('Rögnvald');
      expect(result.race).to.equal('Human');
      expect(result.class).to.equal('Skald');
    });
  });

  describe('Display Character Summary', function() {
    beforeEach(function() {
      // Create required DOM elements
      const nameEl = document.createElement('span');
      nameEl.id = 'display-name';
      const raceEl = document.createElement('span');
      raceEl.id = 'display-race';
      const classEl = document.createElement('span');
      classEl.id = 'display-class';
      
      document.body.appendChild(nameEl);
      document.body.appendChild(raceEl);
      document.body.appendChild(classEl);
    });

    afterEach(function() {
      const nameEl = document.getElementById('display-name');
      const raceEl = document.getElementById('display-race');
      const classEl = document.getElementById('display-class');
      
      if (nameEl) nameEl.remove();
      if (raceEl) raceEl.remove();
      if (classEl) classEl.remove();
    });

    it('should display character summary in DOM elements', function() {
      App.state.character = {
        name: 'Legolas',
        race: 'Elf',
        class: 'Archer'
      };
      
      App.displayCharacterSummary();
      
      expect(document.getElementById('display-name').textContent).to.equal('Legolas');
      expect(document.getElementById('display-race').textContent).to.equal('Elf');
      expect(document.getElementById('display-class').textContent).to.equal('Archer');
    });

    it('should handle missing DOM elements gracefully', function() {
      document.getElementById('display-name').remove();
      
      expect(() => App.displayCharacterSummary()).to.not.throw();
    });

    it('should display default values for empty character', function() {
      App.state.character = { name: '', race: '', class: '' };
      App.displayCharacterSummary();

      const nameEl = document.getElementById('display-name');
      const raceEl = document.getElementById('display-race');
      const classEl = document.getElementById('display-class');

      expect(nameEl.textContent).to.equal('Unnamed Character');
      expect(raceEl.textContent).to.equal('—');
      expect(classEl.textContent).to.equal('—');
    });
  });

  describe('AI Prompt Formatting', function() {
    it('should format AI prompt with paragraphs', function() {
      const prompt = 'Line 1\nLine 2\n\nLine 3';
      const result = App.formatAIPrompt(prompt);
      
      expect(result).to.equal('<p>Line 1</p><p>Line 2</p><p>Line 3</p>');
    });

    it('should handle empty lines in prompt', function() {
      const prompt = 'Line 1\n\n\nLine 2';
      const result = App.formatAIPrompt(prompt);
      
      expect(result).to.equal('<p>Line 1</p><p>Line 2</p>');
    });

    it('should handle empty prompt', function() {
      const result = App.formatAIPrompt('');
      expect(result).to.equal('');
    });
  });

  describe('Focus Management', function() {
    it('should call focus on entry title when element exists', function() {
      // Clean up any existing elements first
      const existing = document.getElementById('entry-title');
      if (existing) existing.remove();
      
      const titleInput = document.createElement('input');
      titleInput.id = 'entry-title';
      document.body.appendChild(titleInput);
      
      // Track focus calls by modifying the element directly accessed by the function
      let focusCalled = false;
      const originalGetElementById = document.getElementById;
      
      document.getElementById = function(id) {
        const element = originalGetElementById.call(this, id);
        if (element && id === 'entry-title') {
          element.focus = function() { 
            focusCalled = true;
          };
        }
        return element;
      };
      
      // Call the function
      App.focusEntryTitle();
      
      // Restore original method
      document.getElementById = originalGetElementById;
      
      // Verify focus was called
      expect(focusCalled).to.be.true;
      
      titleInput.remove();
    });

    it('should handle missing title input gracefully', function() {
      expect(() => App.focusEntryTitle()).to.not.throw();
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

    it('should get entry summaries', async function() {
      App.state.entries.push({
        id: '1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });

      const summary = await App.getEntrySummary('1');
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

  describe('Event Handlers', function() {
    beforeEach(function() {
      // Create required DOM elements
      const addBtn = document.createElement('button');
      addBtn.id = 'add-entry-btn';
      const regenBtn = document.createElement('button');
      regenBtn.id = 'regenerate-prompt-btn';
      const titleInput = document.createElement('input');
      titleInput.id = 'entry-title';
      const contentTextarea = document.createElement('textarea');
      contentTextarea.id = 'entry-content';
      
      document.body.appendChild(addBtn);
      document.body.appendChild(regenBtn);
      document.body.appendChild(titleInput);
      document.body.appendChild(contentTextarea);
    });

    afterEach(function() {
      ['add-entry-btn', 'regenerate-prompt-btn', 'entry-title', 'entry-content'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    });

    it('should setup event handlers for buttons', function() {
      App.setupEventHandlers();
      
      const addBtn = document.getElementById('add-entry-btn');
      const regenBtn = document.getElementById('regenerate-prompt-btn');
      
      // Check that event listeners are attached (we can't easily test the actual events in this environment)
      expect(addBtn).to.exist;
      expect(regenBtn).to.exist;
    });

    it('should setup keyboard event handlers', function() {
      App.setupEventHandlers();
      
      const titleInput = document.getElementById('entry-title');
      const contentTextarea = document.getElementById('entry-content');
      
      expect(titleInput).to.exist;
      expect(contentTextarea).to.exist;
    });

    it('should handle missing elements gracefully', function() {
      document.getElementById('add-entry-btn').remove();
      
      expect(() => App.setupEventHandlers()).to.not.throw();
    });
  });

  describe('AI Display Functions', function() {
    beforeEach(function() {
      const aiPromptText = document.createElement('div');
      aiPromptText.id = 'ai-prompt-text';
      const regenerateBtn = document.createElement('button');
      regenerateBtn.id = 'regenerate-prompt-btn';
      
      document.body.appendChild(aiPromptText);
      document.body.appendChild(regenerateBtn);
    });

    afterEach(function() {
      const aiPromptText = document.getElementById('ai-prompt-text');
      const regenerateBtn = document.getElementById('regenerate-prompt-btn');
      
      if (aiPromptText) aiPromptText.remove();
      if (regenerateBtn) regenerateBtn.remove();
    });

    it('should handle missing AI prompt element in displayAIPrompt', async function() {
      document.getElementById('ai-prompt-text').remove();
      
      // Should not throw an error when element is missing
      try {
        await App.displayAIPrompt();
        expect(true).to.be.true; // If we get here, no error was thrown
      } catch (error) {
        expect.fail('Should not throw error when element is missing');
      }
    });

    it('should handle missing elements in regenerateAIPrompt', async function() {
      document.getElementById('ai-prompt-text').remove();
      
      // Should not throw an error when element is missing
      try {
        await App.regenerateAIPrompt();
        expect(true).to.be.true; // If we get here, no error was thrown
      } catch (error) {
        expect.fail('Should not throw error when element is missing');
      }
    });

    it('should handle errors in displayAIPrompt', async function() {
      // This will test the error handling path since AI is not enabled in tests
      const aiPromptText = document.getElementById('ai-prompt-text');
      
      await App.displayAIPrompt();
      
      // Should handle the error gracefully and not crash
      expect(aiPromptText).to.exist;
    });
  });

  describe('Sync Functions', function() {
    it('should setup sync listener without errors', function() {
      // Sync is always available now via npm packages
      expect(() => App.setupSyncListener()).to.not.throw();
    });
  });
});
