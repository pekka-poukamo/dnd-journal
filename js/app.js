// D&D Journal - Direct Yjs Integration

import { 
  generateId, 
  formatDate, 
  sortEntriesByDate, 
  isValidEntry 
} from './utils.js';

import { generateIntrospectionPrompt, isAIEnabled } from './ai.js';
import { runAutoSummarization, summarize, getSummary } from './summarization.js';
import { setupCharacterForm } from './character.js';
import { 
  createSystem, 
  getSyncStatus,
  onUpdate,
  getSystem,
  clearSystem,
  Y 
} from './yjs.js';

// Simple state for UI rendering (read-only mirror of Yjs)
let state = { character: {}, entries: [] };

// Yjs system instance (created by pure function)
let yjsSystem = null;

// Simple markdown parser for basic formatting
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>') // Code
    .replace(/^### (.*$)/gim, '<h3>$1</h3>') // H3
    .replace(/^## (.*$)/gim, '<h2>$1</h2>') // H2
    .replace(/^# (.*$)/gim, '<h1>$1</h1>') // H1
    .replace(/\n\n/g, '__PARAGRAPH__') // Paragraph breaks
    .replace(/\n/g, '__LINE_BREAK__') // Line breaks
    .replace(/__PARAGRAPH__/g, '</p><p>') // Convert paragraph breaks
    .replace(/^/, '<p>') // Start with paragraph
    .replace(/$/, '</p>') // End with paragraph
    .replace(/<p><\/p>/g, '') // Remove empty paragraphs
    .replace(/__LINE_BREAK__/g, '<br>'); // Single line breaks
};

// Load data from Yjs into local state (for UI rendering)
const loadStateFromYjs = () => {
  if (!yjsSystem?.journalMap) return;
  
  // Load character
  const characterMap = yjsSystem.journalMap.get('character');
  if (characterMap) {
    state.character = {
      name: characterMap.get('name') || '',
      race: characterMap.get('race') || '',
      class: characterMap.get('class') || '',
      backstory: characterMap.get('backstory') || '',
      notes: characterMap.get('notes') || ''
    };
  } else {
    state.character = { name: '', race: '', class: '', backstory: '', notes: '' };
  }
  
  // Load entries
  const entriesArray = yjsSystem.journalMap.get('entries');
  if (entriesArray) {
    state.entries = entriesArray.toArray().map(entryMap => ({
      id: entryMap.get('id'),
      title: entryMap.get('title'),
      content: entryMap.get('content'),
      timestamp: entryMap.get('timestamp')
    }));
  } else {
    state.entries = [];
  }
};



// Get form data for new entries
const getFormData = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  return {
    title: titleInput?.value?.trim() || '',
    content: contentTextarea?.value?.trim() || ''
  };
};

// Create entry object from form data
const createEntryFromForm = (formData) => ({
  id: generateId(),
  title: formData.title,
  content: formData.content,
  timestamp: Date.now()
});

// Add new entry directly to Yjs
export const addEntry = async () => {
  const formData = getFormData();
  
  if (!formData.title || !formData.content) {
    alert('Please fill in both title and content.');
    return;
  }
  
  const entry = createEntryFromForm(formData);
  
  if (isValidEntry(entry) && yjsSystem?.journalMap) {
    // Get or create entries array
    let entriesArray = yjsSystem.journalMap.get('entries');
    if (!entriesArray) {
      entriesArray = new Y.Array();
      yjsSystem.journalMap.set('entries', entriesArray);
    }
    
    // Create entry map
    const entryMap = new Y.Map();
    entryMap.set('id', entry.id);
    entryMap.set('title', entry.title);
    entryMap.set('content', entry.content);
    entryMap.set('timestamp', entry.timestamp);
    
    // Add to beginning of array
    entriesArray.unshift([entryMap]);
    yjsSystem.journalMap.set('lastModified', Date.now());
    
    // Clear form
    clearEntryForm();
    focusEntryTitle();
    
    // Generate AI summary if available
    if (isAIEnabled() && entry.content) {
      try {
        await summarize(entry.id, entry.content);
      } catch (error) {
        console.error('Failed to generate entry summary:', error);
      }
    }
  }
};

// Clear entry form
export const clearEntryForm = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  if (titleInput) titleInput.value = '';
  if (contentTextarea) contentTextarea.value = '';
};

