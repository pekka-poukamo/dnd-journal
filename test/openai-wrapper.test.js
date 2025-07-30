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
  });

  describe('callOpenAI', function() {
    beforeEach(function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    it('should make API call with correct parameters', async function() {
      const originalFetch = global.fetch;
      let capturedRequest = null;
      
      global.fetch = async (url, options) => {
        capturedRequest = { url, options };
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Test response'
              }
            }]
          })
        };
      };

      try {
        const prompt = 'Test prompt';
        const result = await OpenAIWrapper.callOpenAI(prompt);
        
        expect(result).to.equal('Test response');
        expect(capturedRequest.url).to.equal('https://api.openai.com/v1/chat/completions');
        expect(capturedRequest.options.method).to.equal('POST');
        
        const body = JSON.parse(capturedRequest.options.body);
        expect(body.model).to.equal('gpt-4o-mini');
        expect(body.messages).to.have.length(1);
        expect(body.messages[0].role).to.equal('user');
        expect(body.messages[0].content).to.equal(prompt);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API errors gracefully', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key'
          }
        })
      });

      try {
        const result = await OpenAIWrapper.callOpenAI('Test prompt');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle network errors', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };

      try {
        const result = await OpenAIWrapper.callOpenAI('Test prompt');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return null when API is not available', async function() {
      YjsModule.setSetting('ai-enabled', false);
      
      const result = await OpenAIWrapper.callOpenAI('Test prompt');
      expect(result).to.be.null;
    });

    it('should handle empty prompt', async function() {
      const result = await OpenAIWrapper.callOpenAI('');
      expect(result).to.be.null;
    });

    it('should handle malformed API response', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          // Missing choices array
          invalid: 'response'
        })
      });

      try {
        const result = await OpenAIWrapper.callOpenAI('Test prompt');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should use default options when none provided', async function() {
      const originalFetch = global.fetch;
      let capturedRequest = null;
      
      global.fetch = async (url, options) => {
        capturedRequest = { url, options };
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Test response'
              }
            }]
          })
        };
      };

      try {
        await OpenAIWrapper.callOpenAI('Test prompt');
        
        const body = JSON.parse(capturedRequest.options.body);
        expect(body.model).to.equal('gpt-4o-mini');
        expect(body.max_tokens).to.equal(1000);
        expect(body.temperature).to.equal(0.7);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should use custom options when provided', async function() {
      const originalFetch = global.fetch;
      let capturedRequest = null;
      
      global.fetch = async (url, options) => {
        capturedRequest = { url, options };
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Test response'
              }
            }]
          })
        };
      };

      try {
        const customOptions = {
          model: 'gpt-3.5-turbo',
          max_tokens: 500,
          temperature: 0.5
        };
        
        await OpenAIWrapper.callOpenAI('Test prompt', customOptions);
        
        const body = JSON.parse(capturedRequest.options.body);
        expect(body.model).to.equal('gpt-3.5-turbo');
        expect(body.max_tokens).to.equal(500);
        expect(body.temperature).to.equal(0.5);
      } finally {
        global.fetch = originalFetch;
      }
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

  describe('Error handling edge cases', function() {
    beforeEach(function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    it('should handle API timeout', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => {
        // Simulate timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error('Request timeout');
      };

      try {
        const result = await OpenAIWrapper.callOpenAI('Test prompt');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle non-JSON response', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      try {
        const result = await OpenAIWrapper.callOpenAI('Test prompt');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle empty choices array', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: []
        })
      });

      try {
        const result = await OpenAIWrapper.callOpenAI('Test prompt');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});