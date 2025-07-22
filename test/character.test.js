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
  
  // Reset DOM with proper character form elements
  document.body.innerHTML = `
    <input type="text" id="character-name" />
    <input type="text" id="character-race" />
    <input type="text" id="character-class" />
    <input type="number" id="character-level" />
    <input type="text" id="character-subclass" />
    <input type="text" id="character-background" />
    <select id="character-alignment">
      <option value="">Select Alignment</option>
      <option value="Lawful Good">Lawful Good</option>
    </select>
    <textarea id="character-backstory"></textarea>
    <textarea id="character-goals"></textarea>
    <input type="text" id="character-age" />
    <input type="text" id="character-height" />
    <input type="text" id="character-weight" />
    <input type="text" id="character-eyes" />
    <input type="text" id="character-hair" />
    <input type="text" id="character-skin" />
    <textarea id="character-appearance"></textarea>
    <textarea id="character-personality"></textarea>
    <input type="number" id="character-str" />
    <input type="number" id="character-dex" />
    <input type="number" id="character-con" />
    <input type="number" id="character-int" />
    <input type="number" id="character-wis" />
    <input type="number" id="character-cha" />
    <input type="number" id="character-ac" />
    <input type="number" id="character-hp" />
    <input type="text" id="character-speed" />
    <textarea id="character-equipment"></textarea>
    <textarea id="character-notes"></textarea>
  `;
  
  // Clear any existing globals
  delete global.createInitialCharacterState;
  delete global.safeParseJSON;
  delete global.loadCharacterData;
  delete global.saveCharacterData;
  delete global.getCharacterFromForm;
  delete global.populateForm;
  delete global.getAbilityModifier;
  delete global.debounce;
  
  // Evaluate the character code in the global context
  eval(characterContent);
  
  return {
    createInitialCharacterState: global.createInitialCharacterState,
    safeParseJSON: global.safeParseJSON,
    loadCharacterData: global.loadCharacterData,
    saveCharacterData: global.saveCharacterData,
    getCharacterFromForm: global.getCharacterFromForm,
    populateForm: global.populateForm,
    getAbilityModifier: global.getAbilityModifier,
    debounce: global.debounce
  };
}

describe('Character Page', function() {
  beforeEach(function() {
    loadCharacterPage();
  });

  describe('createInitialCharacterState', function() {
    it('should create a complete character state object', function() {
      const state = createInitialCharacterState();
      
      // Basic info
      state.should.have.property('name', '');
      state.should.have.property('race', '');
      state.should.have.property('class', '');
      state.should.have.property('level', '');
      state.should.have.property('subclass', '');
      state.should.have.property('background', '');
      state.should.have.property('alignment', '');
      
      // Backstory
      state.should.have.property('backstory', '');
      state.should.have.property('goals', '');
      
      // Appearance
      state.should.have.property('age', '');
      state.should.have.property('height', '');
      state.should.have.property('weight', '');
      state.should.have.property('eyes', '');
      state.should.have.property('hair', '');
      state.should.have.property('skin', '');
      state.should.have.property('appearance', '');
      state.should.have.property('personality', '');
      
      // Stats
      state.should.have.property('str', '');
      state.should.have.property('dex', '');
      state.should.have.property('con', '');
      state.should.have.property('int', '');
      state.should.have.property('wis', '');
      state.should.have.property('cha', '');
      state.should.have.property('ac', '');
      state.should.have.property('hp', '');
      state.should.have.property('speed', '');
      
      // Equipment & Notes
      state.should.have.property('equipment', '');
      state.should.have.property('notes', '');
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

  describe('getAbilityModifier', function() {
    it('should calculate ability modifiers correctly', function() {
      getAbilityModifier('10').should.equal(0);
      getAbilityModifier('8').should.equal(-1);
      getAbilityModifier('12').should.equal(1);
      getAbilityModifier('16').should.equal(3);
      getAbilityModifier('20').should.equal(5);
      getAbilityModifier('3').should.equal(-4);
    });

    it('should handle invalid input', function() {
      getAbilityModifier('').should.equal('');
      getAbilityModifier('abc').should.equal('');
      getAbilityModifier(null).should.equal('');
    });
  });

  describe('Character Form Integration', function() {
    it('should populate form with character data', function() {
      const testCharacter = {
        name: 'Legolas',
        race: 'Elf',
        class: 'Ranger',
        level: '5',
        str: '14',
        dex: '18',
        backstory: 'A woodland elf from Mirkwood'
      };

      populateForm(testCharacter);

      document.getElementById('character-name').value.should.equal('Legolas');
      document.getElementById('character-race').value.should.equal('Elf');
      document.getElementById('character-class').value.should.equal('Ranger');
      document.getElementById('character-level').value.should.equal('5');
      document.getElementById('character-str').value.should.equal('14');
      document.getElementById('character-dex').value.should.equal('18');
      document.getElementById('character-backstory').value.should.equal('A woodland elf from Mirkwood');
    });

    it('should get character data from form', function() {
      // Set form values
      document.getElementById('character-name').value = 'Gimli';
      document.getElementById('character-race').value = 'Dwarf';
      document.getElementById('character-class').value = 'Fighter';
      document.getElementById('character-level').value = '6';
      document.getElementById('character-str').value = '16';
      document.getElementById('character-con').value = '15';

      const character = getCharacterFromForm();

      character.should.have.property('name', 'Gimli');
      character.should.have.property('race', 'Dwarf');
      character.should.have.property('class', 'Fighter');
      character.should.have.property('level', '6');
      character.should.have.property('str', '16');
      character.should.have.property('con', '15');
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
        race: 'Maia',
        class: 'Wizard',
        level: '20',
        backstory: 'A wise wizard of great power'
      };

      // Save character data
      const saveResult = saveCharacterData(testCharacter);
      saveResult.should.have.property('success', true);

      // Load character data
      const loadedCharacter = loadCharacterData();
      loadedCharacter.should.have.property('name', 'Gandalf');
      loadedCharacter.should.have.property('race', 'Maia');
      loadedCharacter.should.have.property('class', 'Wizard');
      loadedCharacter.should.have.property('level', '20');
      loadedCharacter.should.have.property('backstory', 'A wise wizard of great power');
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