// Focus on entry title input
export const focusEntryTitle = () => {
  const titleInput = document.getElementById('entry-title');
  if (titleInput) {
    titleInput.focus();
  }
};

// Render entries from state
export const renderEntries = () => {
  const entriesContainer = document.getElementById('entries-container');
  if (!entriesContainer) return;
  
  const sortedEntries = sortEntriesByDate([...state.entries]);
  
  entriesContainer.innerHTML = sortedEntries.map(entry => `
    <div class="entry" data-entry-id="${entry.id}">
      <div class="entry-header">
        <h3 class="entry-title">${entry.title}</h3>
        <div class="entry-meta">
          <span class="entry-date">${formatDate(entry.timestamp)}</span>
          <button class="edit-btn" onclick="enableEditMode(this.closest('.entry'), ${JSON.stringify(entry).replace(/"/g, '&quot;')})">✏️</button>
        </div>
      </div>
      <div class="entry-content">${parseMarkdown(entry.content)}</div>
    </div>
  `).join('');
};

// Enable edit mode for an entry
export const enableEditMode = (entryDiv, entry) => {
  const title = entryDiv.querySelector('.entry-title');
  const content = entryDiv.querySelector('.entry-content');
  const editBtn = entryDiv.querySelector('.edit-btn');
  
  // Create edit form
  const editForm = document.createElement('div');
  editForm.className = 'edit-form';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = entry.title;
  titleInput.className = 'edit-title-input';
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.value = entry.content;
  contentTextarea.className = 'edit-content-textarea';
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => saveEdit(entryDiv, entry, titleInput.value, contentTextarea.value);
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => cancelEdit(entryDiv, entry);
  
  editForm.appendChild(titleInput);
  editForm.appendChild(contentTextarea);
  editForm.appendChild(saveBtn);
  editForm.appendChild(cancelBtn);
  
  // Replace content with edit form
  title.style.display = 'none';
  content.style.display = 'none';
  editBtn.style.display = 'none';
  
  entryDiv.appendChild(editForm);
  titleInput.focus();
};

// Save edit changes directly to Yjs
export const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  if (newTitle.trim() && newContent.trim() && yjsSystem?.journalMap) {
    // Find and update entry in Yjs array
    const entriesArray = yjsSystem.journalMap.get('entries');
    if (entriesArray) {
      const entries = entriesArray.toArray();
      const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entry.id);
      
      if (entryIndex >= 0) {
        const entryMap = entries[entryIndex];
        entryMap.set('title', newTitle.trim());
        entryMap.set('content', newContent.trim());
        entryMap.set('timestamp', Date.now());
        yjsSystem.journalMap.set('lastModified', Date.now());
      }
    }
    
    // Remove edit form and restore display
    const editForm = entryDiv.querySelector('.edit-form');
    if (editForm) {
      editForm.remove();
    }
    
    const title = entryDiv.querySelector('.entry-title');
    const content = entryDiv.querySelector('.entry-content');
    const editBtn = entryDiv.querySelector('.edit-btn');
    
    title.textContent = newTitle.trim();
    title.style.display = '';
    content.innerHTML = parseMarkdown(newContent.trim());
    content.style.display = '';
    editBtn.style.display = '';
  }
};

// Cancel edit mode
export const cancelEdit = (entryDiv, entry) => {
  const editForm = entryDiv.querySelector('.edit-form');
  if (editForm) {
    editForm.remove();
  }
  
  const title = entryDiv.querySelector('.entry-title');
  const content = entryDiv.querySelector('.entry-content');
  const editBtn = entryDiv.querySelector('.edit-btn');
  
  title.style.display = '';
  content.style.display = '';
  editBtn.style.display = '';
};

// Display character summary
export const displayCharacterSummary = () => {
  const nameEl = document.getElementById('display-name');
  const raceEl = document.getElementById('display-race');
  const classEl = document.getElementById('display-class');
  
  if (!nameEl || !raceEl || !classEl) return;
  
  nameEl.textContent = state.character.name || 'Unknown';
  raceEl.textContent = state.character.race === 'Unknown' ? '—' : (state.character.race || '—');
  classEl.textContent = state.character.class === 'Unknown' ? '—' : (state.character.class || '—');
};

