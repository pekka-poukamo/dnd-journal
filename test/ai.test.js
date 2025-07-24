const { expect } = require('chai');
require('./setup');

// Load the AI module
const AI = require('../js/ai');

describe('AI Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
  });

  describe('loadAISettings', () => {
    it('should return default settings when no settings exist', () => {
      const settings = AI.loadAISettings();
      expect(settings).to.deep.equal({
        apiKey: '',
        enableAIFeatures: false
      });
    });

    it('should load existing settings from localStorage', () => {
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      const settings = AI.loadAISettings();
      expect(settings).to.deep.equal(testSettings);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      global.localStorage.setItem('simple-dnd-journal-settings', 'invalid-json');

      const settings = AI.loadAISettings();
      expect(settings).to.deep.equal({
        apiKey: '',
        enableAIFeatures: false
      });
    });
  });

  describe('isAIEnabled', () => {
    it('should return false when AI features are disabled', () => {
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
        apiKey: 'sk-test123',
        enableAIFeatures: false
      }));

      const enabled = AI.isAIEnabled();
      expect(enabled).to.be.false;
    });

    it('should return false when no API key is set', () => {
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
        apiKey: '',
        enableAIFeatures: true
      }));

      const enabled = AI.isAIEnabled();
      expect(enabled).to.equal(false);
    });

    it('should return false when API key is invalid format', () => {
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
        apiKey: 'invalid-key',
        enableAIFeatures: true
      }));

      const enabled = AI.isAIEnabled();
      expect(enabled).to.be.false;
    });

    it('should return true when properly configured', () => {
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
        apiKey: 'sk-test123',
        enableAIFeatures: true
      }));

      const enabled = AI.isAIEnabled();
      expect(enabled).to.be.true;
    });
  });

  describe('createIntrospectionPrompt', () => {
    it('should create prompt for unnamed character', () => {
      const character = { name: '', race: '', class: '' };
      const formattedEntries = [];

      const prompt = AI.createIntrospectionPrompt(character, formattedEntries);
      
      expect(prompt).to.include('your character');
      expect(prompt).to.include('Please create 4 introspective questions');
    });

    it('should create prompt with character details', () => {
      const character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger',
        backstory: 'Heir to the throne of Gondor'
      };
      const formattedEntries = [];

      const prompt = AI.createIntrospectionPrompt(character, formattedEntries);
      
      expect(prompt).to.include('Aragorn');
      expect(prompt).to.include('Human Ranger');
      expect(prompt).to.include('Heir to the throne of Gondor');
    });

    it('should include formatted entries in prompt', () => {
      const character = { name: 'Aragorn', race: 'Human', class: 'Ranger' };
      const formattedEntries = [
        {
          title: 'Battle at Helms Deep',
          content: 'We fought valiantly against the orc army',
          type: 'full'
        },
        {
          title: 'Meeting Legolas',
          content: 'Formed an unlikely friendship with the elf',
          type: 'summary'
        }
      ];

      const prompt = AI.createIntrospectionPrompt(character, formattedEntries);
      
      expect(prompt).to.include('Battle at Helms Deep');
      expect(prompt).to.include('Meeting Legolas');
      expect(prompt).to.include('Journey Context');
    });

    it('should truncate long entry content', () => {
      const character = { name: 'Test', race: 'Human', class: 'Fighter' };
      const longContent = 'A'.repeat(600); // Increased to 600 to exceed the new 500-character limit
      const formattedEntries = [
        {
          title: 'Long Entry',
          content: longContent,
          type: 'full'
        }
      ];

      const prompt = AI.createIntrospectionPrompt(character, formattedEntries);
      
      expect(prompt).to.include('Long Entry');
      expect(prompt).to.include('...');
      expect(prompt).not.to.include(longContent);
    });
  });

  // getWordCount is now in utils module, tested in utils.test.js

  describe('generateEntrySummary', () => {
    beforeEach(() => {
      // Mock AI settings for these tests
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
        apiKey: 'sk-test123',
        enableAIFeatures: true
      }));
    });

    it('should return null when AI is disabled', async () => {
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
        apiKey: '',
        enableAIFeatures: false
      }));

      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test entry with some content'
      };

      const summary = await AI.generateEntrySummary(entry);
      expect(summary).to.be.null;
    });

    // Note: Actual API calls would need to be mocked for full testing
    // This is a structure test to ensure the function exists and has proper error handling
    it('should have proper error handling structure', async () => {
      const entry = {
        id: '1',
        title: 'Test Entry',
        content: 'This is a test entry'
      };

      // This will fail due to invalid API key, but should not throw
      const summary = await AI.generateEntrySummary(entry);
      expect(summary).to.be.null;
    });
  });
});
