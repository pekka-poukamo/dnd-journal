# D&D Journal App - Simplified Static Architecture

## Overview
A lightweight, static D&D journal app focused on core functionality: note-taking, character tracking, and AI-powered roleplay prompts. Built with vanilla JavaScript and CSS, hosted on Surge.sh for maximum simplicity and minimal cost.

## Core Features (Simplified)

### 1. Journal Entries
- Simple text-based entries with basic formatting
- Categories: Session Notes, Character Development, Quick Notes
- Local storage with optional cloud backup via Val.town
- Basic tagging system

### 2. AI Roleplay Assistant
- Context-aware prompts using OpenAI API via Val.town proxy
- Simple prompt types: Roleplay suggestions, Character development, Scenario ideas
- Uses recent entries and character info for context

### 3. Character Management
- Basic character profiles (name, class, race, level, traits)
- Simple backstory tracking
- Local storage with sync option

## Technical Architecture

### Frontend (Static Site)
```
Static HTML/CSS/JS Site
├── index.html (Dashboard)
├── journal.html (Entry editor)
├── character.html (Character management)
├── ai-assistant.html (AI prompts)
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── app.js (Main application logic)
│   ├── storage.js (Local/cloud storage)
│   ├── journal.js (Journal functionality)
│   ├── character.js (Character management)
│   └── ai.js (AI integration)
└── assets/ (Icons, images)
```

### No Backend Needed
- **Pure Static Site**: Everything runs in the browser
- **Local Storage**: All data stored locally in browser
- **Direct AI API**: OpenAI API called directly from frontend with user-provided key

## Data Storage Strategy

### Local Storage (Primary)
```javascript
// Simple localStorage schema
{
  "characters": {
    "char-id-1": {
      "id": "char-id-1",
      "name": "Thorin Ironforge",
      "class": "Fighter",
      "race": "Dwarf",
      "level": 5,
      "backstory": "A former city guard...",
      "traits": "Loyal, stubborn, brave"
    }
  },
  "entries": {
    "entry-id-1": {
      "id": "entry-id-1",
      "title": "Session 1: The Tavern",
      "content": "We met at the Prancing Pony...",
      "type": "session",
      "characterId": "char-id-1",
      "tags": ["tavern", "introduction"],
      "date": "2024-01-15",
      "created": 1705334400000
    }
  },
  "settings": {
    "currentCharacter": "char-id-1",
    "openaiApiKey": "sk-...", // Stored locally only
    "preferences": {
      "theme": "light",
      "autoSave": true
    }
  }
}
```

### Export/Import for Backup
- JSON export/import functionality for data backup
- Manual sync across devices via file transfer
- No cloud dependencies

## Core Components

### Main Pages
```html
<!-- index.html - Dashboard -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Journal</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <header>
        <h1>D&D Journal</h1>
        <nav>
            <a href="journal.html">New Entry</a>
            <a href="character.html">Characters</a>
            <a href="ai-assistant.html">AI Assistant</a>
        </nav>
    </header>
    
    <main>
        <section class="recent-entries">
            <h2>Recent Entries</h2>
            <div id="entries-list"></div>
        </section>
        
        <section class="character-summary">
            <h2>Current Character</h2>
            <div id="current-character"></div>
        </section>
    </main>
    
    <script src="js/app.js"></script>
    <script src="js/storage.js"></script>
</body>
</html>
```

### Core JavaScript Structure
```javascript
// js/app.js - Functional dashboard implementation
import { getStorage } from './utils/storage.js';
import { createEntryCard, createCharacterCard } from './components/Cards.js';
import { escapeHtml, formatDate, stripHtml } from './utils/formatters.js';

// Pure functions for data selection
const getCurrentCharacter = (state) => 
  state.characters[state.settings.currentCharacter];

const getRecentEntries = (state, limit = 5) => 
  Object.values(state.entries)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);

// Pure rendering functions
const renderEntries = (entries, container) => {
  const entryElements = entries.length > 0 
    ? entries.map(createEntryCard)
    : [createEmptyState('No entries yet. Create your first entry!')];
  
  container.replaceChildren(...entryElements);
};

const renderCharacterSummary = (character, container) => {
  const element = character 
    ? createCharacterCard(character)
    : createEmptyState('No character selected. Create a character!');
  
  container.replaceChildren(element);
};

const createEmptyState = (message) => {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `<p>${message}</p>`;
  return div;
};

// Main dashboard initialization
const initDashboard = () => {
  const state = getStorage().getData();
  const entriesContainer = document.getElementById('entries-list');
  const characterContainer = document.getElementById('current-character');
  
  if (!entriesContainer || !characterContainer) return;
  
  const recentEntries = getRecentEntries(state);
  const currentCharacter = getCurrentCharacter(state);
  
  renderEntries(recentEntries, entriesContainer);
  renderCharacterSummary(currentCharacter, characterContainer);
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
```

