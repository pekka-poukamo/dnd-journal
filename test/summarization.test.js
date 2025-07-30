import { expect } from 'chai';
import './setup.js';
import * as Summarization from '../js/summarization.js';
import * as YjsModule from '../js/yjs.js';

describe('Simple Summarization Module', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('summarize', function() {
    it('should throw error when API not available', async function() {
      // Don't set API settings, so API is not available
      try {
        await Summarization.summarize('test-key', 'Test content to summarize');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('API not available');
      }
    });

    it('should return existing summary if available', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Pre-set a summary
      YjsModule.setSummary('test-key', 'Existing summary');
      
      const result = await Summarization.summarize('test-key', 'New content');
      expect(result).to.equal('Existing summary');
    });

    it('should create new summary when none exists', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Mock the OpenAI API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This is a generated summary'
            }
          }]
        })
      });
      
      try {
        const result = await Summarization.summarize('new-key', 'Content to summarize');
        expect(result).to.equal('This is a generated summary');
        
        // Verify it was stored in Y.js
        const stored = YjsModule.getSummary('new-key');
        expect(stored).to.equal('This is a generated summary');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API errors gracefully', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Mock API failure
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };
      
      try {
        await Summarization.summarize('error-key', 'Content');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.equal('Network error');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle empty content', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Summary of empty content'
            }
          }]
        })
      });
      
      try {
        const result = await Summarization.summarize('empty-key', '');
        expect(result).to.equal('Summary of empty content');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle different content types', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      const testCases = [
        { key: 'short', content: 'Short text' },
        { key: 'long', content: 'A'.repeat(1000) },
        { key: 'special', content: 'Text with "quotes" and symbols @#$%' },
        { key: 'multiline', content: 'Line 1\nLine 2\nLine 3' }
      ];
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        const userPrompt = body.messages.find(m => m.role === 'user').content;
        
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: `Summary of: ${userPrompt.substring(0, 50)}...`
              }
            }]
          })
        };
      };
      
      try {
        for (const testCase of testCases) {
          const result = await Summarization.summarize(testCase.key, testCase.content);
          expect(result).to.include('Summary of:');
          
          // Verify stored
          const stored = YjsModule.getSummary(testCase.key);
          expect(stored).to.equal(result);
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
