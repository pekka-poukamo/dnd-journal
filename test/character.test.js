import { expect } from 'chai';
import './setup.js';
import * as Character from '../js/character.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';

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
        expect(summaries).to.deep.equal({});
      });

      it('should load summaries from character summaries storage', function() {
        const testSummaries = {
          backstory: {
            summary: 'Character backstory summary',
            words: 25,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(testSummaries));
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries['character:backstory']).to.exist;
        expect(summaries['character:backstory'].content).to.equal('Character backstory summary');
        expect(summaries['character:backstory'].words).to.equal(25);
      });

      it('should load summaries from general summaries storage', function() {
        const testSummaries = {
          'character:notes': {
            content: 'Character notes summary',
            words: 30,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries['character:notes']).to.exist;
        expect(summaries['character:notes'].content).to.equal('Character notes summary');
        expect(summaries['character:notes'].words).to.equal(30);
      });

      it('should combine summaries from both storage locations', function() {
        const characterSummaries = {
          backstory: {
            summary: 'Backstory summary',
            words: 25,
            timestamp: Date.now()
          }
        };
        
        const generalSummaries = {
          'character:notes': {
            content: 'Notes summary',
            words: 30,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(characterSummaries));
        global.localStorage.setItem('simple-summaries', JSON.stringify(generalSummaries));
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries['character:backstory']).to.exist;
        expect(summaries['character:notes']).to.exist;
        expect(Object.keys(summaries)).to.have.length(2);
      });

      it('should handle corrupted storage data gracefully', function() {
        global.localStorage.setItem('simple-dnd-journal-character-summaries', 'invalid-json');
        global.localStorage.setItem('simple-summaries', 'invalid-json');
        
        const summaries = Character.loadCharacterSummaries();
        expect(summaries).to.deep.equal({});
      });
    });

    describe('displayCharacterSummaries', function() {
      it('should display placeholder when no summaries exist', function() {
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('No character summaries available yet');
        expect(summariesContent.innerHTML).to.include('collapsible sections');
      });

      it('should display collapsible summaries when they exist', function() {
        // Test new combined summary format
        const testSummaries = {
          'character:combined': {
            content: 'A comprehensive character summary including backstory and notes',
            words: 50,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('Character Summary');
        expect(summariesContent.innerHTML).to.include('entry-summary');
        expect(summariesContent.innerHTML).to.include('entry-summary__toggle');
        expect(summariesContent.innerHTML).to.include('entry-summary__content');
      });

      it('should display individual summaries for backward compatibility', function() {
        // Test backward compatibility with individual field summaries
        const testSummaries = {
          'character:backstory': {
            content: 'A detailed backstory summary',
            words: 25,
            timestamp: Date.now()
          },
          'character:notes': {
            content: 'Character notes summary',
            words: 30,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('Backstory');
        expect(summariesContent.innerHTML).to.include('Notes');
        expect(summariesContent.innerHTML).to.include('entry-summary');
      });

      it('should handle missing DOM elements gracefully', function() {
        document.getElementById('summaries-content').remove();
        
        // Should not throw an error
        expect(() => Character.displayCharacterSummaries()).to.not.throw();
      });

      it('should create clickable toggle elements', function() {
        const testSummaries = {
          'character:backstory': {
            content: 'A detailed backstory summary',
            words: 25,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        Character.displayCharacterSummaries();
        
        const toggle = document.querySelector('.entry-summary__toggle');
        const content = document.querySelector('.entry-summary__content');
        
        expect(toggle).to.exist;
        expect(content).to.exist;
        expect(content.style.display).to.equal('none');
        
        // Simulate click
        toggle.click();
        expect(content.style.display).to.equal('block');
        
        // Click again to collapse
        toggle.click();
        expect(content.style.display).to.equal('none');
      });

      it('should include word count and timestamp in toggle label', function() {
        const timestamp = Date.now();
        const testSummaries = {
          'character:combined': {
            content: 'A comprehensive character summary',
            words: 45,
            timestamp: timestamp
          }
        };
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        Character.displayCharacterSummaries();
        
        const toggle = document.querySelector('.entry-summary__toggle');
        expect(toggle.innerHTML).to.include('45 words');
        expect(toggle.innerHTML).to.include('Character Summary');
      });

      it('should handle summaries with missing or empty content', function() {
        const testSummaries = {
          'character:backstory': {
            content: '',
            words: 0,
            timestamp: Date.now()
          },
          'character:notes': {
            // Missing content
            words: 10,
            timestamp: Date.now()
          }
        };
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('No summary content available');
      });
    });

    describe('generateCharacterSummaries', function() {
      it('should show alert when AI is not available', async function() {
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        expect(alertMessage).to.include('AI features are not available');
      });

      it('should handle missing generate button gracefully', async function() {
        document.getElementById('generate-summaries').remove();
        
        // Should not throw an error
        let error = null;
        try {
          await Character.generateCharacterSummaries();
        } catch (e) {
          error = e;
        }
        expect(error).to.be.null;
      });

      it('should disable button during generation', async function() {
        const generateBtn = document.getElementById('generate-summaries');
        generateBtn.textContent = 'Generate Summaries'; // Set initial text
        
        // Should not throw even when mocked
        await Character.generateCharacterSummaries();
        
        // Button should be enabled again after completion
        expect(generateBtn.disabled).to.be.false;
        expect(generateBtn.textContent).to.equal('Generate Summaries');
      });

      it('should handle character with long content', async function() {
        // Test with character that has long content but without API
        // This will trigger the "No summaries generated" path
        
        // Store character with long backstory
        const testCharacter = {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter',
          backstory: 'A'.repeat(150), // Long enough content
          notes: 'B'.repeat(150)
        };
        
        global.localStorage.setItem('simple-dnd-journal', JSON.stringify({
          character: testCharacter,
          entries: []
        }));
        
        let alertMessage = '';
        global.alert = (message) => { alertMessage = message; };
        
        await Character.generateCharacterSummaries();
        
        // Since API is not available, should show API error
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
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
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
        
        global.localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(testSummaries));
        
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
        
        global.localStorage.setItem('simple-summaries', JSON.stringify(testSummaries));
        
        Character.displayCharacterSummaries();
        
        const summariesContent = document.getElementById('summaries-content');
        expect(summariesContent.innerHTML).to.include('0 words');
      });
    });
  });
});