### Storage System
```javascript
// js/utils/storage.js - Functional storage management
const STORAGE_KEY = 'dnd-journal-data';

// Default state structure
const createDefaultState = () => ({
  characters: {},
  entries: {},
  settings: {
    currentCharacter: null,
    openaiApiKey: null,
    preferences: {
      theme: 'light',
      autoSave: true
    }
  }
});

// Pure functions for data access
const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : createDefaultState();
  } catch (error) {
    console.error('Failed to load data:', error);
    return createDefaultState();
  }
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true, data };
  } catch (error) {
    console.error('Failed to save data:', error);
    return { success: false, error: error.message };
  }
};

// Pure utility functions
const generateId = () => 
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const addTimestamp = (item) => ({
  ...item,
  id: item.id || generateId(),
  created: item.created || Date.now()
});

// Character operations (pure functions)
const addCharacter = (state, character) => ({
  ...state,
  characters: {
    ...state.characters,
    [character.id]: addTimestamp(character)
  }
});

const updateCharacter = (state, id, updates) => ({
  ...state,
  characters: {
    ...state.characters,
    [id]: { ...state.characters[id], ...updates }
  }
});

const deleteCharacter = (state, id) => {
  const { [id]: deleted, ...remainingCharacters } = state.characters;
  return {
    ...state,
    characters: remainingCharacters,
    settings: state.settings.currentCharacter === id 
      ? { ...state.settings, currentCharacter: null }
      : state.settings
  };
};

// Entry operations (pure functions)
const addEntry = (state, entry) => ({
  ...state,
  entries: {
    ...state.entries,
    [entry.id]: addTimestamp(entry)
  }
});

const updateEntry = (state, id, updates) => ({
  ...state,
  entries: {
    ...state.entries,
    [id]: { ...state.entries[id], ...updates }
  }
});

const deleteEntry = (state, id) => {
  const { [id]: deleted, ...remainingEntries } = state.entries;
  return {
    ...state,
    entries: remainingEntries
  };
};

// Settings operations (pure functions)
const updateSettings = (state, updates) => ({
  ...state,
  settings: {
    ...state.settings,
    ...updates,
    preferences: {
      ...state.settings.preferences,
      ...updates.preferences
    }
  }
});

// Data selectors (pure functions)
const getCharacter = (state, id) => state.characters[id];
const getAllCharacters = (state) => Object.values(state.characters);
const getEntry = (state, id) => state.entries[id];
const getAllEntries = (state) => Object.values(state.entries);
const getSettings = (state) => state.settings;

const getRecentEntries = (state, limit = 10) => 
  getAllEntries(state)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);

const getEntriesForCharacter = (state, characterId) => 
  getAllEntries(state)
    .filter(entry => entry.characterId === characterId)
    .sort((a, b) => b.created - a.created);

// Export/Import functions
const exportData = (state) => JSON.stringify(state, null, 2);

const importData = (jsonString) => {
  try {
    const imported = JSON.parse(jsonString);
    return { success: true, data: imported };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Storage API factory
const createStorage = () => {
  let currentState = loadData();
  
  const updateState = (updateFn) => {
    const newState = updateFn(currentState);
    const saveResult = saveData(newState);
    if (saveResult.success) {
      currentState = newState;
    }
    return saveResult;
  };
  
  return {
    // Data access
    getData: () => currentState,
    
    // Character operations
    saveCharacter: (character) => updateState(state => addCharacter(state, character)),
    updateCharacter: (id, updates) => updateState(state => updateCharacter(state, id, updates)),
    deleteCharacter: (id) => updateState(state => deleteCharacter(state, id)),
    
    // Entry operations
    saveEntry: (entry) => updateState(state => addEntry(state, entry)),
    updateEntry: (id, updates) => updateState(state => updateEntry(state, id, updates)),
    deleteEntry: (id) => updateState(state => deleteEntry(state, id)),
    
    // Settings
    updateSettings: (updates) => updateState(state => updateSettings(state, updates)),
    
    // Import/Export
    exportData: () => exportData(currentState),
    importData: (jsonString) => {
      const result = importData(jsonString);
      if (result.success) {
        const saveResult = saveData(result.data);
        if (saveResult.success) {
          currentState = result.data;
        }
        return saveResult;
      }
      return result;
    }
  };
};

// Singleton storage instance
let storageInstance = null;
export const getStorage = () => {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
};
```

