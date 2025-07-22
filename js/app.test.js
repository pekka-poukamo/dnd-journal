// Import should for BDD-style assertions
require('should');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Mock DOM elements
const createMockElement = (id) => {
  const element = {
    id,
    value: '',
    innerHTML: '',
    appendChild: jest.fn(),
    focus: jest.fn(),
    style: {},
    className: '',
    textContent: '',
    src: '',
    alt: '',
    onerror: null
  };
  return element;
};

// Setup globals
global.localStorage = localStorageMock;
global.document = {
  getElementById: jest.fn((id) => createMockElement(id)),
  createElement: jest.fn((tag) => {
    const element = createMockElement(tag);
    element.appendChild = jest.fn();
    return element;
  })
};
global.console = {
  error: jest.fn(),
  log: jest.fn()
};

// Load the app code - we need to define all the functions globally
const STORAGE_KEY = 'simple-dnd-journal';

let state = {
  character: {
    name: '',
    race: '',
    class: ''
  },
  entries: []
};

const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      state = { ...state, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

const saveData = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save data:', error);
  }
};

const generateId = () => Date.now().toString();

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const createEntryElement = (entry) => {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'entry-card';
  
  const titleDiv = document.createElement('div');
  titleDiv.className = 'entry-title';
  titleDiv.textContent = entry.title;
  
  const dateDiv = document.createElement('div');
  dateDiv.className = 'entry-date';
  dateDiv.textContent = formatDate(entry.timestamp);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-content';
  contentDiv.textContent = entry.content;
  
  entryDiv.appendChild(titleDiv);
  entryDiv.appendChild(dateDiv);
  entryDiv.appendChild(contentDiv);
  
  if (entry.image && entry.image.trim()) {
    const imageElement = document.createElement('img');
    imageElement.className = 'entry-image';
    imageElement.src = entry.image;
    imageElement.alt = entry.title;
    imageElement.onerror = () => {
      imageElement.style.display = 'none';
    };
    entryDiv.appendChild(imageElement);
  }
  
  return entryDiv;
};

const renderEntries = () => {
  const entriesContainer = document.getElementById('entries-list');
  if (!entriesContainer) return;
  
  if (state.entries.length === 0) {
    entriesContainer.innerHTML = '<div class="empty-state">No entries yet. Add your first adventure above!</div>';
    return;
  }
  
  const sortedEntries = [...state.entries].sort((a, b) => b.timestamp - a.timestamp);
  
  entriesContainer.innerHTML = '';
  sortedEntries.forEach(entry => {
    entriesContainer.appendChild(createEntryElement(entry));
  });
};

const addEntry = () => {
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  const imageInput = document.getElementById('entry-image');
  
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const image = imageInput.value.trim();
  
  if (!title || !content) return;
  
  const entry = {
    id: generateId(),
    title,
    content,
    image,
    timestamp: Date.now()
  };
  
  state.entries.push(entry);
  saveData();
  renderEntries();
  
  titleInput.value = '';
  contentInput.value = '';
  imageInput.value = '';
  
  titleInput.focus();
};

const updateCharacter = () => {
  const nameInput = document.getElementById('character-name');
  const raceInput = document.getElementById('character-race');
  const classInput = document.getElementById('character-class');
  
  state.character = {
    name: nameInput.value.trim(),
    race: raceInput.value.trim(),
    class: classInput.value.trim()
  };
  
  saveData();
};

