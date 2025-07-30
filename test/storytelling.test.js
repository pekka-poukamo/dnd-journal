import { expect } from 'chai';
import './setup.js';
import * as Storytelling from '../js/storytelling.js';
import * as YjsModule from '../js/yjs.js';

describe('Simple Storytelling Module', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('generateQuestions', function() {
    it('should return null when API not available', async function() {
      // Don't set API settings
      const result = await Storytelling.generateQuestions();
      expect(result).to.be.null;
    });

    it('should generate questions with minimal character data', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Set minimal character data
      YjsModule.setCharacter('name', 'Aragorn');
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '1. What shaped you?\n2. What conflicts?\n3. How change?\n4. Hidden depths?'
            }
          }]
        })
      });
      
      try {
        const result = await Storytelling.generateQuestions();
        expect(result).to.include('What shaped you?');
        expect(result).to.include('conflicts');
        expect(result).to.include('change');
        expect(result).to.include('Hidden depths');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should generate questions with full character data', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Set full character data
      YjsModule.setCharacter('name', 'Legolas');
      YjsModule.setCharacter('race', 'Elf');
      YjsModule.setCharacter('class', 'Archer');
      YjsModule.setCharacter('backstory', 'Prince of the Woodland Realm...');
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        const userPrompt = body.messages.find(m => m.role === 'user').content;
        
        expect(userPrompt).to.include('Legolas');
        expect(userPrompt).to.include('Elf');
        expect(userPrompt).to.include('Archer');
        expect(userPrompt).to.include('Prince of the Woodland Realm');
        
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Generated questions for Legolas the Elf Archer'
              }
            }]
          })
        };
      };
      
      try {
        const result = await Storytelling.generateQuestions();
        expect(result).to.include('Legolas');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should include recent journal entries in context', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Add character and entries
      YjsModule.setCharacter('name', 'Gimli');
      
      const entries = [
        { id: 'e1', title: 'Moria Adventure', content: 'We explored the deep tunnels...', timestamp: Date.now() - 1000 },
        { id: 'e2', title: 'Dragon Fight', content: 'A terrible dragon appeared...', timestamp: Date.now() - 500 },
        { id: 'e3', title: 'Recent Victory', content: 'We defeated our enemies...', timestamp: Date.now() }
      ];
      
      entries.forEach(entry => YjsModule.addEntry(entry));
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        const userPrompt = body.messages.find(m => m.role === 'user').content;
        
        // Should include recent entries (last 3)
        expect(userPrompt).to.include('Recent Victory');
        expect(userPrompt).to.include('Dragon Fight');
        expect(userPrompt).to.include('Moria Adventure');
        
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Questions based on recent adventures'
              }
            }]
          })
        };
      };
      
      try {
        const result = await Storytelling.generateQuestions();
        expect(result).to.include('recent adventures');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle unnamed character', async function() {
      // Set up API
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Don't set character name
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        const userPrompt = body.messages.find(m => m.role === 'user').content;
        
        expect(userPrompt).to.include('unnamed adventurer');
        
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: 'Questions for unnamed character'
              }
            }]
          })
        };
      };
      
      try {
        const result = await Storytelling.generateQuestions();
        expect(result).to.include('unnamed character');
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
        const result = await Storytelling.generateQuestions();
        expect(result).to.be.null;
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Alias functions', function() {
    it('should have working aliases', function() {
      expect(Storytelling.getIntrospectionQuestions).to.equal(Storytelling.generateQuestions);
      expect(Storytelling.generateIntrospectionQuestions).to.equal(Storytelling.generateQuestions);
      expect(Storytelling.generateIntrospectionPrompt).to.equal(Storytelling.generateQuestions);
    });
  });

  describe('hasGoodContext', function() {
    it('should return false with no data', function() {
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.false;
    });

    it('should return true with character name', function() {
      YjsModule.setCharacter('name', 'Frodo');
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.true;
    });

    it('should return true with character backstory', function() {
      YjsModule.setCharacter('backstory', 'A hobbit from the Shire...');
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.true;
    });

    it('should return true with journal entries', function() {
      YjsModule.addEntry({
        id: 'test-1',
        title: 'Adventure begins',
        content: 'We set out from Hobbiton...',
        timestamp: Date.now()
      });
      
      const result = Storytelling.hasGoodContext();
      expect(result).to.be.true;
    });
  });

  describe('getCharacterContext', function() {
    it('should return character and entries data', async function() {
      // Set up some data
      YjsModule.setCharacter('name', 'Sam');
      YjsModule.setCharacter('race', 'Hobbit');
      
      YjsModule.addEntry({
        id: 'test-1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });
      
      const context = await Storytelling.getCharacterContext();
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context).to.have.property('hasContent');
      
      expect(context.character.name).to.equal('Sam');
      expect(context.character.race).to.equal('Hobbit');
      expect(context.entries).to.have.length(1);
      expect(context.hasContent).to.be.true;
    });

    it('should return empty context with no data', async function() {
      const context = await Storytelling.getCharacterContext();
      
      expect(context.character.name).to.equal('');
      expect(context.entries).to.have.length(0);
      expect(context.hasContent).to.be.false;
    });
  });
});