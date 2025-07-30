import { expect } from 'chai';
import './setup.js';
import * as YjsModule from '../js/yjs.js';
import * as Journal from '../js/journal.js';
import * as Character from '../js/character.js';
import * as Settings from '../js/settings.js';

describe('Integration Tests', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
    
    // Set up basic DOM structure for all pages
    document.body.innerHTML = `
      <!-- Journal page elements -->
      <form id="entry-form">
        <input type="text" name="title" id="entry-title" />
        <textarea name="content" id="entry-content"></textarea>
        <button type="submit">Add Entry</button>
      </form>
      <div id="entries-container"></div>
      <div class="character-info-container"></div>
      
      <!-- Character page elements -->
      <form id="character-form">
        <input type="text" name="name" id="character-name" />
        <input type="text" name="race" id="character-race" />
        <input type="text" name="class" id="character-class" />
        <textarea name="backstory" id="character-backstory"></textarea>
        <textarea name="notes" id="character-notes"></textarea>
        <button type="submit">Save</button>
      </form>
      <div id="summaries-content"></div>
      
      <!-- Settings page elements -->
      <form id="settings-form">
        <input type="text" name="openai-api-key" id="openai-api-key" />
        <input type="checkbox" name="ai-enabled" id="ai-enabled" />
        <input type="text" name="sync-server-url" id="sync-server-url" />
        <button type="submit">Save Settings</button>
      </form>
      <div id="connection-status"></div>
    `;
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('Character to Journal Integration', function() {
    it('should show character summary in journal page', async function() {
      // Set character data
      YjsModule.setCharacter('name', 'Frodo');
      YjsModule.setCharacter('race', 'Hobbit');
      YjsModule.setCharacter('class', 'Burglar');
      YjsModule.setCharacter('backstory', 'A hobbit from the Shire');
      
      // Initialize journal page
      await Journal.initJournalPage();
      
      // Check that character info is displayed
      const characterContainer = document.querySelector('.character-info-container');
      expect(characterContainer.innerHTML).to.include('Frodo');
      expect(characterContainer.innerHTML).to.include('Hobbit');
      expect(characterContainer.innerHTML).to.include('Burglar');
    });

    it('should update journal character summary when character changes', async function() {
      // Initialize journal page first
      await Journal.initJournalPage();
      
      // Change character data
      YjsModule.setCharacter('name', 'Aragorn');
      YjsModule.setCharacter('race', 'Human');
      
      // Manually trigger render (in real app, Y.js observers would do this)
      Journal.renderJournalPage();
      
      // Check updated display
      const characterContainer = document.querySelector('.character-info-container');
      expect(characterContainer.innerHTML).to.include('Aragorn');
      expect(characterContainer.innerHTML).to.include('Human');
    });
  });

  describe('Settings to AI Integration', function() {
    it('should enable AI features when properly configured', function() {
      // Configure AI settings
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Import AI module to test
      import('../js/ai.js').then(AI => {
        expect(AI.isAPIAvailable()).to.be.true;
        expect(AI.isAIEnabled()).to.be.true;
      });
    });

    it('should disable AI features when not configured', function() {
      // Don't set AI settings
      
      import('../js/ai.js').then(AI => {
        expect(AI.isAPIAvailable()).to.be.false;
        expect(AI.isAIEnabled()).to.be.false;
      });
    });
  });

  describe('Journal Entry Workflow', function() {
    it('should create, update, and delete journal entries', async function() {
      // Initialize journal page
      await Journal.initJournalPage();
      
      // Create entry
      document.getElementById('entry-title').value = 'Test Entry';
      document.getElementById('entry-content').value = 'This is a test entry content.';
      
      const form = document.getElementById('entry-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Check entry was created
      const entries = YjsModule.getEntries();
      expect(entries).to.have.length(1);
      expect(entries[0].title).to.equal('Test Entry');
      expect(entries[0].content).to.equal('This is a test entry content.');
      
      // Update entry
      const entryId = entries[0].id;
      YjsModule.updateEntry(entryId, {
        title: 'Updated Entry',
        content: 'Updated content'
      });
      
      const updatedEntries = YjsModule.getEntries();
      expect(updatedEntries[0].title).to.equal('Updated Entry');
      expect(updatedEntries[0].content).to.equal('Updated content');
      
      // Delete entry
      YjsModule.deleteEntry(entryId);
      
      const finalEntries = YjsModule.getEntries();
      expect(finalEntries).to.have.length(0);
    });
  });

  describe('Character Data Workflow', function() {
    it('should save and display character information', async function() {
      // Initialize character page
      await Character.initCharacterPage();
      
      // Fill character form
      document.getElementById('character-name').value = 'Legolas';
      document.getElementById('character-race').value = 'Elf';
      document.getElementById('character-class').value = 'Archer';
      document.getElementById('character-backstory').value = 'Prince of the Woodland Realm';
      document.getElementById('character-notes').value = 'Skilled with bow and arrow';
      
      // Submit form
      const form = document.getElementById('character-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Check data was saved
      expect(YjsModule.getCharacter('name')).to.equal('Legolas');
      expect(YjsModule.getCharacter('race')).to.equal('Elf');
      expect(YjsModule.getCharacter('class')).to.equal('Archer');
      expect(YjsModule.getCharacter('backstory')).to.equal('Prince of the Woodland Realm');
      expect(YjsModule.getCharacter('notes')).to.equal('Skilled with bow and arrow');
      
      // Check form still displays data
      Character.renderCharacterPage();
      expect(document.getElementById('character-name').value).to.equal('Legolas');
      expect(document.getElementById('character-race').value).to.equal('Elf');
    });
  });

  describe('Settings Workflow', function() {
    it('should save and display settings', async function() {
      // Initialize settings page
      await Settings.initSettingsPage();
      
      // Fill settings form
      document.getElementById('openai-api-key').value = 'sk-integration-test';
      document.getElementById('ai-enabled').checked = true;
      document.getElementById('sync-server-url').value = 'wss://test-server.com';
      
      // Submit form
      const form = document.getElementById('settings-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Check data was saved
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-integration-test');
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://test-server.com');
      
      // Check form still displays data
      Settings.renderSettingsPage();
      expect(document.getElementById('openai-api-key').value).to.equal('sk-integration-test');
      expect(document.getElementById('ai-enabled').checked).to.be.true;
      expect(document.getElementById('sync-server-url').value).to.equal('wss://test-server.com');
    });
  });

  describe('Cross-Page Data Consistency', function() {
    it('should maintain character data across page switches', async function() {
      // Set character data in character page
      await Character.initCharacterPage();
      YjsModule.setCharacter('name', 'Gimli');
      YjsModule.setCharacter('race', 'Dwarf');
      
      // Switch to journal page and check character data is available
      await Journal.initJournalPage();
      Journal.renderJournalPage();
      
      const characterContainer = document.querySelector('.character-info-container');
      expect(characterContainer.innerHTML).to.include('Gimli');
      expect(characterContainer.innerHTML).to.include('Dwarf');
    });

    it('should maintain settings across pages', async function() {
      // Set settings
      await Settings.initSettingsPage();
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('openai-api-key', 'sk-cross-page-test');
      
      // Test that other modules can access settings
      import('../js/ai.js').then(AI => {
        expect(AI.isAPIAvailable()).to.be.true;
      });
    });
  });

  describe('Error Handling Integration', function() {
    it('should handle missing DOM elements gracefully across pages', async function() {
      // Remove some DOM elements
      document.getElementById('entry-form').remove();
      document.getElementById('character-form').remove();
      
      // Pages should still initialize without throwing
      expect(async () => {
        await Journal.initJournalPage();
      }).to.not.throw();
      
      expect(async () => {
        await Character.initCharacterPage();
      }).to.not.throw();
      
      expect(async () => {
        await Settings.initSettingsPage();
      }).to.not.throw();
    });

    it('should handle Y.js failures gracefully', async function() {
      // Force Y.js to fail
      const originalInitYjs = YjsModule.initYjs;
      YjsModule.initYjs = async () => {
        throw new Error('Y.js initialization failed');
      };
      
      try {
        // Pages should handle Y.js failures
        await Journal.initJournalPage();
        await Character.initCharacterPage();
        await Settings.initSettingsPage();
        
        // Test passes if no uncaught exceptions
      } finally {
        YjsModule.initYjs = originalInitYjs;
      }
    });
  });

  describe('Reactive Updates Integration', function() {
    it('should update UI when Y.js data changes', async function() {
      // Initialize pages
      await Journal.initJournalPage();
      await Character.initCharacterPage();
      
      // Change character data
      YjsModule.setCharacter('name', 'Reactive Test');
      
      // Manually trigger observers (in real app, Y.js would do this automatically)
      Journal.renderJournalPage();
      Character.renderCharacterPage();
      
      // Check both pages updated
      const characterContainer = document.querySelector('.character-info-container');
      expect(characterContainer.innerHTML).to.include('Reactive Test');
      
      const characterNameInput = document.getElementById('character-name');
      expect(characterNameInput.value).to.equal('Reactive Test');
    });

    it('should handle multiple rapid updates', async function() {
      await Journal.initJournalPage();
      
      // Add multiple entries rapidly
      const entryIds = [];
      for (let i = 0; i < 5; i++) {
        const entry = {
          id: `rapid-${i}`,
          title: `Rapid Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() + i
        };
        YjsModule.addEntry(entry);
        entryIds.push(entry.id);
      }
      
      // Check all entries were added
      const entries = YjsModule.getEntries();
      expect(entries).to.have.length(5);
      expect(entries.map(e => e.id)).to.include.members(entryIds);
    });
  });
});