### Journal Editor
```javascript
// js/pages/Journal.js - Functional journal editor
import { getStorage } from '../utils/storage.js';
import { debounce } from '../utils/helpers.js';
import { showNotification } from '../utils/notifications.js';

// Pure functions for form data processing
const parseFormData = (form) => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  return {
    title: data.title.trim() || 'Untitled Entry',
    content: document.getElementById('editor').innerHTML,
    type: data.type,
    tags: parseTags(data.tags),
    characterId: data.characterId || null,
    date: new Date().toISOString().split('T')[0]
  };
};

const parseTags = (tagString) => 
  tagString.split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

// Pure functions for editor commands
const formatText = (command) => () => {
  document.execCommand(command, false, null);
  document.getElementById('editor').focus();
};

const createToolbarHandlers = () => ({
  bold: formatText('bold'),
  italic: formatText('italic'),
  heading: () => {
    document.execCommand('formatBlock', false, '<h3>');
    document.getElementById('editor').focus();
  }
});

// Form validation
const validateEntry = (entry) => {
  const errors = [];
  
  if (!entry.title.trim()) {
    errors.push('Title is required');
  }
  
  if (!entry.content.trim()) {
    errors.push('Content is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Entry operations
const saveEntry = (entryData, currentEntryId = null) => {
  const validation = validateEntry(entryData);
  
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  const entry = {
    ...entryData,
    id: currentEntryId || undefined
  };
  
  const storage = getStorage();
  const result = currentEntryId 
    ? storage.updateEntry(currentEntryId, entry)
    : storage.saveEntry(entry);
  
  return result;
};

// Form population
const populateForm = (entry) => {
  if (!entry) return;
  
  document.getElementById('title').value = entry.title;
  document.getElementById('type').value = entry.type;
  document.getElementById('tags').value = entry.tags.join(', ');
  document.getElementById('character-select').value = entry.characterId || '';
  document.getElementById('editor').innerHTML = entry.content;
};

const loadCharacterOptions = () => {
  const storage = getStorage();
  const state = storage.getData();
  const characters = Object.values(state.characters);
  const select = document.getElementById('character-select');
  
  select.innerHTML = '<option value="">Select Character</option>';
  
  characters.forEach(character => {
    const option = document.createElement('option');
    option.value = character.id;
    option.textContent = character.name;
    if (character.id === state.settings.currentCharacter) {
      option.selected = true;
    }
    select.appendChild(option);
  });
};

// Auto-save functionality
const createAutoSave = (getCurrentEntry) => {
  let hasChanges = false;
  
  const markChanged = () => { hasChanges = true; };
  const markSaved = () => { hasChanges = false; };
  
  const autoSave = debounce(() => {
    if (hasChanges) {
      const form = document.getElementById('entry-form');
      const entryData = parseFormData(form);
      const currentEntry = getCurrentEntry();
      
      saveEntry(entryData, currentEntry?.id);
      markSaved();
    }
  }, 2000);
  
  return { markChanged, autoSave };
};

// Main initialization
const initJournalEditor = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const entryId = urlParams.get('id');
  
  let currentEntry = null;
  
  // Load existing entry if editing
  if (entryId) {
    const storage = getStorage();
    const state = storage.getData();
    currentEntry = state.entries[entryId];
    if (currentEntry) {
      populateForm(currentEntry);
    }
  }
  
  // Load character options
  loadCharacterOptions();
  
  // Setup toolbar handlers
  const toolbarHandlers = createToolbarHandlers();
  document.getElementById('bold-btn').onclick = toolbarHandlers.bold;
  document.getElementById('italic-btn').onclick = toolbarHandlers.italic;
  document.getElementById('heading-btn').onclick = toolbarHandlers.heading;
  
  // Setup auto-save
  const { markChanged, autoSave } = createAutoSave(() => currentEntry);
  document.getElementById('editor').addEventListener('input', () => {
    markChanged();
    autoSave();
  });
  
  // Setup form submission
  document.getElementById('entry-form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    const entryData = parseFormData(event.target);
    const result = saveEntry(entryData, currentEntry?.id);
    
    if (result.success) {
      showNotification('Entry saved successfully!');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showNotification('Failed to save: ' + result.errors.join(', '), 'error');
    }
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initJournalEditor);
```

