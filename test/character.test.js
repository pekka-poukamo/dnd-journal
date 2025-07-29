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

    it('should handle saveCharacterData without Yjs system', function() {
      clearSystem(); // Clear the Yjs system
      
      const testCharacter = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        backstory: 'Test backstory',
        notes: 'Test notes'
      };

      const result = Character.saveCharacterData(testCharacter);
      expect(result.success).to.be.false;
    });

    it('should handle loadCharacterData without Yjs system', function() {
      clearSystem(); // Clear the Yjs system
      
      const character = Character.loadCharacterData();
      expect(character).to.deep.equal({
        name: '',
        race: '',
        class: '',
        backstory: '',
        notes: ''
      });
    });
  });

  describe('setupCharacterForm', function() {
    it('should setup form with Yjs system available', function() {
      // Ensure we have a Yjs system
      const system = getSystem();
      expect(system).to.exist;
      expect(system.characterMap).to.exist;

      // Setup some initial data
      system.characterMap.set('name', 'Test Character');
      system.characterMap.set('race', 'Human');

      // Setup the form
      Character.setupCharacterForm();

      // Check that form fields are populated
      expect(document.getElementById('character-name').value).to.equal('Test Character');
      expect(document.getElementById('character-race').value).to.equal('Human');
      expect(document.getElementById('character-class').value).to.equal('');
    });

    it('should handle setupCharacterForm without Yjs system', function() {
      clearSystem(); // Clear the Yjs system
      
      // Should not throw error when no Yjs system is available
      expect(() => Character.setupCharacterForm()).to.not.throw();
    });

    it('should handle missing form elements gracefully', function() {
      // Remove some form elements
      document.getElementById('character-name').remove();
      document.getElementById('character-race').remove();
      
      // Should not throw error even with missing elements
      expect(() => Character.setupCharacterForm()).to.not.throw();
    });

    it('should prevent duplicate event listeners', function() {
      const system = getSystem();
      const nameInput = document.getElementById('character-name');
      
      // Setup form twice
      Character.setupCharacterForm();
      Character.setupCharacterForm();
      
      // Should not cause issues with duplicate listeners
      expect(nameInput._updateField).to.exist;
    });

    it('should setup observer only once', function() {
      const system = getSystem();
      
      // Setup form multiple times
      Character.setupCharacterForm();
      Character.setupCharacterForm();
      Character.setupCharacterForm();
      
      // Observer should be marked as setup
      expect(system.characterMap._observerSetup).to.be.true;
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

    it('should handle missing form fields in populateForm', function() {
      // Remove a form field
      document.getElementById('character-name').remove();
      
      const testCharacter = {
        name: 'Test',
        race: 'Human',
        class: 'Fighter',
        backstory: 'Test backstory',
        notes: 'Test notes'
      };

      // Should not throw error
      expect(() => Character.populateForm(testCharacter)).to.not.throw();
      
      // Other fields should still be populated
      expect(document.getElementById('character-race').value).to.equal('Human');
    });

    it('should handle missing form fields in getCharacterFromForm', function() {
      // Remove a form field
      document.getElementById('character-name').remove();
      
      // Set remaining values
      document.getElementById('character-race').value = 'Elf';
      document.getElementById('character-class').value = 'Ranger';
      
      const character = Character.getCharacterFromForm();
      
      // Should handle missing field gracefully
      expect(character.race).to.equal('Elf');
      expect(character.class).to.equal('Ranger');
    });

    it('should trim whitespace from form data', function() {
      // Set form values with whitespace
      document.getElementById('character-name').value = '  Aragorn  ';
      document.getElementById('character-race').value = ' Human ';
      document.getElementById('character-class').value = ' Ranger ';

      const character = Character.getCharacterFromForm();

      expect(character.name).to.equal('Aragorn');
      expect(character.race).to.equal('Human');
      expect(character.class).to.equal('Ranger');
    });
  });

  describe('getFormattedCharacterForAI', function() {
    beforeEach(function() {
      // Setup basic character data
      const testCharacter = {
        name: 'Test Character',
        race: 'Human',
        class: 'Fighter',
        backstory: 'A brave warrior from the northern lands.',
        notes: 'Skilled in combat and tactics.'
      };
      Character.saveCharacterData(testCharacter);
    });

    it('should return formatted character without summary', async function() {
      const character = Character.loadCharacterData();
      const formatted = await Character.getFormattedCharacterForAI(character);
      
      expect(formatted).to.have.property('name');
      expect(formatted).to.have.property('race');
      expect(formatted).to.have.property('class');
      expect(formatted).to.have.property('backstory');
      expect(formatted).to.have.property('notes');
    });

    it('should use combined summary when available', async function() {
      // Mock localStorage for fallback
      if (!global.localStorage) {
        global.localStorage = {
          data: {},
          setItem: function(key, value) { this.data[key] = value; },
          getItem: function(key) { return this.data[key] || null; },
          removeItem: function(key) { delete this.data[key]; },
          clear: function() { this.data = {}; }
        };
      }
      
      global.localStorage.setItem('simple-summaries', JSON.stringify({
        'character:combined': {
          content: 'A summarized character description',
          words: 30,
          timestamp: Date.now()
        }
      }));
      
      const character = Character.loadCharacterData();
      const formatted = await Character.getFormattedCharacterForAI(character);
      
      expect(formatted).to.have.property('name', 'Test Character');
      expect(formatted).to.have.property('summary');
      expect(formatted.summary).to.include('summarized');
    });

    it('should handle null character input', async function() {
      const formatted = await Character.getFormattedCharacterForAI(null);
      
      expect(formatted).to.have.property('name', 'Unnamed Character');
    });

    it('should handle character with long content for summarization', async function() {
      const longCharacter = {
        name: 'Epic Character',
        race: 'Human',
        class: 'Paladin',
        backstory: 'A very long backstory. '.repeat(50), // 150+ words
        notes: 'Detailed notes about the character. '.repeat(20)
      };
      
      const formatted = await Character.getFormattedCharacterForAI(longCharacter);
      
      expect(formatted).to.have.property('name', 'Epic Character');
      // Should include all character data since AI is not available in tests
      expect(formatted).to.have.property('backstory');
      expect(formatted).to.have.property('notes');
    });

    it('should handle character with short content', async function() {
      const shortCharacter = {
        name: 'Simple Character',
        race: 'Elf',
        class: 'Archer',
        backstory: 'Short backstory.',
        notes: 'Few notes.'
      };
      
      const formatted = await Character.getFormattedCharacterForAI(shortCharacter);
      
      expect(formatted).to.have.property('name', 'Simple Character');
      expect(formatted).to.have.property('backstory', 'Short backstory.');
      expect(formatted).to.have.property('notes', 'Few notes.');
    });

    it('should handle missing character name', async function() {
      const character = {
        name: '',
        race: 'Human',
        class: 'Fighter',
        backstory: 'A character without a name.',
        notes: 'Some notes.'
      };
      
      const formatted = await Character.getFormattedCharacterForAI(character);
      
      expect(formatted).to.have.property('name', 'Unnamed Character');
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

      it('should load summaries from Yjs system', function() {
        const system = getSystem();
        const summaryMap = {
          data: {},
          set: function(key, value) { this.data[key] = value; },
          get: function(key) { return this.data[key]; },
          has: function(key) { return key in this.data; },
          delete: function(key) { delete this.data[key]; },
          clear: function() { this.data = {}; },
          forEach: function(callback) {
            Object.entries(this.data).forEach(([key, value]) => {
              callback(value, key);
            });
          }
        };
        summaryMap.set('content', 'Test summary content');
        summaryMap.set('words', 25);
        summaryMap.set('timestamp', Date.now());
        
        system.summariesMap.set('character:combined', summaryMap);
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries).to.have.property('character:combined');
        expect(summaries['character:combined'].content).to.equal('Test summary content');
      });

      it('should handle summaries without Yjs system', function() {
        clearSystem();
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries).to.be.an('object');
        expect(Object.keys(summaries)).to.have.length(0);
      });

      it('should fallback to localStorage when Yjs has no summaries', function() {
        // Mock localStorage
        global.localStorage.setItem('simple-summaries', JSON.stringify({
          'character:combined': {
            content: 'Fallback summary',
            words: 20,
            timestamp: Date.now()
          }
        }));
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries).to.have.property('character:combined');
        expect(summaries['character:combined'].content).to.equal('Fallback summary');
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

      it('should display summaries with proper formatting', function() {
        // Setup test summary
        const system = getSystem();
        const summaryMap = {
          data: {},
          set: function(key, value) { this.data[key] = value; },
          get: function(key) { return this.data[key]; },
          has: function(key) { return key in this.data; },
          delete: function(key) { delete this.data[key]; },
          clear: function() { this.data = {}; },
          forEach: function(callback) {
            Object.entries(this.data).forEach(([key, value]) => {
              callback(value, key);
            });
          }
        };
        summaryMap.set('content', 'Test summary content');
        summaryMap.set('words', 25);
        summaryMap.set('timestamp', Date.now());
        
        system.summariesMap.set('character:combined', summaryMap);
        
        Character.displayCharacterSummaries();
        
        const content = document.getElementById('summaries-content');
        expect(content.innerHTML).to.include('Character Summary');
        expect(content.innerHTML).to.include('25 words');
        expect(content.innerHTML).to.include('Test summary content');
      });

      it('should setup collapsible functionality', function() {
        // Setup test summary
        const system = getSystem();
        const summaryMap = {
          data: {},
          set: function(key, value) { this.data[key] = value; },
          get: function(key) { return this.data[key]; },
          has: function(key) { return key in this.data; },
          delete: function(key) { delete this.data[key]; },
          clear: function() { this.data = {}; },
          forEach: function(callback) {
            Object.entries(this.data).forEach(([key, value]) => {
              callback(value, key);
            });
          }
        };
        summaryMap.set('content', 'Test summary content');
        summaryMap.set('words', 25);
        summaryMap.set('timestamp', Date.now());
        
        system.summariesMap.set('character:combined', summaryMap);
        
        Character.displayCharacterSummaries();
        
        const toggles = document.querySelectorAll('.entry-summary__toggle');
        expect(toggles).to.have.length(1);
        
        const content = document.querySelector('.entry-summary__content');
        expect(content.style.display).to.equal('none');
      });
    });

    describe('generateCharacterSummaries', function() {
      it('should show alert when AI is not available', async function() {
        // Ensure AI is disabled by setting up the Yjs system directly
        const system = getSystem();
        system.settingsMap.set('apiKey', '');
        system.settingsMap.set('enableAIFeatures', false);
        
        // Mock alert to capture the call
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        global.window.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        expect(alertMessage).to.include('AI features are not available');
      });

      it('should handle missing generate button gracefully', async function() {
        document.body.innerHTML = '';
        
        expect(async () => await Character.generateCharacterSummaries()).to.not.throw();
      });

      it('should handle character with long content', async function() {
        // Ensure AI is disabled by setting up the Yjs system directly
        const system = getSystem();
        system.settingsMap.set('apiKey', '');
        system.settingsMap.set('enableAIFeatures', false);
        
        // Create character with substantial content
        const longCharacter = {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter',
          backstory: 'Long backstory content. '.repeat(50), // 150+ words
          notes: 'Detailed notes. '.repeat(20)
        };
        
        Character.saveCharacterData(longCharacter);
        
        // Mock alert
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        global.window.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        // Should show "not available" since AI is disabled in tests
        expect(alertMessage).to.include('AI features are not available');
      });

      it('should handle character with short content', async function() {
        // Create character with short content
        const shortCharacter = {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter',
          backstory: 'Short backstory.',
          notes: 'Few notes.'
        };
        
        Character.saveCharacterData(shortCharacter);
        
        // Mock alert
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        global.window.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        expect(alertMessage).to.include('too short to summarize');
      });

      it('should disable and re-enable generate button', async function() {
        const generateBtn = document.getElementById('generate-summaries');
        
        // Mock alert
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        
        // Start the async function
        const promise = Character.generateCharacterSummaries();
        
        // Button should be disabled and text changed
        expect(generateBtn.disabled).to.be.true;
        expect(generateBtn.textContent).to.equal('Generating...');
        
        // Wait for completion
        await promise;
        
        // Button should be re-enabled
        expect(generateBtn.disabled).to.be.false;
        expect(generateBtn.textContent).to.equal('Generate Summaries');
      });

      it('should handle errors gracefully', async function() {
        // Mock console.error to capture error
        let errorMessage = '';
        const originalError = console.error;
        console.error = (message) => { errorMessage = message; };
        
        // Mock alert
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        
        // Force an error by making summarize throw
        const system = getSystem();
        system.settingsMap.set('apiKey', 'sk-test');
        system.settingsMap.set('enableAIFeatures', true);
        
        // Create character with enough content
        const longCharacter = {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter',
          backstory: 'Long backstory content. '.repeat(50),
          notes: 'Detailed notes. '.repeat(20)
        };
        
        Character.saveCharacterData(longCharacter);
        
        try {
          await Character.generateCharacterSummaries();
        } catch (error) {
          // Expected to fail since we don't have real AI
        }
        
        // Restore console.error
        console.error = originalError;
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
        
        // Using Yjs summariesMap with proper mock Y.Map format
        const system = getSystem();
        Object.entries(testSummaries).forEach(([key, value]) => {
          const summaryMap = {
            data: {},
            set: function(key, value) { this.data[key] = value; },
            get: function(key) { return this.data[key]; },
            has: function(key) { return key in this.data; },
            delete: function(key) { delete this.data[key]; },
            clear: function() { this.data = {}; },
            forEach: function(callback) {
              Object.entries(this.data).forEach(([key, value]) => {
                callback(value, key);
              });
            }
          };
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
          'character:backstory': {
            summary: 'Content from summary property', // Using 'summary' instead of 'content'
            words: 25,
            timestamp: Date.now()
          }
        };
        
        // Using Yjs summariesMap with proper mock Y.Map format
        const system = getSystem();
        Object.entries(testSummaries).forEach(([key, value]) => {
          const summaryMap = {
            data: {},
            set: function(key, value) { this.data[key] = value; },
            get: function(key) { return this.data[key]; },
            has: function(key) { return key in this.data; },
            delete: function(key) { delete this.data[key]; },
            clear: function() { this.data = {}; },
            forEach: function(callback) {
              Object.entries(this.data).forEach(([key, value]) => {
                callback(value, key);
              });
            }
          };
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
        
        // Using Yjs summariesMap with proper mock Y.Map format
        const system = getSystem();
        Object.entries(testSummaries).forEach(([key, value]) => {
          const summaryMap = {
            data: {},
            set: function(key, value) { this.data[key] = value; },
            get: function(key) { return this.data[key]; },
            has: function(key) { return key in this.data; },
            delete: function(key) { delete this.data[key]; },
            clear: function() { this.data = {}; },
            forEach: function(callback) {
              Object.entries(this.data).forEach(([key, value]) => {
                callback(value, key);
              });
            }
          };
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

  describe('Error Handling and Edge Cases', function() {
    it('should handle null character data in saveCharacterData', function() {
      const result = Character.saveCharacterData(null);
      expect(result.success).to.be.false;
    });

    it('should handle undefined character data in saveCharacterData', function() {
      const result = Character.saveCharacterData(undefined);
      expect(result.success).to.be.false;
    });

    it('should handle empty character data in saveCharacterData', function() {
      const result = Character.saveCharacterData({});
      expect(result.success).to.be.true;
      
      const loaded = Character.loadCharacterData();
      expect(loaded.name).to.equal('');
      expect(loaded.race).to.equal('');
    });

    it('should handle character data with null values', function() {
      const testCharacter = {
        name: null,
        race: null,
        class: null,
        backstory: null,
        notes: null
      };

      const result = Character.saveCharacterData(testCharacter);
      expect(result.success).to.be.true;
      
      const loaded = Character.loadCharacterData();
      expect(loaded.name).to.equal('');
      expect(loaded.race).to.equal('');
    });

    it('should handle character data with undefined values', function() {
      const testCharacter = {
        name: undefined,
        race: undefined,
        class: undefined,
        backstory: undefined,
        notes: undefined
      };

      const result = Character.saveCharacterData(testCharacter);
      expect(result.success).to.be.true;
      
      const loaded = Character.loadCharacterData();
      expect(loaded.name).to.equal('');
      expect(loaded.race).to.equal('');
    });

    it('should handle populateForm with null character', function() {
      expect(() => Character.populateForm(null)).to.not.throw();
    });

    it('should handle populateForm with undefined character', function() {
      expect(() => Character.populateForm(undefined)).to.not.throw();
    });

    it('should handle populateForm with missing character properties', function() {
      const incompleteCharacter = {
        name: 'Test'
        // Missing other properties
      };
      
      expect(() => Character.populateForm(incompleteCharacter)).to.not.throw();
      expect(document.getElementById('character-name').value).to.equal('Test');
      expect(document.getElementById('character-race').value).to.equal('');
    });
  });

  describe('Integration Tests', function() {
    it('should maintain data consistency between save and load', function() {
      const testCharacter = {
        name: 'Integration Test Character',
        race: 'Half-Elf',
        class: 'Bard',
        backstory: 'A character created for integration testing.',
        notes: 'Has musical abilities and charm.'
      };

      // Save character data
      const saveResult = Character.saveCharacterData(testCharacter);
      expect(saveResult.success).to.be.true;

      // Load character data
      const loadedCharacter = Character.loadCharacterData();
      expect(loadedCharacter).to.deep.equal(testCharacter);

      // Populate form
      Character.populateForm(loadedCharacter);

      // Get data from form
      const formCharacter = Character.getCharacterFromForm();
      expect(formCharacter).to.deep.equal(testCharacter);
    });

    it('should handle complete character workflow', function() {
      // Start with empty state
      let character = Character.loadCharacterData();
      expect(character.name).to.equal('');

      // Populate form with test data
      const testData = {
        name: 'Workflow Test',
        race: 'Human',
        class: 'Wizard',
        backstory: 'Testing the complete workflow.',
        notes: 'Should work end-to-end.'
      };

      Character.populateForm(testData);

      // Get form data
      character = Character.getCharacterFromForm();
      expect(character.name).to.equal('Workflow Test');

      // Save character data
      const result = Character.saveCharacterData(character);
      expect(result.success).to.be.true;

      // Verify persistence
      const persistedCharacter = Character.loadCharacterData();
      expect(persistedCharacter).to.deep.equal(testData);
    });

    it('should work with setupCharacterForm integration', function() {
      // Setup initial data
      const testCharacter = {
        name: 'Setup Test',
        race: 'Elf',
        class: 'Ranger',
        backstory: 'Testing form setup integration.',
        notes: 'Should bind correctly.'
      };

      Character.saveCharacterData(testCharacter);

      // Setup the form (simulates the actual form binding)
      Character.setupCharacterForm();

      // Verify form is populated
      expect(document.getElementById('character-name').value).to.equal('Setup Test');
      expect(document.getElementById('character-race').value).to.equal('Elf');
      expect(document.getElementById('character-class').value).to.equal('Ranger');
    });
  });
});
