import { expect } from 'chai';
import './setup.js';
import * as AI from '../js/ai.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';
import { initializeYjs, clearSystem } from '../js/yjs.js';
import * as Settings from '../js/settings.js';

describe('AI Module', function() {
  beforeEach(async function() {
    // Clear and reinitialize Yjs direct system
    clearSystem();
    await initializeYjs();
    
    // Set up mock settings with API key for AI tests
    Settings.saveSettings({
      apiKey: 'sk-test123',
      enableAIFeatures: true
    });
  });

  afterEach(function() {
    clearSystem();
  });

  describe('estimateTokenCount', function() {
    it('should estimate token count for text using tiktoken', function() {
      const testText = 'This is a test string for token estimation.';
      const tokens = AI.estimateTokenCount(testText);
      
      expect(tokens).to.be.a('number');
      expect(tokens).to.be.greaterThan(0);
      expect(tokens).to.be.lessThan(50); // Reasonable upper bound for this short text
    });

    it('should handle empty text', function() {
      const tokens = AI.estimateTokenCount('');
      expect(tokens).to.equal(0);
    });

    it('should handle null/undefined text', function() {
      expect(AI.estimateTokenCount(null)).to.equal(0);
      expect(AI.estimateTokenCount(undefined)).to.equal(0);
    });
  });

  describe('isAIEnabled', function() {
    it('should return true when AI features are enabled and API key is set', function() {
      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.true;
    });

    it('should return false with default settings', async function() {
      // Clear settings completely and reinitialize with no settings
      clearSystem();
      await initializeYjs();
      // Explicitly set empty settings to override any defaults
      Settings.saveSettings({
        apiKey: '',
        enableAIFeatures: false
      });
      
      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.false;
    });

    it('should return false when API key is missing', async function() {
      Settings.saveSettings({
        apiKey: '',
        enableAIFeatures: true
      });
      
      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.false;
    });

    it('should return false when AI features are disabled', async function() {
      Settings.saveSettings({
        apiKey: 'sk-test123',
        enableAIFeatures: false
      });
      
      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.false;
    });
  });

  describe('getIntrospectionPromptForPreview', function() {
    beforeEach(async function() {
      clearSystem();
      await initializeYjs();
      
      // Set up AI settings to enable AI features
      Settings.saveSettings({
        apiKey: 'sk-test123',
        enableAIFeatures: true
      });
    });

    it('should return complete prompt structure', async function() {
      const result = await AI.getIntrospectionPromptForPreview();
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('systemPrompt');
      expect(result).to.have.property('userPrompt');
      expect(result).to.have.property('totalTokens');
      expect(result.systemPrompt).to.be.a('string');
      expect(result.userPrompt).to.be.a('string');
      expect(result.totalTokens).to.be.a('number');
      // Should contain some expected elements for D&D introspection
      expect(result.systemPrompt.toLowerCase()).to.include('d&d');
    });

    it('should work even when AI is disabled', async function() {
      Settings.saveSettings({
        apiKey: '',
        enableAIFeatures: false
      });
      
      const result = await AI.getIntrospectionPromptForPreview();
      // Function returns structure regardless of AI status for preview purposes
      expect(result).to.be.an('object');
      expect(result).to.have.property('systemPrompt');
      expect(result).to.have.property('userPrompt');
    });
  });

  describe('getFormattedEntriesForAI', function() {
    beforeEach(async function() {
      clearSystem();
      await initializeYjs();
    });

    it('should return empty array when no data exists', function() {
      const formattedEntries = AI.getFormattedEntriesForAI();
      expect(formattedEntries).to.be.an('array');
      expect(formattedEntries).to.have.length(0);
    });
  });
});
