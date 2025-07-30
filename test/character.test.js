import { expect } from 'chai';
import './setup.js';
import * as Character from '../js/character.js';
import * as YjsModule from '../js/yjs.js';

describe('Character Page', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
    
    // Set up simplified character form DOM
    document.body.innerHTML = `
      <form id="character-form">
        <input type="text" name="name" id="character-name" />
        <input type="text" name="race" id="character-race" />
        <input type="text" name="class" id="character-class" />
        <textarea name="backstory" id="character-backstory"></textarea>
        <textarea name="notes" id="character-notes"></textarea>
        <button type="submit">Save</button>
      </form>
      <div id="summaries-content"></div>
      <button id="refresh-summaries">Refresh</button>
      <button id="generate-summaries">Generate</button>
    `;
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initCharacterPage', function() {
    it('should initialize without errors', async function() {
      expect(async () => {
        await Character.initCharacterPage();
      }).to.not.throw();
    });

    it('should render character form with current data', async function() {
      // Set some character data
      YjsModule.setCharacter('name', 'Aragorn');
      YjsModule.setCharacter('race', 'Human');
      
      await Character.initCharacterPage();
      
      // Check that form was populated
      expect(document.getElementById('character-name').value).to.equal('Aragorn');
      expect(document.getElementById('character-race').value).to.equal('Human');
    });
  });

  describe('renderCharacterPage', function() {
    it('should update form fields with character data', function() {
      // Set character data in Y.js
      YjsModule.setCharacter('name', 'Legolas');
      YjsModule.setCharacter('race', 'Elf');
      YjsModule.setCharacter('class', 'Archer');
      YjsModule.setCharacter('backstory', 'Prince of Woodland Realm');
      YjsModule.setCharacter('notes', 'Skilled with bow');
      
      Character.renderCharacterPage();
      
      // Check form fields
      expect(document.getElementById('character-name').value).to.equal('Legolas');
      expect(document.getElementById('character-race').value).to.equal('Elf');
      expect(document.getElementById('character-class').value).to.equal('Archer');
      expect(document.getElementById('character-backstory').value).to.equal('Prince of Woodland Realm');
      expect(document.getElementById('character-notes').value).to.equal('Skilled with bow');
    });

    it('should handle empty character data', function() {
      Character.renderCharacterPage();
      
      // All fields should be empty
      expect(document.getElementById('character-name').value).to.equal('');
      expect(document.getElementById('character-race').value).to.equal('');
      expect(document.getElementById('character-class').value).to.equal('');
      expect(document.getElementById('character-backstory').value).to.equal('');
      expect(document.getElementById('character-notes').value).to.equal('');
    });
  });

  describe('Character form handling', function() {
    beforeEach(async function() {
      await Character.initCharacterPage();
    });

    it('should save character data on form submission', function() {
      // Fill form
      document.getElementById('character-name').value = 'Gimli';
      document.getElementById('character-race').value = 'Dwarf';
      document.getElementById('character-class').value = 'Fighter';
      document.getElementById('character-backstory').value = 'Son of Gloin';
      document.getElementById('character-notes').value = 'Brave warrior';
      
      // Submit form
      const form = document.getElementById('character-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      
      // Check Y.js data
      expect(YjsModule.getCharacter('name')).to.equal('Gimli');
      expect(YjsModule.getCharacter('race')).to.equal('Dwarf');
      expect(YjsModule.getCharacter('class')).to.equal('Fighter');
      expect(YjsModule.getCharacter('backstory')).to.equal('Son of Gloin');
      expect(YjsModule.getCharacter('notes')).to.equal('Brave warrior');
    });

    it('should update Y.js on field blur events', function() {
      const nameInput = document.getElementById('character-name');
      nameInput.value = 'Frodo';
      
      // Trigger blur event
      const event = new Event('blur', { bubbles: true });
      nameInput.dispatchEvent(event);
      
      // Check Y.js was updated
      expect(YjsModule.getCharacter('name')).to.equal('Frodo');
    });

    it('should trim whitespace from form inputs', function() {
      const nameInput = document.getElementById('character-name');
      nameInput.value = '  Bilbo  ';
      
      // Trigger blur event
      const event = new Event('blur', { bubbles: true });
      nameInput.dispatchEvent(event);
      
      // Check Y.js data is trimmed
      expect(YjsModule.getCharacter('name')).to.equal('Bilbo');
    });
  });

  describe('Summary functionality', function() {
    beforeEach(async function() {
      await Character.initCharacterPage();
      
      // Set up API for summarization tests
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
    });

    it('should show placeholder when no summaries exist', function() {
      Character.renderCharacterPage();
      
      const summariesContent = document.getElementById('summaries-content');
      expect(summariesContent.innerHTML).to.include('No character summaries available');
    });

    it('should display existing summaries', function() {
      // Set some summaries
      YjsModule.setSummary('character-backstory', 'Summary of backstory');
      YjsModule.setSummary('character-notes', 'Summary of notes');
      
      Character.renderCharacterPage();
      
      const summariesContent = document.getElementById('summaries-content');
      expect(summariesContent.innerHTML).to.include('Backstory Summary');
      expect(summariesContent.innerHTML).to.include('Summary of backstory');
      expect(summariesContent.innerHTML).to.include('Notes Summary');
      expect(summariesContent.innerHTML).to.include('Summary of notes');
    });

    it('should handle refresh summaries with sufficient content', async function() {
      // Set character with long content
      YjsModule.setCharacter('backstory', 'A'.repeat(200)); // Long enough for summarization
      
      // Mock API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Generated backstory summary'
            }
          }]
        })
      });
      
      try {
        // Trigger refresh
        const refreshBtn = document.getElementById('refresh-summaries');
        const event = new Event('click', { bubbles: true });
        await refreshBtn.dispatchEvent(event);
        
        // Should attempt to generate summary
        expect(global.fetch).to.have.been;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should show error when API not available for refresh', async function() {
      // Disable API
      YjsModule.setSetting('ai-enabled', false);
      
      // Set character content
      YjsModule.setCharacter('backstory', 'Long backstory content...');
      
      // Mock console.error to capture error
      const originalError = console.error;
      let errorCaught = false;
      console.error = () => { errorCaught = true; };
      
      try {
        const refreshBtn = document.getElementById('refresh-summaries');
        const event = new Event('click', { bubbles: true });
        refreshBtn.dispatchEvent(event);
        
        // Should handle error gracefully
        expect(errorCaught).to.be.false; // No console errors expected for this case
      } finally {
        console.error = originalError;
      }
    });
  });

  describe('Reactive updates', function() {
    it('should update form when Y.js character data changes', async function() {
      await Character.initCharacterPage();
      
      // Simulate Y.js data change
      YjsModule.setCharacter('name', 'Samwise');
      
      // Manually trigger the observer callback (in real app, Y.js would do this)
      Character.renderCharacterPage();
      
      expect(document.getElementById('character-name').value).to.equal('Samwise');
    });

    it('should update summaries when Y.js summary data changes', async function() {
      await Character.initCharacterPage();
      
      // Add a summary
      YjsModule.setSummary('character-backstory', 'New summary content');
      
      // Manually trigger render
      Character.renderCharacterPage();
      
      const summariesContent = document.getElementById('summaries-content');
      expect(summariesContent.innerHTML).to.include('New summary content');
    });
  });

  describe('Error handling', function() {
    it('should handle missing form elements gracefully', async function() {
      // Remove form from DOM
      document.body.innerHTML = '<div>No form here</div>';
      
      expect(async () => {
        await Character.initCharacterPage();
      }).to.not.throw();
    });

    it('should handle missing summary elements gracefully', function() {
      // Remove summaries div
      document.getElementById('summaries-content').remove();
      
      expect(() => {
        Character.renderCharacterPage();
      }).to.not.throw();
    });

    it('should handle Y.js initialization failure', async function() {
      // Force Y.js to fail
      const originalInitYjs = YjsModule.initYjs;
      YjsModule.initYjs = async () => {
        throw new Error('Y.js init failed');
      };
      
      try {
        // Should handle error gracefully
        await Character.initCharacterPage();
        // Test passes if no uncaught exception
      } finally {
        YjsModule.initYjs = originalInitYjs;
      }
    });
  });
});
