import { expect } from 'chai';
import './setup.js';
import * as Character from '../js/character.js';

describe('Character Page', function() {
  beforeEach(function() {
    // Clear localStorage before each test
    global.localStorage.clear();
    
    // Reset DOM with simplified character form elements
    document.body.innerHTML = `
      <input type="text" id="character-name" />
      <input type="text" id="character-race" />
      <input type="text" id="character-class" />
      <textarea id="character-backstory"></textarea>
      <textarea id="character-notes"></textarea>
    `;
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

      Character.populateForm(testCharacter);

      expect(document.getElementById('character-name').value).to.equal('Legolas');
      expect(document.getElementById('character-race').value).to.equal('Elf');
      expect(document.getElementById('character-class').value).to.equal('Ranger');
      expect(document.getElementById('character-backstory').value).to.equal('A woodland elf from Mirkwood');
      expect(document.getElementById('character-notes').value).to.equal('Skilled with bow and arrow');
    });

    it('should get character data from form', function() {
      // Set form values
      document.getElementById('character-name').value = 'Gimli';
      document.getElementById('character-race').value = 'Dwarf';
      document.getElementById('character-class').value = 'Fighter';
      document.getElementById('character-backstory').value = 'Son of Glóin';
      document.getElementById('character-notes').value = 'Carries a family axe';

      const character = Character.getCharacterFromForm();

      // Test that form data is correctly extracted
      expect(character.name).to.equal('Gimli');
      expect(character.race).to.equal('Dwarf');
      expect(character.class).to.equal('Fighter');
      expect(character.backstory).to.equal('Son of Glóin');
      expect(character.notes).to.equal('Carries a family axe');
    });

    it('should handle empty form gracefully', function() {
      const character = Character.getCharacterFromForm();
      const expectedState = {
        name: '',
        race: '',
        class: '',
        backstory: '',
        notes: ''
      };
      
      expect(character).to.deep.equal(expectedState);
    });

    it('should handle partial form data', function() {
      // Set only some form values
      document.getElementById('character-name').value = 'Aragorn';
      document.getElementById('character-race').value = 'Human';

      const character = Character.getCharacterFromForm();

      expect(character.name).to.equal('Aragorn');
      expect(character.race).to.equal('Human');
      expect(character.class).to.equal('');
      expect(character.backstory).to.equal('');
      expect(character.notes).to.equal('');
    });
  });

  describe('Character Data Persistence', function() {
    it('should save character data to localStorage', function() {
      const testCharacter = {
        name: 'Frodo',
        race: 'Hobbit',
        class: 'Burglar',
        backstory: 'A hobbit from the Shire',
        notes: 'Ring-bearer'
      };

      Character.saveCharacterData(testCharacter);

      const savedData = JSON.parse(global.localStorage.getItem('simple-dnd-journal'));
      expect(savedData.character).to.deep.equal(testCharacter);
    });

    it('should load character data from localStorage', function() {
      const testCharacter = {
        name: 'Sam',
        race: 'Hobbit',
        class: 'Gardener',
        backstory: 'Frodo\'s loyal companion',
        notes: 'Carries cooking gear'
      };

      global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
        character: testCharacter,
        entries: []
      }));

      const loadedCharacter = Character.loadCharacterData();
      expect(loadedCharacter).to.deep.equal(testCharacter);
    });

    it('should return default character when no data exists', function() {
      const loadedCharacter = Character.loadCharacterData();
      const expectedDefault = {
        name: '',
        race: '',
        class: '',
        backstory: '',
        notes: ''
      };

      expect(loadedCharacter).to.deep.equal(expectedDefault);
    });

    it('should handle corrupted localStorage data gracefully', function() {
      global.localStorage.setItem('simple-dnd-journal', 'invalid-json');

      const loadedCharacter = Character.loadCharacterData();
      const expectedDefault = {
        name: '',
        race: '',
        class: '',
        backstory: '',
        notes: ''
      };

      expect(loadedCharacter).to.deep.equal(expectedDefault);
    });
  });

  describe('Form Field Integration', function() {
    it('should handle all character form fields', function() {
      const testCharacter = {
        name: 'Gandalf',
        race: 'Wizard',
        class: 'Mage',
        backstory: 'A powerful wizard sent to Middle-earth',
        notes: 'Carries a staff and knows many spells'
      };

      Character.populateForm(testCharacter);

      // Verify all fields are populated
      const nameField = document.getElementById('character-name');
      const raceField = document.getElementById('character-race');
      const classField = document.getElementById('character-class');
      const backstoryField = document.getElementById('character-backstory');
      const notesField = document.getElementById('character-notes');

      expect(nameField.value).to.equal('Gandalf');
      expect(raceField.value).to.equal('Wizard');
      expect(classField.value).to.equal('Mage');
      expect(backstoryField.value).to.equal('A powerful wizard sent to Middle-earth');
      expect(notesField.value).to.equal('Carries a staff and knows many spells');
    });

    it('should handle special characters in form data', function() {
      const testCharacter = {
        name: 'Éowyn',
        race: 'Human',
        class: 'Shield-maiden',
        backstory: 'Daughter of Éomund, niece of Théoden',
        notes: 'Wields a sword and shield'
      };

      Character.populateForm(testCharacter);

      expect(document.getElementById('character-name').value).to.equal('Éowyn');
      expect(document.getElementById('character-race').value).to.equal('Human');
      expect(document.getElementById('character-class').value).to.equal('Shield-maiden');
      expect(document.getElementById('character-backstory').value).to.equal('Daughter of Éomund, niece of Théoden');
      expect(document.getElementById('character-notes').value).to.equal('Wields a sword and shield');
    });
  });
});