### AI Assistant Integration
```javascript
// js/pages/AIAssistant.js - Functional AI integration
import { getStorage } from '../utils/storage.js';
import { showNotification } from '../utils/notifications.js';

// Pure functions for API key management
const getApiKey = () => {
  const storage = getStorage();
  const state = storage.getData();
  return state.settings.openaiApiKey;
};

const setApiKey = (apiKey) => {
  const storage = getStorage();
  return storage.updateSettings({ openaiApiKey: apiKey });
};

const promptForApiKey = () => {
  const key = prompt('Enter your OpenAI API key (will be stored locally):');
  if (key) {
    setApiKey(key);
    return key;
  }
  return null;
};

// Pure functions for prompt building
const buildCharacterContext = (character) => 
  character ? `
Character: ${character.name} (${character.race} ${character.class}, Level ${character.level})
Traits: ${character.traits || 'Not specified'}
Backstory: ${character.backstory ? character.backstory.substring(0, 200) + '...' : 'None'}
` : 'No character selected';

const buildRecentEventsContext = (entries) => 
  entries.length > 0 
    ? `Recent Events: ${entries.map(e => e.title).join(', ')}`
    : 'Recent Events: None';

const createPromptTemplate = (type) => {
  const templates = {
    roleplay: (context, userInput) => 
      `${context}\n\nBased on this character, suggest how they would react to: ${userInput}\n\nProvide 2-3 specific roleplay suggestions with dialogue options.`,
    
    character: (context, userInput) => 
      `${context}\n\nSuggest character development ideas focusing on: ${userInput}\n\nInclude personality growth, relationships, and backstory elements.`,
    
    scenario: (context, userInput) => 
      `${context}\n\nGenerate an interesting scenario or challenge: ${userInput}\n\nInclude potential obstacles, choices, and consequences.`
  };
  
  return templates[type] || templates.roleplay;
};

const buildPrompt = (type, character, recentEntries, userInput) => {
  const characterContext = buildCharacterContext(character);
  const eventsContext = buildRecentEventsContext(recentEntries);
  const fullContext = characterContext + eventsContext;
  
  const templateFn = createPromptTemplate(type);
  return templateFn(fullContext, userInput);
};

// API interaction
const callOpenAI = async (prompt, apiKey) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful D&D assistant that provides creative roleplay suggestions. Keep responses concise and actionable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
};

// Main AI generation function
const generateAIResponse = async (type, characterId, userInput) => {
  try {
    let apiKey = getApiKey();
    
    if (!apiKey) {
      apiKey = promptForApiKey();
      if (!apiKey) {
        return { success: false, error: 'API key required' };
      }
    }
    
    const storage = getStorage();
    const state = storage.getData();
    
    const character = state.characters[characterId];
    if (!character) {
      return { success: false, error: 'Character not found' };
    }
    
    const recentEntries = Object.values(state.entries)
      .filter(entry => entry.characterId === characterId)
      .sort((a, b) => b.created - a.created)
      .slice(0, 3);
    
    const prompt = buildPrompt(type, character, recentEntries, userInput);
    const content = await callOpenAI(prompt, apiKey);
    
    return { success: true, content };
    
  } catch (error) {
    console.error('AI generation failed:', error);
    
    if (error.message.includes('401')) {
      return { success: false, error: 'Invalid API key. Please check your OpenAI API key.' };
    }
    
    return { success: false, error: 'Failed to generate response. Please try again.' };
  }
};

// UI helper functions
const createLoadingState = () => {
  const div = document.createElement('div');
  div.className = 'ai-response loading';
  div.innerHTML = '<p>🤔 Generating suggestions...</p>';
  return div;
};

const createErrorState = (error) => {
  const div = document.createElement('div');
  div.className = 'ai-response error';
  div.innerHTML = `<p>❌ ${error}</p>`;
  return div;
};

const createSuccessState = (content, type) => {
  const div = document.createElement('div');
  div.className = 'ai-response success';
  div.innerHTML = `
    <h3>🤖 AI Suggestions (${type})</h3>
    <div class="response-content">${content.replace(/\n/g, '<br>')}</div>
  `;
  return div;
};

// Form management
const loadCharacterOptions = () => {
  const storage = getStorage();
  const state = storage.getData();
  const characters = Object.values(state.characters);
  const select = document.getElementById('ai-character-select');
  
  select.innerHTML = '<option value="">Select Character</option>';
  
  characters.forEach(character => {
    const option = document.createElement('option');
    option.value = character.id;
    option.textContent = character.name;
    if (character.id === state.settings.currentCharacter) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  
  updateGenerateButton();
};

const updateGenerateButton = () => {
  const characterSelected = document.getElementById('ai-character-select').value;
  const button = document.getElementById('generate-btn');
  button.disabled = !characterSelected;
};

// Main initialization
const initAIAssistant = () => {
  loadCharacterOptions();
  
  // Setup event listeners
  document.getElementById('ai-character-select').addEventListener('change', updateGenerateButton);
  document.getElementById('user-input').addEventListener('input', updateGenerateButton);
  
  document.getElementById('generate-btn').addEventListener('click', async () => {
    const characterId = document.getElementById('ai-character-select').value;
    const promptType = document.getElementById('prompt-type').value;
    const userInput = document.getElementById('user-input').value.trim();
    const container = document.getElementById('ai-response');
    
    if (!characterId) {
      showNotification('Please select a character first.', 'error');
      return;
    }
    
    if (!userInput) {
      showNotification('Please enter a description or question.', 'error');
      return;
    }
    
    // Show loading state
    container.replaceChildren(createLoadingState());
    
    // Generate response
    const result = await generateAIResponse(promptType, characterId, userInput);
    
    // Show result
    if (result.success) {
      container.replaceChildren(createSuccessState(result.content, promptType));
    } else {
      container.replaceChildren(createErrorState(result.error));
    }
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAIAssistant);
```

