import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as Character from '../js/character.js';
import * as Journal from '../js/journal.js';
import * as Settings from '../js/settings.js';
import { generateId } from '../js/utils.js';

describe('Integration Tests', function() {
  let state;

  beforeEach(async function() {
    // Set up a more complete DOM for integration tests
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="character-info-container"></div>
          <form id="character-form">
            <input id="character-name" name="name" />
            <input id="character-race" name="race" />
            <input id="character-class" name="class" />
            <textarea id="character-backstory" name="backstory"></textarea>
            <textarea id="character-notes" name="notes"></textarea>
          </form>
          <div id="character-summaries"></div>
          
          <div id="entries-container"></div>
          <form id="entry-form">
            <input id="entry-title" />
            <textarea id="entry-content"></textarea>
          </form>
          
          <form id="settings-form">
            <input id="openai-api-key" name="openai-api-key" />
            <input id="ai-enabled" name="ai-enabled" type="checkbox" />
            <input id="sync-server-url" name="sync-server-url" />
          </form>
          <div id="connection-status"></div>
        </body>
      </html>
    `);
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Reset and initialize Y.js
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('Character to Journal Integration', function() {
    it('should show character summary in journal page', function() {
      // Set character data
      YjsModule.setCharacter(state, 'name', 'Aragorn');
      YjsModule.setCharacter(state, 'race', 'Human');
      YjsModule.setCharacter(state, 'class', 'Ranger');
      YjsModule.setCharacter(state, 'backstory', 'Heir of Isildur');
      
      // Initialize and render journal page
      Journal.initJournalPage(state);
      Journal.renderJournalPage(state);
      
      // Check that character info appears in journal
      const characterInfo = document.getElementById('character-info-container');
      expect(characterInfo.textContent).to.include('Aragorn');
    });

    it('should update journal character summary when character changes', function() {
      // Initialize journal page first
      Journal.initJournalPage(state);
      
      // Set initial character data
      YjsModule.setCharacter(state, 'name', 'Legolas');
      YjsModule.setCharacter(state, 'race', 'Elf');
      
      Journal.renderJournalPage(state);
      
      let characterInfo = document.getElementById('character-info-container');
      expect(characterInfo.textContent).to.include('Legolas');
      
      // Update character data
      YjsModule.setCharacter(state, 'name', 'Gimli');
      YjsModule.setCharacter(state, 'race', 'Dwarf');
      
      // Re-render journal (in real app, Y.js observers would do this)
      Journal.renderJournalPage(state);
      
      characterInfo = document.getElementById('character-info-container');
      expect(characterInfo.textContent).to.include('Gimli');
      expect(characterInfo.textContent).to.include('Dwarf');
    });
  });

  describe('Settings to AI Integration', function() {
    it('should enable AI features when properly configured', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      // Settings should be accessible across modules
      const apiKey = YjsModule.getSetting(state, 'openai-api-key');
      const aiEnabled = YjsModule.getSetting(state, 'ai-enabled');
      
      expect(apiKey).to.equal('sk-test123');
      expect(aiEnabled).to.be.true;
    });
  });

  describe('Data Management Workflow', function() {
    it('should manage journal entries through Y.js', function() {
      // Initialize journal page to ensure proper setup
      Journal.initJournalPage(state);
      
      // Add multiple entries
      const entries = [
        {
          id: 'entry-1',
          title: 'First Adventure',
          content: 'We set out from the tavern...',
          timestamp: Date.now() - 2000
        },
        {
          id: 'entry-2',
          title: 'The Dragon',
          content: 'A fearsome dragon appeared...',
          timestamp: Date.now() - 1000
        },
        {
          id: 'entry-3',
          title: 'Victory',
          content: 'We defeated our enemies...',
          timestamp: Date.now()
        }
      ];
      
      entries.forEach(entry => YjsModule.addEntry(state, entry));
      
      // Verify all entries are stored
      const storedEntries = YjsModule.getEntries(state);
      expect(storedEntries).to.have.length(3);
      
      // Update an entry
      YjsModule.updateEntry(state, 'entry-1', {
        title: 'Updated First Adventure',
        content: 'We set out from the tavern (updated)...'
      });
      
      const updatedEntries = YjsModule.getEntries(state);
      const updatedEntry = updatedEntries.find(e => e.id === 'entry-1');
      expect(updatedEntry.title).to.equal('Updated First Adventure');
      
      // Delete an entry
      YjsModule.deleteEntry(state, 'entry-2');
      const finalEntries = YjsModule.getEntries(state);
      expect(finalEntries).to.have.length(2);
    });

    it('should manage character data through Y.js', function() {
      // Set complete character data
      const characterData = {
        name: 'Thorin Oakenshield',
        race: 'Dwarf',
        class: 'King',
        backstory: 'Rightful King under the Mountain',
        notes: 'Proud and sometimes stubborn, but loyal to his people'
      };
      
      Object.entries(characterData).forEach(([field, value]) => {
        YjsModule.setCharacter(state, field, value);
      });
      
      // Verify character data
      const storedData = YjsModule.getCharacterData(state);
      expect(storedData.name).to.equal('Thorin Oakenshield');
      expect(storedData.race).to.equal('Dwarf');
      expect(storedData.class).to.equal('King');
      expect(storedData.backstory).to.equal('Rightful King under the Mountain');
      expect(storedData.notes).to.equal('Proud and sometimes stubborn, but loyal to his people');
    });

    it('should manage settings through Y.js', function() {
      // Set various settings
      const settings = {
        'openai-api-key': 'sk-workflow-test',
        'ai-enabled': true,
        'sync-server-url': 'ws://localhost:8080',
        'custom-setting': 'custom-value'
      };
      
      Object.entries(settings).forEach(([key, value]) => {
        YjsModule.setSetting(state, key, value);
      });
      
      // Verify all settings
      Object.entries(settings).forEach(([key, expectedValue]) => {
        const actualValue = YjsModule.getSetting(state, key);
        expect(actualValue).to.equal(expectedValue);
      });
    });
  });

  describe('Cross-Page Data Consistency', function() {
    it('should maintain character data across page switches', function() {
      // Character page: set data
      YjsModule.setCharacter(state, 'name', 'Bilbo Baggins');
      YjsModule.setCharacter(state, 'race', 'Hobbit');
      
      // Journal page: verify same data is accessible
      Journal.initJournalPage(state);
      Journal.renderJournalPage(state);
      
      const characterInfo = document.getElementById('character-info-container');
      expect(characterInfo.textContent).to.include('Bilbo Baggins');
      
      // Character page: verify data is still there
      Character.initCharacterPage(state);
      Character.renderCharacterPage(state);
      
      expect(document.getElementById('character-name').value).to.equal('Bilbo Baggins');
      expect(document.getElementById('character-race').value).to.equal('Hobbit');
    });

    it('should maintain settings across pages', function() {
      // Settings page: configure API
      YjsModule.setSetting(state, 'openai-api-key', 'sk-cross-page');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      // Character page: should access same settings
      const apiKey = YjsModule.getSetting(state, 'openai-api-key');
      const aiEnabled = YjsModule.getSetting(state, 'ai-enabled');
      
      expect(apiKey).to.equal('sk-cross-page');
      expect(aiEnabled).to.be.true;
      
      // Journal page: should access same settings
      Journal.initJournalPage(state);
      
      const sameApiKey = YjsModule.getSetting(state, 'openai-api-key');
      expect(sameApiKey).to.equal('sk-cross-page');
    });
  });

  describe('Error Handling Integration', function() {
    it('should handle missing DOM elements gracefully across pages', function() {
      // Remove some DOM elements
      document.getElementById('character-form').remove();
      document.getElementById('entry-form').remove();
      
      // All pages should still initialize without errors
      expect(() => Character.initCharacterPage(state)).to.not.throw();
      expect(() => Journal.initJournalPage(state)).to.not.throw();
      expect(() => Settings.initSettingsPage(state)).to.not.throw();
    });
  });

  describe('Y.js Data Integrity', function() {
    it('should maintain data integrity across operations', function() {
      // Perform multiple operations rapidly
      YjsModule.setCharacter(state, 'name', 'Frodo');
      
      const entry1 = {
        id: generateId(),
        title: 'The Ring',
        content: 'I inherited a mysterious ring...',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry1);
      YjsModule.setSetting(state, 'test-setting', 'test-value');
      YjsModule.setSummary(state, 'test-summary', 'A test summary');
      
      // Verify all data is intact
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Frodo');
      expect(YjsModule.getEntries(state)).to.have.length(1);
      expect(YjsModule.getSetting(state, 'test-setting')).to.equal('test-value');
      expect(YjsModule.getSummary(state, 'test-summary')).to.equal('A test summary');
    });

    it('should handle rapid data changes', function() {
      // Rapidly add multiple entries
      const entries = [];
      for (let i = 0; i < 10; i++) {
        const entry = {
          id: generateId(),
          title: `Entry ${i}`,
          content: `Content for entry ${i}`,
          timestamp: Date.now() + i
        };
        entries.push(entry);
        YjsModule.addEntry(state, entry);
      }
      
      // Verify all entries were added
      const storedEntries = YjsModule.getEntries(state);
      expect(storedEntries).to.have.length(10);
      
      // Rapidly update character data
      for (let i = 0; i < 5; i++) {
        YjsModule.setCharacter(state, 'name', `Character ${i}`);
      }
      
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Character 4');
    });
  });

  describe('Page Module Integration', function() {
    it('should allow all page modules to coexist', function() {
      // Initialize all page modules
      Character.initCharacterPage(state);
      Journal.initJournalPage(state);
      Settings.initSettingsPage(state);
      
      // Set data in each module
      YjsModule.setCharacter(state, 'name', 'Integration Test Character');
      
      const entry = {
        id: generateId(),
        title: 'Integration Test Entry',
        content: 'Testing module integration',
        timestamp: Date.now()
      };
      YjsModule.addEntry(state, entry);
      
      YjsModule.setSetting(state, 'integration-test', 'success');
      
      // Verify data is accessible from all modules
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Integration Test Character');
      expect(YjsModule.getEntries(state)).to.have.length(1);
      expect(YjsModule.getSetting(state, 'integration-test')).to.equal('success');
    });

    it('should maintain separate responsibilities per page', function() {
      // Character module should handle character data
      Character.initCharacterPage(state);
      YjsModule.setCharacter(state, 'name', 'Character Module Test');
      
      // Journal module should handle entries
      Journal.initJournalPage(state);
      const entry = {
        id: generateId(),
        title: 'Journal Module Test',
        content: 'Testing journal responsibility',
        timestamp: Date.now()
      };
      YjsModule.addEntry(state, entry);
      
      // Settings module should handle settings
      Settings.initSettingsPage(state);
      YjsModule.setSetting(state, 'settings-module-test', 'working');
      
      // Each module can access its data
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Character Module Test');
      expect(YjsModule.getEntries(state)[0].title).to.equal('Journal Module Test');
      expect(YjsModule.getSetting(state, 'settings-module-test')).to.equal('working');
    });
  });
});
