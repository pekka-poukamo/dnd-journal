import { expect } from 'chai';
import './setup.js';
import * as AI from '../js/ai.js';
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

    it('should return true when AI is enabled', function() {
      YjsModule.setSetting('ai-enabled', true);
      expect(AI.isAIEnabled()).to.be.true;
    });

    it('should return false when AI setting is not set', function() {
      expect(AI.isAIEnabled()).to.be.false;
    });
  });

  describe('isAPIAvailable', function() {
    it('should return false when API key is missing', function() {
      YjsModule.setSetting('ai-enabled', true);
      expect(AI.isAPIAvailable()).to.be.false;
    });

    it('should return false when AI is disabled', function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', false);
      expect(AI.isAPIAvailable()).to.be.false;
    });

    it('should return true when both API key and AI are enabled', function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      expect(AI.isAPIAvailable()).to.be.true;
    });

    it('should return false when API key is empty', function() {
      YjsModule.setSetting('openai-api-key', '');
      YjsModule.setSetting('ai-enabled', true);
      expect(AI.isAPIAvailable()).to.be.false;
    });
  });

  describe('getEntrySummary', function() {
    beforeEach(function() {
      // Enable AI for summary tests
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    it('should return existing summary if available', async function() {
      const entryId = 'test-entry-1';
      const existingSummary = 'Existing summary content';
      
      // Set existing summary
      YjsModule.setSummary(entryId, existingSummary);
      
      const result = await AI.getEntrySummary(entryId, 'Some content to summarize');
      expect(result).to.equal(existingSummary);
    });

    it('should generate new summary when none exists', async function() {
      const entryId = 'test-entry-2';
      const content = 'Content to be summarized by AI';
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'AI-generated summary of the content'
            }
          }]
        })
      });
      
      try {
        const result = await AI.getEntrySummary(entryId, content);
        expect(result).to.equal('AI-generated summary of the content');
        
        // Verify summary was stored
        const stored = YjsModule.getSummary(entryId);
        expect(stored).to.equal('AI-generated summary of the content');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API errors gracefully', async function() {
      const entryId = 'test-entry-3';
      const content = 'Content that will fail to summarize';
      
      // Mock API failure
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };
      
      try {
        const result = await AI.getEntrySummary(entryId, content);
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should return null when API is not available', async function() {
      // Disable AI
      YjsModule.setSetting('ai-enabled', false);
      
      const result = await AI.getEntrySummary('test-entry-4', 'Content');
      expect(result).to.be.null;
    });

    it('should return null for empty content', async function() {
      const result = await AI.getEntrySummary('test-entry-5', '');
      expect(result).to.be.null;
    });

    it('should handle content that is too short', async function() {
      const shortContent = 'Short';
      const result = await AI.getEntrySummary('test-entry-6', shortContent);
      expect(result).to.be.null;
    });

    it('should handle different content types', async function() {
      const testCases = [
        { id: 'markdown', content: '# Title\n\nThis is **bold** text with [links](http://example.com)' },
        { id: 'special-chars', content: 'Text with émojis 🎭 and special chars: @#$%^&*()' },
        { id: 'multiline', content: 'Line 1\nLine 2\nLine 3\n\nParagraph 2' },
        { id: 'long', content: 'A'.repeat(1000) }
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
                content: `Summary of: ${userPrompt.substring(0, 20)}...`
              }
            }]
          })
        };
      };
      
      try {
        for (const testCase of testCases) {
          const result = await AI.getEntrySummary(testCase.id, testCase.content);
          expect(result).to.include('Summary of:');
          
          // Verify stored
          const stored = YjsModule.getSummary(testCase.id);
          expect(stored).to.equal(result);
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Settings integration', function() {
    it('should use Y.js settings directly', function() {
      // Test that AI module reads from Y.js settings
      YjsModule.setSetting('openai-api-key', 'sk-direct-test');
      YjsModule.setSetting('ai-enabled', true);
      
      expect(AI.isAPIAvailable()).to.be.true;
      expect(AI.isAIEnabled()).to.be.true;
    });

    it('should handle missing settings gracefully', function() {
      // No settings set
      expect(AI.isAPIAvailable()).to.be.false;
      expect(AI.isAIEnabled()).to.be.false;
    });

    it('should handle invalid setting values', function() {
      // Set invalid values
      YjsModule.setSetting('ai-enabled', 'invalid-boolean');
      YjsModule.setSetting('openai-api-key', 123); // Number instead of string
      
      expect(AI.isAIEnabled()).to.be.false;
      expect(AI.isAPIAvailable()).to.be.false;
    });
  });

  describe('Summary storage integration', function() {
    it('should store summaries in Y.js summariesMap', async function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Mock API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Test summary for storage'
            }
          }]
        })
      });
      
      try {
        const entryId = 'storage-test';
        const result = await AI.getEntrySummary(entryId, 'Content to summarize for storage test');
        
        expect(result).to.equal('Test summary for storage');
        
        // Verify it's in Y.js
        const stored = YjsModule.getSummary(entryId);
        expect(stored).to.equal('Test summary for storage');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should retrieve existing summaries from Y.js', async function() {
      const entryId = 'retrieval-test';
      const existingSummary = 'Pre-existing summary';
      
      // Store summary directly in Y.js
      YjsModule.setSummary(entryId, existingSummary);
      
      // AI should return the existing summary without API call
      const result = await AI.getEntrySummary(entryId, 'Some content');
      expect(result).to.equal(existingSummary);
    });
  });

  describe('Error handling and edge cases', function() {
    beforeEach(function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    it('should handle malformed API responses', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          // Missing choices array
          invalid: 'response'
        })
      });
      
      try {
        const result = await AI.getEntrySummary('malformed-test', 'Test content');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API responses with empty choices', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [] // Empty choices array
        })
      });
      
      try {
        const result = await AI.getEntrySummary('empty-choices-test', 'Test content');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle non-JSON API responses', async function() {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => {
          throw new Error('Not JSON');
        }
      });
      
      try {
        const result = await AI.getEntrySummary('non-json-test', 'Test content');
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle Y.js storage errors', async function() {
      // Mock Y.js setSummary to throw error
      const originalSetSummary = YjsModule.setSummary;
      YjsModule.setSummary = () => {
        throw new Error('Storage error');
      };
      
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Summary that will fail to store'
            }
          }]
        })
      });
      
      try {
        const result = await AI.getEntrySummary('storage-error-test', 'Test content');
        // Should still return the summary even if storage fails
        expect(result).to.equal('Summary that will fail to store');
      } finally {
        global.fetch = originalFetch;
        YjsModule.setSummary = originalSetSummary;
      }
    });
  });
});