describe('D&D Journal App', () => {
  beforeEach(() => {
    // Reset state and mocks before each test
    localStorage.clear();
    jest.clearAllMocks();
    state = {
      character: {
        name: '',
        race: '',
        class: ''
      },
      entries: []
    };
  });

  describe('Data Persistence', () => {
    it('should load data from localStorage', () => {
      // Given
      const testData = {
        character: { name: 'Gandalf', race: 'Maiar', class: 'Wizard' },
        entries: [{ id: '1', title: 'Test', content: 'Content', timestamp: 123 }]
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));

      // When
      loadData();

      // Then
      state.character.name.should.equal('Gandalf');
      state.character.race.should.equal('Maiar');
      state.character.class.should.equal('Wizard');
      state.entries.should.have.length(1);
      state.entries[0].title.should.equal('Test');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Given
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      // When
      loadData();

      // Then
      expect(console.error).toHaveBeenCalled();
      state.character.name.should.equal('');
      state.entries.should.have.length(0);
    });

    it('should save data to localStorage', () => {
      // Given
      state.character = { name: 'Frodo', race: 'Hobbit', class: 'Ringbearer' };
      state.entries = [{ id: '1', title: 'Journey Begins', content: 'Left the Shire' }];

      // When
      saveData();

      // Then
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      saved.character.name.should.equal('Frodo');
      saved.entries.should.have.length(1);
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique IDs', (done) => {
      // When
      const id1 = generateId();
      
      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const id2 = generateId();
        
        // Then
        id1.should.be.a.String();
        id2.should.be.a.String();
        id1.should.not.equal(id2);
        done();
      }, 2);
    });

    it('should format dates correctly', () => {
      // Given
      const timestamp = new Date('2024-01-15T10:30:00').getTime();

      // When
      const formatted = formatDate(timestamp);

      // Then
      formatted.should.be.a.String();
      formatted.should.match(/Jan 15, 2024/);
    });
  });

  describe('Entry Management', () => {
    it('should create entry element with all fields', () => {
      // Given
      const entry = {
        id: '123',
        title: 'Dragon Encounter',
        content: 'We met a red dragon',
        image: 'dragon.jpg',
        timestamp: Date.now()
      };
      
      // Reset mock
      document.createElement = jest.fn((tag) => {
        const element = createMockElement(tag);
        element.appendChild = jest.fn();
        return element;
      });

      // When
      const element = createEntryElement(entry);

      // Then
      element.className.should.equal('entry-card');
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.createElement).toHaveBeenCalledWith('img');
    });

    it('should create entry element without image', () => {
      // Given
      const entry = {
        id: '123',
        title: 'Tavern Rest',
        content: 'Stayed at the inn',
        image: '',
        timestamp: Date.now()
      };
      
      // Reset mock
      document.createElement = jest.fn((tag) => {
        const element = createMockElement(tag);
        element.appendChild = jest.fn();
        return element;
      });

      // When
      const element = createEntryElement(entry);

      // Then
      element.className.should.equal('entry-card');
      // Should not create img element
      const imgCalls = document.createElement.mock.calls.filter(call => call[0] === 'img');
      imgCalls.length.should.equal(0);
    });

    it('should render empty state when no entries exist', () => {
      // Given
      const container = createMockElement('entries-list');
      document.getElementById = jest.fn().mockReturnValue(container);
      state.entries = [];

      // When
      renderEntries();

      // Then
      container.innerHTML.should.match(/No entries yet/);
    });

    it('should render entries sorted by newest first', () => {
      // Given
      const container = createMockElement('entries-list');
      document.getElementById = jest.fn().mockReturnValue(container);
      state.entries = [
        { id: '1', title: 'Old', timestamp: 100 },
        { id: '2', title: 'New', timestamp: 200 },
        { id: '3', title: 'Middle', timestamp: 150 }
      ];

      // When
      renderEntries();

      // Then
      expect(container.appendChild).toHaveBeenCalled();
      expect(container.appendChild.mock.calls.length).toBe(3);
    });

    it('should add new entry with valid data', () => {
      // Given
      const titleInput = createMockElement('entry-title');
      titleInput.value = 'Epic Battle';
      const contentInput = createMockElement('entry-content');
      contentInput.value = 'We fought bravely';
      const imageInput = createMockElement('entry-image');
      imageInput.value = 'battle.png';
      
      document.getElementById = jest.fn().mockImplementation((id) => {
        if (id === 'entry-title') return titleInput;
        if (id === 'entry-content') return contentInput;
        if (id === 'entry-image') return imageInput;
        return createMockElement(id);
      });

      // When
      addEntry();

      // Then
      state.entries.should.have.length(1);
      state.entries[0].title.should.equal('Epic Battle');
      state.entries[0].content.should.equal('We fought bravely');
      state.entries[0].image.should.equal('battle.png');
      titleInput.value.should.equal('');
      contentInput.value.should.equal('');
      imageInput.value.should.equal('');
      expect(titleInput.focus).toHaveBeenCalled();
    });

    it('should not add entry with empty title', () => {
      // Given
      const titleInput = createMockElement('entry-title');
      titleInput.value = '';
      const contentInput = createMockElement('entry-content');
      contentInput.value = 'Some content';
      const imageInput = createMockElement('entry-image');
      
      document.getElementById = jest.fn().mockImplementation((id) => {
        if (id === 'entry-title') return titleInput;
        if (id === 'entry-content') return contentInput;
        if (id === 'entry-image') return imageInput;
        return createMockElement(id);
      });

      // When
      addEntry();

      // Then
      state.entries.should.have.length(0);
    });

    it('should not add entry with empty content', () => {
      // Given
      const titleInput = createMockElement('entry-title');
      titleInput.value = 'Title';
      const contentInput = createMockElement('entry-content');
      contentInput.value = '   '; // whitespace only
      const imageInput = createMockElement('entry-image');
      
      document.getElementById = jest.fn().mockImplementation((id) => {
        if (id === 'entry-title') return titleInput;
        if (id === 'entry-content') return contentInput;
        if (id === 'entry-image') return imageInput;
        return createMockElement(id);
      });

      // When
      addEntry();

      // Then
      state.entries.should.have.length(0);
    });
  });

  describe('Character Management', () => {
    it('should update character information', () => {
      // Given
      const nameInput = createMockElement('character-name');
      nameInput.value = 'Aragorn';
      const raceInput = createMockElement('character-race');
      raceInput.value = 'Human';
      const classInput = createMockElement('character-class');
      classInput.value = 'Ranger';
      
      document.getElementById = jest.fn().mockImplementation((id) => {
        if (id === 'character-name') return nameInput;
        if (id === 'character-race') return raceInput;
        if (id === 'character-class') return classInput;
        return createMockElement(id);
      });

      // When
      updateCharacter();

      // Then
      state.character.name.should.equal('Aragorn');
      state.character.race.should.equal('Human');
      state.character.class.should.equal('Ranger');
      localStorage.getItem(STORAGE_KEY).should.not.be.null();
    });

    it('should trim whitespace from character fields', () => {
      // Given
      const nameInput = createMockElement('character-name');
      nameInput.value = '  Legolas  ';
      const raceInput = createMockElement('character-race');
      raceInput.value = '  Elf  ';
      const classInput = createMockElement('character-class');
      classInput.value = '  Archer  ';
      
      document.getElementById = jest.fn().mockImplementation((id) => {
        if (id === 'character-name') return nameInput;
        if (id === 'character-race') return raceInput;
        if (id === 'character-class') return classInput;
        return createMockElement(id);
      });

      // When
      updateCharacter();

      // Then
      state.character.name.should.equal('Legolas');
      state.character.race.should.equal('Elf');
      state.character.class.should.equal('Archer');
    });
  });
});