// Setup sync status indicator
const updateSyncStatus = (status, text, details) => {
  const syncIndicator = document.getElementById('sync-status');
  if (syncIndicator) {
    syncIndicator.textContent = text;
    syncIndicator.className = `sync-${status}`;
    syncIndicator.title = details;
  }
  console.log(`Sync status: ${status} - ${text}`);
};

// Setup sync listener for real-time updates
export const setupSyncListener = () => {
  if (!yjsSystem?.ydoc) {
    updateSyncStatus('local-only', 'Local only', 'Data is only stored locally');
    return;
  }
  
  // Monitor sync status using pure function
  const checkSyncStatus = () => {
    const status = getSyncStatus(yjsSystem.providers);
    if (status.connected) {
      updateSyncStatus('connected', 'Synced', `Connected to ${status.connectedCount}/${status.totalProviders} sync servers`);
    } else {
      updateSyncStatus('disconnected', 'Offline', 'Not connected to sync servers - data stored locally');
    }
  };
  
  // Check status periodically
  setInterval(checkSyncStatus, 5000);
  checkSyncStatus(); // Initial check
  
  // Listen for Yjs document changes
  yjsSystem.ydoc.on('update', () => {
    console.log('Yjs document updated - refreshing UI');
    loadStateFromYjs();
    renderEntries();
    displayCharacterSummary();
  });
  
  // Listen for provider connection changes
  yjsSystem.providers.forEach(provider => {
    provider.on('status', checkSyncStatus);
  });
};

// Setup event handlers
export const setupEventHandlers = () => {
  // Add entry form submission
  const addEntryBtn = document.getElementById('add-entry-btn');
  if (addEntryBtn) {
    addEntryBtn.addEventListener('click', addEntry);
  }
  
  // Form submission with Enter key
  const entryForm = document.getElementById('entry-form');
  if (entryForm) {
    entryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addEntry();
    });
  }
  
  // Make functions available globally for onclick handlers
  if (typeof window !== 'undefined') {
    window.enableEditMode = enableEditMode;
    window.saveEdit = saveEdit;
    window.cancelEdit = cancelEdit;
  }
};

// AI prompt functionality
const displayAIPrompt = async () => {
  try {
    const promptContainer = document.getElementById('ai-prompt-container');
    const promptText = document.getElementById('ai-prompt-text');
    
    if (!promptContainer || !promptText) return;
    
    if (isAIEnabled()) {
      const prompt = await generateIntrospectionPrompt();
      promptText.textContent = prompt;
      promptContainer.style.display = 'block';
    } else {
      promptContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to display AI prompt:', error);
  }
};

// Initialize app
export const init = async () => {
  try {
    // Initialize Yjs system
    yjsSystem = await createSystem();
    
    // Register callback for updates
    onUpdate((updatedSystem) => {
      loadStateFromYjs();
      renderEntries();
      displayCharacterSummary();
    });
    
    // Load initial state from Yjs
    loadStateFromYjs();
    
    // Setup UI
    if (yjsSystem?.journalMap) {
      setupCharacterForm();
    }
    renderEntries();
    displayCharacterSummary();
    setupEventHandlers();
    setupSyncListener();
    
    // Initialize summarization
    try {
      await runAutoSummarization();
    } catch (error) {
      console.error('Failed to initialize summarization:', error);
    }
    
    // Display AI prompt
    await displayAIPrompt();
    
    console.log('App initialized with direct Yjs integration');
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ff4444; color: white; padding: 10px; border-radius: 5px; z-index: 1000;';
    errorDiv.textContent = 'Failed to initialize app. Please refresh the page.';
    document.body.appendChild(errorDiv);
  }
};

// Reset state to initial values (for testing)
export const resetState = () => {
  state = {
    character: { name: '', race: '', class: '', backstory: '', notes: '' },
    entries: []
  };
  // Update global state reference for tests
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};

// Reset Yjs system (for testing)
export const resetSyncCache = () => {
  yjsSystem = null;
  clearSystem();
};

// Export state for testing
export { state };

// Start when DOM is ready (only in browser environment, not in tests)
if (typeof document !== 'undefined' && document.addEventListener && 
    !(typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test')) {
  document.addEventListener('DOMContentLoaded', init);
}