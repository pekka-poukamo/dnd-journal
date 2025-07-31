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
    it('should return false when AI is disabled', function() {
      YjsModule.setSetting(state, 'ai-enabled', false);
      expect(AI.isAIEnabled(state)).to.be.false;
    });

    it('should return true when AI is enabled and API key is set', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      expect(AI.isAIEnabled(state)).to.be.true;
    });
  });

  describe('loadAISettings', function() {
    it('should load AI settings from Y.js', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const settings = AI.loadAISettings(state);
      expect(settings).to.deep.equal({
        apiKey: 'sk-test123',
        enableAIFeatures: true
      });
    });
  });

  describe('getEntrySummary', function() {
    beforeEach(function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
    });

    it('should return existing summary if available', function() {
      const entryId = 'test-entry-1';
      const expectedSummary = 'This is a test summary';
      
      YjsModule.setSummary(state, entryId, expectedSummary);
      
      const summary = AI.getEntrySummary(state, entryId);
      expect(summary).to.equal(expectedSummary);
    });

    it('should return null if no summary exists', function() {
      const summary = AI.getEntrySummary(state, 'non-existent-entry');
      expect(summary).to.be.null;
    });
  });

  describe('createIntrospectionPrompt', function() {
    it('should create prompt with character data', function() {
      const character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        backstory: 'Son of Arathorn'
      };
      
      const entries = [
        { title: 'First Adventure', content: 'We began our quest...', timestamp: Date.now() }
      ];
      
      const prompt = AI.createIntrospectionPrompt(character, entries);
      expect(prompt).to.be.a('string');
      expect(prompt).to.include('Aragorn');
      expect(prompt).to.include('Human');
      expect(prompt).to.include('Ranger');
    });

    it('should handle empty character', function() {
      const character = {};
      const entries = [];
      
      const prompt = AI.createIntrospectionPrompt(character, entries);
      expect(prompt).to.be.a('string');
      expect(prompt).to.include('character');
    });
  });

  describe('Integration with OpenAI Wrapper', function() {
    it('should use OpenAI wrapper for API availability', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      expect(AI.isAIEnabled(state)).to.be.true;
    });

    it('should handle missing API key', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', '');
      expect(AI.isAIEnabled(state)).to.be.false;
    });
  });

  describe('Advanced AI Functions', function() {
    beforeEach(function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
    });

    it('should handle API calls when properly configured', function() {
      // This test just verifies setup doesn't throw
      expect(() => AI.isAIEnabled(state)).to.not.throw();
    });
  });
});
