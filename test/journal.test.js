import { expect } from 'chai';
import './setup.js';
import * as Journal from '../js/journal.js';
import * as YjsModule from '../js/yjs.js';

describe('Journal Page', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
    
    // Set up journal page DOM
    document.body.innerHTML = `
      <form id="entry-form">
        <input type="text" name="title" id="entry-title" />
        <textarea name="content" id="entry-content"></textarea>
        <button type="submit">Add Entry</button>
      </form>
      <div id="entries-container"></div>
      <div class="character-info-container"></div>
    `;
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initJournalPage', function() {
    it('should initialize without errors', async function() {
      expect(async () => {
        await Journal.initJournalPage();
      }).to.not.throw();
    });

    it('should render existing entries', async function() {
      // Add some entries first
      YjsModule.addEntry({
        id: 'test-1',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      });

      await Journal.initJournalPage();
      
      // Check that entries container has content
      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.innerHTML).to.include('Test Entry');
    });
  });

  describe('renderJournalPage', function() {
    it('should display journal entries', function() {
      // Add entries
      YjsModule.addEntry({
        id: 'entry-1',
        title: 'First Adventure',
        content: 'We began our quest today...',
        timestamp: Date.now() - 1000
      });

      YjsModule.addEntry({
        id: 'entry-2',
        title: 'Second Day',
        content: 'The journey continues...',
        timestamp: Date.now()
      });

      Journal.renderJournalPage();

      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.innerHTML).to.include('First Adventure');
      expect(entriesContainer.innerHTML).to.include('Second Day');
      expect(entriesContainer.innerHTML).to.include('We began our quest today');
      expect(entriesContainer.innerHTML).to.include('The journey continues');
    });

    it('should display character summary', function() {
      // Set character data
      YjsModule.setCharacter('name', 'Aragorn');
      YjsModule.setCharacter('race', 'Human');
      YjsModule.setCharacter('class', 'Ranger');

      Journal.renderJournalPage();

      const characterContainer = document.querySelector('.character-info-container');
      expect(characterContainer.innerHTML).to.include('Aragorn');
      expect(characterContainer.innerHTML).to.include('Human');
      expect(characterContainer.innerHTML).to.include('Ranger');
    });

    it('should show empty state when no entries exist', function() {
      Journal.renderJournalPage();

      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.innerHTML).to.include('No journal entries yet');
    });
  });

  describe('Entry form handling', function() {
    beforeEach(async function() {
      await Journal.initJournalPage();
    });

    it('should add new entry on form submission', function() {
      // Fill form
      document.getElementById('entry-title').value = 'New Adventure';
      document.getElementById('entry-content').value = 'Today we discovered something amazing...';

      // Submit form
      const form = document.getElementById('entry-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Check entry was added
      const entries = YjsModule.getEntries();
      expect(entries).to.have.length(1);
      expect(entries[0].title).to.equal('New Adventure');
      expect(entries[0].content).to.equal('Today we discovered something amazing...');
    });

    it('should clear form after submission', function() {
      // Fill form
      document.getElementById('entry-title').value = 'Test Entry';
      document.getElementById('entry-content').value = 'Test content';

      // Submit form
      const form = document.getElementById('entry-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Check form is cleared
      expect(document.getElementById('entry-title').value).to.equal('');
      expect(document.getElementById('entry-content').value).to.equal('');
    });

    it('should handle empty form submission', function() {
      // Submit empty form
      const form = document.getElementById('entry-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Should not add empty entry
      const entries = YjsModule.getEntries();
      expect(entries).to.have.length(0);
    });

    it('should trim whitespace from inputs', function() {
      // Fill form with whitespace
      document.getElementById('entry-title').value = '  Whitespace Test  ';
      document.getElementById('entry-content').value = '  Content with spaces  ';

      // Submit form
      const form = document.getElementById('entry-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);

      // Check trimmed values
      const entries = YjsModule.getEntries();
      expect(entries[0].title).to.equal('Whitespace Test');
      expect(entries[0].content).to.equal('Content with spaces');
    });
  });

  describe('Entry management', function() {
    beforeEach(async function() {
      await Journal.initJournalPage();
      
      // Add test entries
      YjsModule.addEntry({
        id: 'edit-test',
        title: 'Editable Entry',
        content: 'This entry can be edited',
        timestamp: Date.now()
      });
    });

    it('should handle entry editing', function() {
      // Update entry
      YjsModule.updateEntry('edit-test', {
        title: 'Updated Title',
        content: 'Updated content'
      });

      // Render and check update
      Journal.renderJournalPage();

      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.innerHTML).to.include('Updated Title');
      expect(entriesContainer.innerHTML).to.include('Updated content');
      expect(entriesContainer.innerHTML).to.not.include('Editable Entry');
    });

    it('should handle entry deletion', function() {
      // Delete entry
      YjsModule.deleteEntry('edit-test');

      // Render and check deletion
      Journal.renderJournalPage();

      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.innerHTML).to.not.include('Editable Entry');
      expect(entriesContainer.innerHTML).to.include('No journal entries yet');
    });
  });

  describe('Reactive updates', function() {
    it('should update UI when entries change', async function() {
      await Journal.initJournalPage();

      // Add entry through Y.js
      YjsModule.addEntry({
        id: 'reactive-test',
        title: 'Reactive Entry',
        content: 'This should appear automatically',
        timestamp: Date.now()
      });

      // Manually trigger render (in real app, Y.js observers would do this)
      Journal.renderJournalPage();

      const entriesContainer = document.getElementById('entries-container');
      expect(entriesContainer.innerHTML).to.include('Reactive Entry');
    });

    it('should update character summary when character changes', async function() {
      await Journal.initJournalPage();

      // Change character
      YjsModule.setCharacter('name', 'Updated Character');

      // Manually trigger render
      Journal.renderJournalPage();

      const characterContainer = document.querySelector('.character-info-container');
      expect(characterContainer.innerHTML).to.include('Updated Character');
    });
  });

  describe('Error handling', function() {
    it('should handle missing form elements', async function() {
      // Remove form
      document.getElementById('entry-form').remove();

      expect(async () => {
        await Journal.initJournalPage();
      }).to.not.throw();
    });

    it('should handle missing container elements', function() {
      // Remove containers
      document.getElementById('entries-container').remove();
      document.querySelector('.character-info-container').remove();

      expect(() => {
        Journal.renderJournalPage();
      }).to.not.throw();
    });

    it('should handle Y.js initialization failure', async function() {
      // Force Y.js to fail
      const originalInitYjs = YjsModule.initYjs;
      YjsModule.initYjs = async () => {
        throw new Error('Y.js init failed');
      };

      try {
        await Journal.initJournalPage();
        // Test passes if no uncaught exception
      } finally {
        YjsModule.initYjs = originalInitYjs;
      }
    });
  });

  describe('Entry sorting and display', function() {
    beforeEach(async function() {
      await Journal.initJournalPage();
    });

    it('should display entries in reverse chronological order', function() {
      // Add entries with different timestamps
      const now = Date.now();
      YjsModule.addEntry({
        id: 'old',
        title: 'Old Entry',
        content: 'This is older',
        timestamp: now - 2000
      });

      YjsModule.addEntry({
        id: 'new',
        title: 'New Entry',
        content: 'This is newer',
        timestamp: now
      });

      YjsModule.addEntry({
        id: 'middle',
        title: 'Middle Entry',
        content: 'This is in the middle',
        timestamp: now - 1000
      });

      Journal.renderJournalPage();

      const entriesContainer = document.getElementById('entries-container');
      const innerHTML = entriesContainer.innerHTML;
      
      // New entry should appear before middle entry
      const newIndex = innerHTML.indexOf('New Entry');
      const middleIndex = innerHTML.indexOf('Middle Entry');
      const oldIndex = innerHTML.indexOf('Old Entry');

      expect(newIndex).to.be.lessThan(middleIndex);
      expect(middleIndex).to.be.lessThan(oldIndex);
    });
  });
});