# Quick Start Guide - D&D Journal App

## 🚀 Get Started in 10 Minutes

This guide will help you create a working D&D journal app that you can start using immediately.

## Step 1: Create Project Structure

Create these files in a new folder:

```
dnd-journal/
├── index.html
├── journal.html
├── character.html
├── ai-assistant.html
├── css/
│   └── main.css
└── js/
    ├── app.js
    ├── storage.js
    ├── journal.js
    ├── character.js
    └── ai.js
```

## Step 2: Core Files

### index.html (Dashboard)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Journal</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🐉 D&D Journal</h1>
            <nav>
                <a href="journal.html">✏️ New Entry</a>
                <a href="character.html">👤 Characters</a>
                <a href="ai-assistant.html">🤖 AI Assistant</a>
            </nav>
        </header>
        
        <main>
            <section class="recent-entries">
                <h2>Recent Entries</h2>
                <div id="entries-list">
                    <div class="empty-state">
                        <p>No entries yet. <a href="journal.html">Create your first entry!</a></p>
                    </div>
                </div>
            </section>
            
            <section class="character-summary">
                <h2>Current Character</h2>
                <div id="current-character">
                    <div class="empty-state">
                        <p>No character selected. <a href="character.html">Create a character!</a></p>
                    </div>
                </div>
            </section>
        </main>
    </div>
    
    <script src="js/storage.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

### journal.html (Entry Editor)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Journal Entry - D&D Journal</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>📝 Journal Entry</h1>
            <nav>
                <a href="index.html">🏠 Dashboard</a>
                <a href="character.html">👤 Characters</a>
                <a href="ai-assistant.html">🤖 AI Assistant</a>
            </nav>
        </header>
        
        <main>
            <form id="entry-form" class="entry-form">
                <div class="form-row">
                    <input type="text" id="title" placeholder="Entry title..." required>
                    <select id="type">
                        <option value="session">Session Notes</option>
                        <option value="character">Character Development</option>
                        <option value="lore">Campaign Lore</option>
                        <option value="note">Quick Note</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <input type="text" id="tags" placeholder="Tags (comma separated)">
                    <select id="character-select">
                        <option value="">Select Character</option>
                    </select>
                </div>
                
                <div class="toolbar">
                    <button type="button" id="bold-btn">Bold</button>
                    <button type="button" id="italic-btn">Italic</button>
                    <button type="button" id="heading-btn">Heading</button>
                </div>
                
                <div id="editor" contenteditable="true" placeholder="Start writing your entry..."></div>
                
                <div class="form-actions">
                    <button type="button" onclick="history.back()">Cancel</button>
                    <button type="submit">Save Entry</button>
                </div>
            </form>
        </main>
    </div>
    
    <script src="js/storage.js"></script>
    <script src="js/journal.js"></script>
</body>
</html>
```

### character.html (Character Management)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Characters - D&D Journal</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>👤 Characters</h1>
            <nav>
                <a href="index.html">🏠 Dashboard</a>
                <a href="journal.html">✏️ New Entry</a>
                <a href="ai-assistant.html">🤖 AI Assistant</a>
            </nav>
        </header>
        
        <main>
            <section class="character-form">
                <h2>Character Details</h2>
                <form id="character-form">
                    <div class="form-row">
                        <input type="text" id="char-name" placeholder="Character Name" required>
                        <input type="text" id="char-class" placeholder="Class" required>
                    </div>
                    <div class="form-row">
                        <input type="text" id="char-race" placeholder="Race" required>
                        <input type="number" id="char-level" placeholder="Level" min="1" max="20" required>
                    </div>
                    <textarea id="char-traits" placeholder="Personality traits..."></textarea>
                    <textarea id="char-backstory" placeholder="Backstory..."></textarea>
                    <div class="form-actions">
                        <button type="submit">Save Character</button>
                        <button type="button" id="new-char-btn">New Character</button>
                    </div>
                </form>
            </section>
            
            <section class="character-list">
                <h2>Your Characters</h2>
                <div id="characters-list"></div>
            </section>
        </main>
    </div>
    
    <script src="js/storage.js"></script>
    <script src="js/character.js"></script>
</body>
</html>
```

