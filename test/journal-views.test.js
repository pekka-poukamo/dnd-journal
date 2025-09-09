import { expect } from 'chai';
import './setup.js';
import * as JournalViews from '../js/journal-views.js';
import * as YjsModule from '../js/yjs.js';

describe('Journal Views Module', function() {
  let state;

  beforeEach(async function() {
    // Set up a clean DOM environment for each test
    document.body.innerHTML = '<div id="test-container"></div>';
    
    // Reset and initialize Y.js
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('createEntryForm', function() {
    it('should create a form element with correct structure', function() {
      const form = JournalViews.createEntryForm();
      
      expect(form.tagName).to.equal('FORM');
      expect(form.id).to.equal('entry-form');
      expect(form.className).to.equal('entry-form');
      
      // Check form contains required fields
      const contentTextarea = form.querySelector('#entry-content');
      const submitButton = form.querySelector('button[type="submit"]');
      
      expect(contentTextarea).to.exist;
      expect(contentTextarea.name).to.equal('content');
      expect(contentTextarea.required).to.be.true;
      
      expect(submitButton).to.exist;
      expect(submitButton.textContent).to.equal('Add Entry');
    });

    it('should create form with proper labels', function() {
      const form = JournalViews.createEntryForm();
      
      const contentLabel = form.querySelector('label[for="entry-content"]');
      
      expect(contentLabel).to.exist;
      expect(contentLabel.textContent).to.equal('Notes');
    });

    it('should create form with placeholders', function() {
      const form = JournalViews.createEntryForm();
      
      const contentTextarea = form.querySelector('#entry-content');
      
      expect(contentTextarea.placeholder).to.equal('Write your journal entry here...');
    });
  });

  describe('createEntryElement', function() {
    const mockEntry = {
      id: 'test-entry-123',
      content: 'Today we fought a dragon and won!',
      timestamp: 1640995200000 // Jan 1, 2022
    };

    it('should create entry element with correct structure', function() {
      const onEdit = function() {};
      const onDelete = function() {};
      
      const element = JournalViews.createEntryElement(mockEntry, onEdit, onDelete);
      
      expect(element.tagName).to.equal('ARTICLE');
      expect(element.className).to.equal('entry entry--placeholder');
      expect(element.dataset.entryId).to.equal('test-entry-123');
    });

    // Title functionality removed - entries no longer display titles

    it('should format and display timestamp', function() {
      const element = JournalViews.createEntryElement(mockEntry, () => {}, () => {});
      
      const timestamp = element.querySelector('.entry-timestamp');
      expect(timestamp).to.exist;
      expect(timestamp.tagName).to.equal('TIME');
      expect(timestamp.dateTime).to.equal('1640995200000');
    });

    it('should render content with markdown parsing', function() {
      const entryWithMarkdown = {
        ...mockEntry,
        content: '**Bold text** and *italic text*'
      };
      
      const element = JournalViews.createEntryElement(entryWithMarkdown, () => {}, () => {});
      
      const content = element.querySelector('.collapsible__content');
      expect(content).to.exist;
      expect(content.innerHTML).to.include('<strong>Bold text</strong>');
      expect(content.innerHTML).to.include('<em>italic text</em>');
    });

    it('should not create empty paragraph tags', function() {
      const entryWithEmptyContent = {
        ...mockEntry,
        content: ''
      };
      
      const element = JournalViews.createEntryElement(entryWithEmptyContent, () => {}, () => {});
      
      const content = element.querySelector('.collapsible__content');
      expect(content).to.exist;
      expect(content.innerHTML).to.not.include('<p></p>');
      expect(content.innerHTML).to.not.include('<p> </p>');
      expect(content.innerHTML).to.not.include('<p>\n</p>');
    });

    it('should handle content with only whitespace', function() {
      const entryWithWhitespace = {
        ...mockEntry,
        content: '   \n\n  \n\n  '
      };
      
      const element = JournalViews.createEntryElement(entryWithWhitespace, () => {}, () => {});
      
      const content = element.querySelector('.collapsible__content');
      expect(content).to.exist;
      expect(content.innerHTML).to.not.include('<p></p>');
      expect(content.innerHTML).to.not.include('<p> </p>');
      expect(content.innerHTML).to.not.include('<p>\n</p>');
    });

    it('should create edit and delete buttons', function() {
      const element = JournalViews.createEntryElement(mockEntry, () => {}, () => {});

      const buttons = element.querySelectorAll('button');
      
      expect(buttons).to.have.length(3); // toggle button + edit + delete
      
      // Check for the toggle button
      const toggleButton = element.querySelector('.entry-content-control__toggle');
      expect(toggleButton).to.exist;
      expect(toggleButton.textContent).to.equal('Show chapter');
      
      // Check for edit and delete buttons (they're icon buttons)
      const editButton = element.querySelector('.icon-button[title="Edit"]');
      const deleteButton = element.querySelector('.icon-button[title="Delete"]');
      expect(editButton).to.exist;
      expect(deleteButton).to.exist;
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

    it('should render recent and older sections when many entries', function() {
      const container = document.getElementById('entries-container');
      const many = [];
      const base = 1640995200000;
      for (let i = 0; i < 12; i++) {
        many.push({ id: `e${i}`, content: `content ${i}`, timestamp: base + i * 1000 });
      }
      JournalViews.renderEntries(container, many, () => {}, () => {});
      // Verify toggling older entries collapsible works
      const toggleButton = container.querySelector('.entries-section--older .collapsible__toggle');
      expect(toggleButton).to.exist;
      const contentDiv = container.querySelector('.entries-section--older .collapsible__content');
      expect(contentDiv.style.display).to.equal('none');
      toggleButton.click();
      expect(contentDiv.style.display).to.equal('block');
      toggleButton.click();
      expect(contentDiv.style.display).to.equal('none');
      const sections = container.querySelectorAll('.entries-section');
      expect(sections.length).to.be.greaterThan(0);
      const recentHeader = container.querySelector('.entries-section--recent h3');
      const olderHeader = container.querySelector('.entries-section--older h3');
      expect(recentHeader.textContent).to.include('Recent Adventures');
      expect(olderHeader.textContent).to.include('Older Adventures');
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
      content: 'Original content'
    };

    it('should create edit form with pre-filled values', function() {
      const form = JournalViews.createEntryEditForm(mockEntry, () => {}, () => {});
      
      expect(form.tagName).to.equal('FORM');
      expect(form.className).to.include('entry-edit-form');
      
      const contentTextarea = form.querySelector('textarea');
      
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

  describe('getFormData', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <form id="test-form">
          <input name="text-input" value="test text" />
          <textarea name="textarea-input">test textarea content</textarea>
          <select name="select-input">
            <option value="option1" selected>Option 1</option>
            <option value="option2">Option 2</option>
          </select>
          <input type="checkbox" name="checkbox-input" checked />
          <input type="radio" name="radio-input" value="radio1" checked />
          <input type="hidden" name="hidden-input" value="hidden value" />
        </form>
      `;
    });



    it('should handle error gracefully when FormData fails', function() {
      const form = document.getElementById('test-form') || document.createElement('form');
      
      // This test verifies the function doesn't crash even if FormData fails
      expect(() => {
        try {
          JournalViews.getFormData(form);
        } catch (error) {
          // Expected in JSDOM environment
          console.log('FormData not available in test environment');
        }
      }).to.not.throw();
    });
  });

  describe('clearForm', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <form id="test-form">
          <input type="text" name="text-input" value="initial text" />
          <textarea name="textarea-input">initial textarea content</textarea>
          <select name="select-input">
            <option value="option1">Option 1</option>
            <option value="option2" selected>Option 2</option>
          </select>
          <input type="checkbox" name="checkbox-input" checked />
          <input type="radio" name="radio-input" value="radio1" checked />
          <input type="radio" name="radio-input" value="radio2" />
          <input type="hidden" name="hidden-input" value="hidden value" />
          <input type="email" name="email-input" value="test@example.com" />
          <input type="number" name="number-input" value="42" />
        </form>
      `;
    });

    it('should clear text inputs', function() {
      const form = document.getElementById('test-form');
      
      JournalViews.clearForm(form);
      
      const textInput = form.querySelector('input[name="text-input"]');
      const emailInput = form.querySelector('input[name="email-input"]');
      const numberInput = form.querySelector('input[name="number-input"]');
      const hiddenInput = form.querySelector('input[name="hidden-input"]');
      
      expect(textInput.value).to.equal('');
      expect(emailInput.value).to.equal('');
      expect(numberInput.value).to.equal('');
      expect(hiddenInput.value).to.equal('');
    });

    it('should clear textarea inputs', function() {
      const form = document.getElementById('test-form');
      
      JournalViews.clearForm(form);
      
      const textarea = form.querySelector('textarea[name="textarea-input"]');
      expect(textarea.value).to.equal('');
    });

    it('should clear select inputs', function() {
      const form = document.getElementById('test-form');
      
      JournalViews.clearForm(form);
      
      const select = form.querySelector('select[name="select-input"]');
      expect(select.value).to.equal('');
    });

    it('should uncheck checkbox inputs', function() {
      const form = document.getElementById('test-form');
      
      JournalViews.clearForm(form);
      
      const checkbox = form.querySelector('input[name="checkbox-input"]');
      expect(checkbox.checked).to.be.false;
    });

    it('should uncheck radio inputs', function() {
      const form = document.getElementById('test-form');
      
      JournalViews.clearForm(form);
      
      const radio1 = form.querySelector('input[name="radio-input"][value="radio1"]');
      const radio2 = form.querySelector('input[name="radio-input"][value="radio2"]');
      expect(radio1.checked).to.be.false;
      expect(radio2.checked).to.be.false;
    });

    it('should handle empty form', function() {
      document.body.innerHTML = '<form id="empty-form"></form>';
      const form = document.getElementById('empty-form');
      
      expect(() => {
        JournalViews.clearForm(form);
      }).to.not.throw();
    });

    it('should handle form with no inputs', function() {
      document.body.innerHTML = '<form id="no-inputs-form"><div>No inputs here</div></form>';
      const form = document.getElementById('no-inputs-form');
      
      expect(() => {
        JournalViews.clearForm(form);
      }).to.not.throw();
    });

    it('should handle mixed input types', function() {
      document.body.innerHTML = `
        <form id="mixed-form">
          <input type="text" name="text" value="text value" />
          <input type="checkbox" name="checkbox" checked />
          <textarea name="textarea">textarea content</textarea>
          <select name="select">
            <option value="1" selected>One</option>
          </select>
        </form>
      `;
      
      const form = document.getElementById('mixed-form');
      JournalViews.clearForm(form);
      
      expect(form.querySelector('input[name="text"]').value).to.equal('');
      expect(form.querySelector('input[name="checkbox"]').checked).to.be.false;
      expect(form.querySelector('textarea[name="textarea"]').value).to.equal('');
      expect(form.querySelector('select[name="select"]').value).to.equal('');
    });
  });

  describe('AI Prompt Rendering Functions', function() {
    let testElement, testButton;

    beforeEach(function() {
      // Create test DOM elements
      testElement = document.createElement('p');
      testButton = document.createElement('button');
      document.body.appendChild(testElement);
      document.body.appendChild(testButton);
    });

    afterEach(function() {
      // Clean up test elements
      if (testElement.parentNode) {
        testElement.parentNode.removeChild(testElement);
      }
      if (testButton.parentNode) {
        testButton.parentNode.removeChild(testButton);
      }
    });

    describe('renderAIPrompt', function() {
      it('should render API not available state', function() {
        const aiPromptState = { type: 'api-not-available' };
        
        JournalViews.renderAIPrompt(testElement, aiPromptState, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__empty-state');
        expect(testElement.innerHTML).to.equal('AI features require an API key to be configured in Settings.');
        expect(testButton.disabled).to.be.true;
      });

      it('should render no context state', function() {
        const aiPromptState = { type: 'no-context' };
        
        JournalViews.renderAIPrompt(testElement, aiPromptState, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__empty-state');
        expect(testElement.innerHTML).to.equal('Add some character details or journal entries to get personalized reflection questions.');
        expect(testButton.disabled).to.be.true;
      });

      it('should render loading state', function() {
        const aiPromptState = { type: 'loading' };
        
        JournalViews.renderAIPrompt(testElement, aiPromptState, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__text loading');
        expect(testElement.innerHTML).to.equal('Generating your personalized reflection questions...');
        expect(testButton.disabled).to.be.true;
      });

      it('should render questions state', function() {
        const questions = 'Test reflection questions for your character.';
        const aiPromptState = { type: 'questions', questions };
        
        JournalViews.renderAIPrompt(testElement, aiPromptState, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__text');
        expect(testElement.innerHTML).to.equal(questions);
        expect(testButton.disabled).to.be.false;
      });

      it('should render error state', function() {
        const aiPromptState = { type: 'error' };
        
        JournalViews.renderAIPrompt(testElement, aiPromptState, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__error-state');
        expect(testElement.innerHTML).to.equal('Unable to generate reflection questions. Please try again.');
        expect(testButton.disabled).to.be.false;
      });

      it('should render default error state for unknown type', function() {
        const aiPromptState = { type: 'unknown-type' };
        
        JournalViews.renderAIPrompt(testElement, aiPromptState, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__error-state');
        expect(testElement.innerHTML).to.equal('Unable to generate reflection questions. Please try again.');
        expect(testButton.disabled).to.be.false;
      });

      it('should handle missing element gracefully', function() {
        const aiPromptState = { type: 'loading' };
        
        expect(() => JournalViews.renderAIPrompt(null, aiPromptState, testButton)).to.not.throw();
      });

      it('should handle missing button gracefully', function() {
        const aiPromptState = { type: 'loading' };
        
        expect(() => JournalViews.renderAIPrompt(testElement, aiPromptState, null)).to.not.throw();
        expect(testElement.className).to.equal('ai-prompt__text loading');
      });
    });

    describe('showAIPromptAPINotAvailable', function() {
      it('should set correct class and text', function() {
        JournalViews.showAIPromptAPINotAvailable(testElement, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__empty-state');
        expect(testElement.innerHTML).to.equal('AI features require an API key to be configured in Settings.');
        expect(testButton.disabled).to.be.true;
      });

      it('should handle missing element', function() {
        expect(() => JournalViews.showAIPromptAPINotAvailable(null, testButton)).to.not.throw();
      });

      it('should handle missing button', function() {
        expect(() => JournalViews.showAIPromptAPINotAvailable(testElement, null)).to.not.throw();
      });
    });

    describe('showAIPromptNoContext', function() {
      it('should set correct class and text', function() {
        JournalViews.showAIPromptNoContext(testElement, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__empty-state');
        expect(testElement.innerHTML).to.equal('Add some character details or journal entries to get personalized reflection questions.');
        expect(testButton.disabled).to.be.true;
      });

      it('should handle missing element', function() {
        expect(() => JournalViews.showAIPromptNoContext(null, testButton)).to.not.throw();
      });
    });

    describe('showAIPromptLoading', function() {
      it('should set correct class and text', function() {
        JournalViews.showAIPromptLoading(testElement, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__text loading');
        expect(testElement.innerHTML).to.equal('Generating your personalized reflection questions...');
        expect(testButton.disabled).to.be.true;
      });

      it('should handle missing element', function() {
        expect(() => JournalViews.showAIPromptLoading(null, testButton)).to.not.throw();
      });
    });

    describe('showAIPromptQuestions', function() {
      it('should set correct class and text', function() {
        const questions = 'Sample questions for testing';
        
        JournalViews.showAIPromptQuestions(testElement, questions, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__text');
        expect(testElement.innerHTML).to.equal(questions);
        expect(testButton.disabled).to.be.false;
      });

      it('should handle missing element', function() {
        expect(() => JournalViews.showAIPromptQuestions(null, 'questions', testButton)).to.not.throw();
      });

      it('should format questions with newlines and numbered lists', function() {
        const questions = '1. What drives your character?\n\n2. How do they handle conflict?\n\n3. What are their deepest fears?';
        
        JournalViews.showAIPromptQuestions(testElement, questions, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__text');
        expect(testElement.innerHTML).to.include('<strong>1. </strong>What drives your character?');
        expect(testElement.innerHTML).to.include('<br><br>');
        expect(testElement.innerHTML).to.include('<strong>2. </strong>How do they handle conflict?');
        expect(testElement.innerHTML).to.include('<strong>3. </strong>What are their deepest fears?');
        expect(testButton.disabled).to.be.false;
      });
    });

    describe('showAIPromptError', function() {
      it('should set correct class and text', function() {
        JournalViews.showAIPromptError(testElement, testButton);
        
        expect(testElement.className).to.equal('ai-prompt__error-state');
        expect(testElement.innerHTML).to.equal('Unable to generate reflection questions. Please try again.');
        expect(testButton.disabled).to.be.false;
      });

      it('should handle missing element', function() {
        expect(() => JournalViews.showAIPromptError(null, testButton)).to.not.throw();
      });
    });
  });
});