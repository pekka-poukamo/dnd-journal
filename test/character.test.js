const path = require('path');
const fs = require('fs');
require('./setup');
const { should } = require('chai');

// Load the character.js file as a module
const characterPath = path.join(__dirname, '../js/character.js');
const characterContent = fs.readFileSync(characterPath, 'utf8');

// Create a proper module context for character page
function loadCharacterPage() {
  // Clear localStorage before each test
  localStorage.clear();
  
  // Reset DOM with proper character form elements (simplified)
  document.body.innerHTML = `
    <input type="text" id="character-name" />
    <input type="text" id="character-race" />
    <input type="text" id="character-class" />
    <input type="text" id="character-concept" />
    <textarea id="character-backstory"></textarea>
    <textarea id="character-personality"></textarea>
    <textarea id="character-goals"></textarea>
    <textarea id="character-relationships"></textarea>
    <textarea id="character-growth"></textarea>
    <textarea id="character-abilities"></textarea>
    <textarea id="character-notes"></textarea>
  `;
  
  // Clear any existing globals
  delete global.createInitialCharacterState;
  delete global.safeParseJSON;
  delete global.loadCharacterData;
  delete global.saveCharacterData;
  delete global.getCharacterFromForm;
  delete global.populateForm;
  delete global.debounce;
  delete global.extractLevel;
  delete global.extractRace;
  delete global.extractClass;
  
  // Evaluate the character code in the global context
  eval(characterContent);
  
  return {
    createInitialCharacterState: global.createInitialCharacterState,
    safeParseJSON: global.safeParseJSON,
    loadCharacterData: global.loadCharacterData,
    saveCharacterData: global.saveCharacterData,
    getCharacterFromForm: global.getCharacterFromForm,
    populateForm: global.populateForm,
    debounce: global.debounce,
    extractLevel: global.extractLevel,
    extractRace: global.extractRace,
    extractClass: global.extractClass
  };
}

describe('Character Page', function() {
  beforeEach(function() {
    loadCharacterPage();
  });

  describe('createInitialCharacterState', function() {
    it('should create a valid empty character state', function() {
      const state = createInitialCharacterState();
      
      // Test that it's a valid object
      state.should.be.an('object');
      
      // Test that it has the core properties needed for the app to function
      state.should.have.property('name');
      state.should.have.property('race');
      state.should.have.property('class');
      
      // Test that it can be used with form population without errors
      (() => populateForm(state)).should.not.throw();
    });
  });

  describe('safeParseJSON', function() {
    it('should parse valid JSON successfully', function() {
      const validJson = '{"name": "Aragorn", "class": "Ranger"}';
      const result = safeParseJSON(validJson);
      
      result.should.have.property('success', true);
      result.should.have.property('data');
      result.data.should.have.property('name', 'Aragorn');
      result.data.should.have.property('class', 'Ranger');
    });

    it('should handle invalid JSON gracefully', function() {
      const invalidJson = '{"name": "Aragorn", "class":}';
      const result = safeParseJSON(invalidJson);
      
      result.should.have.property('success', false);
      result.should.have.property('error').that.is.a('string');
    });
  });

  describe('Text Parsing Functions', function() {
    it('should extract level from class text', function() {
      extractLevel('Level 5 Fighter').should.equal('Level 5');
      extractLevel('Fighter Level 3').should.equal('Level 3');
      extractLevel('level 10 wizard').should.equal('Level 10');
      extractLevel('Fighter').should.equal('');
      extractLevel('').should.equal('');
    });

    it('should extract race from race text', function() {
      extractRace('Human Noble').should.equal('Human');
      extractRace('Elven Outlander').should.equal('Elven');
      extractRace('Dwarf').should.equal('Dwarf');
      extractRace('').should.equal('');
    });

    it('should extract class name without level', function() {
      extractClass('Level 5 Fighter').should.equal('Fighter');
      extractClass('Fighter Level 3').should.equal('Fighter');
      extractClass('level 10 wizard').should.equal('wizard');
      extractClass('Fighter').should.equal('Fighter');
      extractClass('').should.equal('');
    });
  });

  describe('Character Form Integration', function() {
    it('should populate form with character data', function() {
      const testCharacter = {
        name: 'Legolas',
        race: 'Elf Outlander',
        class: 'Level 5 Ranger',
        concept: 'A skilled archer seeking adventure',
        backstory: 'A woodland elf from Mirkwood',
        personality: 'Proud and observant'
      };

      populateForm(testCharacter);

      document.getElementById('character-name').value.should.equal('Legolas');
      document.getElementById('character-race').value.should.equal('Elf Outlander');
      document.getElementById('character-class').value.should.equal('Level 5 Ranger');
      document.getElementById('character-concept').value.should.equal('A skilled archer seeking adventure');
      document.getElementById('character-backstory').value.should.equal('A woodland elf from Mirkwood');
      document.getElementById('character-personality').value.should.equal('Proud and observant');
    });

    it('should get character data from form', function() {
      // Set form values
      document.getElementById('character-name').value = 'Gimli';
      document.getElementById('character-race').value = 'Dwarf Noble';
      document.getElementById('character-class').value = 'Level 6 Fighter';
      document.getElementById('character-concept').value = 'A proud warrior';
      document.getElementById('character-goals').value = 'Reclaim the homeland';
      document.getElementById('character-notes').value = 'Carries a family axe';

      const character = getCharacterFromForm();

      // Test that form data is correctly extracted
      character.name.should.equal('Gimli');
      character.race.should.equal('Dwarf Noble');
      character.class.should.equal('Level 6 Fighter');
      character.concept.should.equal('A proud warrior');
      character.goals.should.equal('Reclaim the homeland');
      character.notes.should.equal('Carries a family axe');
    });

    it('should handle empty form gracefully', function() {
      const character = getCharacterFromForm();
      const initialState = createInitialCharacterState();
      
      character.should.deep.equal(initialState);
    });
  });

  describe('Data Persistence', function() {
    it('should save and load character data', function() {
      const testCharacter = {
        name: 'Gandalf',
        race: 'Maia Hermit',
        class: 'Level 20 Wizard',
        concept: 'A wise and powerful guide',
        backstory: 'A wise wizard of great power'
      };

      // Save character data
      const saveResult = saveCharacterData(testCharacter);
      saveResult.should.have.property('success', true);

      // Load character data and verify it was saved correctly
      const loadedCharacter = loadCharacterData();
      loadedCharacter.name.should.equal('Gandalf');
      loadedCharacter.race.should.equal('Maia Hermit');
      loadedCharacter.class.should.equal('Level 20 Wizard');
      loadedCharacter.concept.should.equal('A wise and powerful guide');
      loadedCharacter.backstory.should.equal('A wise wizard of great power');
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

  describe('Utility Functions', function() {
    it('should create a debounced function', function(done) {
      let callCount = 0;
      const testFunction = () => callCount++;
      const debouncedFn = debounce(testFunction, 50);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not have been called yet
      callCount.should.equal(0);

      // Wait for debounce delay
      setTimeout(() => {
        callCount.should.equal(1);
        done();
      }, 60);
    });
  });
});