### ai-assistant.html (AI Assistant)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Assistant - D&D Journal</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🤖 AI Roleplay Assistant</h1>
            <nav>
                <a href="index.html">🏠 Dashboard</a>
                <a href="journal.html">✏️ New Entry</a>
                <a href="character.html">👤 Characters</a>
            </nav>
        </header>
        
        <main>
            <section class="ai-form">
                <div class="form-row">
                    <select id="prompt-type">
                        <option value="roleplay">🎭 Roleplay Suggestions</option>
                        <option value="character">📚 Character Development</option>
                        <option value="scenario">🗡️ Scenario Ideas</option>
                    </select>
                    <select id="ai-character-select">
                        <option value="">Select Character</option>
                    </select>
                </div>
                
                <textarea id="user-input" placeholder="Describe the situation or what you'd like help with..."></textarea>
                
                <button id="generate-btn" disabled>✨ Generate AI Suggestions</button>
                
                <div id="ai-response" class="ai-response"></div>
            </section>
        </main>
    </div>
    
    <script src="js/storage.js"></script>
    <script src="js/ai.js"></script>
</body>
</html>
```

### css/main.css (Styling)
```css
:root {
    --primary: #4a90e2;
    --secondary: #7b68ee;
    --background: #f8f9fa;
    --surface: #ffffff;
    --text: #333333;
    --text-light: #666666;
    --border: #e1e5e9;
    --success: #28a745;
    --warning: #ffc107;
    --error: #dc3545;
    --radius: 8px;
    --shadow: 0 2px 4px rgba(0,0,0,0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--background);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 1rem 0;
    margin-bottom: 2rem;
}

header h1 {
    margin-bottom: 0.5rem;
    color: var(--primary);
}

nav {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

nav a {
    text-decoration: none;
    color: var(--text);
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    transition: all 0.2s;
    background: var(--surface);
}

nav a:hover {
    background: var(--primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: var(--shadow);
}

/* Layout */
main {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
}

@media (min-width: 768px) {
    main {
        grid-template-columns: 2fr 1fr;
    }
}

section {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

section h2 {
    margin-bottom: 1rem;
    color: var(--text);
    border-bottom: 2px solid var(--primary);
    padding-bottom: 0.5rem;
}

/* Cards */
.entry-card, .character-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.entry-card:hover, .character-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-color: var(--primary);
}

.entry-card h3, .character-card h3 {
    color: var(--primary);
    margin-bottom: 0.5rem;
}

.entry-meta {
    color: var(--text-light);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.entry-preview {
    margin-bottom: 0.5rem;
}

.tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tag {
    background: var(--primary);
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
}

.traits {
    color: var(--text-light);
    font-style: italic;
}

/* Forms */
.entry-form, .character-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-row {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
}

@media (min-width: 768px) {
    .form-row {
        grid-template-columns: 1fr 1fr;
    }
}

input, select, textarea {
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 1rem;
    transition: border-color 0.2s;
    background: var(--surface);
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

textarea {
    resize: vertical;
    min-height: 80px;
}

/* Editor */
.toolbar {
    background: #f8f9fa;
    border: 1px solid var(--border);
    border-bottom: none;
    border-radius: var(--radius) var(--radius) 0 0;
    padding: 0.5rem;
    display: flex;
    gap: 0.5rem;
}

.toolbar button {
    background: white;
    color: var(--text);
    border: 1px solid var(--border);
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
}

.toolbar button:hover {
    background: var(--primary);
    color: white;
}

#editor {
    min-height: 300px;
    border: 1px solid var(--border);
    border-radius: 0 0 var(--radius) var(--radius);
    padding: 1rem;
    outline: none;
    background: var(--surface);
    line-height: 1.6;
}

#editor:empty:before {
    content: attr(placeholder);
    color: var(--text-light);
}

/* Buttons */
button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    border: 1px solid transparent;
}

button:hover:not(:disabled) {
    background: #357abd;
    transform: translateY(-1px);
    box-shadow: var(--shadow);
}

button:disabled {
    background: var(--text-light);
    cursor: not-allowed;
    transform: none;
}

button[type="button"] {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
}

button[type="button"]:hover {
    background: var(--border);
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1rem;
}

/* AI Assistant */
.ai-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.ai-response {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: var(--radius);
    border-left: 4px solid var(--primary);
}

.ai-response h3 {
    color: var(--primary);
    margin-bottom: 0.5rem;
}

.response-content {
    margin-bottom: 1rem;
    line-height: 1.6;
}

.suggestions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.suggestion-btn {
    background: var(--secondary);
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
}

.suggestion-btn:hover {
    background: #6854d6;
}

/* Empty States */
.empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-light);
}

