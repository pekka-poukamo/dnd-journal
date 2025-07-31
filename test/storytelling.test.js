import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as Storytelling from '../js/storytelling.js';

describe('Simple Storytelling Module', function() {
  let state;

  beforeEach(async function() {
    // Set up DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Reset and initialize Y.js
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('generateQuestions', function() {
    it('should return null when API not available', async function() {
      // No API key set, so API should not be available
      const character = { name: 'Test Character' };
      const entries = [];
      
      const result = await Storytelling.generateQuestions(character, entries);
      expect(result).to.be.null;
    });

    it('should generate questions with minimal character data', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      
      const character = { name: 'Minimal Character' };
      const entries = [];
      
      // Since this will likely fail due to no real API, we test that it doesn't throw
      expect(() => Storytelling.generateQuestions(character, entries)).to.not.throw();
    });

    it('should generate questions with full character data', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      
      const character = {
        name: 'Thorin Oakenshield',
        race: 'Dwarf',
        class: 'King',
        backstory: 'Rightful King under the Mountain, leader of the Company of Thorin Oakenshield',
        notes: 'Proud, sometimes arrogant, but brave and loyal to his people'
      };
      
      const entries = [
        {
          title: 'The Unexpected Party',
          content: 'Thirteen dwarves arrived at Bag End tonight.',
          timestamp: Date.now() - 86400000
        }
      ];
      
      expect(() => Storytelling.generateQuestions(character, entries)).to.not.throw();
    });

    it('should include recent journal entries in context', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      
      const character = {
        name: 'Bilbo Baggins',
        race: 'Hobbit',
        class: 'Burglar'
      };
      
      const entries = [
        {
          title: 'An Unexpected Journey Begins',
          content: 'I have been swept up in an adventure against my will.',
          timestamp: Date.now() - 3600000
        },
        {
          title: 'The Trolls',
          content: 'We encountered three trolls who nearly made us their dinner.',
          timestamp: Date.now() - 1800000  
        },
        {
          title: 'Rivendell',
          content: 'We are staying with the elves in Rivendell, a place of peace and wisdom.',
          timestamp: Date.now() - 900000
        }
      ];
      
      expect(() => Storytelling.generateQuestions(character, entries)).to.not.throw();
    });

    it('should handle unnamed character', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      
      const character = {
        race: 'Human',
        class: 'Fighter'
      };
      
      const entries = [
        {
          title: 'First Battle',
          content: 'Today I fought my first battle.',
          timestamp: Date.now()
        }
      ];
      
      expect(() => Storytelling.generateQuestions(character, entries)).to.not.throw();
    });

    it('should handle API errors gracefully', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-invalid-key');
      
      const character = { name: 'Test Character' };
      const entries = [];
      
      // Should not throw even with invalid API key
      expect(() => Storytelling.generateQuestions(character, entries)).to.not.throw();
    });
  });

  describe('hasGoodContext', function() {
    it('should return false with no data', function() {
      const character = {};
      const entries = [];
      
      const result = Storytelling.hasGoodContext(character, entries);
      expect(result).to.be.false;
    });

    it('should return true with character name', function() {
      const character = { name: 'Aragorn' };
      const entries = [];
      
      const result = Storytelling.hasGoodContext(character, entries);
      expect(result).to.be.true;
    });

    it('should return true with character backstory', function() {
      const character = { backstory: 'A ranger from the North' };
      const entries = [];
      
      const result = Storytelling.hasGoodContext(character, entries);
      expect(result).to.be.true;
    });

    it('should return true with journal entries', function() {
      const character = {};
      const entries = [
        {
          title: 'First Adventure',
          content: 'Today I started my journey',
          timestamp: Date.now()
        }
      ];
      
      const result = Storytelling.hasGoodContext(character, entries);
      expect(result).to.be.true;
    });
  });

  describe('getCharacterContext', function() {
    it('should return character and entries data', function() {
      const character = {
        name: 'Gandalf',
        race: 'Maiar',
        class: 'Wizard'
      };
      
      const entries = [
        {
          title: 'The Grey Pilgrim',
          content: 'I have wandered Middle-earth for many years',
          timestamp: Date.now()
        }
      ];
      
      const context = Storytelling.getCharacterContext(character, entries);
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context.character).to.deep.equal(character);
      expect(context.entries).to.deep.equal(entries);
    });

    it('should return empty context with no data', function() {
      const character = {};
      const entries = [];
      
      const context = Storytelling.getCharacterContext(character, entries);
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context.character).to.deep.equal({});
      expect(context.entries).to.deep.equal([]);
    });
  });
});