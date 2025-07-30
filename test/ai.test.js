import { expect } from 'chai';
import './setup.js';
import * as AI from '../js/ai.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';
import * as YjsModule from '../js/yjs.js';

describe('AI Module', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('isAIEnabled', function() {
    it('should return false when AI is disabled', function() {
      YjsModule.setSetting('ai-enabled', false);
      expect(AI.isAIEnabled()).to.be.false;
    });

    it('should return true when AI is enabled and API key is set', function() {
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      expect(AI.isAIEnabled()).to.be.true;
    });

    it('should return false when AI setting is not set', function() {
      expect(AI.isAIEnabled()).to.be.false;
    });
  });

  describe('loadAISettings', function() {
    it('should load AI settings from Y.js', function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      const settings = AI.loadAISettings();
      expect(settings).to.have.property('apiKey', 'sk-test123');
      expect(settings).to.have.property('enableAIFeatures', true);
    });

    it('should return default settings when none exist', function() {
      const settings = AI.loadAISettings();
      expect(settings).to.have.property('apiKey', '');
      expect(settings).to.have.property('enableAIFeatures', false);
    });
  });

  describe('getEntrySummary', function() {
    beforeEach(function() {
      // Enable AI for summary tests
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    it('should return existing summary if available', async function() {
      const entry = { id: 'test-entry-1' };
      const existingSummary = 'Existing summary content';
      
      // Set existing summary
      YjsModule.setSummary('test-entry-1', existingSummary);
      
      const result = await AI.getEntrySummary(entry);
      expect(result).to.equal(existingSummary);
    });

    it('should return null when no summary exists and AI disabled', async function() {
      YjsModule.setSetting('ai-enabled', false);
      
      const entry = { id: 'test-entry-2' };
      const result = await AI.getEntrySummary(entry);
      expect(result).to.be.null;
    });

    it('should handle entry without ID', async function() {
      const entry = {};
      const result = await AI.getEntrySummary(entry);
      expect(result).to.be.null;
    });
  });

  describe('createIntrospectionPrompt', function() {
    it('should create prompt with character data', function() {
      const character = {
        name: 'Frodo',
        race: 'Hobbit',
        class: 'Burglar'
      };
      const entries = [];
      
      const prompt = AI.createIntrospectionPrompt(character, entries);
      expect(prompt).to.be.a('string');
      expect(prompt).to.include('Frodo');
      expect(prompt).to.include('Hobbit');
    });

    it('should handle empty character', function() {
      const character = {};
      const entries = [];
      
      const prompt = AI.createIntrospectionPrompt(character, entries);
      expect(prompt).to.be.a('string');
    });
  });

  describe('estimateTokenCount', function() {
    it('should estimate tokens for text', async function() {
      const text = 'Hello world';
      const tokens = await AI.estimateTokenCount(text);
      expect(tokens).to.be.a('number');
      expect(tokens).to.be.greaterThan(0);
    });

    it('should handle empty text', async function() {
      const tokens = await AI.estimateTokenCount('');
      expect(tokens).to.equal(0);
    });

    it('should handle null text', async function() {
      const tokens = await AI.estimateTokenCount(null);
      expect(tokens).to.equal(0);
    });
  });

  describe('calculateTotalTokens', function() {
    it('should calculate tokens for message array', async function() {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];
      
      const total = await AI.calculateTotalTokens(messages);
      expect(total).to.be.a('number');
      expect(total).to.be.greaterThan(0);
    });

    it('should handle empty message array', async function() {
      const total = await AI.calculateTotalTokens([]);
      expect(total).to.equal(0);
    });
  });

  describe('getPromptDescription', function() {
    it('should return description string', function() {
      const description = AI.getPromptDescription();
      expect(description).to.be.a('string');
      expect(description.length).to.be.greaterThan(0);
    });
  });

  describe('Integration with OpenAI Wrapper', function() {
    it('should use OpenAI wrapper for API availability', function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
    });

    it('should handle missing API key', function() {
      YjsModule.setSetting('ai-enabled', true);
      // No API key set
      
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });
  });
});