.empty-state a {
    color: var(--primary);
    text-decoration: none;
}

.empty-state a:hover {
    text-decoration: underline;
}

/* Notifications */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem;
    border-radius: var(--radius);
    background: var(--success);
    color: white;
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

.notification.error {
    background: var(--error);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .container {
        padding: 0 10px;
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    nav {
        justify-content: center;
    }
    
    main {
        grid-template-columns: 1fr;
    }
}
```

### js/storage.js (Local Storage)
```javascript
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
    
    deleteCharacter(id) {
        delete this.data.characters[id];
        // If this was the current character, clear the setting
        if (this.data.settings.currentCharacter === id) {
            this.data.settings.currentCharacter = null;
        }
        this.saveData();
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
    
    deleteEntry(id) {
        delete this.data.entries[id];
        this.saveData();
    }
    
    // Settings methods
    getSettings() {
        return this.data.settings;
    }
    
    updateSettings(updates) {
        Object.assign(this.data.settings, updates);
        this.saveData();
    }
    
    setCurrentCharacter(characterId) {
        this.data.settings.currentCharacter = characterId;
        this.saveData();
    }
    
    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

### js/app.js (Dashboard Logic)
```javascript
class DNDJournal {
    constructor() {
        this.storage = new Storage();
        this.currentCharacter = null;
        this.init();
    }
    
    init() {
        this.loadCurrentCharacter();
        this.renderDashboard();
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
        
        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No entries yet. <a href="journal.html">Create your first entry!</a></p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = entries.map(entry => `
            <div class="entry-card" onclick="editEntry('${entry.id}')">
                <h3>${this.escapeHtml(entry.title)}</h3>
                <p class="entry-meta">${entry.type} • ${new Date(entry.date).toLocaleDateString()}</p>
                <p class="entry-preview">${this.stripHtml(entry.content).substring(0, 100)}...</p>
                <div class="tags">
                    ${entry.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }
    
    renderCharacterSummary() {
        const container = document.getElementById('current-character');
        
        if (!this.currentCharacter) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No character selected. <a href="character.html">Create a character!</a></p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="character-card" onclick="editCharacter('${this.currentCharacter.id}')">
                <h3>${this.escapeHtml(this.currentCharacter.name)}</h3>
                <p>Level ${this.currentCharacter.level} ${this.escapeHtml(this.currentCharacter.race)} ${this.escapeHtml(this.currentCharacter.class)}</p>
                <p class="traits">${this.escapeHtml(this.currentCharacter.traits || '')}</p>
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
}

// Global functions
function editEntry(entryId) {
    window.location.href = `journal.html?id=${entryId}`;
}

function editCharacter(characterId) {
    window.location.href = `character.html?id=${characterId}`;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('entries-list')) {
        window.app = new DNDJournal();
    }
});
```

## Step 3: Add Remaining JavaScript Files

Create these additional files:

### js/journal.js
```javascript
class JournalEditor {
    constructor() {
        this.storage = new Storage();
        this.currentEntry = null;
        this.init();
    }
    
    init() {
        this.setupEditor();
        this.loadCharacterSelect();
        this.loadEntryFromURL();
        this.setupEventListeners();
    }
    
