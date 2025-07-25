import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';

describe('D&D Journal App', function() {
  beforeEach(function() {
    // Clear localStorage before each test
    global.localStorage.clear();
    
    // Reset DOM with proper form elements
    document.body.innerHTML = `
      <input type="text" id="character-name" />
      <input type="text" id="character-race" />
      <input type="text" id="character-class" />
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <div id="entries-list"></div>
    `;
  });

  describe('State Management', function() {
    it('should initialize with default state', function() {
      // Test that the state is properly initialized for the app to function
      expect(App.state).to.be.an('object');
      expect(App.state.character).to.be.an('object');
      expect(App.state.entries).to.be.an('array').that.is.empty;
      
      // Test that default character values work with the character summary
      const summary = App.createCharacterSummary(App.state.character);
      expect(summary.name).to.equal('No character created yet');
    });

    it('should save and load data from localStorage', function() {
      // Modify state
      App.state.character.name = 'Aragorn';
      App.state.character.race = 'Human';
      App.state.character.class = 'Ranger';
      App.state.entries.push({
        id: '123',
        title: 'Test Adventure',
        content: 'A great quest!',
        timestamp: Date.now()
      });

      // Save data
      App.saveData();

      // Verify localStorage contains data
      const stored = global.localStorage.getItem('simple-dnd-journal');
      expect(stored).to.not.be.null;
      
      const parsedData = JSON.parse(stored);
      expect(parsedData.character.name).to.equal('Aragorn');
      expect(parsedData.entries).to.have.length(1);

      // Clear current state and simulate fresh app start
      global.localStorage.clear();
      
      // Load data
      App.loadData();
      
      // Verify state was restored
      expect(App.state.character.name).to.equal('Aragorn');
      expect(App.state.entries).to.have.length(1);
    });
  });

  describe('Entry Management', function() {
    it('should add new entries', function() {
      const entryData = {
        title: 'New Adventure',
        content: 'This is a new journal entry'
      };

      App.addEntry(entryData);

      expect(App.state.entries).to.have.length(1);
      expect(App.state.entries[0].title).to.equal('New Adventure');
      expect(App.state.entries[0].content).to.equal('This is a new journal entry');
      expect(App.state.entries[0]).to.have.property('id');
      expect(App.state.entries[0]).to.have.property('timestamp');
    });

    it('should validate entry data', function() {
      const invalidEntry = {
        title: '',
        content: 'Some content'
      };

      const result = App.addEntry(invalidEntry);
      expect(result.success).to.be.false;
      expect(App.state.entries).to.have.length(0);
    });

    it('should render entries correctly', function() {
      App.state.entries.push({
        id: '1',
        title: 'First Entry',
        content: 'First content',
        timestamp: Date.now()
      });

      App.state.entries.push({
        id: '2',
        title: 'Second Entry',
        content: 'Second content',
        timestamp: Date.now() - 1000
      });

      App.renderEntries();

      const entriesList = document.getElementById('entries-list');
      expect(entriesList.children).to.have.length(2);
    });
  });

  describe('Character Summary', function() {
    it('should create character summary for empty character', function() {
      const summary = App.createCharacterSummary({});
      
      expect(summary.name).to.equal('No character created yet');
      expect(summary.details).to.equal('No character details available');
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
    it('should generate AI prompts', async function() {
      const character = {
        name: 'Frodo',
        race: 'Hobbit',
        class: 'Burglar'
      };

      const entries = [
        {
          id: '1',
          title: 'The Journey Begins',
          content: 'Left the Shire with the ring',
          timestamp: Date.now()
        }
      ];

      const result = await App.generateIntrospectionPrompt(character, entries);
      
      expect(result).to.have.property('success');
      expect(result).to.have.property('prompt');
    });

    it('should get entry summaries', function() {
      const entryId = 'test-entry';
      const summaries = {
        [entryId]: 'This is a test summary'
      };
      
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
      
      const summary = App.getEntrySummary(entryId);
      expect(summary).to.equal('This is a test summary');
    });
  });

  describe('Form Handling', function() {
    it('should get form data correctly', function() {
      document.getElementById('entry-title').value = 'Test Title';
      document.getElementById('entry-content').value = 'Test Content';

      const formData = App.getFormData();
      
      expect(formData.title).to.equal('Test Title');
      expect(formData.content).to.equal('Test Content');
    });

    it('should clear entry form', function() {
      document.getElementById('entry-title').value = 'Test Title';
      document.getElementById('entry-content').value = 'Test Content';

      App.clearEntryForm();

      expect(document.getElementById('entry-title').value).to.equal('');
      expect(document.getElementById('entry-content').value).to.equal('');
    });
  });

  describe('Edit Mode', function() {
    it('should enable edit mode for entries', function() {
      const entry = {
        id: '1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      App.state.entries.push(entry);
      App.renderEntries();

      const entryElement = document.querySelector('.entry');
      expect(entryElement).to.exist;

      App.enableEditMode(entry.id);

      // Check that edit form is created
      const editForm = document.querySelector('.edit-form');
      expect(editForm).to.exist;
    });

    it('should save edits correctly', function() {
      const entry = {
        id: '1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      App.state.entries.push(entry);
      App.renderEntries();

      // Enable edit mode
      App.enableEditMode(entry.id);

      // Modify form values
      const titleInput = document.querySelector('.edit-form input[type="text"]');
      const contentTextarea = document.querySelector('.edit-form textarea');
      
      if (titleInput && contentTextarea) {
        titleInput.value = 'Updated Title';
        contentTextarea.value = 'Updated content';

        App.saveEdit(entry.id);

        expect(App.state.entries[0].title).to.equal('Updated Title');
        expect(App.state.entries[0].content).to.equal('Updated content');
      }
    });

    it('should cancel edits correctly', function() {
      const entry = {
        id: '1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      App.state.entries.push(entry);
      App.renderEntries();

      // Enable edit mode
      App.enableEditMode(entry.id);

      // Cancel edit
      App.cancelEdit(entry.id);

      // Check that edit form is removed
      const editForm = document.querySelector('.edit-form');
      expect(editForm).to.not.exist;
    });
  });
});
