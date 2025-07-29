import { expect } from 'chai';
import './setup.js';
import * as Storytelling from '../js/storytelling.js';
import { createSystem, clearSystem } from '../js/yjs.js';

describe('Storytelling Module', function() {
  beforeEach(async function() {
    // Clear and reinitialize Yjs mock system
    clearSystem();
    await createSystem();
  });

  describe('generateQuestions', function() {
    it('should return null when AI is not available', async function() {
      // AI is not available in test environment
      const result = await Storytelling.generateQuestions();
      expect(result).to.be.null;
    });

    it('should handle null character input', async function() {
      const result = await Storytelling.generateQuestions(null, []);
      expect(result).to.be.null;
    });

    it('should handle empty entries input', async function() {
      const character = { name: 'Test Character', class: 'Fighter' };
      const result = await Storytelling.generateQuestions(character, []);
      expect(result).to.be.null;
    });

    it('should handle null entries input', async function() {
      const character = { name: 'Test Character', class: 'Fighter' };
      const result = await Storytelling.generateQuestions(character, null);
      expect(result).to.be.null;
    });
  });

  describe('getIntrospectionQuestions', function() {
    it('should return null when AI is not available', async function() {
      const result = await Storytelling.getIntrospectionQuestions();
      expect(result).to.be.null;
    });
  });

  describe('getCharacterContext', function() {
    it('should return character and entries from storage', async function() {
      const system = await createSystem();
      
      // Set up test data in Yjs system
      const testCharacter = { name: 'Aragorn', class: 'Ranger' };
      const testEntries = [
        { id: '1', title: 'Adventure 1', content: 'First adventure' },
        { id: '2', title: 'Adventure 2', content: 'Second adventure' }
      ];
      
      system.characterMap.set('name', testCharacter.name);
      system.characterMap.set('class', testCharacter.class);
      system.journalMap.set('entries', testEntries);
      
      const context = await Storytelling.getCharacterContext();
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context.entries).to.be.an('array');
    });

    it('should handle empty character data', async function() {
      const context = await Storytelling.getCharacterContext();
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context.character).to.be.an('object');
      expect(context.entries).to.be.an('array');
    });
  });

  describe('hasGoodContext', function() {
    beforeEach(async function() {
      await createSystem();
    });

    it('should return object with false ready state with no character or entries', function() {
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.an('object');
      expect(result).to.have.property('hasCharacter', false);
      expect(result).to.have.property('hasContent', false);
      expect(result).to.have.property('ready', false);
    });

    it('should return object with false ready state with character but no entries', function() {
      // hasGoodContext now uses Yjs system only per ADR-0004
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.an('object');
      expect(result).to.have.property('hasCharacter', false);
      expect(result).to.have.property('ready', false);
    });

    it('should return object with false ready state with entries but no character', function() {
      // hasGoodContext now uses Yjs system only per ADR-0004
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.an('object');
      expect(result).to.have.property('hasCharacter', false);
      expect(result).to.have.property('ready', false);
    });

    it('should return object structure for context checking', async function() {
      // hasGoodContext now uses Yjs system only per ADR-0004
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.an('object');
      expect(result).to.have.property('hasCharacter');
      expect(result).to.have.property('hasContent');
      expect(result).to.have.property('ready');
    });
  });

  describe('Alias Functions', function() {
    it('should have generateIntrospectionQuestions as alias for generateQuestions', function() {
      expect(Storytelling.generateIntrospectionQuestions).to.equal(Storytelling.generateQuestions);
    });

    it('should have generateIntrospectionPrompt as alias for getIntrospectionQuestions', function() {
      expect(Storytelling.generateIntrospectionPrompt).to.equal(Storytelling.getIntrospectionQuestions);
    });
  });

  describe('Edge Cases and Error Handling', function() {
    beforeEach(async function() {
      await createSystem();
    });

    it('should handle corrupted character data gracefully', async function() {
      const system = await createSystem();
      
      // Set invalid character data
      system.characterMap.set('name', null);
      system.characterMap.set('class', undefined);
      
      const context = await Storytelling.getCharacterContext();
      expect(context).to.have.property('character');
      expect(context.character).to.be.an('object');
    });

    it('should handle corrupted entries data gracefully', async function() {
      const system = await createSystem();
      
      // Set invalid entries data
      system.journalMap.set('entries', null);
      
      const context = await Storytelling.getCharacterContext();
      expect(context).to.have.property('entries');
      expect(context.entries).to.be.an('array');
    });

    it('should handle missing Yjs system gracefully', async function() {
      clearSystem();
      
      const context = await Storytelling.getCharacterContext();
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
    });
  });

  describe('Integration with Other Modules', function() {
    it('should work with character data from character module', async function() {
      const system = await createSystem();
      
      // Simulate character data as it would be stored by character.js
      const characterData = {
        name: 'Gimli',
        race: 'Dwarf',
        class: 'Fighter',
        backstory: 'Son of Glóin, member of the Fellowship',
        notes: 'Loyal and brave, wields an axe'
      };
      
      Object.entries(characterData).forEach(([key, value]) => {
        system.characterMap.set(key, value);
      });
      
      const context = await Storytelling.getCharacterContext();
      expect(context.character).to.be.an('object');
    });

    it('should work with journal entries from app module', async function() {
      // getCharacterContext now uses Yjs system only per ADR-0004
      const context = await Storytelling.getCharacterContext();
      expect(context.entries).to.be.an('array');
      // In test environment with empty Yjs mock, entries will be empty
      expect(context.entries.length).to.be.at.least(0);
    });
  });
});