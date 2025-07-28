import { expect } from 'chai';
import './setup.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';
import { createSystem, clearSystem } from '../js/yjs.js';
import * as Settings from '../js/settings.js';

describe('OpenAI Wrapper', () => {
  beforeEach(async () => {
    // Reset localStorage and reinitialize Yjs mock system
    global.resetLocalStorage();
    clearSystem();
    await createSystem();
  });

  describe('isAPIAvailable', () => {
    it('should return false when no settings exist', () => {
      const result = OpenAIWrapper.isAPIAvailable();
      result.should.be.false;
    });

    it('should return false when AI features are disabled', () => {
      Settings.saveSettings({
        enableAIFeatures: false,
        apiKey: 'sk-test123'
      });
      
      const result = OpenAIWrapper.isAPIAvailable();
      result.should.be.false;
    });

    it('should return false when API key is missing', () => {
      Settings.saveSettings({
        enableAIFeatures: true,
        apiKey: ''
      });
      
      const result = OpenAIWrapper.isAPIAvailable();
      result.should.be.false;
    });

    it('should return false when API key does not start with sk-', () => {
      Settings.saveSettings({
        enableAIFeatures: true,
        apiKey: 'invalid-key'
      });
      
      const result = OpenAIWrapper.isAPIAvailable();
      result.should.be.false;
    });

    it('should return true when properly configured', () => {
      Settings.saveSettings({
        enableAIFeatures: true,
        apiKey: 'sk-test123'
      });
      
      const result = OpenAIWrapper.isAPIAvailable();
      result.should.be.true;
    });
  });

  describe('createSystemPromptFunction', () => {
    it('should return a function', () => {
      const fn = OpenAIWrapper.createSystemPromptFunction('Test prompt');
      fn.should.be.a('function');
    });

    it('should create function that throws when API not available', async () => {
      const fn = OpenAIWrapper.createSystemPromptFunction('Test prompt');
      
      try {
        await fn('User input');
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });

    it('should accept options parameter', () => {
      const fn = OpenAIWrapper.createSystemPromptFunction('Test prompt', { temperature: 0.5 });
      fn.should.be.a('function');
    });
  });

  describe('createUserPromptFunction', () => {
    it('should return a function', () => {
      const fn = OpenAIWrapper.createUserPromptFunction();
      fn.should.be.a('function');
    });

    it('should create function that throws when API not available', async () => {
      const fn = OpenAIWrapper.createUserPromptFunction();
      
      try {
        await fn('User input');
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });

    it('should accept options parameter', () => {
      const fn = OpenAIWrapper.createUserPromptFunction({ temperature: 0.3 });
      fn.should.be.a('function');
    });
  });

  describe('createTemplateFunction', () => {
    it('should return a function', () => {
      const template = (text, words) => `Summarize ${text} in ${words} words`;
      const fn = OpenAIWrapper.createTemplateFunction(template);
      fn.should.be.a('function');
    });

    it('should create function that throws when API not available', async () => {
      const template = (text) => `Process: ${text}`;
      const fn = OpenAIWrapper.createTemplateFunction(template);
      
      try {
        await fn('test input');
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });

    it('should accept options parameter', () => {
      const template = (text) => `Process: ${text}`;
      const fn = OpenAIWrapper.createTemplateFunction(template, { maxTokens: 100 });
      fn.should.be.a('function');
    });
  });

  describe('callAI', () => {
    it('should throw when API not available', async () => {
      try {
        await OpenAIWrapper.callAI('Test prompt');
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });

    it('should accept options parameter', async () => {
      try {
        await OpenAIWrapper.callAI('Test prompt', { temperature: 0.5 });
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });
  });

  describe('callAIWithSystem', () => {
    it('should throw when API not available', async () => {
      try {
        await OpenAIWrapper.callAIWithSystem('System prompt', 'User prompt');
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });

    it('should accept options parameter', async () => {
      try {
        await OpenAIWrapper.callAIWithSystem('System prompt', 'User prompt', { temperature: 0.5 });
        expect.fail('Should have thrown');
      } catch (error) {
        error.message.should.contain('OpenAI API not available');
      }
    });
  });
});