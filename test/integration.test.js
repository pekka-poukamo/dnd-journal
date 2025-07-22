require('./setup');
const path = require('path');
const fs = require('fs');

describe('D&D Journal Integration Tests', function() {
  let appContent;
  
  before(function() {
    // Load the app content
    const appPath = path.join(__dirname, '../js/app.js');
    appContent = fs.readFileSync(appPath, 'utf8');
  });

  beforeEach(function() {
    // Clear localStorage and reset DOM
    localStorage.clear();
    document.body.innerHTML = `
      <input type="text" id="character-name" />
      <input type="text" id="character-race" />
      <input type="text" id="character-class" />
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <input type="url" id="entry-image" />
      <div id="entries-list"></div>
    `;
    
    // Execute app code
    eval(appContent);
  });

  it('should complete full user workflow', function() {
    // 1. User creates a character (simulating data from character page)
    state.character = {
      name: 'Thorin',
      race: 'Dwarf',
      class: 'King'
    };

    // Save the character data
    saveData();

    // Character should be saved
    state.character.name.should.equal('Thorin');
    state.character.race.should.equal('Dwarf');
    state.character.class.should.equal('King');

    // 2. User adds multiple journal entries
    const titleInput = document.getElementById('entry-title');
    const contentInput = document.getElementById('entry-content');
    const imageInput = document.getElementById('entry-image');

    // First entry
    titleInput.value = 'The Quest Begins';
    contentInput.value = 'We set out from the Shire on a grand adventure.';
    imageInput.value = 'https://example.com/shire.jpg';
    addEntry();

    // Wait to ensure different timestamp
    const start1 = Date.now();
    while (Date.now() === start1) { /* wait */ }

    // Second entry
    titleInput.value = 'Meeting Gandalf';
    contentInput.value = 'The wizard has important news for us.';
    imageInput.value = '';
    addEntry();

    // Wait to ensure different timestamp
    const start2 = Date.now();
    while (Date.now() === start2) { /* wait */ }

    // Third entry
    titleInput.value = 'The Lonely Mountain';
    contentInput.value = 'We can see our destination in the distance.';
    imageInput.value = 'https://example.com/mountain.jpg';
    addEntry();

    // Should have 3 entries
    state.entries.should.have.length(3);

    // 3. Check that data persists after reload
    const savedData = localStorage.getItem('simple-dnd-journal');
    savedData.should.not.be.null;

    const parsedData = JSON.parse(savedData);
    parsedData.character.name.should.equal('Thorin');
    parsedData.entries.should.have.length(3);

    // 4. Test data persistence (simulate app reload)
    const storedData = localStorage.getItem('simple-dnd-journal');
    
    // Parse and verify the stored data directly
    const parsedStoredData = JSON.parse(storedData);
    parsedStoredData.character.name.should.equal('Thorin');
    parsedStoredData.character.race.should.equal('Dwarf');
    parsedStoredData.character.class.should.equal('King');
    parsedStoredData.entries.should.have.length(3);

    // Simulate fresh app load by resetting and reloading from storage
    localStorage.clear();
    localStorage.setItem('simple-dnd-journal', storedData);
    
    // Create fresh state and load from storage
    const freshState = {
      character: { name: '', race: '', class: '' },
      entries: []
    };
    
    const reloadedData = localStorage.getItem('simple-dnd-journal');
    if (reloadedData) {
      Object.assign(freshState, JSON.parse(reloadedData));
    }

    // Character data should be restored
    freshState.character.name.should.equal('Thorin');
    freshState.character.race.should.equal('Dwarf');
    freshState.character.class.should.equal('King');

    // Entries should be restored
    freshState.entries.should.have.length(3);

    // Verify entries are in correct order (newest first when sorted)
    const sortedEntries = [...freshState.entries].sort((a, b) => b.timestamp - a.timestamp);
    sortedEntries[0].title.should.equal('The Lonely Mountain');
    sortedEntries[1].title.should.equal('Meeting Gandalf');
    sortedEntries[2].title.should.equal('The Quest Begins');

    // Check images are properly stored
    sortedEntries[0].image.should.equal('https://example.com/mountain.jpg');
    sortedEntries[1].image.should.equal('');
    sortedEntries[2].image.should.equal('https://example.com/shire.jpg');
  });

  it('should handle empty state gracefully', function() {
    // Fresh start with no data
    renderEntries();
    
    const entriesContainer = document.getElementById('entries-list');
    entriesContainer.innerHTML.should.include('No entries yet');
    
    // Setup DOM for character summary test
    document.body.innerHTML += `
      <div class="character-summary__name" id="summary-name"></div>
      <div class="character-summary__details" id="summary-details"></div>
    `;
    
    displayCharacterSummary();
    
    const nameElement = document.getElementById('summary-name');
    const detailsElement = document.getElementById('summary-details');
    
    nameElement.textContent.should.equal('No character created yet');
    detailsElement.textContent.should.equal('Click "View Details" to create your character');
  });

  it('should maintain data integrity through multiple operations', function() {
    // Add some initial data
    state.character = { name: 'Frodo', race: 'Hobbit', class: 'Burglar' };
    state.entries = [
      {
        id: generateId(),
        title: 'Initial Entry',
        content: 'Starting the journey',
        timestamp: Date.now() - 1000
      }
    ];
    
    saveData();

    // Add more entries
    const titleInput = document.getElementById('entry-title');
    const contentInput = document.getElementById('entry-content');

    titleInput.value = 'Second Entry';
    contentInput.value = 'The journey continues';
    addEntry();

    // Small delay to ensure different timestamps
    const start = Date.now();
    while (Date.now() === start) {
      // wait for next millisecond
    }

    titleInput.value = 'Third Entry';
    contentInput.value = 'Almost there!';
    addEntry();

    // Should have 3 total entries
    state.entries.should.have.length(3);

    // Update character (simulating character page update)
    state.character.name = 'Frodo Baggins';
    saveData();

    // Verify everything is still consistent
    state.character.name.should.equal('Frodo Baggins');
    state.entries.should.have.length(3);

    // Verify persistence
    const savedData = JSON.parse(localStorage.getItem('simple-dnd-journal'));
    savedData.character.name.should.equal('Frodo Baggins');
    savedData.entries.should.have.length(3);
    
    // Check entry order is maintained
    const sortedEntries = [...state.entries].sort((a, b) => b.timestamp - a.timestamp);
    sortedEntries[0].title.should.equal('Third Entry');
    sortedEntries[1].title.should.equal('Second Entry');
    sortedEntries[2].title.should.equal('Initial Entry');
  });
});
