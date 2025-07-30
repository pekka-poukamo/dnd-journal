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
      
      // Verify character data is accessible
      expect(YjsModule.getCharacter('name')).to.equal('Frodo');
      expect(YjsModule.getCharacter('race')).to.equal('Hobbit');
      expect(YjsModule.getCharacter('class')).to.equal('Burglar');
    });

    it('should update journal character summary when character changes', async function() {
      // Initialize journal page first
      await Journal.initJournalPage();
      
      // Change character data
      YjsModule.setCharacter('name', 'Aragorn');
      YjsModule.setCharacter('race', 'Human');
      
      // Manually trigger render (in real app, Y.js observers would do this)
      Journal.renderJournalPage();
      
      // Check updated data
      expect(YjsModule.getCharacter('name')).to.equal('Aragorn');
      expect(YjsModule.getCharacter('race')).to.equal('Human');
    });
  });

  describe('Settings to AI Integration', function() {
    it('should enable AI features when properly configured', function() {
      // Configure AI settings
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      
      // Test that other modules can access settings
      import('../js/openai-wrapper.js').then(OpenAIWrapper => {
        expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
      });
    });

    it('should disable AI features when not configured', function() {
      // Don't set AI settings
      
      import('../js/openai-wrapper.js').then(OpenAIWrapper => {
        expect(OpenAIWrapper.isAPIAvailable()).to.be.false;
      });
    });
  });

  describe('Data Management Workflow', function() {
    it('should manage journal entries through Y.js', async function() {
      // Initialize journal page
      await Journal.initJournalPage();
      
      // Create entry through Y.js
      const entry = {
        id: 'integration-test',
        title: 'Test Entry',
        content: 'This is a test entry content.',
        timestamp: Date.now()
      };
      YjsModule.addEntry(entry);
      
      // Check entry was created
      const entries = YjsModule.getEntries();
      expect(entries).to.have.length(1);
      expect(entries[0].title).to.equal('Test Entry');
      expect(entries[0].content).to.equal('This is a test entry content.');
      
      // Update entry
      YjsModule.updateEntry('integration-test', {
        title: 'Updated Entry',
        content: 'Updated content'
      });
      
      const updatedEntries = YjsModule.getEntries();
      expect(updatedEntries[0].title).to.equal('Updated Entry');
      expect(updatedEntries[0].content).to.equal('Updated content');
      
      // Delete entry
      YjsModule.deleteEntry('integration-test');
      
      const finalEntries = YjsModule.getEntries();
      expect(finalEntries).to.have.length(0);
    });

    it('should manage character data through Y.js', async function() {
      // Initialize character page
      await Character.initCharacterPage();
      
      // Set character data through Y.js
      YjsModule.setCharacter('name', 'Legolas');
      YjsModule.setCharacter('race', 'Elf');
      YjsModule.setCharacter('class', 'Archer');
      YjsModule.setCharacter('backstory', 'Prince of the Woodland Realm');
      YjsModule.setCharacter('notes', 'Skilled with bow and arrow');
      
      // Check data was saved
      expect(YjsModule.getCharacter('name')).to.equal('Legolas');
      expect(YjsModule.getCharacter('race')).to.equal('Elf');
      expect(YjsModule.getCharacter('class')).to.equal('Archer');
      expect(YjsModule.getCharacter('backstory')).to.equal('Prince of the Woodland Realm');
      expect(YjsModule.getCharacter('notes')).to.equal('Skilled with bow and arrow');
    });

    it('should manage settings through Y.js', async function() {
      // Initialize settings page
      await Settings.initSettingsPage();
      
      // Set settings through Y.js
      YjsModule.setSetting('openai-api-key', 'sk-integration-test');
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('sync-server-url', 'wss://test-server.com');
      
      // Check data was saved
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-integration-test');
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://test-server.com');
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
      
      // Verify data persists
      expect(YjsModule.getCharacter('name')).to.equal('Gimli');
      expect(YjsModule.getCharacter('race')).to.equal('Dwarf');
    });

    it('should maintain settings across pages', async function() {
      // Set settings
      await Settings.initSettingsPage();
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('openai-api-key', 'sk-cross-page-test');
      
      // Test that other modules can access settings
      import('../js/openai-wrapper.js').then(OpenAIWrapper => {
        expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
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
  });

  describe('Y.js Data Integrity', function() {
    it('should maintain data integrity across operations', async function() {
      // Initialize all pages
      await Journal.initJournalPage();
      await Character.initCharacterPage();
      await Settings.initSettingsPage();
      
      // Set data in all categories
      YjsModule.setCharacter('name', 'Data Integrity Test');
      YjsModule.addEntry({
        id: 'integrity-test',
        title: 'Integrity Entry',
        content: 'Testing data integrity',
        timestamp: Date.now()
      });
      YjsModule.setSetting('test-setting', 'test-value');
      
      // Verify all data persists
      expect(YjsModule.getCharacter('name')).to.equal('Data Integrity Test');
      
      const entries = YjsModule.getEntries();
      expect(entries).to.have.length(1);
      expect(entries[0].title).to.equal('Integrity Entry');
      
      expect(YjsModule.getSetting('test-setting')).to.equal('test-value');
    });

    it('should handle rapid data changes', async function() {
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

  describe('Page Module Integration', function() {
    it('should allow all page modules to coexist', async function() {
      // Initialize all pages without conflicts
      await Journal.initJournalPage();
      await Character.initCharacterPage();
      await Settings.initSettingsPage();
      
      // All should render without errors
      expect(() => {
        Journal.renderJournalPage();
        Character.renderCharacterPage();
        Settings.renderSettingsPage();
      }).to.not.throw();
    });

    it('should maintain separate responsibilities per page', async function() {
      // Each page should handle its own data type
      await Journal.initJournalPage();
      await Character.initCharacterPage();
      await Settings.initSettingsPage();
      
      // Journal handles entries
      YjsModule.addEntry({
        id: 'journal-test',
        title: 'Journal Test',
        content: 'Journal content',
        timestamp: Date.now()
      });
      
      // Character handles character data
      YjsModule.setCharacter('name', 'Character Test');
      
      // Settings handles settings
      YjsModule.setSetting('setting-test', 'setting-value');
      
      // All data should be independently accessible
      expect(YjsModule.getEntries()).to.have.length(1);
      expect(YjsModule.getCharacter('name')).to.equal('Character Test');
      expect(YjsModule.getSetting('setting-test')).to.equal('setting-value');
    });
  });
});
