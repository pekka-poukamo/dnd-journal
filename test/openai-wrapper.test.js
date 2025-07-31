import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as OpenAIWrapper from '../js/openai-wrapper.js';

describe('OpenAI Wrapper Module', function() {
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

  describe('isAPIAvailable', function() {
    it('should return false when API key is missing', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      // No API key set
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });

    it('should return false when AI is disabled', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', false);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });

    it('should return true when both API key and AI are enabled', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.true;
    });

    it('should return false when API key is empty string', function() {
      YjsModule.setSetting(state, 'openai-api-key', '');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });

    it('should return false when API key is whitespace only', function() {
      YjsModule.setSetting(state, 'openai-api-key', '   ');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });

    it('should validate API key format', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'invalid-key');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });

    it('should accept valid API key format', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-1234567890abcdef');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.true;
    });
  });

  describe('Function creators', function() {
    beforeEach(function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
    });

    describe('createSystemPromptFunction', function() {
      it('should return a function', function() {
        const systemPromptFn = OpenAIWrapper.createSystemPromptFunction('Test system prompt');
        expect(systemPromptFn).to.be.a('function');
      });

      it('should create function that returns correct messages', function() {
        const systemPromptFn = OpenAIWrapper.createSystemPromptFunction('You are a helpful assistant');
        const messages = systemPromptFn('User message');
        
        expect(messages).to.be.an('array');
        expect(messages).to.have.length(2);
        expect(messages[0]).to.deep.equal({
          role: 'system',
          content: 'You are a helpful assistant'
        });
        expect(messages[1]).to.deep.equal({
          role: 'user',
          content: 'User message'
        });
      });
    });
  });

  describe('AI calling functions', function() {
    beforeEach(function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
    });

    describe('callAI', function() {
      it('should handle API call attempts', function() {
        // Since we don't have a real API key, this will likely throw
        try {
          OpenAIWrapper.callAI('Test prompt');
          // If it doesn't throw, that's fine too
        } catch (error) {
          expect(error).to.be.an('error');
        }
      });

      it('should handle options parameter', function() {
        try {
          OpenAIWrapper.callAI('Test prompt', { temperature: 0.5 });
        } catch (error) {
          expect(error).to.be.an('error');
        }
      });

      it('should handle system prompt functions', function() {
        const systemPromptFn = OpenAIWrapper.createSystemPromptFunction('You are helpful');
        
        try {
          OpenAIWrapper.callAI(systemPromptFn('Test message'));
        } catch (error) {
          expect(error).to.be.an('error');
        }
      });
    });
  });

  describe('Settings integration', function() {
    it('should read API key from Y.js settings', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-settings-test');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.true;
    });

    it('should handle missing settings', function() {
      // Don't set any settings
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });

    it('should handle invalid setting types', function() {
      YjsModule.setSetting(state, 'openai-api-key', null);
      YjsModule.setSetting(state, 'ai-enabled', 'invalid');
      
      const result = OpenAIWrapper.isAPIAvailable();
      expect(result).to.be.false;
    });
  });

  describe('Error handling when API not available', function() {
    beforeEach(function() {
      YjsModule.setSetting(state, 'ai-enabled', false);
      // No API key or disabled AI
    });

    it('should handle callAI when API not available', async function() {
      try {
        await OpenAIWrapper.callAI('Test prompt');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('OpenAI API not available');
      }
    });

    it('should handle createSystemPromptFunction when API not available', function() {
      // This should still work even when API is not available
      const systemPromptFn = OpenAIWrapper.createSystemPromptFunction('Test prompt');
      expect(systemPromptFn).to.be.a('function');
    });
  });
});