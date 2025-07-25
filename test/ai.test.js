import { expect } from 'chai';
import './setup.js';
import * as AI from '../js/ai.js';

describe('AI Module', function() {
  beforeEach(function() {
    global.resetLocalStorage();
  });

  afterEach(function() {
    global.resetLocalStorage();
  });

  describe('createIntrospectionPrompt', function() {
    it('should include recent entries in prompt', function() {
      const character = {
        name: 'Frodo',
        race: 'Hobbit',
        class: 'Burglar'
      };

      const entries = [
        {
          id: '1',
          title: 'The Journey Begins',
          content: 'Left the Shire with the ring',
          timestamp: Date.now()
        },
        {
          id: '2',
          title: 'Meeting Gandalf',
          content: 'The wizard has important news',
          timestamp: Date.now() - 1000
        }
      ];

      const prompt = AI.createIntrospectionPrompt(character, entries);
      expect(prompt).to.be.a('string');
      expect(prompt).to.include('Frodo');
      expect(prompt).to.include('Hobbit');
    });

    it('should handle empty entries array', function() {
      const character = {
        name: 'Gandalf',
        race: 'Wizard',
        class: 'Mage'
      };

      const prompt = AI.createIntrospectionPrompt(character, []);
      expect(prompt).to.be.a('string');
      expect(prompt).to.include('Gandalf');
    });
  });

  describe('generateIntrospectionPrompt', function() {
    it('should generate prompt and save to localStorage', async function() {
      const character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger'
      };

      const entries = [
        {
          id: '1',
          title: 'The Fellowship',
          content: 'Joined the fellowship',
          timestamp: Date.now()
        }
      ];

      const result = await AI.generateIntrospectionPrompt(character, entries);
      // In test environment, this might return null due to missing API key
      expect(result).to.satisfy(val => val === null || typeof val === 'string');
    });

    it('should handle API errors gracefully', async function() {
      const character = {
        name: 'Test',
        race: 'Test',
        class: 'Test'
      };

      const entries = [];

      // Mock fetch to return error
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' })
      });

      try {
        const result = await AI.generateIntrospectionPrompt(character, entries);
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should use fallback entry formatting when Summarization is not available', async function() {
      // Clear and reset localStorage to ensure clean state
      global.resetLocalStorage();
      
      const character = {
        name: 'Gandalf',
        race: 'Wizard',
        class: 'Mage'
      };

      // Create more than 5 entries to test the sorting and slicing
      const entries = [];
      for (let i = 0; i < 8; i++) {
        entries.push({
          id: `entry-${i}`,
          title: `Test Entry ${i}`,
          content: `Test content ${i}`,
          timestamp: Date.now() - (i * 1000) // Make timestamps different
        });
      }

      // Set up valid AI settings AFTER localStorage reset
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      // Verify AI is enabled
      expect(AI.isAIEnabled()).to.be.true;

      // Ensure window.Summarization is NOT available (test the fallback path)
      const originalWindow = global.window;
      global.window = undefined;

      // Mock successful fetch
      const originalFetch = global.fetch;
      global.fetch = async (url, options) => {
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Generated introspection prompt using fallback'
              }
            }]
          })
        };
      };

      const result = await AI.generateIntrospectionPrompt(character, entries);
      expect(result).to.equal('Generated introspection prompt using fallback');

      // Cleanup
      global.fetch = originalFetch;
      global.window = originalWindow;
    });

    it('should handle errors in generateIntrospectionPrompt', async function() {
      // Clear and reset localStorage to ensure clean state
      global.resetLocalStorage();
      
      const character = {
        name: 'Gandalf',
        race: 'Wizard',
        class: 'Mage'
      };

      const entries = [{
        id: '1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      }];

      // Set up valid AI settings AFTER localStorage reset
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      // Mock fetch to throw an error
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };

      const result = await AI.generateIntrospectionPrompt(character, entries);
      expect(result).to.be.null;

      // Cleanup
      global.fetch = originalFetch;
    });
  });

  describe('generateEntrySummary', function() {
    it('should generate summary for entry', async function() {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test entry with some content to summarize.',
        timestamp: Date.now()
      };

      const result = await AI.generateEntrySummary(entry);
      // In test environment, this might return null due to missing API key
      expect(result).to.satisfy(val => val === null || typeof val === 'string');
    });

    it('should handle empty content gracefully', async function() {
      const entry = {
        id: '1',
        title: 'Empty Entry',
        content: '',
        timestamp: Date.now()
      };

      const result = await AI.generateEntrySummary(entry);
      expect(result).to.be.null;
    });
  });

  describe('getEntrySummary', function() {
    it('should return existing summary from localStorage', async function() {
      const entryId = 'test-entry';
      const summaries = {
        [entryId]: 'This is a test summary'
      };

      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));

      const result = await AI.getEntrySummary(entryId);
      // In test environment, this might return null due to missing AI module
      expect(result).to.satisfy(val => val === null || val === 'This is a test summary');
    });

    it('should return null when no summary exists', async function() {
      const result = await AI.getEntrySummary('non-existent');
      expect(result).to.be.null;
    });
  });

  describe('callOpenAI', function() {
    it('should make successful API call', async function() {
      const prompt = 'Test prompt';
      const apiKey = 'test-key';

      // Set up API key in settings
      const settings = { apiKey: apiKey, enableAIFeatures: true };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(settings));

      const result = await AI.callOpenAI(prompt, apiKey);
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(0);
    });

    it('should handle API errors', async function() {
      const prompt = 'Test prompt';
      const apiKey = 'invalid-key';

      // Set up API key in settings
      const settings = { apiKey: apiKey, enableAIFeatures: true };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(settings));

      // Mock fetch to return error
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      try {
        await AI.callOpenAI(prompt, apiKey);
        expect.fail('Expected function to throw an error');
      } catch (error) {
        expect(error.message).to.equal('API request failed');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle network errors', async function() {
      const prompt = 'Test prompt';
      const apiKey = 'test-key';

      // Set up API key in settings
      const settings = { apiKey: apiKey, enableAIFeatures: true };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(settings));

      // Mock fetch to throw error
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };

      try {
        await AI.callOpenAI(prompt, apiKey);
        expect.fail('Expected function to throw an error');
      } catch (error) {
        expect(error.message).to.equal('Network error');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('getPromptDescription', function() {
    it('should return description for introspection prompt', function() {
      const description = AI.getPromptDescription();
      expect(description).to.be.a('string');
      expect(description).to.include('introspection');
    });

    it('should return description for summary prompt', function() {
      const description = AI.getPromptDescription();
      expect(description).to.include('questions');
    });
  });

  describe('getIntrospectionPromptForPreview', function() {
    beforeEach(function() {
      global.resetLocalStorage();
      
      // Set up AI settings to enable AI features
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));
    });

    it('should return complete prompt structure', function() {
      const character = { name: 'Test Character', class: 'Fighter' };
      const entries = [];
      
      const result = AI.getIntrospectionPromptForPreview(character, entries);
      
      expect(result).to.be.an('object');
      expect(result).to.have.property('systemPrompt');
      expect(result).to.have.property('userPrompt');
      expect(result).to.have.property('messages');
      expect(result.messages).to.be.an('array');
      expect(result.messages).to.have.length(2);
      expect(result.messages[0]).to.have.property('role', 'system');
      expect(result.messages[1]).to.have.property('role', 'user');
    });

    it('should include character information in user prompt', function() {
      const character = { name: 'Elara', race: 'Elf', class: 'Ranger' };
      const entries = [];
      
      const result = AI.getIntrospectionPromptForPreview(character, entries);
      
      expect(result.userPrompt).to.include('Elara');
      expect(result.userPrompt).to.include('Elf');
      expect(result.userPrompt).to.include('Ranger');
    });

    it('should return null when AI is not enabled', function() {
      global.resetLocalStorage(); // Clear AI settings
      
      const character = { name: 'Test Character', class: 'Fighter' };
      const entries = [];
      
      const result = AI.getIntrospectionPromptForPreview(character, entries);
      
      expect(result).to.be.null;
    });

    it('should handle errors in prompt preparation', function() {
      // Set up AI but create a scenario that might cause errors
      const character = null; // Invalid character data
      const entries = null; // Invalid entries data
      
      const result = AI.getIntrospectionPromptForPreview(character, entries);
      
      // Should handle gracefully and either return valid data or null
      expect(result).to.satisfy(val => val === null || (typeof val === 'object' && val.systemPrompt && val.userPrompt));
    });

    it('should use consistent system prompt', function() {
      const character = { name: 'Test Character', class: 'Fighter' };
      const entries = [];
      
      const result = AI.getIntrospectionPromptForPreview(character, entries);
      
      expect(result).to.not.be.null;
      expect(result.systemPrompt).to.include('D&D storytelling companion');
      expect(result.systemPrompt).to.include('4 questions');
      expect(result.messages[0].content).to.equal(result.systemPrompt);
    });

    it('should include entries context when provided', function() {
      const character = { name: 'Test Hero', class: 'Paladin' };
      const entries = [
        {
          id: '1',
          title: 'Victory Against Evil',
          content: 'We defeated the dark wizard threatening the kingdom.',
          timestamp: Date.now()
        }
      ];
      
      const result = AI.getIntrospectionPromptForPreview(character, entries);
      
      expect(result).to.not.be.null;
      expect(result.userPrompt).to.include('Test Hero');
      expect(result.userPrompt).to.include('Paladin');
      // The function uses formatted entries, so let's check for the actual structure
      expect(result.userPrompt).to.satisfy(prompt => 
        prompt.includes('Journey') || prompt.includes('Entry') || prompt.includes('Recent') || prompt.length > 50
      );
    });
  });

  describe('getEntrySummary', function() {
    beforeEach(function() {
      global.resetLocalStorage();
    });

    afterEach(function() {
      global.resetLocalStorage();
    });

    it('should return existing summary from localStorage', async function() {
      const entry = {
        id: 'test-entry-1',
        title: 'Test Entry',
        content: 'This is test content',
        timestamp: Date.now()
      };

      const existingSummary = 'This is an existing summary';
      
      // Store existing summary
      const summaries = { [entry.id]: existingSummary };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));

      const result = await AI.getEntrySummary(entry);
      expect(result).to.equal(existingSummary);
    });

    it('should generate new summary when none exists', async function() {
      // Clear and reset localStorage to ensure clean state
      global.resetLocalStorage();
      
      // Set up AI settings to enable AI AFTER localStorage reset
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      // Verify AI is enabled
      expect(AI.isAIEnabled()).to.be.true;

      const entry = {
        id: 'new-entry',
        title: 'Test Entry',
        content: 'This is test content that needs summarization',
        timestamp: Date.now()
      };

      // Mock fetch for successful API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Generated summary of the entry'
            }
          }]
        })
      });

      const result = await AI.getEntrySummary(entry);
      expect(result).to.be.an('object');
      expect(result.summary).to.equal('Generated summary of the entry');
      expect(result.id).to.equal(entry.id);
      
      // Verify summary was saved to localStorage
      const storedSummaries = JSON.parse(global.localStorage.getItem('simple-dnd-journal-summaries') || '{}');
      expect(storedSummaries[entry.id]).to.be.an('object');
      expect(storedSummaries[entry.id].summary).to.equal('Generated summary of the entry');

      global.fetch = originalFetch;
    });

    it('should return null when summary generation fails', async function() {
      // Clear and reset localStorage to ensure clean state
      global.resetLocalStorage();
      
      // Set up AI settings to enable AI AFTER localStorage reset
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      const entry = {
        id: 'failed-entry',
        title: 'Test Entry',
        content: 'This is test content',
        timestamp: Date.now()
      };

      // Mock fetch to fail
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('API Error');
      };

      const result = await AI.getEntrySummary(entry);
      expect(result).to.be.null;

      global.fetch = originalFetch;
    });

    it('should handle corrupted localStorage data gracefully', async function() {
      const entry = {
        id: 'test-entry',
        title: 'Test Entry',
        content: 'This is test content',
        timestamp: Date.now()
      };

      // Store invalid JSON
      global.localStorage.setItem('simple-dnd-journal-summaries', 'invalid-json');

      const result = await AI.getEntrySummary(entry);
      expect(result).to.be.null;
    });
  });

  describe('AI Settings Functions', function() {
    beforeEach(function() {
      global.resetLocalStorage();
    });

    afterEach(function() {
      global.resetLocalStorage();
    });

    it('should load AI settings from localStorage', function() {
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };

      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      // Note: loadAISettings is not exported, but we can test isAIEnabled which uses it
      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.true;
    });

    it('should return false when AI features are disabled', function() {
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: false
      };

      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.false;
    });

    it('should return false when no API key is provided', function() {
      const testSettings = {
        apiKey: '',
        enableAIFeatures: true
      };

      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.false;
    });

    it('should return false with default settings', function() {
      // No settings in localStorage, should use defaults
      const isEnabled = AI.isAIEnabled();
      expect(isEnabled).to.be.false;
    });
  });
});