    setupEditor() {
        const editor = document.getElementById('editor');
        
        // Add formatting buttons
        document.getElementById('bold-btn').onclick = () => this.formatText('bold');
        document.getElementById('italic-btn').onclick = () => this.formatText('italic');
        document.getElementById('heading-btn').onclick = () => this.toggleHeading();
        
        // Add placeholder behavior
        editor.addEventListener('focus', () => {
            if (editor.innerHTML === '') {
                editor.innerHTML = '';
            }
        });
    }
    
    loadCharacterSelect() {
        const select = document.getElementById('character-select');
        const characters = this.storage.getAllCharacters();
        const currentCharacterId = this.storage.getSettings().currentCharacter;
        
        select.innerHTML = '<option value="">Select Character</option>';
        characters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            if (char.id === currentCharacterId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
    
    loadEntryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const entryId = urlParams.get('id');
        
        if (entryId) {
            this.currentEntry = this.storage.getEntry(entryId);
            if (this.currentEntry) {
                this.populateForm();
            }
        }
    }
    
    populateForm() {
        if (!this.currentEntry) return;
        
        document.getElementById('title').value = this.currentEntry.title;
        document.getElementById('type').value = this.currentEntry.type;
        document.getElementById('tags').value = this.currentEntry.tags.join(', ');
        document.getElementById('character-select').value = this.currentEntry.characterId || '';
        document.getElementById('editor').innerHTML = this.currentEntry.content;
    }
    
    setupEventListeners() {
        document.getElementById('entry-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEntry();
        });
    }
    
    formatText(command) {
        document.execCommand(command, false, null);
        document.getElementById('editor').focus();
    }
    
    toggleHeading() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            document.execCommand('formatBlock', false, '<h3>');
        }
        document.getElementById('editor').focus();
    }
    
    saveEntry() {
        const title = document.getElementById('title').value;
        const content = document.getElementById('editor').innerHTML;
        const type = document.getElementById('type').value;
        const tags = this.parseTags(document.getElementById('tags').value);
        const characterId = document.getElementById('character-select').value;
        
        const entry = {
            id: this.currentEntry?.id,
            title: title || 'Untitled Entry',
            content,
            type,
            tags,
            characterId: characterId || null,
            date: new Date().toISOString().split('T')[0],
            created: this.currentEntry?.created || Date.now()
        };
        
        this.storage.saveEntry(entry);
        this.showNotification('Entry saved successfully!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
    
    parseTags(tagString) {
        return tagString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('entry-form')) {
        new JournalEditor();
    }
});
```

### js/character.js
```javascript
class CharacterManager {
    constructor() {
        this.storage = new Storage();
        this.currentCharacter = null;
        this.init();
    }
    
    init() {
        this.loadCharacterFromURL();
        this.renderCharactersList();
        this.setupEventListeners();
    }
    
    loadCharacterFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');
        
