import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as Journal from '../js/journal.js';
import { generateId } from '../js/utils.js';

describe('Journal Page', function() {
  let state;

  beforeEach(async function() {
    // Set up DOM
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="entries-container"></div>
          <div id="character-info"></div>
          <form id="entry-form">
            <input id="entry-title" />
            <textarea id="entry-content"></textarea>
            <button type="submit">Add Entry</button>
          </form>
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

  describe('initJournalPage', function() {
    it('should initialize without errors', function() {
      expect(() => Journal.initJournalPage(state)).to.not.throw();
    });

    it('should render existing entries when initialized', function() {
      const entry = {
        id: generateId(),
        title: 'Test Entry',
        content: 'This is a test entry',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      Journal.initJournalPage(state);
      
      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.children.length).to.be.greaterThan(0);
    });
  });

  describe('renderJournalPage', function() {
    it('should render when called', function() {
      const entry = {
        id: generateId(),
        title: 'Sample Entry',
        content: 'Sample content',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      
      expect(() => Journal.renderJournalPage(state)).to.not.throw();
      
      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.children.length).to.be.greaterThan(0);
    });

    it('should handle missing containers gracefully', function() {
      document.getElementById('entries-container').remove();
      document.getElementById('character-info').remove();
      
      expect(() => Journal.renderJournalPage(state)).to.not.throw();
    });

    it('should display character summary', function() {
      YjsModule.setCharacter(state, 'name', 'Aragorn');
      YjsModule.setCharacter(state, 'race', 'Human');
      YjsModule.setCharacter(state, 'class', 'Ranger');
      
      Journal.renderJournalPage(state);
      
      const characterInfo = document.getElementById('character-info');
      expect(characterInfo.textContent).to.include('Aragorn');
    });

    it('should handle no entries gracefully', function() {
      // Ensure no entries exist
      const entries = YjsModule.getEntries(state);
      expect(entries).to.have.length(0);
      
      expect(() => Journal.renderJournalPage(state)).to.not.throw();
      
      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.textContent).to.include('No entries yet');
    });
  });

  describe('Entry data management', function() {
    it('should add new entries through Y.js', function() {
      const entry = {
        id: generateId(),
        title: 'New Adventure',
        content: 'Today we started our journey...',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      
      const entries = YjsModule.getEntries(state);
      expect(entries).to.have.length(1);
      expect(entries[0].title).to.equal('New Adventure');
    });

    it('should handle entry updates', function() {
      const entry = {
        id: 'test-entry-1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      
      const updates = {
        title: 'Updated Title',
        content: 'Updated content'
      };
      
      YjsModule.updateEntry(state, 'test-entry-1', updates);
      
      const entries = YjsModule.getEntries(state);
      expect(entries[0].title).to.equal('Updated Title');
      expect(entries[0].content).to.equal('Updated content');
    });

    it('should handle entry deletion', function() {
      const entry = {
        id: 'test-entry-2',
        title: 'To Delete',
        content: 'This will be deleted',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      expect(YjsModule.getEntries(state)).to.have.length(1);
      
      YjsModule.deleteEntry(state, 'test-entry-2');
      expect(YjsModule.getEntries(state)).to.have.length(0);
    });

    it('should handle multiple entries', function() {
      const entries = [
        { id: 'entry-1', title: 'First', content: 'First entry', timestamp: Date.now() },
        { id: 'entry-2', title: 'Second', content: 'Second entry', timestamp: Date.now() + 1 },
        { id: 'entry-3', title: 'Third', content: 'Third entry', timestamp: Date.now() + 2 }
      ];
      
      entries.forEach(entry => YjsModule.addEntry(state, entry));
      
      const storedEntries = YjsModule.getEntries(state);
      expect(storedEntries).to.have.length(3);
    });
  });

  describe('Reactive updates', function() {
    it('should update when entries change', function() {
      Journal.initJournalPage(state);
      
      const entry = {
        id: generateId(),
        title: 'Reactive Test',
        content: 'Testing reactive updates',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      
      // Note: In real app, Y.js observers would trigger updates
      // For testing, we manually render
      Journal.renderJournalPage(state);
      
      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.textContent).to.include('Reactive Test');
    });

    it('should update character summary when character changes', function() {
      Journal.initJournalPage(state);
      
      YjsModule.setCharacter(state, 'name', 'Legolas');
      YjsModule.setCharacter(state, 'race', 'Elf');
      
      // Note: In real app, Y.js observers would trigger updates
      Journal.renderJournalPage(state);
      
      const characterInfo = document.getElementById('character-info');
      expect(characterInfo.textContent).to.include('Legolas');
      expect(characterInfo.textContent).to.include('Elf');
    });
  });

  describe('Error handling', function() {
    it('should handle missing form elements', function() {
      document.getElementById('entry-form').remove();
      
      expect(() => Journal.initJournalPage(state)).to.not.throw();
      expect(() => Journal.renderJournalPage(state)).to.not.throw();
    });

    it('should handle missing container elements', function() {
      document.getElementById('entries-container').remove();
      document.getElementById('character-info').remove();
      
      expect(() => Journal.initJournalPage(state)).to.not.throw();
      expect(() => Journal.renderJournalPage(state)).to.not.throw();
    });
  });

  describe('Entry sorting and display', function() {
    it('should maintain entries in Y.js properly', function() {
      const entries = [
        { id: 'old', title: 'Old Entry', content: 'Old', timestamp: 1000 },
        { id: 'new', title: 'New Entry', content: 'New', timestamp: 2000 },
        { id: 'newest', title: 'Newest Entry', content: 'Newest', timestamp: 3000 }
      ];
      
      entries.forEach(entry => YjsModule.addEntry(state, entry));
      
      const storedEntries = YjsModule.getEntries(state);
      expect(storedEntries).to.have.length(3);
      
      // Find entries by ID to verify they were stored
      const oldEntry = storedEntries.find(e => e.id === 'old');
      const newEntry = storedEntries.find(e => e.id === 'new');
      const newestEntry = storedEntries.find(e => e.id === 'newest');
      
      expect(oldEntry).to.exist;
      expect(newEntry).to.exist;
      expect(newestEntry).to.exist;
    });
  });
});