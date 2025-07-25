import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';
import * as Utils from '../js/utils.js';

describe('D&D Journal Integration Tests', function() {
  beforeEach(function() {
    // Clear localStorage and reset DOM
    global.localStorage.clear();
    document.body.innerHTML = `
      <input type="text" id="character-name" />
      <input type="text" id="character-race" />
      <input type="text" id="character-class" />
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <div id="entries-list"></div>
    `;
  });

  it('should complete full user workflow', function() {
    // 1. User creates a character (simulating data from character page)
    App.state.character = {
      name: 'Thorin',
      race: 'Dwarf',
      class: 'King'
    };

    // Save the character data
    App.saveData();

    // Character should be saved
    expect(App.state.character.name).to.equal('Thorin');
    expect(App.state.character.race).to.equal('Dwarf');
    expect(App.state.character.class).to.equal('King');

    // 2. User adds multiple journal entries
    const titleInput = document.getElementById('entry-title');
    const contentInput = document.getElementById('entry-content');

    // First entry
    titleInput.value = 'The Quest Begins';
    contentInput.value = 'We set out from the Shire on a grand adventure.';
    App.addEntry();

    // Wait to ensure different timestamp
    const start1 = Date.now();
    while (Date.now() === start1) { /* wait */ }

    // Second entry
    titleInput.value = 'Meeting Gandalf';
    contentInput.value = 'The wizard has important news for us.';
    App.addEntry();

    // Wait to ensure different timestamp
    const start2 = Date.now();
    while (Date.now() === start2) { /* wait */ }

    // Third entry
    titleInput.value = 'The Lonely Mountain';
    contentInput.value = 'We can see our destination in the distance.';
    App.addEntry();

    // Should have 3 entries
    expect(App.state.entries).to.have.length(3);

    // 3. Check that data persists after reload
    const savedData = global.localStorage.getItem('simple-dnd-journal');
    expect(savedData).to.not.be.null;

    const parsedData = JSON.parse(savedData);
    expect(parsedData.character.name).to.equal('Thorin');
    expect(parsedData.entries).to.have.length(3);

    // 4. Test data persistence (simulate app reload)
    const storedData = global.localStorage.getItem('simple-dnd-journal');
    
    // Parse and verify the stored data directly
    const parsedStoredData = JSON.parse(storedData);
    expect(parsedStoredData.character.name).to.equal('Thorin');
    expect(parsedStoredData.character.race).to.equal('Dwarf');
    expect(parsedStoredData.character.class).to.equal('King');
    expect(parsedStoredData.entries).to.have.length(3);

    // 5. Verify entry order (newest first)
    expect(parsedStoredData.entries[0].title).to.equal('The Lonely Mountain');
    expect(parsedStoredData.entries[1].title).to.equal('Meeting Gandalf');
    expect(parsedStoredData.entries[2].title).to.equal('The Quest Begins');
  });

  it('should handle character and entry integration', function() {
    // Create character with backstory
    App.state.character = {
      name: 'Aragorn',
      race: 'Human',
      class: 'Ranger',
      backstory: 'Heir to the throne of Gondor',
      notes: 'Carries Andúril, the sword of kings'
    };

    // Add entries that reference the character
    const entries = [
      {
        title: 'The Fellowship Forms',
        content: 'As Aragorn, I joined the fellowship to protect the ring-bearer.'
      },
      {
        title: 'The Paths of the Dead',
        content: 'My heritage as heir to Gondor helped us pass through safely.'
      }
    ];

    entries.forEach(entry => {
      document.getElementById('entry-title').value = entry.title;
      document.getElementById('entry-content').value = entry.content;
      App.addEntry();
    });

    // Verify integration
    expect(App.state.character.name).to.equal('Aragorn');
    expect(App.state.entries).to.have.length(2);
    expect(App.state.entries[0].content).to.include('Aragorn');
    expect(App.state.entries[1].content).to.include('heir to Gondor');
  });

  it('should handle data validation and error cases', function() {
    // Test invalid entry (empty title)
    document.getElementById('entry-title').value = '';
    document.getElementById('entry-content').value = 'This should not be added';
    
    const result = App.addEntry();
    expect(result.success).to.be.false;
    expect(App.state.entries).to.have.length(0);

    // Test invalid entry (empty content)
    document.getElementById('entry-title').value = 'Valid Title';
    document.getElementById('entry-content').value = '';
    
    const result2 = App.addEntry();
    expect(result2.success).to.be.false;
    expect(App.state.entries).to.have.length(0);

    // Test valid entry
    document.getElementById('entry-title').value = 'Valid Title';
    document.getElementById('entry-content').value = 'Valid content';
    
    const result3 = App.addEntry();
    expect(result3.success).to.be.true;
    expect(App.state.entries).to.have.length(1);
  });

  it('should handle localStorage errors gracefully', function() {
    // Mock localStorage to throw error
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
    global.localStorage.setItem('simple-dnd-journal', 'invalid json');

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
    expect(id1).to.not.equal(id2);
    expect(id1).to.be.a('string');
    expect(id2).to.be.a('string');
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
    App.enableEditMode('1');

    // Verify edit form is created
    const editForm = document.querySelector('.edit-form');
    expect(editForm).to.exist;

    // Modify and save
    const titleInput = editForm.querySelector('input[type="text"]');
    const contentTextarea = editForm.querySelector('textarea');
    
    if (titleInput && contentTextarea) {
      titleInput.value = 'Updated Title';
      contentTextarea.value = 'Updated content';

      App.saveEdit('1');

      expect(App.state.entries[0].title).to.equal('Updated Title');
      expect(App.state.entries[0].content).to.equal('Updated content');
    }
  });
});
