const path = require('path');
const fs = require('fs');
require('./setup');
const { should } = require('chai');

// Load the utils and character files as modules
const utilsPath = path.join(__dirname, '../js/utils.js');
const characterPath = path.join(__dirname, '../js/character.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
const characterContent = fs.readFileSync(characterPath, 'utf8');

// Create a proper module context for character page
function loadCharacterPage() {
  // Clear localStorage before each test
  localStorage.clear();
  
  // Reset DOM with simplified character form elements
  document.body.innerHTML = `
    <input type="text" id="character-name" />
    <input type="text" id="character-race" />
    <input type="text" id="character-class" />
    <textarea id="character-backstory"></textarea>
    <textarea id="character-notes"></textarea>
  `;
  
  // Clear any existing globals
  delete global.loadCharacterData;
  delete global.saveCharacterData;
  delete global.getCharacterFromForm;
  delete global.populateForm;
  
  // Setup window object for utils
  global.window = global.window || {};
  
  // Evaluate the utils code first to setup window.Utils
  eval(utilsContent);
  
  // Evaluate the character code in the global context
  eval(characterContent);
  
  return {
    loadCharacterData: global.loadCharacterData,
    saveCharacterData: global.saveCharacterData,
    getCharacterFromForm: global.getCharacterFromForm,
    populateForm: global.populateForm
  };
}

describe('Character Page', function() {
  beforeEach(function() {
    loadCharacterPage();
  });

  describe('Character Form Integration', function() {
    it('should populate form with character data', function() {
      const testCharacter = {
        name: 'Legolas',
        race: 'Elf',
        class: 'Ranger',
        backstory: 'A woodland elf from Mirkwood',
        notes: 'Skilled with bow and arrow'
      };

      populateForm(testCharacter);

      document.getElementById('character-name').value.should.equal('Legolas');
      document.getElementById('character-race').value.should.equal('Elf');
      document.getElementById('character-class').value.should.equal('Ranger');
      document.getElementById('character-backstory').value.should.equal('A woodland elf from Mirkwood');
      document.getElementById('character-notes').value.should.equal('Skilled with bow and arrow');
    });

    it('should get character data from form', function() {
      // Set form values
      document.getElementById('character-name').value = 'Gimli';
      document.getElementById('character-race').value = 'Dwarf';
      document.getElementById('character-class').value = 'Fighter';
      document.getElementById('character-backstory').value = 'Son of Glóin';
      document.getElementById('character-notes').value = 'Carries a family axe';

      const character = getCharacterFromForm();

      // Test that form data is correctly extracted
      character.name.should.equal('Gimli');
      character.race.should.equal('Dwarf');
      character.class.should.equal('Fighter');
      character.backstory.should.equal('Son of Glóin');
      character.notes.should.equal('Carries a family axe');
    });

    it('should handle empty form gracefully', function() {
      const character = getCharacterFromForm();
      const expectedState = {
        name: '',
        race: '',
        class: '',
        backstory: '',
        notes: ''
      };
      
      character.should.deep.equal(expectedState);
    });
  });

  describe('Data Persistence', function() {
    it('should save and load character data', function() {
      const testCharacter = {
        name: 'Gandalf',
        race: 'Maia',
        class: 'Wizard',
        backstory: 'A wise wizard of great power',
        notes: 'Carries a staff and sword'
      };

      // Save character data
      const saveResult = saveCharacterData(testCharacter);
      saveResult.should.have.property('success', true);

      // Load character data and verify it was saved correctly
      const loadedCharacter = loadCharacterData();
      loadedCharacter.name.should.equal('Gandalf');
      loadedCharacter.race.should.equal('Maia');
      loadedCharacter.class.should.equal('Wizard');
      loadedCharacter.backstory.should.equal('A wise wizard of great power');
      loadedCharacter.notes.should.equal('Carries a staff and sword');
    });

    it('should preserve existing entries when saving character', function() {
      // Setup existing data with entries
      const existingData = {
        character: { name: 'Old Character' },
        entries: [
          { id: '1', title: 'First Adventure', content: 'An epic quest' }
        ]
      };
      localStorage.setItem('simple-dnd-journal', JSON.stringify(existingData));

      // Save new character data
      const newCharacter = { name: 'New Character', class: 'Paladin' };
      saveCharacterData(newCharacter);

      // Verify entries are preserved
      const stored = JSON.parse(localStorage.getItem('simple-dnd-journal'));
      stored.should.have.property('entries').that.is.an('array').with.length(1);
      stored.entries[0].should.have.property('title', 'First Adventure');
      stored.should.have.property('character');
      stored.character.should.have.property('name', 'New Character');
    });
  });


});