        if (characterId) {
            this.currentCharacter = this.storage.getCharacter(characterId);
            if (this.currentCharacter) {
                this.populateForm();
            }
        }
    }
    
    populateForm() {
        if (!this.currentCharacter) return;
        
        document.getElementById('char-name').value = this.currentCharacter.name;
        document.getElementById('char-class').value = this.currentCharacter.class;
        document.getElementById('char-race').value = this.currentCharacter.race;
        document.getElementById('char-level').value = this.currentCharacter.level;
        document.getElementById('char-traits').value = this.currentCharacter.traits || '';
        document.getElementById('char-backstory').value = this.currentCharacter.backstory || '';
    }
    
    renderCharactersList() {
        const characters = this.storage.getAllCharacters();
        const container = document.getElementById('characters-list');
        const currentCharacterId = this.storage.getSettings().currentCharacter;
        
        if (characters.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No characters created yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = characters.map(char => `
            <div class="character-card ${char.id === currentCharacterId ? 'current' : ''}" 
                 onclick="selectCharacter('${char.id}')">
                <h3>${this.escapeHtml(char.name)} ${char.id === currentCharacterId ? '⭐' : ''}</h3>
                <p>Level ${char.level} ${this.escapeHtml(char.race)} ${this.escapeHtml(char.class)}</p>
                <p class="traits">${this.escapeHtml(char.traits || '')}</p>
                <div class="character-actions">
                    <button onclick="editCharacter('${char.id}'); event.stopPropagation();">Edit</button>
                    <button onclick="deleteCharacter('${char.id}'); event.stopPropagation();" class="danger">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    setupEventListeners() {
        document.getElementById('character-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCharacter();
        });
        
        document.getElementById('new-char-btn').addEventListener('click', () => {
            this.clearForm();
            this.currentCharacter = null;
        });
    }
    
    saveCharacter() {
        const character = {
            id: this.currentCharacter?.id,
            name: document.getElementById('char-name').value,
            class: document.getElementById('char-class').value,
            race: document.getElementById('char-race').value,
            level: parseInt(document.getElementById('char-level').value),
            traits: document.getElementById('char-traits').value,
            backstory: document.getElementById('char-backstory').value
        };
        
        this.storage.saveCharacter(character);
        
        // If this is the first character, make it current
        const characters = this.storage.getAllCharacters();
        if (characters.length === 1 || !this.storage.getSettings().currentCharacter) {
            this.storage.setCurrentCharacter(character.id);
        }
        
        this.showNotification('Character saved successfully!');
        this.renderCharactersList();
        this.clearForm();
        this.currentCharacter = null;
    }
    
    clearForm() {
        document.getElementById('character-form').reset();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions
function selectCharacter(characterId) {
    const storage = new Storage();
    storage.setCurrentCharacter(characterId);
    window.location.reload();
}

function editCharacter(characterId) {
    window.location.href = `character.html?id=${characterId}`;
}

function deleteCharacter(characterId) {
    if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
        const storage = new Storage();
        storage.deleteCharacter(characterId);
        window.location.reload();
    }
}

// Initialize manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('character-form')) {
        new CharacterManager();
    }
});
```

### js/ai.js (AI Assistant - Basic Version)
```javascript
class AIAssistant {
    constructor() {
        this.storage = new Storage();
        this.init();
    }
    
    init() {
        this.loadCharacterSelect();
        this.setupEventListeners();
    }
    
    loadCharacterSelect() {
        const select = document.getElementById('ai-character-select');
        const characters = this.storage.getAllCharacters();
        const currentCharacterId = this.storage.getSettings().currentCharacter;
        
        select.innerHTML = '<option value="">Select Character</option>';
        characters.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            if (char.id === currentCharacterId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        this.updateGenerateButton();
    }
    
    setupEventListeners() {
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateSuggestions();
        });
        
        document.getElementById('ai-character-select').addEventListener('change', () => {
            this.updateGenerateButton();
        });
        
        document.getElementById('user-input').addEventListener('input', () => {
            this.updateGenerateButton();
        });
    }
    
    updateGenerateButton() {
        const characterSelected = document.getElementById('ai-character-select').value;
        const button = document.getElementById('generate-btn');
        button.disabled = !characterSelected;
    }
    
    generateSuggestions() {
        const characterId = document.getElementById('ai-character-select').value;
        const promptType = document.getElementById('prompt-type').value;
        const userInput = document.getElementById('user-input').value;
        
        if (!characterId) {
            this.showError('Please select a character first.');
            return;
        }
        
        const character = this.storage.getCharacter(characterId);
        const recentEntries = this.storage.getEntriesForCharacter(characterId).slice(0, 3);
        
        // Since we don't have AI integration yet, generate mock responses
        this.generateMockResponse(character, promptType, userInput, recentEntries);
    }
    
    generateMockResponse(character, promptType, userInput, recentEntries) {
        const button = document.getElementById('generate-btn');
        button.disabled = true;
        button.textContent = '🤔 Thinking...';
        
        // Simulate API delay
        setTimeout(() => {
            const response = this.createMockResponse(character, promptType, userInput, recentEntries);
            this.displayResponse(response);
            
            button.disabled = false;
            button.textContent = '✨ Generate AI Suggestions';
        }, 2000);
    }
    
    createMockResponse(character, promptType, userInput, recentEntries) {
        const responses = {
            roleplay: {
                content: `Based on ${character.name}'s personality as a ${character.race} ${character.class}, here are some roleplay suggestions:
                
                <strong>Immediate Reaction:</strong> ${character.name} would likely approach this situation with their characteristic ${character.traits || 'determination'}.
                
                <strong>Dialogue Options:</strong>
                <ul>
                    <li>"This reminds me of something from my past..."</li>
                    <li>"Let me think about this carefully before we proceed."</li>
                    <li>"I trust my instincts on this one."</li>
                </ul>
                
                <strong>Character Motivation:</strong> Consider how this situation relates to ${character.name}'s backstory and current goals.`,
                suggestions: ['Ask about motivation', 'Explore backstory connection', 'React emotionally']
            },
            character: {
                content: `Character development opportunities for ${character.name}:
                
                <strong>Growth Areas:</strong>
                <ul>
                    <li>Exploring the relationship between their ${character.class} training and personal values</li>
                    <li>Developing deeper connections with party members</li>
                    <li>Confronting aspects of their ${character.race} heritage</li>
                </ul>
                
                <strong>Internal Conflicts:</strong> Consider how recent events might challenge ${character.name}'s worldview or beliefs.
                
                <strong>Character Arc:</strong> Think about where ${character.name} might grow from level ${character.level} to the next stage of their journey.`,
                suggestions: ['Develop relationship', 'Face internal conflict', 'Question beliefs']
            },
            scenario: {
                content: `Scenario ideas for ${character.name}:
                
                <strong>Personal Challenge:</strong> A situation that tests ${character.name}'s core values while requiring their ${character.class} skills.
                
                <strong>Backstory Connection:</strong> An encounter that ties into ${character.name}'s history as a ${character.race}.
                
                <strong>Character Growth:</strong> A moral dilemma that pushes ${character.name} beyond their comfort zone and forces them to rely on their party members.
                
                Consider how this scenario might reveal new aspects of ${character.name}'s personality.`,
                suggestions: ['Create moral dilemma', 'Test core values', 'Involve party members']
            }
        };
        
        return responses[promptType] || responses.roleplay;
    }
    
    displayResponse(response) {
        const container = document.getElementById('ai-response');
        
        container.innerHTML = `
            <div class="ai-response">
                <h3>🤖 AI Suggestions</h3>
                <div class="response-content">${response.content}</div>
                ${response.suggestions ? this.renderSuggestions(response.suggestions) : ''}
                <div style="margin-top: 1rem; padding: 0.5rem; background: #fff3cd; border-radius: 4px; font-size: 0.9rem;">
                    💡 <strong>Note:</strong> This is a demo response. Connect to Val.town for real AI suggestions!
                </div>
            </div>
        `;
    }
    
    renderSuggestions(suggestions) {
        return `
            <div class="suggestions">
                <h4>Quick Actions:</h4>
                ${suggestions.map(suggestion => `
                    <button class="suggestion-btn" onclick="useAISuggestion('${suggestion}')">
                        ${suggestion}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    showError(message) {
        const container = document.getElementById('ai-response');
        container.innerHTML = `<div class="notification error">${message}</div>`;
    }
}

function useAISuggestion(suggestion) {
    // You could implement this to auto-fill the input or create a new journal entry
    document.getElementById('user-input').value = suggestion;
}

// Initialize AI assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ai-character-select')) {
        new AIAssistant();
    }
});
```

## Step 4: Deploy to Surge.sh

```bash
# Install surge globally
npm install -g surge

# Navigate to your project folder
cd dnd-journal

# Deploy to surge
surge

# Follow the prompts to create your domain
# Your site will be live at: https://your-domain.surge.sh
```

## 🎉 You're Done!

Your D&D journal app is now live! You can:

1. ✅ Create and manage characters
2. ✅ Write journal entries with basic formatting
3. ✅ Tag and categorize entries
4. ✅ View recent entries on dashboard
5. ✅ Get mock AI suggestions (ready for Val.town integration)

## Next Steps (Optional)

To add real AI functionality:

1. Create a Val.town account
2. Set up the AI proxy endpoint from the architecture doc
3. Update the `apiEndpoint` in `js/ai.js`
4. Add your OpenAI API key to Val.town environment

This gives you a fully functional D&D journal that you can start using immediately!