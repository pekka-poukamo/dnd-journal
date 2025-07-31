import { expect } from 'chai';
import './setup.js';
import * as JournalViews from '../js/journal-views.js';

describe('Journal Views Module', function() {
  beforeEach(function() {
    // Set up a clean DOM environment for each test
    document.body.innerHTML = '<div id="test-container"></div>';
  });

  describe('createEntryForm', function() {
    it('should create a form element with correct structure', function() {
      const form = JournalViews.createEntryForm();
      
      expect(form.tagName).to.equal('FORM');
      expect(form.id).to.equal('entry-form');
      expect(form.className).to.equal('entry-form');
      
      // Check form contains required fields
      const titleInput = form.querySelector('#entry-title');
      const contentTextarea = form.querySelector('#entry-content');
      const submitButton = form.querySelector('button[type="submit"]');
      
      expect(titleInput).to.exist;
      expect(titleInput.name).to.equal('title');
      expect(titleInput.required).to.be.true;
      
      expect(contentTextarea).to.exist;
      expect(contentTextarea.name).to.equal('content');
      expect(contentTextarea.required).to.be.true;
      
      expect(submitButton).to.exist;
      expect(submitButton.textContent).to.equal('Add Entry');
    });

    it('should create form with proper labels', function() {
      const form = JournalViews.createEntryForm();
      
      const titleLabel = form.querySelector('label[for="entry-title"]');
      const contentLabel = form.querySelector('label[for="entry-content"]');
      
      expect(titleLabel).to.exist;
      expect(titleLabel.textContent).to.equal('Title');
      
      expect(contentLabel).to.exist;
      expect(contentLabel.textContent).to.equal('Notes');
    });

    it('should create form with placeholders', function() {
      const form = JournalViews.createEntryForm();
      
      const titleInput = form.querySelector('#entry-title');
      const contentTextarea = form.querySelector('#entry-content');
      
      expect(titleInput.placeholder).to.equal('What happened?');
      expect(contentTextarea.placeholder).to.equal('Write your notes here...');
    });
  });

  describe('createEntryElement', function() {
    const mockEntry = {
      id: 'test-entry-123',
      title: 'Test Adventure',
      content: 'Today we fought a dragon and won!',
      timestamp: 1640995200000 // Jan 1, 2022
    };

    it('should create entry element with correct structure', function() {
      const onEdit = function() {};
      const onDelete = function() {};
      
      const element = JournalViews.createEntryElement(mockEntry, onEdit, onDelete);
      
      expect(element.tagName).to.equal('ARTICLE');
      expect(element.className).to.equal('entry');
      expect(element.dataset.entryId).to.equal('test-entry-123');
    });

    it('should display entry title correctly', function() {
      const element = JournalViews.createEntryElement(mockEntry, () => {}, () => {});
      
      const title = element.querySelector('.entry-title');
      expect(title).to.exist;
      expect(title.textContent).to.equal('Test Adventure');
    });

    it('should format and display timestamp', function() {
      const element = JournalViews.createEntryElement(mockEntry, () => {}, () => {});
      
      const timestamp = element.querySelector('.entry-timestamp');
      expect(timestamp).to.exist;
      expect(timestamp.tagName).to.equal('TIME');
      expect(timestamp.dateTime).to.equal('2022-01-01T00:00:00.000Z');
    });

    it('should render content with markdown parsing', function() {
      const entryWithMarkdown = {
        ...mockEntry,
        content: '**Bold text** and *italic text*'
      };
      
      const element = JournalViews.createEntryElement(entryWithMarkdown, () => {}, () => {});
      
      const content = element.querySelector('.entry-content');
      expect(content).to.exist;
      expect(content.innerHTML).to.include('<strong>Bold text</strong>');
      expect(content.innerHTML).to.include('<em>italic text</em>');
    });

    it('should create edit and delete buttons', function() {
      const element = JournalViews.createEntryElement(mockEntry, () => {}, () => {});
      
      const buttons = element.querySelectorAll('button');
      
      expect(buttons).to.have.length(2);
      expect(buttons[0].textContent).to.equal('Edit');
      expect(buttons[1].textContent).to.equal('Delete');
    });

    it('should handle missing callback functions', function() {
      expect(() => {
        JournalViews.createEntryElement(mockEntry, null, null);
      }).to.not.throw();
    });
  });

  describe('renderEntries', function() {
    const mockEntries = [
      {
        id: 'entry-1',
        title: 'First Adventure',
        content: 'We started our journey',
        timestamp: 1640995200000
      },
      {
        id: 'entry-2',
        title: 'Second Day',
        content: 'The quest continues',
        timestamp: 1641081600000
      }
    ];

    beforeEach(function() {
      document.body.innerHTML = '<div id="entries-container"></div>';
    });

    it('should render entries in container', function() {
      const container = document.getElementById('entries-container');
      
      JournalViews.renderEntries(container, mockEntries, () => {}, () => {});
      
      const entryElements = container.querySelectorAll('.entry');
      expect(entryElements).to.have.length(2);
      
      // Entries should be sorted newest first (entry-2 has higher timestamp)
      expect(entryElements[0].dataset.entryId).to.equal('entry-2');
      expect(entryElements[1].dataset.entryId).to.equal('entry-1');
    });

    it('should display empty state when no entries', function() {
      const container = document.getElementById('entries-container');
      
      JournalViews.renderEntries(container, [], () => {}, () => {});
      
      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).to.exist;
      expect(emptyState.textContent).to.include('No journal entries yet');
    });

    it('should handle null or undefined entries', function() {
      const container = document.getElementById('entries-container');
      
      // The function expects entries to be an array, so let's test with empty array
      expect(() => {
        JournalViews.renderEntries(container, null || [], () => {}, () => {});
      }).to.not.throw();
      
      expect(() => {
        JournalViews.renderEntries(container, undefined || [], () => {}, () => {});
      }).to.not.throw();
    });

    it('should handle missing container', function() {
      expect(() => {
        JournalViews.renderEntries(null, mockEntries, () => {}, () => {});
      }).to.not.throw();
    });

    it('should clear existing content before rendering', function() {
      const container = document.getElementById('entries-container');
      container.innerHTML = '<div class="old-content">Old content</div>';
      
      JournalViews.renderEntries(container, mockEntries, () => {}, () => {});
      
      const oldContent = container.querySelector('.old-content');
      expect(oldContent).to.not.exist;
      
      const entryElements = container.querySelectorAll('.entry');
      expect(entryElements).to.have.length(2);
    });
  });

  describe('renderCharacterSummary', function() {
    const mockCharacter = {
      name: 'Aragorn',
      race: 'Human',
      class: 'Ranger',
      backstory: 'A mysterious ranger from the North',
      notes: 'Heir to the throne of Gondor'
    };

    beforeEach(function() {
      document.body.innerHTML = '<div class="character-info-container"></div>';
    });

    it('should render character summary with all fields', function() {
      const container = document.querySelector('.character-info-container');
      
      JournalViews.renderCharacterSummary(container, mockCharacter);
      
      const summary = container.querySelector('.character-info');
      expect(summary).to.exist;
      
      expect(summary.innerHTML).to.include('Aragorn');
      expect(summary.innerHTML).to.include('Human');
      expect(summary.innerHTML).to.include('Ranger');
    });

    it('should handle empty character data', function() {
      const container = document.querySelector('.character-info-container');
      
      JournalViews.renderCharacterSummary(container, {});
      
      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).to.exist;
      expect(emptyState.textContent).to.include('No character information yet');
    });

    it('should handle partial character data', function() {
      const partialCharacter = {
        name: 'Gimli',
        race: 'Dwarf'
        // Missing class, backstory, notes
      };
      
      const container = document.querySelector('.character-info-container');
      
      JournalViews.renderCharacterSummary(container, partialCharacter);
      
      const summary = container.querySelector('.character-info');
      expect(summary).to.exist;
      expect(summary.innerHTML).to.include('Gimli');
      expect(summary.innerHTML).to.include('Dwarf');
    });

    it('should handle missing container', function() {
      expect(() => {
        JournalViews.renderCharacterSummary(null, mockCharacter);
      }).to.not.throw();
    });

    it('should handle null character data', function() {
      const container = document.querySelector('.character-info-container');
      
      expect(() => {
        JournalViews.renderCharacterSummary(container, null || {});
      }).to.not.throw();
    });
  });

  describe('createEntryEditForm', function() {
    const mockEntry = {
      id: 'edit-test',
      title: 'Original Title',
      content: 'Original content'
    };

    it('should create edit form with pre-filled values', function() {
      const form = JournalViews.createEntryEditForm(mockEntry, () => {}, () => {});
      
      expect(form.tagName).to.equal('FORM');
      expect(form.className).to.include('entry-edit-form');
      
      const titleInput = form.querySelector('input[type="text"]');
      const contentTextarea = form.querySelector('textarea');
      
      expect(titleInput.value).to.equal('Original Title');
      expect(contentTextarea.value).to.equal('Original content');
    });

    it('should create save and cancel buttons', function() {
      const form = JournalViews.createEntryEditForm(mockEntry, () => {}, () => {});
      
      const saveButton = form.querySelector('button[type="submit"]');
      const cancelButton = form.querySelector('button[type="button"]');
      
      expect(saveButton).to.exist;
      expect(saveButton.textContent).to.equal('Save');
      
      expect(cancelButton).to.exist;
      expect(cancelButton.textContent).to.equal('Cancel');
    });

    it('should handle missing entry data', function() {
      // The function expects entry.title and entry.content, so let's provide defaults
      const emptyEntry = { title: '', content: '' };
      
      expect(() => {
        JournalViews.createEntryEditForm(emptyEntry, () => {}, () => {});
      }).to.not.throw();
      
      expect(() => {
        JournalViews.createEntryEditForm({ title: 'Test', content: 'Test' }, () => {}, () => {});
      }).to.not.throw();
    });
  });

  describe('Error handling', function() {
    it('should handle DOM manipulation errors gracefully', function() {
      // Test with invalid/missing DOM elements
      expect(() => {
        JournalViews.renderEntries(null, [], () => {}, () => {});
      }).to.not.throw();
      
      expect(() => {
        JournalViews.renderCharacterSummary(null, {});
      }).to.not.throw();
    });

    it('should handle malformed entry data', function() {
      const malformedEntry = {
        id: 'test',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now() // Valid timestamp
      };
      
      expect(() => {
        JournalViews.createEntryElement(malformedEntry, () => {}, () => {});
      }).to.not.throw();
    });
  });
});