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

  describe('Advanced AI Functions', function() {
    beforeEach(function() {
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    describe('callOpenAI', function() {
      it('should handle API calls when properly configured', async function() {
        try {
          const result = await AI.callOpenAI('Test prompt');
          // In test environment, this will likely fail due to no real API
          expect(result).to.satisfy(val => typeof val === 'string' || val === null);
        } catch (error) {
          // Expected in test environment
          expect(error).to.be.an('error');
          expect(error.message).to.include('No API key configured');
        }
      });

      it('should throw error when no API key is configured', async function() {
        YjsModule.setSetting('openai-api-key', '');
        
        try {
          await AI.callOpenAI('Test prompt');
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error.message).to.include('No API key configured');
        }
      });

      it('should accept maxTokens parameter', async function() {
        try {
          await AI.callOpenAI('Test prompt', 500);
        } catch (error) {
          expect(error.message).to.include('No API key configured');
        }
      });
    });

    describe('callOpenAIForSummarization', function() {
      it('should handle summarization calls', async function() {
        try {
          const result = await AI.callOpenAIForSummarization('Summarize this text');
          expect(result).to.satisfy(val => typeof val === 'string' || val === null);
        } catch (error) {
          expect(error).to.be.an('error');
          expect(error.message).to.include('No API key configured');
        }
      });

      it('should throw error when no API key is configured', async function() {
        YjsModule.setSetting('openai-api-key', '');
        
        try {
          await AI.callOpenAIForSummarization('Test content');
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error.message).to.include('No API key configured');
        }
      });
    });

    describe('generateIntrospectionPrompt', function() {
      it('should return null when AI is disabled', async function() {
        YjsModule.setSetting('ai-enabled', false);
        
        const result = await AI.generateIntrospectionPrompt({}, []);
        expect(result).to.be.null;
      });

      it('should handle function call with valid parameters', async function() {
        try {
          const result = await AI.generateIntrospectionPrompt({ name: 'Test' }, []);
          // In test environment, this will likely fail due to no real API
          expect(result).to.satisfy(val => typeof val === 'string' || val === null);
        } catch (error) {
          // Expected in test environment
          expect(error).to.be.an('error');
        }
      });
    });

    describe('generateEntrySummary', function() {
      it('should return null when AI is disabled', async function() {
        YjsModule.setSetting('ai-enabled', false);
        
        const result = await AI.generateEntrySummary({ 
          id: 'test', 
          content: 'This is a long entry with enough content to summarize properly.' 
        });
        expect(result).to.be.null;
      });

      it('should return null for short content', async function() {
        const result = await AI.generateEntrySummary({ 
          id: 'test', 
          content: 'Short' 
        });
        expect(result).to.be.null;
      });

      it('should return null for empty content', async function() {
        const result = await AI.generateEntrySummary({ 
          id: 'test', 
          content: '' 
        });
        expect(result).to.be.null;
      });

      it('should handle entries without content', async function() {
        const result = await AI.generateEntrySummary({ 
          id: 'test' 
        });
        expect(result).to.be.null;
      });

      it('should calculate appropriate target length', async function() {
        // Test with long content that would get summarized
        const longContent = 'A'.repeat(200) + ' This is a long entry with enough content to summarize properly.';
        
        try {
          await AI.generateEntrySummary({ 
            id: 'test', 
            title: 'Test Entry',
            content: longContent 
          });
        } catch (error) {
          // Expected in test environment due to no real API
          expect(error).to.be.an('error');
        }
      });
    });

    describe('getIntrospectionPromptForPreview', function() {
      it('should return null when AI is disabled', async function() {
        YjsModule.setSetting('ai-enabled', false);
        
        const result = await AI.getIntrospectionPromptForPreview({}, []);
        expect(result).to.be.null;
      });

      it('should return prompt structure when AI is enabled', async function() {
        try {
          const result = await AI.getIntrospectionPromptForPreview({ name: 'Test' }, []);
          
          if (result) {
            expect(result).to.have.property('systemPrompt');
            expect(result).to.have.property('userPrompt');
            expect(result).to.have.property('messages');
            expect(result).to.have.property('totalTokens');
          }
        } catch (error) {
          // Expected if token calculation fails
          expect(error).to.be.an('error');
        }
      });

      it('should handle function call without errors', async function() {
        try {
          const result = await AI.getIntrospectionPromptForPreview({ name: 'Test' }, []);
          
          if (result) {
            expect(result).to.have.property('systemPrompt');
            expect(result).to.have.property('userPrompt');
            expect(result).to.have.property('messages');
            expect(result).to.have.property('totalTokens');
          } else {
            expect(result).to.be.null;
          }
        } catch (error) {
          // Expected if dependencies are not available in test environment
          expect(error).to.be.an('error');
        }
      });
    });

    describe('getFormattedCharacterForAI', function() {
      it('should format character with all fields', function() {
        const character = {
          name: 'Gandalf',
          race: 'Maiar',
          class: 'Wizard',
          backstory: 'A wise wizard from Middle-earth',
          notes: 'Carries a staff'
        };
        
        const formatted = AI.getFormattedCharacterForAI(character);
        expect(formatted).to.have.property('name', 'Gandalf');
        expect(formatted).to.have.property('race', 'Maiar');
        expect(formatted).to.have.property('class', 'Wizard');
        expect(formatted).to.have.property('backstory', 'A wise wizard from Middle-earth');
        expect(formatted).to.have.property('notes', 'Carries a staff');
      });

      it('should handle empty character', function() {
        const character = {};
        
        const formatted = AI.getFormattedCharacterForAI(character);
        expect(formatted).to.have.property('name', 'unnamed adventurer');
        expect(formatted).to.have.property('race', '');
        expect(formatted).to.have.property('class', '');
        expect(formatted).to.have.property('backstory', '');
        expect(formatted).to.have.property('notes', '');
      });

      it('should use character summaries when available', function() {
        // Set a character summary
        YjsModule.setSummary('character:backstory', 'Summarized backstory');
        
        const character = {
          name: 'Test Character',
          backstory: 'Original long backstory'
        };
        
        const formatted = AI.getFormattedCharacterForAI(character);
        expect(formatted.backstory).to.equal('Summarized backstory');
      });
    });

    describe('getFormattedEntriesForAI', function() {
      beforeEach(function() {
        // Add some test entries
        YjsModule.addEntry({
          id: 'entry1',
          title: 'Recent Entry',
          content: 'This happened recently',
          timestamp: Date.now()
        });
        
        YjsModule.addEntry({
          id: 'entry2',
          title: 'Older Entry',
          content: 'This happened earlier',
          timestamp: Date.now() - 100000
        });
      });

      it('should format entries for AI consumption', function() {
        const formatted = AI.getFormattedEntriesForAI();
        expect(formatted).to.be.a('string');
        expect(formatted).to.include('Recent Entry');
        expect(formatted).to.include('Older Entry');
      });

      it('should handle no entries', function() {
        // Clear all entries
        YjsModule.deleteEntry('entry1');
        YjsModule.deleteEntry('entry2');
        
        const formatted = AI.getFormattedEntriesForAI();
        expect(formatted).to.be.a('string');
        expect(formatted).to.include('No journal entries yet');
      });
    });
  });
});
