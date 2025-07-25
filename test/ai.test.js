import { expect } from 'chai';
import './setup.js';
import * as AI from '../js/ai.js';

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
        class: 'Ranger'
      };
      const formattedEntries = [];

      const prompt = AI.createIntrospectionPrompt(character, formattedEntries);
      
      expect(prompt).to.include('Aragorn');
      expect(prompt).to.include('Human');
      expect(prompt).to.include('Ranger');
    });

    it('should include recent entries in prompt', () => {
      const character = { name: 'Test', race: 'Elf', class: 'Wizard' };
      const formattedEntries = [
        'Entry 1: Found a magical sword',
        'Entry 2: Defeated a dragon'
      ];

      const prompt = AI.createIntrospectionPrompt(character, formattedEntries);
      
      expect(prompt).to.include('Found a magical sword');
      expect(prompt).to.include('Defeated a dragon');
    });
  });

  describe('generateIntrospectionPrompt', () => {
    it('should generate prompt and save to localStorage', async () => {
      const character = { name: 'Test', race: 'Dwarf', class: 'Fighter' };
      const entries = [
        { title: 'Battle', content: 'Fought bravely', timestamp: Date.now() }
      ];

      const result = await AI.generateIntrospectionPrompt(character, entries);
      
      expect(result.success).to.be.true;
      expect(result.prompt).to.be.a('string');
      expect(result.prompt).to.include('Test');
      
      // Check that prompt was saved
      const saved = JSON.parse(global.localStorage.getItem('simple-dnd-journal-settings'));
      expect(saved.currentPrompt).to.equal(result.prompt);
    });

    it('should handle API errors gracefully', async () => {
      // Mock fetch to return error
      global.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' })
      });

      const character = { name: 'Test', race: 'Elf', class: 'Wizard' };
      const entries = [];

      const result = await AI.generateIntrospectionPrompt(character, entries);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('API Error');
    });
  });

  describe('generateEntrySummary', () => {
    it('should generate summary for entry', async () => {
      const entry = {
        title: 'The Battle of Helm\'s Deep',
        content: 'We defended the fortress against overwhelming odds. The battle was fierce and many lives were lost, but we emerged victorious.',
        timestamp: Date.now()
      };

      const result = await AI.generateEntrySummary(entry);
      
      expect(result.success).to.be.true;
      expect(result.summary).to.be.a('string');
      expect(result.summary).to.include('Battle');
    });

    it('should handle empty content gracefully', async () => {
      const entry = {
        title: 'Empty Entry',
        content: '',
        timestamp: Date.now()
      };

      const result = await AI.generateEntrySummary(entry);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('empty');
    });
  });

  describe('getEntrySummary', () => {
    it('should return existing summary from localStorage', () => {
      const entryId = 'test-entry-123';
      const summaries = {
        [entryId]: 'This is a test summary'
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));

      const summary = AI.getEntrySummary(entryId);
      expect(summary).to.equal('This is a test summary');
    });

    it('should return null when no summary exists', () => {
      const summary = AI.getEntrySummary('nonexistent-entry');
      expect(summary).to.be.null;
    });
  });

  describe('callOpenAI', () => {
    it('should make successful API call', async () => {
      const prompt = 'Test prompt';
      const apiKey = 'sk-test123';

      const result = await AI.callOpenAI(prompt, apiKey);
      
      expect(result.success).to.be.true;
      expect(result.content).to.be.a('string');
    });

    it('should handle API errors', async () => {
      // Mock fetch to return error
      global.fetch = async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      const prompt = 'Test prompt';
      const apiKey = 'invalid-key';

      const result = await AI.callOpenAI(prompt, apiKey);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Unauthorized');
    });

    it('should handle network errors', async () => {
      // Mock fetch to throw error
      global.fetch = async () => {
        throw new Error('Network error');
      };

      const prompt = 'Test prompt';
      const apiKey = 'sk-test123';

      const result = await AI.callOpenAI(prompt, apiKey);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Network error');
    });
  });

  describe('getPromptDescription', () => {
    it('should return description for introspection prompt', () => {
      const description = AI.getPromptDescription('introspection');
      expect(description).to.be.a('string');
      expect(description).to.include('introspective');
    });

    it('should return description for summary prompt', () => {
      const description = AI.getPromptDescription('summary');
      expect(description).to.be.a('string');
      expect(description).to.include('summary');
    });

    it('should return default description for unknown prompt type', () => {
      const description = AI.getPromptDescription('unknown');
      expect(description).to.be.a('string');
    });
  });
});
