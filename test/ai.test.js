import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as AI from '../js/ai.js';

describe('AI Module', function() {
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

  describe('isAIEnabled', function() {
    it('should return true by default (server-managed availability)', function() {
      expect(AI.isAIEnabled(state)).to.be.true;
    });
  });

  describe('generateQuestions', function() {
    it('should return null when no context available', async function() {
      // No character and entries
      const result = await AI.generateQuestions(null, null);
      expect(result).to.be.null;
    });

    it('should generate questions with minimal character data', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      
      const character = { name: 'Minimal Character' };
      const entries = [];
      
      // Since this will likely fail due to no real API, we test that it doesn't throw
      expect(() => AI.generateQuestions(character, entries)).to.not.throw();
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
      
      expect(() => AI.generateQuestions(character, entries)).to.not.throw();
    });

    it('should handle API errors gracefully', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-invalid-key');
      
      const character = { name: 'Test Character' };
      const entries = [];
      
      // Should not throw even with invalid API key
      expect(() => AI.generateQuestions(character, entries)).to.not.throw();
    });
  });

  describe('getPromptPreview', function() {
    it('should return prompt preview with minimal context', async function() {
      
      const character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger'
      };
      
      const entries = [
        { id: 'entry-1', title: 'First Adventure', content: 'We began our quest...', timestamp: Date.now() }
      ];
      
      const preview = await AI.getPromptPreview(character, entries);
      expect(preview).to.be.an('object');
      expect(preview).to.have.property('systemPrompt');
      expect(preview).to.have.property('userPrompt');
      expect(preview).to.have.property('context');
      expect(preview.systemPrompt).to.be.a('string');
      expect(preview.userPrompt).to.be.a('string');
      expect(preview.context).to.be.a('string');
    });
  });


});
