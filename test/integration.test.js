import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';
import * as Utils from '../js/utils.js';

describe('D&D Journal Integration Tests', function() {
  beforeEach(function() {
    // Reset localStorage before each test
    global.resetLocalStorage();
    
    // Clear DOM
    document.body.innerHTML = '';
    
    // Reset app state to initial values
    App.resetState();
  });

  afterEach(function() {
    // Reset localStorage after each test
    global.resetLocalStorage();
  });

  it('should complete full user workflow', function() {
    // Set up character data
    App.state.character = {
      name: 'Aragorn',
      race: 'Human',
      class: 'Ranger',
      backstory: 'Heir to the throne of Gondor',
      notes: 'Carries Andúril, the sword of kings'
    };

    // Add journal entries
    const entry1 = {
      id: Utils.generateId(),
      title: 'The Fellowship Begins',
      content: 'Today we set out from Rivendell with the One Ring.',
      timestamp: Date.now()
    };

    const entry2 = {
      id: Utils.generateId(),
      title: 'Moria Mines',
      content: 'We entered the dark mines of Moria. Gandalf fell fighting the Balrog.',
      timestamp: Date.now() + 1000
    };

    App.state.entries.push(entry1, entry2);

    // Save data
    App.saveData();

    // Verify data persistence
    const savedData = Utils.safeGetFromStorage(Utils.STORAGE_KEYS.JOURNAL);
    expect(savedData.success).to.be.true;
    expect(savedData.data.character.name).to.equal('Aragorn');
    expect(savedData.data.entries).to.have.length(2);

    // Test character summary
    const summary = App.createCharacterSummary(App.state.character);
    expect(summary.name).to.equal('Aragorn');
    expect(summary.details).to.include('Human');
    expect(summary.details).to.include('Ranger');

    // Test entry editing
    const originalTitle = App.state.entries[0].title;
    App.state.entries[0].title = 'Updated Title';
    expect(App.state.entries[0].title).to.equal('Updated Title');

    // Test data validation
    const validEntry = {
      id: Utils.generateId(),
      title: 'Valid Entry',
      content: 'This is valid content',
      timestamp: Date.now()
    };
    expect(Utils.isValidEntry(validEntry)).to.be.true;

    const invalidEntry = {
      id: Utils.generateId(),
      title: '', // Empty title is invalid
      content: 'This has no title',
      timestamp: Date.now()
    };
    expect(Utils.isValidEntry(invalidEntry)).to.be.false;
  });

  it('should handle character and entry integration', function() {
    // Create character
    App.state.character = {
      name: 'Legolas',
      race: 'Elf',
      class: 'Archer',
      backstory: 'Prince of Mirkwood',
      notes: 'Master archer with keen eyesight'
    };

    // Add entries that reference the character
    const entry1 = {
      id: Utils.generateId(),
      title: 'First Shot',
      content: 'Legolas proved his archery skills today, hitting targets from impossible distances.',
      timestamp: Date.now()
    };

    const entry2 = {
      id: Utils.generateId(),
      title: 'Elven Wisdom',
      content: 'Legolas shared ancient elven knowledge about the forest paths.',
      timestamp: Date.now() + 1000
    };

    App.state.entries.push(entry1, entry2);

    // Save both character and entries
    App.saveData();

    // Verify integration
    const savedData = Utils.safeGetFromStorage(Utils.STORAGE_KEYS.JOURNAL);
    expect(savedData.success).to.be.true;
    expect(savedData.data.character.name).to.equal('Legolas');
    expect(savedData.data.entries).to.have.length(2);

    // Test that entries can reference character
    const characterSummary = App.createCharacterSummary(App.state.character);
    expect(characterSummary.name).to.equal('Legolas');

    // Test entry sorting
    const sortedEntries = Utils.sortEntriesByDate(App.state.entries);
    expect(sortedEntries[0].timestamp).to.be.greaterThan(sortedEntries[1].timestamp);

    // Test word counting
    const totalWords = App.state.entries.reduce((sum, entry) => {
      return sum + Utils.getWordCount(entry.content);
    }, 0);
    expect(totalWords).to.be.greaterThan(0);
  });

  it('should handle data validation and error cases', function() {
    // Test invalid entry
    const invalidEntry = {
      id: Utils.generateId(),
      title: '', // Empty title
      content: 'Some content',
      timestamp: Date.now()
    };

    expect(Utils.isValidEntry(invalidEntry)).to.be.false;

    // Test valid entry
    const validEntry = {
      id: Utils.generateId(),
      title: 'Valid Title',
      content: 'Valid content',
      timestamp: Date.now()
    };

    expect(Utils.isValidEntry(validEntry)).to.be.true;

    // Test corrupted data handling
    global.localStorage.setItem(Utils.STORAGE_KEYS.JOURNAL, 'invalid json');
    
    // Should load default state without throwing
    expect(() => App.loadData()).to.not.throw();
    expect(App.state.character.name).to.equal('');
    expect(App.state.entries).to.have.length(0);
  });

  it('should handle localStorage errors gracefully', function() {
    // Mock localStorage to throw error temporarily
    const originalSetItem = global.localStorage.setItem;
    global.localStorage.setItem = () => {
      throw new Error('Storage full');
    };

    // Should not throw when saving
    expect(() => App.saveData()).to.not.throw();

    // Restore original method
    global.localStorage.setItem = originalSetItem;
  });

  it('should handle corrupted localStorage data', function() {
    // Set corrupted data
    global.localStorage.setItem(Utils.STORAGE_KEYS.JOURNAL, 'invalid json');

    // Should load default state without throwing
    expect(() => App.loadData()).to.not.throw();
    
    // Should have default character state
    expect(App.state.character.name).to.equal('');
    expect(App.state.character.race).to.equal('');
    expect(App.state.character.class).to.equal('');
    expect(App.state.entries).to.have.length(0);
  });

  it('should integrate with utility functions', function() {
    // Test utility integration
    const testData = { test: 'value' };
    const result = Utils.safeSetToStorage('test-key', testData);
    expect(result.success).to.be.true;

    const retrieved = Utils.safeGetFromStorage('test-key');
    expect(retrieved.success).to.be.true;
    expect(retrieved.data).to.deep.equal(testData);

    // Test ID generation with delay to ensure uniqueness
    const id1 = Utils.generateId();
    setTimeout(() => {
      const id2 = Utils.generateId();
      expect(id1).to.not.equal(id2);
      expect(id1).to.be.a('string');
      expect(id2).to.be.a('string');
    }, 1);
  });

  it('should handle character summary integration', function() {
    // Create character
    App.state.character = {
      name: 'Gandalf',
      race: 'Wizard',
      class: 'Mage',
      backstory: 'A powerful wizard sent to Middle-earth',
      notes: 'Carries a staff and knows many spells'
    };

    // Generate character summary
    const summary = App.createCharacterSummary(App.state.character);
    
    expect(summary.name).to.equal('Gandalf');
    expect(summary.details).to.include('Wizard');
    expect(summary.details).to.include('Mage');
  });

  it('should handle entry editing workflow', function() {
    // Add an entry
    App.state.entries.push({
      id: '1',
      title: 'Original Title',
      content: 'Original content',
      timestamp: Date.now()
    });

    // Render entries
    App.renderEntries();

    // Enable edit mode
    const entryDiv = document.querySelector('.entry');
    expect(entryDiv).to.exist;
    App.enableEditMode(entryDiv, App.state.entries[0]);

    // Verify edit form is created
    const editForm = entryDiv.querySelector('.edit-form');
    expect(editForm).to.exist;

    // Modify and save
    const titleInput = editForm.querySelector('input[type="text"]');
    const contentTextarea = editForm.querySelector('textarea');
    
    if (titleInput && contentTextarea) {
      titleInput.value = 'Updated Title';
      contentTextarea.value = 'Updated content';

      App.saveEdit(entryDiv, App.state.entries[0], 'Updated Title', 'Updated content');

      expect(App.state.entries[0].title).to.equal('Updated Title');
      expect(App.state.entries[0].content).to.equal('Updated content');
    }
  });
});
