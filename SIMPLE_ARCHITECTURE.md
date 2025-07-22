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
// js/app.js - Main application
class DNDJournal {
    constructor() {
        this.storage = new Storage();
        this.currentCharacter = null;
        this.init();
    }
    
    init() {
        this.loadCurrentCharacter();
        this.renderDashboard();
        this.setupEventListeners();
    }
    
    loadCurrentCharacter() {
        const settings = this.storage.getSettings();
        if (settings.currentCharacter) {
            this.currentCharacter = this.storage.getCharacter(settings.currentCharacter);
        }
    }
    
    renderDashboard() {
        this.renderRecentEntries();
        this.renderCharacterSummary();
    }
    
    renderRecentEntries() {
        const entries = this.storage.getRecentEntries(5);
        const container = document.getElementById('entries-list');
        
        container.innerHTML = entries.map(entry => `
            <div class="entry-card" onclick="editEntry('${entry.id}')">
                <h3>${entry.title}</h3>
                <p class="entry-meta">${entry.type} • ${new Date(entry.date).toLocaleDateString()}</p>
                <p class="entry-preview">${entry.content.substring(0, 100)}...</p>
                <div class="tags">
                    ${entry.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }
    
    renderCharacterSummary() {
        if (!this.currentCharacter) return;
        
        const container = document.getElementById('current-character');
        container.innerHTML = `
            <div class="character-card">
                <h3>${this.currentCharacter.name}</h3>
                <p>Level ${this.currentCharacter.level} ${this.currentCharacter.race} ${this.currentCharacter.class}</p>
                <p class="traits">${this.currentCharacter.traits}</p>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DNDJournal();
});
```

### Storage System
```javascript
// js/storage.js - Local storage management
class Storage {
    constructor() {
        this.storageKey = 'dnd-journal-data';
        this.data = this.loadData();
    }
    
    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {
            characters: {},
            entries: {},
            settings: {
                currentCharacter: null,
                syncEnabled: false,
                lastSync: null
            }
        };
    }
    
    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }
    
    // Character methods
    saveCharacter(character) {
        if (!character.id) {
            character.id = this.generateId();
        }
        this.data.characters[character.id] = character;
        this.saveData();
        return character;
    }
    
    getCharacter(id) {
        return this.data.characters[id];
    }
    
    getAllCharacters() {
        return Object.values(this.data.characters);
    }
    
    // Entry methods
    saveEntry(entry) {
        if (!entry.id) {
            entry.id = this.generateId();
        }
        entry.created = entry.created || Date.now();
        this.data.entries[entry.id] = entry;
        this.saveData();
        return entry;
    }
    
    getEntry(id) {
        return this.data.entries[id];
    }
    
    getRecentEntries(limit = 10) {
        return Object.values(this.data.entries)
            .sort((a, b) => b.created - a.created)
            .slice(0, limit);
    }
    
    getEntriesForCharacter(characterId) {
        return Object.values(this.data.entries)
            .filter(entry => entry.characterId === characterId)
            .sort((a, b) => b.created - a.created);
    }
    
    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getSettings() {
        return this.data.settings;
    }
    
    updateSettings(updates) {
        Object.assign(this.data.settings, updates);
        this.saveData();
    }
    
    // Export/Import for backup
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }
    
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.data = imported;
            this.saveData();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}
```

### Journal Editor
```javascript
// js/journal.js - Journal entry functionality
class JournalEditor {
    constructor() {
        this.storage = new Storage();
        this.currentEntry = null;
        this.init();
    }
    
    init() {
        this.setupEditor();
        this.loadEntryFromURL();
    }
    
    setupEditor() {
        // Simple rich text editing with basic formatting
        const editor = document.getElementById('editor');
        
        // Add formatting buttons
        document.getElementById('bold-btn').onclick = () => this.formatText('bold');
        document.getElementById('italic-btn').onclick = () => this.formatText('italic');
        
        // Auto-save functionality
        editor.addEventListener('input', this.debounce(() => this.autoSave(), 1000));
    }
    
    formatText(command) {
        document.execCommand(command, false, null);
        document.getElementById('editor').focus();
    }
    
    saveEntry() {
        const title = document.getElementById('title').value;
        const content = document.getElementById('editor').innerHTML;
        const type = document.getElementById('type').value;
        const tags = this.parseTags(document.getElementById('tags').value);
        
        const entry = {
            id: this.currentEntry?.id,
            title: title || 'Untitled Entry',
            content,
            type,
            tags,
            characterId: this.getCurrentCharacterId(),
            date: new Date().toISOString().split('T')[0],
            created: this.currentEntry?.created || Date.now()
        };
        
        this.storage.saveEntry(entry);
        this.showSaveConfirmation();
    }
    
    parseTags(tagString) {
        return tagString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    autoSave() {
        if (this.hasUnsavedChanges()) {
            this.saveEntry();
        }
    }
}
```

### AI Assistant Integration
```javascript
// js/ai.js - Direct OpenAI API integration
class AIAssistant {
    constructor() {
        this.storage = new Storage();
        this.apiKey = this.getApiKey();
    }
    
    getApiKey() {
        // Get API key from settings or prompt user
        const settings = this.storage.getSettings();
        if (!settings.openaiApiKey) {
            const key = prompt('Enter your OpenAI API key (will be stored locally):');
            if (key) {
                settings.openaiApiKey = key;
                this.storage.updateSettings(settings);
            }
            return key;
        }
        return settings.openaiApiKey;
    }
    
    async generatePrompt(type, context, userInput = '') {
        if (!this.apiKey) {
            return { error: 'OpenAI API key required' };
        }
        
        const character = this.storage.getCharacter(this.storage.getSettings().currentCharacter);
        const recentEntries = this.storage.getRecentEntries(3);
        
        const prompt = this.buildPrompt(type, character, recentEntries, userInput);
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful D&D assistant that provides roleplay suggestions.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            return { content: data.choices[0].message.content };
            
        } catch (error) {
            console.error('AI generation failed:', error);
            return { error: 'Failed to generate AI response. Check your API key.' };
        }
    }
    
    buildPrompt(type, character, recentEntries, userInput) {
        const context = `
Character: ${character.name} (${character.race} ${character.class}, Level ${character.level})
Traits: ${character.traits || 'Not specified'}
Recent Events: ${recentEntries.map(e => e.title).join(', ') || 'None'}
        `;
        
        const prompts = {
            roleplay: `${context}\nBased on this character, suggest how they would react to: ${userInput}`,
            character: `${context}\nSuggest character development ideas for: ${userInput}`,
            scenario: `${context}\nGenerate a scenario or challenge: ${userInput}`
        };
        
        return prompts[type] || prompts.roleplay;
    }
}
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