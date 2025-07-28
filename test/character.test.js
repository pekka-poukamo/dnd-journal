import { expect } from 'chai';
import './setup.js';
import * as Character from '../js/character.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';
import * as Settings from '../js/settings.js';
import { createSystem, clearSystem, getSystem, Y } from '../js/yjs.js';

describe('Character Page', function() {
  beforeEach(async function() {
    // Clear and reinitialize Yjs mock system
    clearSystem();
    await createSystem();
    
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
    it('should save and load character data', function() {
      const testCharacter = {
        name: 'Frodo',
        race: 'Hobbit',
        class: 'Burglar',
        backstory: 'A hobbit from the Shire',
        notes: 'Ring-bearer'
      };

      const result = Character.saveCharacterData(testCharacter);
      expect(result.success).to.be.true;
      
      // Verify data is saved by loading it back
      const loadedCharacter = Character.loadCharacterData();
      expect(loadedCharacter).to.deep.equal(testCharacter);
    });

    it('should return default character when no data exists', function() {
      const character = Character.loadCharacterData();
      expect(character).to.have.property('name', '');
      expect(character).to.have.property('race', '');
      expect(character).to.have.property('class', '');
      expect(character).to.have.property('backstory', '');
      expect(character).to.have.property('notes', '');
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

  describe('Character Summaries', function() {
    beforeEach(function() {
      // Add DOM elements needed for summary functionality
      document.body.innerHTML += `
        <div id="summaries-content"></div>
        <button id="refresh-summaries" class="btn btn--secondary">Refresh</button>
        <button id="generate-summaries" class="btn btn--primary">Generate</button>
      `;
    });

    describe('loadCharacterSummaries', function() {
      it('should return empty object when no summaries exist', function() {
        const summaries = Character.loadCharacterSummaries();
        expect(summaries).to.be.an('object');
        expect(Object.keys(summaries)).to.have.length(0);
      });
    });

    describe('displayCharacterSummaries', function() {
      it('should display placeholder when no summaries exist', function() {
        document.body.innerHTML = '<div id="summaries-content"></div>';
        
        Character.displayCharacterSummaries();
        
        const content = document.getElementById('summaries-content');
        expect(content.innerHTML).to.include('No character summaries available yet');
      });

      it('should handle missing DOM elements gracefully', function() {
        document.body.innerHTML = '';
        
        expect(() => Character.displayCharacterSummaries()).to.not.throw();
      });
    });

    describe('generateCharacterSummaries', function() {
      it('should show alert when AI is not available', async function() {
        // Ensure AI is disabled
        const disabledSettings = {
          apiKey: '',
          enableAIFeatures: false
        };
        Settings.saveSettings(disabledSettings);
        
        // Mock window.alert to capture the call
        let alertMessage = '';
        global.window.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        expect(alertMessage).to.include('AI features are not available');
      });

      it('should handle missing generate button gracefully', async function() {
        document.body.innerHTML = '';
        
        expect(async () => await Character.generateCharacterSummaries()).to.not.throw();
      });

      it('should handle character with long content', async function() {
        // Ensure AI is disabled
        const disabledSettings = {
          apiKey: '',
          enableAIFeatures: false
        };
        Settings.saveSettings(disabledSettings);
        
        // Create character with substantial content
        const longCharacter = {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter',
          backstory: 'Long backstory content. '.repeat(50), // 150+ words
          notes: 'Detailed notes. '.repeat(20)
        };
        
        Character.saveCharacterData(longCharacter);
        
        // Mock window.alert
        let alertMessage = '';
        global.window.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        // Should show "not available" since AI is disabled in tests
        expect(alertMessage).to.include('AI features are not available');
      });
    });

    describe('Button visibility logic', function() {
      it('should hide generate button when no API is available', function() {
        const generateBtn = document.getElementById('generate-summaries');
        
        // By default, API is not available in tests
        Character.displayCharacterSummaries();
        
        // Button should remain hidden (style.display is not explicitly set to inline-block)
        expect(generateBtn.style.display).to.not.equal('inline-block');
      });
    });

    describe('Edge cases and error handling', function() {
      it('should handle missing timestamp in summary data', function() {
        const testSummaries = {
          'character:combined': {
            content: 'A summary without timestamp',
            words: 35
            // Missing timestamp
          }
        };
        
        // Using Yjs summariesMap with proper Y.Map format
        const system = getSystem();
        Object.entries(testSummaries).forEach(([key, value]) => {
          const summaryMap = new Y.Map();
          summaryMap.set('content', value.content);
          summaryMap.set('words', value.words || 0);
          summaryMap.set('timestamp', value.timestamp || 0);
          system.summariesMap.set(key, summaryMap);
        });
        
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('Character Summary');
        expect(summariesContent.innerHTML).to.include('Unknown date');
      });

      it('should handle summary content from summary property', function() {
        const testSummaries = {
          backstory: {
            summary: 'Content from summary property', // Using 'summary' instead of 'content'
            words: 25,
            timestamp: Date.now()
          }
        };
        
        // Using Yjs summariesMap with proper Y.Map format
        const system = getSystem();
        Object.entries(testSummaries).forEach(([key, value]) => {
          const summaryMap = new Y.Map();
          summaryMap.set('content', value.summary || value.content);
          summaryMap.set('words', value.words || 0);
          summaryMap.set('timestamp', value.timestamp || Date.now());
          system.summariesMap.set(key, summaryMap);
        });
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries['character:backstory'].content).to.equal('Content from summary property');
      });

      it('should handle zero word count', function() {
        const testSummaries = {
          'character:backstory': {
            content: 'A summary',
            // Missing words property
            timestamp: Date.now()
          }
        };
        
        // Using Yjs summariesMap with proper Y.Map format
        const system = getSystem();
        Object.entries(testSummaries).forEach(([key, value]) => {
          const summaryMap = new Y.Map();
          summaryMap.set('content', value.content);
          summaryMap.set('words', value.words || 0);
          summaryMap.set('timestamp', value.timestamp || Date.now());
          system.summariesMap.set(key, summaryMap);
        });
        
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('0 words');
      });
    });
  });
});
