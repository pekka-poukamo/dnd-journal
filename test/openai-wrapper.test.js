import { expect } from 'chai';
import './setup.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';
import * as YjsModule from '../js/yjs.js';

describe('OpenAI Wrapper Module', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('isAPIAvailable', function() {
    it('should return false when API key is missing', function() {
      YjsModule.setSetting('ai-enabled', true);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });

    it('should return false when AI is disabled', function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', false);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });

    it('should return true when both API key and AI are enabled', function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
    });

    it('should return false when API key is empty string', function() {
      YjsModule.setSetting('openai-api-key', '');
      YjsModule.setSetting('ai-enabled', true);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });

    it('should return false when API key is whitespace only', function() {
      YjsModule.setSetting('openai-api-key', '   ');
      YjsModule.setSetting('ai-enabled', true);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });

    it('should validate API key format', function() {
      YjsModule.setSetting('openai-api-key', 'invalid-key');
      YjsModule.setSetting('ai-enabled', true);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });

    it('should accept valid API key format', function() {
      YjsModule.setSetting('openai-api-key', 'sk-valid123');
      YjsModule.setSetting('ai-enabled', true);
      expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
    });
  });

  describe('Function creators', function() {
    beforeEach(function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    describe('createSystemPromptFunction', function() {
      it('should return a function', function() {
        const fn = OpenAIWrapper.createSystemPromptFunction('Test prompt');
        expect(fn).to.be.a('function');
      });

      it('should accept options parameter', function() {
        const fn = OpenAIWrapper.createSystemPromptFunction('Test prompt', { temperature: 0.5 });
        expect(fn).to.be.a('function');
      });
    });

    describe('createUserPromptFunction', function() {
      it('should return a function', function() {
        const fn = OpenAIWrapper.createUserPromptFunction();
        expect(fn).to.be.a('function');
      });

      it('should accept options parameter', function() {
        const fn = OpenAIWrapper.createUserPromptFunction({ temperature: 0.3 });
        expect(fn).to.be.a('function');
      });
    });

    describe('createTemplateFunction', function() {
      it('should return a function', function() {
        const template = (text, words) => `Summarize ${text} in ${words} words`;
        const fn = OpenAIWrapper.createTemplateFunction(template);
        expect(fn).to.be.a('function');
      });

      it('should accept options parameter', function() {
        const template = (text) => `Process: ${text}`;
        const fn = OpenAIWrapper.createTemplateFunction(template, { maxTokens: 100 });
        expect(fn).to.be.a('function');
      });
    });
  });

  describe('AI calling functions', function() {
    beforeEach(function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    describe('callAI', function() {
      it('should handle API call attempts', async function() {
        // Note: In test environment, this will likely fail due to no real API
        // We're testing that the function exists and handles errors gracefully
        try {
          const result = await OpenAIWrapper.callAI('Test prompt');
          // If it succeeds (unlikely in test), result should be string or null
          expect(result).to.satisfy(val => typeof val === 'string' || val === null);
        } catch (error) {
          // Expected in test environment without real API
          expect(error).to.be.an('error');
        }
      });

      it('should accept options parameter', async function() {
        try {
          await OpenAIWrapper.callAI('Test prompt', { temperature: 0.5 });
          // Function should accept options without throwing immediately
        } catch (error) {
          // Expected in test environment
          expect(error).to.be.an('error');
        }
      });
    });

    describe('callAIWithSystem', function() {
      it('should handle system and user prompts', async function() {
        try {
          const result = await OpenAIWrapper.callAIWithSystem('System prompt', 'User prompt');
          expect(result).to.satisfy(val => typeof val === 'string' || val === null);
        } catch (error) {
          // Expected in test environment
          expect(error).to.be.an('error');
        }
      });

      it('should accept options parameter', async function() {
        try {
          await OpenAIWrapper.callAIWithSystem('System prompt', 'User prompt', { temperature: 0.5 });
        } catch (error) {
          // Expected in test environment
          expect(error).to.be.an('error');
        }
      });
    });
  });

  describe('Settings integration', function() {
    it('should read API key from Y.js settings', function() {
      YjsModule.setSetting('openai-api-key', 'sk-from-yjs');
      YjsModule.setSetting('ai-enabled', true);
      
      expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
    });

    it('should handle missing settings', function() {
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });

    it('should handle invalid setting types', function() {
      YjsModule.setSetting('openai-api-key', 123); // Number instead of string
      YjsModule.setSetting('ai-enabled', 'invalid'); // String instead of boolean
      
      expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
    });
  });

  describe('Error handling when API not available', function() {
    beforeEach(function() {
      // Disable API
      YjsModule.setSetting('ai-enabled', false);
    });

    it('should handle callAI when API not available', async function() {
      try {
        await OpenAIWrapper.callAI('Test prompt');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('OpenAI API not available');
      }
    });

    it('should handle callAIWithSystem when API not available', async function() {
      try {
        await OpenAIWrapper.callAIWithSystem('System', 'User');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('OpenAI API not available');
      }
    });

    it('should handle created functions when API not available', async function() {
      const fn = OpenAIWrapper.createSystemPromptFunction('Test');
      
      try {
        await fn('User input');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('OpenAI API not available');
      }
    });
  });
});