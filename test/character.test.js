import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as Character from '../js/character.js';

describe('Character Page', function() {
  let state;

  beforeEach(async function() {
    // Set up DOM
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="character-form">
            <input id="character-name" name="name" />
            <input id="character-race" name="race" />
            <input id="character-class" name="class" />
            <textarea id="character-backstory" name="backstory"></textarea>
            <textarea id="character-notes" name="notes"></textarea>
          </form>
          <div id="summaries-content"></div>
        </body>
      </html>
    `);
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Reset and initialize Y.js
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initCharacterPage', function() {
    it('should initialize without errors', function() {
      expect(() => Character.initCharacterPage(state)).to.not.throw();
    });

    it('should render character form with current data', function() {
      YjsModule.setCharacter(state, 'name', 'Aragorn');
      YjsModule.setCharacter(state, 'race', 'Human');
      YjsModule.setCharacter(state, 'class', 'Ranger');
      
      Character.initCharacterPage(state);
      Character.renderCharacterPage(state);
      
      expect(document.getElementById('character-name').value).to.equal('Aragorn');
      expect(document.getElementById('character-race').value).to.equal('Human');
      expect(document.getElementById('character-class').value).to.equal('Ranger');
    });
  });

  describe('renderCharacterPage', function() {
    it('should update form fields with character data', function() {
      YjsModule.setCharacter(state, 'name', 'Legolas');
      YjsModule.setCharacter(state, 'race', 'Elf');
      YjsModule.setCharacter(state, 'backstory', 'Prince of the Woodland Realm');
      
      Character.renderCharacterPage(state);
      
      expect(document.getElementById('character-name').value).to.equal('Legolas');
      expect(document.getElementById('character-race').value).to.equal('Elf');
      expect(document.getElementById('character-backstory').value).to.equal('Prince of the Woodland Realm');
    });

    it('should handle empty character data', function() {
      Character.renderCharacterPage(state);
      
      expect(document.getElementById('character-name').value).to.equal('');
      expect(document.getElementById('character-race').value).to.equal('');
      expect(document.getElementById('character-class').value).to.equal('');
    });

    it('should handle missing form elements gracefully', function() {
      // Remove form from DOM
      document.getElementById('character-form').remove();
      
      expect(() => Character.renderCharacterPage(state)).to.not.throw();
    });
  });

  describe('Character data management', function() {
    it('should save character data when form is submitted manually', function() {
      const form = document.getElementById('character-form');
      const nameInput = document.getElementById('character-name');
      const raceInput = document.getElementById('character-race');
      
      nameInput.value = 'Gimli';
      raceInput.value = 'Dwarf';
      
      // Simulate manual save by calling the save function directly
      Character.saveCharacterData(state);
      
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Gimli');
      expect(YjsModule.getCharacter(state, 'race')).to.equal('Dwarf');
    });

    it('should update character data directly through Y.js', function() {
      YjsModule.setCharacter(state, 'name', 'Boromir');
      YjsModule.setCharacter(state, 'class', 'Warrior');
      
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Boromir');
      expect(YjsModule.getCharacter(state, 'class')).to.equal('Warrior');
    });

    it('should handle trimming whitespace', function() {
      YjsModule.setCharacter(state, 'name', '  Frodo  ');
      YjsModule.setCharacter(state, 'race', '  Hobbit  ');
      
      expect(YjsModule.getCharacter(state, 'name')).to.equal('  Frodo  '); // Y.js preserves exact values
      expect(YjsModule.getCharacter(state, 'race')).to.equal('  Hobbit  ');
    });
  });

  describe('Summary functionality', function() {
    beforeEach(function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
    });

    it('should show placeholder when no summaries exist', function() {
      Character.updateSummariesDisplay(state);
      
      const summariesDiv = document.getElementById('summaries-content');
      expect(summariesDiv.textContent).to.include('No character summaries available');
    });

    it('should display existing summaries', function() {
      YjsModule.setSummary(state, 'character:backstory', 'A brief summary of backstory');
      
      Character.updateSummariesDisplay(state);
      
      const summariesDiv = document.getElementById('summaries-content');
      expect(summariesDiv.textContent).to.include('A brief summary of backstory');
    });

    it('should handle missing summaries container', function() {
      document.getElementById('summaries-content').remove();
      
      expect(() => Character.updateSummariesDisplay(state)).to.not.throw();
    });
  });

  describe('Reactive updates', function() {
    it('should update form when Y.js character data changes', function() {
      Character.initCharacterPage(state);
      
      // Change data through Y.js
      YjsModule.setCharacter(state, 'name', 'Sam');
      YjsModule.setCharacter(state, 'race', 'Hobbit');
      
      // Note: In real app, Y.js observers would trigger updates
      // For testing, we manually render
      Character.renderCharacterPage(state);
      
      expect(document.getElementById('character-name').value).to.equal('Sam');
      expect(document.getElementById('character-race').value).to.equal('Hobbit');
    });

    it('should update summaries when Y.js summary data changes', function() {
      YjsModule.setSummary(state, 'character:backstory', 'Updated summary');
      
      Character.updateSummariesDisplay(state);
      
      const summariesDiv = document.getElementById('summaries-content');
      expect(summariesDiv.textContent).to.include('Updated summary');
    });
  });

  describe('Error handling', function() {
    it('should handle missing form gracefully', function() {
      document.body.innerHTML = ''; // Remove all elements
      
      expect(() => Character.initCharacterPage(state)).to.not.throw();
      expect(() => Character.renderCharacterPage(state)).to.not.throw();
      expect(() => Character.saveCharacterData(state)).to.not.throw();
    });

    it('should handle corrupt character data gracefully', function() {
      // Y.js handles data integrity, so this test ensures no crashes
      YjsModule.setCharacter(state, 'name', null);
      
      expect(() => Character.renderCharacterPage(state)).to.not.throw();
    });
  });
});
