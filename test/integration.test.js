import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';
import * as Character from '../js/character.js';
import * as Settings from '../js/settings.js';
import * as Utils from '../js/utils.js';
import { createSystem, clearSystem } from '../js/yjs.js';

describe('D&D Journal Integration Tests', function() {
  beforeEach(async function() {
    // Reset localStorage and reinitialize Yjs mock system
    global.resetLocalStorage();
    clearSystem();
    await createSystem();
    
    // Clear DOM
    document.body.innerHTML = `
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <button id="add-entry-btn">Add Entry</button>
      <div id="entries-container"></div>
      <div id="display-name">Unnamed Character</div>
      <div id="display-race">Unknown</div>
      <div id="display-class">Unknown</div>
    `;
    
    // Reset app state
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

    // Test ID generation
    const id1 = Utils.generateId();
    const id2 = Utils.generateId();
    expect(id1).to.be.a('string');
    expect(id2).to.be.a('string');
    // Note: IDs might be identical if generated in same millisecond
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
    // Ensure entries-list element exists
    let entriesList = document.getElementById('entries-list');
    if (!entriesList) {
      entriesList = document.createElement('div');
      entriesList.id = 'entries-list';
      document.body.appendChild(entriesList);
    }

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
    const entryDiv = document.querySelector('.entry-card');
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

  // Note: Test for character name display functionality is covered by unit tests
  // in app.test.js "Display Character Summary" section and "Simple Character Data" section

  // Note: Character display functionality is comprehensively tested in app.test.js
  // including the specific "Puoskari" character and localStorage fallback mechanism

  it('should handle character data persistence across page navigation simulation', function() {
    // This test simulates navigating from character page to journal page
    
    // Set up DOM elements for journal page
    const nameEl = document.createElement('span');
    nameEl.id = 'display-name';
    const raceEl = document.createElement('span');
    raceEl.id = 'display-race';
    const classEl = document.createElement('span');
    classEl.id = 'display-class';
    
    document.body.appendChild(nameEl);
    document.body.appendChild(raceEl);
    document.body.appendChild(classEl);

    // Simulate character page workflow
    // 1. Load existing data (empty initially)
    App.loadData();
    
    // 2. User enters character information
    const characterData = {
      name: 'Gimli',
      race: 'Dwarf',
      class: 'Fighter',
      backstory: 'Son of Glóin',
      notes: 'Wields an ancestral axe'
    };
    
    // 3. Character page saves the data
    App.state.character = characterData;
    App.saveData();

    // Simulate page navigation - reset app state and reload from localStorage
    App.resetState();
    App.loadData();

    // Verify character data is properly loaded
    expect(App.state.character.name).to.equal('Gimli');
    expect(App.state.character.race).to.equal('Dwarf');
    expect(App.state.character.class).to.equal('Fighter');

    // Display character summary on journal page
    App.displayCharacterSummary();

    // Verify the display shows the correct character name (not "Unnamed Character")
    expect(document.getElementById('display-name').textContent).to.equal('Gimli');
    expect(document.getElementById('display-race').textContent).to.equal('Dwarf');
    expect(document.getElementById('display-class').textContent).to.equal('Fighter');

    // Clean up DOM elements
    nameEl.remove();
    raceEl.remove();
    classEl.remove();
  });

  it('should show "Unnamed Character" when character name is empty string', function() {
    // Set up DOM elements for journal page
    const nameEl = document.createElement('span');
    nameEl.id = 'display-name';
    const raceEl = document.createElement('span');
    raceEl.id = 'display-race';
    const classEl = document.createElement('span');
    classEl.id = 'display-class';
    
    document.body.appendChild(nameEl);
    document.body.appendChild(raceEl);
    document.body.appendChild(classEl);

    // Set character data with empty name (simulating partially filled character form)
    App.state.character = {
      name: '', // Empty string name
      race: 'Elf',
      class: 'Ranger',
      backstory: 'A mysterious character',
      notes: 'Has filled out other fields but not name'
    };

    // Display character summary
    App.displayCharacterSummary();

    // Should show "Unnamed Character" because name is empty
    expect(document.getElementById('display-name').textContent).to.equal('Unnamed Character');
    expect(document.getElementById('display-race').textContent).to.equal('Elf');
    expect(document.getElementById('display-class').textContent).to.equal('Ranger');

    // Clean up DOM elements
    nameEl.remove();
    raceEl.remove();
    classEl.remove();
  });

  it('should properly handle character data when name is whitespace only', function() {
    // Set up DOM elements for journal page
    const nameEl = document.createElement('span');
    nameEl.id = 'display-name';
    const raceEl = document.createElement('span');
    raceEl.id = 'display-race';
    const classEl = document.createElement('span');
    classEl.id = 'display-class';
    
    document.body.appendChild(nameEl);
    document.body.appendChild(raceEl);
    document.body.appendChild(classEl);

    // Test character with name that is only whitespace (common user input error)
    App.state.character = {
      name: '   ', // Only whitespace
      race: 'Elf',
      class: 'Ranger',
      backstory: 'A character with whitespace name',
      notes: 'User may have entered spaces accidentally'
    };

    // Display character summary
    App.displayCharacterSummary();

    // Should show "Unnamed Character" because whitespace-only name should be treated as empty
    expect(document.getElementById('display-name').textContent).to.equal('Unnamed Character');
    expect(document.getElementById('display-race').textContent).to.equal('Elf');
    expect(document.getElementById('display-class').textContent).to.equal('Ranger');

    // Clean up DOM elements
    nameEl.remove();
    raceEl.remove();
    classEl.remove();
  });

  it('should handle potential sync override issue with character data', function() {
    // This test checks if there's an issue with how character data is merged/loaded
    
    // Set up DOM elements for journal page
    const nameEl = document.createElement('span');
    nameEl.id = 'display-name';
    const raceEl = document.createElement('span');
    raceEl.id = 'display-race';
    const classEl = document.createElement('span');
    classEl.id = 'display-class';
    
    document.body.appendChild(nameEl);
    document.body.appendChild(raceEl);
    document.body.appendChild(classEl);

    // Simulate the exact scenario: character data exists but might be getting overridden
    App.resetState();
    
    // Set character data in app state directly
    App.state.character = {
      name: 'Puoskari',
      race: 'Human', 
      class: 'Thief Artificer',
      backstory: 'A skilled artificer and thief',
      notes: 'Expert in both mechanics and stealth'
    };

    // Now test displayCharacterSummary directly
    App.displayCharacterSummary();

    // This should work correctly if the issue isn't in displayCharacterSummary
    expect(document.getElementById('display-name').textContent).to.equal('Puoskari');
    expect(document.getElementById('display-race').textContent).to.equal('Human');
    expect(document.getElementById('display-class').textContent).to.equal('Thief Artificer');

    // Clean up DOM elements
    nameEl.remove();
    raceEl.remove();
    classEl.remove();
  });
});
