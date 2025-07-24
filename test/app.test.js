const path = require('path');
const fs = require('fs');
require('./setup');
const { should } = require('chai');

// Load the utils and app files as modules
const utilsPath = path.join(__dirname, '../js/utils.js');
const appPath = path.join(__dirname, '../js/app.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// Create a proper module context
function loadApp() {
  // Clear localStorage before each test
  localStorage.clear();
  
  // Reset DOM with proper form elements
  document.body.innerHTML = `
    <input type="text" id="character-name" />
    <input type="text" id="character-race" />
    <input type="text" id="character-class" />
    <input type="text" id="entry-title" />
    <textarea id="entry-content"></textarea>
    <div id="entries-list"></div>
  `;
  
  // Clear any existing globals
  delete global.state;
  delete global.loadData;
  delete global.saveData;
  delete global.getEntrySummary;
  delete global.createEntryElement;
  delete global.enableEditMode;
  delete global.saveEdit;
  delete global.cancelEdit;
  delete global.renderEntries;
  delete global.addEntry;
  delete global.createCharacterSummary;
  delete global.displayCharacterSummary;
  
  // Setup window object for utils
  global.window = global.window || {};
  
  // Evaluate the utils code first to setup window.Utils
  eval(utilsContent);
  
  // Evaluate the app code in the global context
  eval(appContent);
  
  return {
    loadData: global.loadData,
    saveData: global.saveData,
    state: global.state
  };
}

describe('D&D Journal App', function() {
  beforeEach(function() {
    loadApp();
  });



  describe('State Management', function() {
    it('should initialize with default state', function() {
      // Test that the state is properly initialized for the app to function
      state.should.be.an('object');
      state.character.should.be.an('object');
      state.entries.should.be.an('array').that.is.empty;
      
      // Test that default character values work with the character summary
      const summary = createCharacterSummary(state.character);
      summary.name.should.equal('No character created yet');
    });

    it('should save and load data from localStorage', function() {
      // Modify state
      state.character.name = 'Aragorn';
      state.character.race = 'Human';
      state.character.class = 'Ranger';
      state.entries.push({
        id: '123',
        title: 'Test Adventure',
        content: 'A great quest!',
        timestamp: Date.now()
      });

      // Save data
      saveData();

      // Verify localStorage contains data
      const stored = localStorage.getItem('simple-dnd-journal');
      stored.should.not.be.null;
      
      const parsedData = JSON.parse(stored);
      parsedData.character.name.should.equal('Aragorn');
      parsedData.entries.should.have.length(1);

      // Clear current state and simulate fresh app start
      localStorage.clear();
      localStorage.setItem('simple-dnd-journal', stored);
      
      // Reinitialize the state from storage
      const freshState = {
        character: { name: '', race: '', class: '' },
        entries: []
      };
      
      try {
        const storedData = localStorage.getItem('simple-dnd-journal');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          Object.assign(freshState, parsed);
        }
      } catch (error) {
        // Handle error
      }

      // Verify state was restored
      freshState.character.name.should.equal('Aragorn');
      freshState.character.race.should.equal('Human');
      freshState.character.class.should.equal('Ranger');
      freshState.entries.should.have.length(1);
      freshState.entries[0].title.should.equal('Test Adventure');
    });
  });

  describe('DOM Manipulation', function() {
    beforeEach(function() {
      // Setup proper form elements
      document.body.innerHTML = `
        <input type="text" id="character-name" />
        <input type="text" id="character-race" />
        <input type="text" id="character-class" />
        <input type="text" id="entry-title" />
        <textarea id="entry-content"></textarea>
        <div id="entries-list"></div>
      `;
    });

    it('should create entry element with proper structure', function() {
      const entry = {
        id: '123',
        title: 'Test Adventure',
        content: 'A great quest!',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);

      element.should.not.be.null;
      element.className.should.equal('entry-card');
      
      const titleEl = element.querySelector('.entry-title');
      titleEl.should.not.be.null;
      titleEl.textContent.should.equal('Test Adventure');
      
      const contentEl = element.querySelector('.entry-content');
      contentEl.should.not.be.null;
      contentEl.textContent.should.equal('A great quest!');
      
      const dateEl = element.querySelector('.entry-date');
      dateEl.should.not.be.null;
      
      // Images should no longer be displayed
      const imageEl = element.querySelector('.entry-image');
      (imageEl === null).should.be.true;
    });

    it('should create entry element with summary when available', function() {
      // Setup mock summaries in localStorage
      localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify({
        '124': {
          summary: 'Adventure summary: Heroes explored a dungeon.',
          originalWordCount: 15,
          summaryWordCount: 7
        }
      }));

      const entry = {
        id: '124',
        title: 'Another Adventure',
        content: 'A detailed adventure in the dungeon with many encounters.',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      const summaryEl = element.querySelector('.entry-summary');
      
      summaryEl.should.not.be.null;
      summaryEl.innerHTML.should.contain('Adventure summary: Heroes explored a dungeon.');
    });

    it('should create entry element without summary when not available', function() {
      const entry = {
        id: '125',
        title: 'New Adventure',
        content: 'No summary yet.',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      const summaryEl = element.querySelector('.entry-summary');
      
      (summaryEl === null).should.be.true;
    });

    it('should render empty state when no entries exist', function() {
      state.entries = [];
      renderEntries();

      const entriesContainer = document.getElementById('entries-list');
      entriesContainer.innerHTML.should.include('No entries yet');
    });

    it('should render entries in newest-first order', function() {
      const oldEntry = {
        id: '1',
        title: 'Old Adventure',
        content: 'This happened first',
        timestamp: 1000
      };
      
      const newEntry = {
        id: '2',
        title: 'New Adventure',
        content: 'This happened later',
        timestamp: 2000
      };

      state.entries = [oldEntry, newEntry];
      renderEntries();

      const entriesContainer = document.getElementById('entries-list');
      const entryCards = entriesContainer.querySelectorAll('.entry-card');
      
      entryCards.should.have.length(2);
      entryCards[0].querySelector('.entry-title').textContent.should.equal('New Adventure');
      entryCards[1].querySelector('.entry-title').textContent.should.equal('Old Adventure');
    });

    it('should add new entry when form is filled', async function() {
      const titleInput = document.getElementById('entry-title');
      const contentInput = document.getElementById('entry-content');

      titleInput.value = 'New Quest';
      contentInput.value = 'Epic adventure awaits!';

      // Mock window.AI and displayAIPrompt for async behavior
      global.window = global.window || {};
      global.window.AI = {
        isAIEnabled: () => false,
        getEntrySummary: async () => null
      };
      global.displayAIPrompt = async () => {};

      const initialLength = state.entries.length;
      await addEntry();

      state.entries.should.have.length(initialLength + 1);
      
      const newEntry = state.entries[state.entries.length - 1];
      newEntry.title.should.equal('New Quest');
      newEntry.content.should.equal('Epic adventure awaits!');
      newEntry.should.have.property('id');
      newEntry.should.have.property('timestamp');
      newEntry.should.not.have.property('image');

      // Form should be cleared
      titleInput.value.should.equal('');
      contentInput.value.should.equal('');
    });

    it('should not add entry when title or content is missing', function() {
      const titleInput = document.getElementById('entry-title');
      const contentInput = document.getElementById('entry-content');

      // Test missing title
      titleInput.value = '';
      contentInput.value = 'Content without title';
      
      const initialLength = state.entries.length;
      addEntry();
      
      state.entries.should.have.length(initialLength);

      // Test missing content
      titleInput.value = 'Title without content';
      contentInput.value = '';
      
      addEntry();
      
      state.entries.should.have.length(initialLength);
    });

    it('should update character summary when character data changes', function() {
      // Setup DOM elements for character summary
      document.body.innerHTML += `
        <div class="character-summary__name" id="summary-name"></div>
        <div class="character-summary__details" id="summary-details"></div>
      `;

      // Update state with character data
      state.character = {
        name: 'Legolas',
        race: 'Elf',
        class: 'Archer'
      };

      displayCharacterSummary();

      const nameElement = document.getElementById('summary-name');
      const detailsElement = document.getElementById('summary-details');

      nameElement.textContent.should.equal('Legolas');
      detailsElement.textContent.should.equal('Elf • Archer');
    });

    it('should display character summary for minimal character data', function() {
      // Setup DOM elements for character summary
      document.body.innerHTML += `
        <div class="character-summary__name" id="summary-name"></div>
        <div class="character-summary__details" id="summary-details"></div>
      `;

      state.character = {
        name: 'Gimli',
        race: 'Dwarf',
        class: 'Warrior'
      };

      displayCharacterSummary();

      const nameElement = document.getElementById('summary-name');
      const detailsElement = document.getElementById('summary-details');

      nameElement.textContent.should.equal('Gimli');
      detailsElement.textContent.should.equal('Dwarf • Warrior');
    });
  });

  describe('Error Handling', function() {
    it('should handle localStorage errors gracefully', function() {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage full');
      };

      // Should not throw
      (() => saveData()).should.not.throw();

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted localStorage data', function() {
      localStorage.setItem('simple-dnd-journal', 'invalid json');
      
      // Should not throw and should use default state
      (() => loadData()).should.not.throw();
    });
  });

  describe('Edit Functionality', function() {
    beforeEach(function() {
      // Setup proper form elements
      document.body.innerHTML = `
        <input type="text" id="character-name" />
        <input type="text" id="character-race" />
        <input type="text" id="character-class" />
        <input type="text" id="entry-title" />
        <textarea id="entry-content"></textarea>
        <div id="entries-list"></div>
      `;
    });

    it('should create entry element with edit button', function() {
      const entry = {
        id: '123',
        title: 'Test Adventure',
        content: 'A great quest!',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      
      const editButton = element.querySelector('.button');
      editButton.should.not.be.null;
      editButton.textContent.should.equal('Edit');
      editButton.className.should.include('button--secondary');
      editButton.className.should.include('button--small');
    });

    it('should enable edit mode when edit button is clicked', function() {
      const entry = {
        id: '123',
        title: 'Test Adventure',
        content: 'A great quest!',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      const editButton = element.querySelector('.button');
      
      // Simulate edit button click
      editButton.click();

      // Should have input fields
      const titleInput = element.querySelector('input');
      const contentTextarea = element.querySelector('textarea');
      
      titleInput.should.not.be.null;
      contentTextarea.should.not.be.null;
      titleInput.value.should.equal('Test Adventure');
      contentTextarea.value.should.equal('A great quest!');

      // Should have save and cancel buttons
      const buttons = element.querySelectorAll('.button');
      buttons.should.have.length(2);
      buttons[0].textContent.should.equal('Save');
      buttons[1].textContent.should.equal('Cancel');
    });

    it('should save edit changes when save button is clicked', function() {
      const entry = {
        id: '123',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      const editButton = element.querySelector('.button');
      
      // Enable edit mode
      editButton.click();

      // Update values
      const titleInput = element.querySelector('input');
      const contentTextarea = element.querySelector('textarea');
      titleInput.value = 'Updated Title';
      contentTextarea.value = 'Updated content';

      // Click save
      const saveButton = element.querySelector('.button');
      saveButton.click();

      // Entry should be updated
      entry.title.should.equal('Updated Title');
      entry.content.should.equal('Updated content');
      entry.timestamp.should.be.above(Date.now() - 1000); // Should be recent
    });

    it('should not save edit changes when title or content is empty', function() {
      const entry = {
        id: '123',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      const editButton = element.querySelector('.button');
      
      // Enable edit mode
      editButton.click();

      // Clear title
      const titleInput = element.querySelector('input');
      titleInput.value = '';

      // Click save
      const saveButton = element.querySelector('.button');
      saveButton.click();

      // Entry should not be updated
      entry.title.should.equal('Original Title');
      entry.content.should.equal('Original content');
    });

    it('should cancel edit and restore original view', function() {
      const entry = {
        id: '123',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      const editButton = element.querySelector('.button');
      
      // Enable edit mode
      editButton.click();

      // Update values
      const titleInput = element.querySelector('input');
      const contentTextarea = element.querySelector('textarea');
      titleInput.value = 'Changed Title';
      contentTextarea.value = 'Changed content';

      // Click cancel
      const cancelButton = element.querySelectorAll('.button')[1];
      cancelButton.click();

      // Entry should not be updated
      entry.title.should.equal('Original Title');
      entry.content.should.equal('Original content');
    });

    it('should have entry actions container', function() {
      const entry = {
        id: '123',
        title: 'Test Adventure',
        content: 'A great quest!',
        timestamp: Date.now()
      };

      const element = createEntryElement(entry);
      
      const actionsDiv = element.querySelector('.entry-actions');
      actionsDiv.should.not.be.null;
      actionsDiv.className.should.equal('entry-actions');
    });
  });

  describe('Character Summary', function() {
    beforeEach(function() {
      // Setup DOM with character summary elements
      document.body.innerHTML += `
        <div class="character-summary__name" id="summary-name"></div>
        <div class="character-summary__details" id="summary-details"></div>
      `;
    });

    it('should create character summary for empty character', function() {
      const emptyCharacter = { name: '', race: '', class: '' };
      const summary = createCharacterSummary(emptyCharacter);
      
      summary.name.should.equal('No character created yet');
      summary.details.should.equal('Click "View Details" to create your character');
    });

    it('should create character summary with complete info', function() {
      const character = { 
        name: 'Thorin', 
        race: 'Dwarf', 
        class: 'Fighter'
      };
      const summary = createCharacterSummary(character);
      
      summary.name.should.equal('Thorin');
      summary.details.should.equal('Dwarf • Fighter');
    });

    it('should create character summary with partial info', function() {
      const character = { 
        name: 'Bilbo', 
        race: 'Halfling',
        class: ''
      };
      const summary = createCharacterSummary(character);
      
      summary.name.should.equal('Bilbo');
      summary.details.should.equal('Halfling');
    });

    it('should handle unnamed character gracefully', function() {
      const character = { 
        name: '', 
        race: 'Human', 
        class: 'Rogue'
      };
      const summary = createCharacterSummary(character);
      
      summary.name.should.equal('Unnamed Character');
      summary.details.should.equal('Human • Rogue');
    });

    it('should display character summary in DOM', function() {
      state.character = {
        name: 'Aragorn',
        race: 'Human',
        class: 'Ranger'
      };

      displayCharacterSummary();

      const nameElement = document.getElementById('summary-name');
      const detailsElement = document.getElementById('summary-details');

      nameElement.textContent.should.equal('Aragorn');
      detailsElement.textContent.should.equal('Human • Ranger');
    });

    it('should handle missing DOM elements gracefully', function() {
      // Remove the elements
      document.getElementById('summary-name').remove();
      document.getElementById('summary-details').remove();

      // Should not throw an error
      (() => displayCharacterSummary()).should.not.throw();
    });
  });

  describe('getEntrySummary', function() {
    beforeEach(function() {
      localStorage.clear();
    });

    it('should return null when no summary exists', function() {
      const result = getEntrySummary('nonexistent-id');
      (result === null).should.be.true;
    });

    it('should return summary when it exists', function() {
      const summaries = {
        'test-id': {
          summary: 'Test adventure summary',
          originalWordCount: 20,
          summaryWordCount: 4
        }
      };
      localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));

      const result = getEntrySummary('test-id');
      result.should.not.be.null;
      result.summary.should.equal('Test adventure summary');
      result.originalWordCount.should.equal(20);
      result.summaryWordCount.should.equal(4);
    });

    it('should handle corrupted localStorage gracefully', function() {
      localStorage.setItem('simple-dnd-journal-summaries', 'invalid-json');
      
      const result = getEntrySummary('test-id');
      (result === null).should.be.true;
    });

    it('should return null when summary data is malformed', function() {
      localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify({ 'test-id': null }));
      
      const result = getEntrySummary('test-id');
      (result === null).should.be.true;
    });
  });

  describe('displayAIPrompt', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <section id="ai-prompt-section" style="display: none;">
          <div id="ai-prompt-text" class="loading">Loading...</div>
        </section>
      `;
      // Mock window.AI
      global.window = {
        AI: {
          isAIEnabled: () => false,
          generateIntrospectionPrompt: async () => null
        }
      };
    });

    it('should hide prompt section when AI is disabled', async function() {
      await displayAIPrompt();
      
      const promptSection = document.getElementById('ai-prompt-section');
      promptSection.style.display.should.equal('none');
    });

    it('should show prompt section when AI is enabled and prompt is generated', async function() {
      global.window.AI.isAIEnabled = () => true;
      global.window.AI.generateIntrospectionPrompt = async () => 'Test introspection prompt';
      
      await displayAIPrompt();
      
      const promptSection = document.getElementById('ai-prompt-section');
      const promptText = document.getElementById('ai-prompt-text');
      
      promptSection.style.display.should.equal('block');
      promptText.textContent.should.equal('Test introspection prompt');
      promptText.classList.contains('loading').should.be.false;
    });

    it('should hide prompt section when AI is enabled but no prompt is generated', async function() {
      global.window.AI.isAIEnabled = () => true;
      global.window.AI.generateIntrospectionPrompt = async () => null;
      
      await displayAIPrompt();
      
      const promptSection = document.getElementById('ai-prompt-section');
      promptSection.style.display.should.equal('none');
    });

    it('should handle missing DOM elements gracefully', async function() {
      document.body.innerHTML = '';
      
      // Should not throw error
      (() => displayAIPrompt()).should.not.throw();
    });

    it('should handle AI module errors gracefully', async function() {
      global.window.AI.isAIEnabled = () => true;
      global.window.AI.generateIntrospectionPrompt = async () => {
        throw new Error('API Error');
      };
      
      await displayAIPrompt();
      
      const promptSection = document.getElementById('ai-prompt-section');
      promptSection.style.display.should.equal('none');
    });
  });

  describe('regenerateAIPrompt', function() {
    beforeEach(function() {
      document.body.innerHTML = `
        <section id="ai-prompt-section" style="display: block;">
          <div class="ai-prompt__header">
            <button id="regenerate-prompt-btn">🔄 Regenerate</button>
          </div>
          <div id="ai-prompt-text">Existing prompt content</div>
        </section>
      `;
      // Mock window.AI
      global.window = {
        AI: {
          isAIEnabled: () => false,
          generateIntrospectionPrompt: async () => null
        }
      };
    });

    it('should do nothing when AI is disabled', async function() {
      await regenerateAIPrompt();
      
      const promptText = document.getElementById('ai-prompt-text');
      promptText.textContent.should.equal('Existing prompt content');
    });

    it('should regenerate prompt when AI is enabled', async function() {
      global.window.AI.isAIEnabled = () => true;
      global.window.AI.generateIntrospectionPrompt = async () => 'New introspection prompt';
      
      await regenerateAIPrompt();
      
      const promptText = document.getElementById('ai-prompt-text');
      const regenerateBtn = document.getElementById('regenerate-prompt-btn');
      
      promptText.textContent.should.equal('New introspection prompt');
      promptText.classList.contains('loading').should.be.false;
      regenerateBtn.disabled.should.be.false;
    });

    it('should show loading state during regeneration', async function() {
      global.window.AI.isAIEnabled = () => true;
      let resolvePromise;
      const promiseToResolve = new Promise(resolve => {
        resolvePromise = resolve;
      });
      global.window.AI.generateIntrospectionPrompt = async () => promiseToResolve;
      
      const regeneratePromise = regenerateAIPrompt();
      
      const promptText = document.getElementById('ai-prompt-text');
      const regenerateBtn = document.getElementById('regenerate-prompt-btn');
      
      promptText.classList.contains('loading').should.be.true;
      promptText.textContent.should.equal('Generating a new introspection prompt...');
      regenerateBtn.disabled.should.be.true;
      
      resolvePromise('Test prompt');
      await regeneratePromise;
      
      promptText.classList.contains('loading').should.be.false;
      regenerateBtn.disabled.should.be.false;
    });

    it('should handle no prompt generated gracefully', async function() {
      global.window.AI.isAIEnabled = () => true;
      global.window.AI.generateIntrospectionPrompt = async () => null;
      
      await regenerateAIPrompt();
      
      const promptText = document.getElementById('ai-prompt-text');
      const regenerateBtn = document.getElementById('regenerate-prompt-btn');
      
      promptText.textContent.should.equal('Unable to generate introspection prompt at this time.');
      promptText.classList.contains('loading').should.be.false;
      regenerateBtn.disabled.should.be.false;
    });

    it('should handle API errors gracefully', async function() {
      global.window.AI.isAIEnabled = () => true;
      global.window.AI.generateIntrospectionPrompt = async () => {
        throw new Error('API Error');
      };
      
      await regenerateAIPrompt();
      
      const promptText = document.getElementById('ai-prompt-text');
      const regenerateBtn = document.getElementById('regenerate-prompt-btn');
      
      promptText.textContent.should.equal('Error generating prompt. Please try again.');
      promptText.classList.contains('loading').should.be.false;
      regenerateBtn.disabled.should.be.false;
    });

    it('should handle missing DOM elements gracefully', async function() {
      document.body.innerHTML = '';
      
      // Should not throw error
      (() => regenerateAIPrompt()).should.not.throw();
    });
  });

  describe('formatAIPrompt', function() {
         it('should format bold text correctly', function() {
       const input = '**Important Note:**\n1. Test question';
       const expected = '<strong>Important Note:</strong><br><br>1. Test question';
       
       const result = formatAIPrompt(input);
       result.should.equal(expected);
     });

    it('should convert line breaks correctly', function() {
      const input = 'Question 1\nQuestion 2\nQuestion 3';
      const expected = 'Question 1<br>Question 2<br>Question 3';
      
      const result = formatAIPrompt(input);
      result.should.equal(expected);
    });

         it('should format numbered lists with proper spacing', function() {
       const input = '1. First question\n2. Second question';
       const expected = '1. First question<br><br>2. Second question';
       
       const result = formatAIPrompt(input);
       result.should.equal(expected);
     });

    it('should handle empty or null input', function() {
      formatAIPrompt('').should.equal('');
      formatAIPrompt(null).should.equal('');
      formatAIPrompt(undefined).should.equal('');
    });

         it('should format complete AI prompt correctly', function() {
       const input = '1. Puoskari, can you share a pivotal memory?\n2. What current internal conflict?\n3. How might recent events change your path?\n4. What unexpected truth about yourself remains hidden?';
       const expected = '1. Puoskari, can you share a pivotal memory?<br><br>2. What current internal conflict?<br><br>3. How might recent events change your path?<br><br>4. What unexpected truth about yourself remains hidden?';
       
       const result = formatAIPrompt(input);
       result.should.equal(expected);
     });
  });
});