## Settings Management

### API Key Storage
```javascript
// Store OpenAI API key locally in browser
const settings = {
  openaiApiKey: null,
  currentCharacter: null,
  preferences: {
    theme: 'light',
    autoSave: true
  }
};

// Simple settings UI in the app
function showSettingsModal() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <h3>Settings</h3>
        <label>
          OpenAI API Key:
          <input type="password" id="api-key" placeholder="sk-...">
        </label>
        <div class="modal-actions">
          <button onclick="saveSettings()">Save</button>
          <button onclick="closeModal()">Cancel</button>
        </div>
      </div>
    </div>
  `;
}
```

## CSS Styling (Simple & Clean)
```css
/* css/main.css */
:root {
  --primary: #4a90e2;
  --secondary: #7b68ee;
  --background: #f8f9fa;
  --text: #333;
  --border: #e1e5e9;
  --success: #28a745;
  --warning: #ffc107;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text);
  background: var(--background);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
}

nav a {
  text-decoration: none;
  color: var(--primary);
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

nav a:hover {
  background: var(--background);
}

.entry-card, .character-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.entry-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tag {
  background: var(--primary);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
}

button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #357abd;
}

#editor {
  min-height: 300px;
  border: 1px solid var(--border);
  padding: 1rem;
  border-radius: 4px;
  outline: none;
}

.toolbar {
  background: #f1f3f4;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}

.toolbar button {
  background: white;
  color: var(--text);
  border: 1px solid var(--border);
  margin-right: 0.5rem;
  font-size: 0.9rem;
}
```

## Deployment

### Surge.sh Deployment
```bash
# Build and deploy
npm install -g surge

# In your project directory
surge

# Or specify domain
surge . your-dnd-journal.surge.sh
```

### Project Structure for Deployment
```
dnd-journal/
├── index.html
├── journal.html
├── character.html
├── ai-assistant.html
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── journal.js
│   ├── character.js
│   └── ai.js
├── assets/
│   └── icon.png
└── CNAME (optional, for custom domain)
```

This ultra-simple architecture provides:
- ✅ Pure static site hosted on Surge.sh (FREE)
- ✅ Local storage for offline functionality  
- ✅ Direct OpenAI API integration with user-provided key
- ✅ No backend dependencies whatsoever
- ✅ Minimal complexity - just HTML/CSS/JS
- ✅ Mobile-friendly responsive design
- ✅ Easy to maintain and extend
- ✅ Export/Import for manual backup

The total cost is essentially free hosting + your OpenAI API usage (typically $1-3/month for personal use).