// D&D Journal - Radically Simple with Yjs Data Store

import { 
  generateId, 
  formatDate, 
  sortEntriesByDate, 
  isValidEntry 
} from './utils.js';

import { generateIntrospectionPrompt, isAIEnabled } from './ai.js';
import { runAutoSummarization, summarize, getSummary } from './summarization.js';
import { 
  initializeDataStore, 
  waitForReady, 
  onChange as onDataChange,
  getJournal, 
  getCharacter, 
  setCharacter, 
  getEntries, 
  addEntry as addEntryToStore, 
  updateEntry as updateEntryInStore,
  getSyncStatus 
} from './data-store.js';
import { needsMigration, migrateToYjs } from './migration.js';

// Simple state management - now backed by Yjs
let state = { character: {}, entries: [] };

// Data store ready flag
let dataStoreReady = false;

// Simple markdown parser for basic formatting
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  let result = text
    // Bold text **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text *text* or _text_ (but not part of ** or __)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
    // Code `text`
    .replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Process lists and line breaks more carefully
  const lines = result.split('\n');
  const processedLines = [];
  let inList = false;
  let listType = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for unordered list items
    if (trimmedLine.match(/^[-*]\s+(.+)$/)) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      processedLines.push(`<li>${trimmedLine.replace(/^[-*]\s+/, '')}</li>`);
    }
    // Check for ordered list items
    else if (trimmedLine.match(/^\d+\.\s+(.+)$/)) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      processedLines.push(`<li>${trimmedLine.replace(/^\d+\.\s+/, '')}</li>`);
    }
    // Regular line
    else {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      // Handle empty lines as paragraph breaks, regular lines normally
      if (trimmedLine === '') {
        processedLines.push('__EMPTY_LINE__'); // Placeholder for empty lines
      } else {
        processedLines.push(trimmedLine);
      }
    }
  }
  
  // Close any open list
  if (inList) {
    processedLines.push(`</${listType}>`);
  }
  
  // Join and handle line breaks properly
  return processedLines
    .join('__LINE_BREAK__')
    .replace(/__EMPTY_LINE____LINE_BREAK__/g, '<br><br>') // Double line breaks
    .replace(/__EMPTY_LINE__/g, '<br><br>') // Remaining empty lines
    .replace(/__LINE_BREAK__(?=<\/?(ul|ol|li))/g, '') // No breaks before/after list tags
    .replace(/(<\/?(ul|ol)>)__LINE_BREAK__/g, '$1') // No breaks after list tags
    .replace(/__LINE_BREAK__/g, '<br>'); // Single line breaks
};

// Load data from Yjs data store
export const loadData = async () => {
  try {
    // Handle migration from localStorage if needed
    if (needsMigration()) {
      console.log('Migration needed - converting localStorage to Yjs...');
      const migrationResult = await migrateToYjs();
      if (migrationResult.success) {
        console.log('Migration completed successfully');
      } else {
        console.error('Migration failed:', migrationResult.error);
      }
    }
    
    // Initialize data store
    await initializeDataStore();
    await waitForReady();
    
    // Load current data from Yjs
    const journalData = getJournal();
    state = journalData;
    dataStoreReady = true;
    
    // Update global state reference for tests
    if (typeof global !== 'undefined') {
      global.state = state;
    }
    
    console.log('Data loaded from Yjs store');
    
  } catch (e) {
    console.error('Failed to load data:', e);
    // Fall back to empty state
    state = { 
      character: { name: '', race: '', class: '', backstory: '', notes: '' }, 
      entries: [] 
    };
    dataStoreReady = true;
  }
};

// Save data to Yjs data store (automatic sync)
export const saveData = () => {
  if (!dataStoreReady) {
    console.warn('Data store not ready, skipping save');
    return { success: false, error: 'Data store not ready' };
  }
  
  try {
    // Data is automatically saved to Yjs and synced
    // Just update our local state reference
    state.lastModified = Date.now();
    
    console.log('Data automatically saved to Yjs store');
    return { success: true };
  } catch (e) {
    console.error('Failed to save data:', e);
    return { success: false, error: e.message };
  }
};

// Get entry summary from new summarization module
export const getEntrySummary = (entryId) => {
  // First check if we have a cached summary
  const cachedSummary = getSummary(entryId);
  if (cachedSummary) {
    return Promise.resolve({ summary: cachedSummary });
  }
  
  // If no cached summary and AI is enabled, try to generate one
  if (isAIEnabled()) {
    const entry = state.entries.find(e => e.id === entryId);
    if (entry && entry.content) {
      return summarize(entryId, entry.content).then(summary => {
        return summary ? { summary } : null;
      });
    }
  }
  return Promise.resolve(null);
};

// Create DOM element for an entry
export const createEntryElement = (entry) => {
  const entryDiv = document.createElement('div');
  entryDiv.className = 'entry-card';
  entryDiv.dataset.entryId = entry.id;
  
  const header = document.createElement('div');
  header.className = 'entry-header';
  
  const title = document.createElement('h3');
  title.className = 'entry-title';
  title.textContent = entry.title;
  
  const date = document.createElement('span');
  date.className = 'entry-date';
  date.textContent = formatDate(entry.timestamp);
  
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.textContent = 'Edit';
  editBtn.onclick = () => enableEditMode(entryDiv, entry);
  
  header.appendChild(title);
  header.appendChild(date);
  header.appendChild(editBtn);
  
  const content = document.createElement('div');
  content.className = 'entry-content';
  content.innerHTML = parseMarkdown(entry.content);
  
  entryDiv.appendChild(header);
  entryDiv.appendChild(content);
  
  // Add collapsible summary section if available (async)
  if (isAIEnabled()) {
    getEntrySummary(entry.id).then(summary => {
      if (summary && summary.summary) {
        const summarySection = createSummarySection(summary.summary);
        entryDiv.appendChild(summarySection);
      }
    }).catch(error => {
      console.error('Failed to get entry summary:', error);
    });
  }
  
  return entryDiv;
};

// Create collapsible summary section
export const createSummarySection = (summary) => {
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'entry-summary';
  
  const summaryToggle = document.createElement('button');
  summaryToggle.className = 'entry-summary__toggle';
  summaryToggle.innerHTML = `
    <span class="entry-summary__label">Summary</span>
    <span class="entry-summary__icon">▼</span>
  `;
  
  const summaryContent = document.createElement('div');
  summaryContent.className = 'entry-summary__content';
  summaryContent.style.display = 'none';
  summaryContent.innerHTML = `<p>${summary}</p>`;
  
  summaryToggle.onclick = () => {
    const isExpanded = summaryContent.style.display !== 'none';
    summaryContent.style.display = isExpanded ? 'none' : 'block';
    summaryToggle.querySelector('.entry-summary__icon').textContent = isExpanded ? '▼' : '▲';
    summaryToggle.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
  };
  
  summaryDiv.appendChild(summaryToggle);
  summaryDiv.appendChild(summaryContent);
  
  return summaryDiv;
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
  
  // Focus on title input
  titleInput.focus();
};

// Save edit changes
export const saveEdit = (entryDiv, entry, newTitle, newContent) => {
  if (newTitle.trim() && newContent.trim()) {
    // Update entry in Yjs store (automatically syncs)
    updateEntryInStore(entry.id, {
      title: newTitle.trim(),
      content: newContent.trim()
    });
    
    // Update local state
    state.entries = getEntries();
    
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

// Create empty state element
export const createEmptyStateElement = () => {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.innerHTML = '<p>No journal entries yet. Start writing your adventure!</p>';
  return emptyDiv;
};

// Render all entries
export const renderEntries = () => {
  const entriesList = document.getElementById('entries-list');
  if (!entriesList) return;
  
  entriesList.innerHTML = '';
  
  if (state.entries.length === 0) {
    entriesList.appendChild(createEmptyStateElement());
    return;
  }
  
  const sortedEntries = sortEntriesByDate(state.entries);
  
  sortedEntries.forEach(entry => {
    const entryElement = createEntryElement(entry);
    entriesList.appendChild(entryElement);
  });
};

// Create entry from form data
export const createEntryFromForm = (formData) => ({
  id: generateId(),
  title: formData.title.trim(),
  content: formData.content.trim(),
  timestamp: Date.now()
});

// Get form data
export const getFormData = () => {
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  return {
    title: titleInput ? titleInput.value : '',
    content: contentTextarea ? contentTextarea.value : ''
  };
};

// Add new entry
export const addEntry = async () => {
  if (!dataStoreReady) {
    alert('Data store not ready, please wait...');
    return;
  }
  
  const formData = getFormData();
  
  if (!formData.title.trim() || !formData.content.trim()) {
    alert('Please fill in both title and content.');
    return;
  }
  
  const entry = createEntryFromForm(formData);
  
  if (isValidEntry(entry)) {
    // Add to Yjs store (automatically syncs)
    addEntryToStore(entry);
    
    // Update local state
    state.entries = getEntries();
    
    renderEntries();
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

// Create character summary
export const createCharacterSummary = (character) => {
  if (!character || !character.name) {
    return {
      name: 'No Character',
      details: 'Create a character to see details here.'
    };
  }
  
  const details = [];
  if (character.race) details.push(`Race: ${character.race}`);
  if (character.class) details.push(`Class: ${character.class}`);
  if (character.backstory) details.push(`Backstory: ${character.backstory}`);
  if (character.notes) details.push(`Notes: ${character.notes}`);
  
  return {
    name: character.name,
    details: details.join(' | ')
  };
};

// Create simplified character data for main page display
export const createSimpleCharacterData = (character) => {
  if (!character) {
    return {
      name: 'Unnamed Character',
      race: 'Unknown',
      class: 'Unknown'
    };
  }
  
  // Determine the display name - use 'Unnamed Character' if name is missing or just whitespace
  const displayName = (!character.name || character.name.trim() === '') 
    ? 'Unnamed Character' 
    : character.name.trim();
  
  return {
    name: displayName,
    race: character.race || 'Unknown',
    class: character.class || 'Unknown'
  };
};

// Display character summary - simplified
export const displayCharacterSummary = () => {
  const nameEl = document.getElementById('display-name');
  const raceEl = document.getElementById('display-race');
  const classEl = document.getElementById('display-class');
  
  if (!nameEl || !raceEl || !classEl) return;
  
  // Get current character data from Yjs store
  const characterToDisplay = dataStoreReady ? getCharacter() : state.character;
  
  const summary = createSimpleCharacterData(characterToDisplay);
  
  // Format for minimal display
  nameEl.textContent = summary.name;
  raceEl.textContent = summary.race === 'Unknown' ? '—' : summary.race;
  classEl.textContent = summary.class === 'Unknown' ? '—' : summary.class;
};

// Display AI prompt
export const displayAIPrompt = async () => {
  const aiPromptText = document.getElementById('ai-prompt-text');
  const aiPromptSection = document.getElementById('ai-prompt-section');
  if (!aiPromptText || !aiPromptSection) return;
  
  // Always show the section, but adjust content based on AI status
  aiPromptSection.style.display = 'block';
  
  if (!isAIEnabled()) {
    aiPromptText.innerHTML = '<p class="ai-prompt__empty-state">Enable AI features in Settings to get personalized reflection prompts for your journal sessions.</p>';
    return;
  }
  
  try {
    const prompt = await generateIntrospectionPrompt(state.character, state.entries);
    if (prompt) {
      aiPromptText.innerHTML = formatAIPrompt(prompt);
    } else {
      aiPromptText.innerHTML = '<p class="ai-prompt__empty-state">Write some journal entries to get personalized reflection prompts.</p>';
    }
  } catch (error) {
    console.error('Failed to generate AI prompt:', error);
    aiPromptText.innerHTML = '<p class="ai-prompt__error-state">Unable to generate AI prompt at this time. Please check your settings and try again.</p>';
  }
};

// Regenerate AI prompt
export const regenerateAIPrompt = async () => {
  const aiPromptText = document.getElementById('ai-prompt-text');
  const regenerateBtn = document.getElementById('regenerate-prompt-btn');
  
  if (!aiPromptText || !regenerateBtn) return;
  
  try {
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = 'Generating...';
    
    const prompt = await generateIntrospectionPrompt(state.character, state.entries);
    
    if (prompt) {
      aiPromptText.innerHTML = formatAIPrompt(prompt);
    }
  } catch (error) {
    console.error('Failed to regenerate AI prompt:', error);
  } finally {
    regenerateBtn.disabled = false;
    regenerateBtn.textContent = 'Regenerate';
  }
};

// Format AI prompt for display
export const formatAIPrompt = (prompt) => {
  return prompt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('');
};

// Setup event handlers
export const setupEventHandlers = () => {
  const addEntryBtn = document.getElementById('add-entry-btn');
  if (addEntryBtn) {
    addEntryBtn.addEventListener('click', () => {
      addEntry().catch(error => {
        console.error('Failed to add entry:', error);
      });
    });
  }
  
  const regeneratePromptBtn = document.getElementById('regenerate-prompt-btn');
  if (regeneratePromptBtn) {
    regeneratePromptBtn.addEventListener('click', regenerateAIPrompt);
  }
  

  
  // Enter key to add entry
  const titleInput = document.getElementById('entry-title');
  const contentTextarea = document.getElementById('entry-content');
  
  const handleEnterKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addEntry().catch(error => {
        console.error('Failed to add entry:', error);
      });
    }
  };
  
  if (titleInput) titleInput.addEventListener('keydown', handleEnterKey);
  if (contentTextarea) contentTextarea.addEventListener('keydown', handleEnterKey);
};



// Update sync status indicator
const updateSyncStatus = (status, text, title = '') => {
  const statusElement = document.getElementById('sync-status');
  const dotElement = document.getElementById('sync-dot');
  const textElement = document.getElementById('sync-text');
  
  if (!statusElement || !dotElement || !textElement) return;
  
  // Show status indicator
  statusElement.style.display = 'flex';
  statusElement.title = title;
  
  // Remove all status classes
  dotElement.className = 'sync-dot';
  
  // Add current status class
  dotElement.classList.add(status);
  textElement.textContent = text;
  
  console.log(`Sync status: ${status} - ${text}`);
};

// Setup sync listener for real-time updates
export const setupSyncListener = () => {
  if (!dataStoreReady) {
    updateSyncStatus('local-only', 'Local only', 'Data is only stored locally');
    return;
  }
  
  // Initial status
  updateSyncStatus('connecting', 'Connecting...', 'Attempting to connect to sync server');
  
  // Monitor sync status
  const checkSyncStatus = () => {
    const status = getSyncStatus();
    if (status.connected) {
      updateSyncStatus('connected', 'Synced', `Connected to ${status.connectedCount}/${status.totalProviders} sync servers`);
    } else {
      updateSyncStatus('disconnected', 'Offline', 'Not connected to sync servers - data stored locally');
    }
  };
  
  // Check status periodically
  setInterval(checkSyncStatus, 5000);
  checkSyncStatus(); // Initial check
  
  // Listen for data changes
  onDataChange((event, data) => {
    console.log('Data store event:', event, data);
    
    if (event === 'journal-changed') {
      // Refresh local state from Yjs store
      const journalData = getJournal();
      state = journalData;
      
      renderEntries();
      displayCharacterSummary();
      
      updateSyncStatus('connected', 'Sync updated', 'Data synchronized from another device');
      setTimeout(() => checkSyncStatus(), 2000);
    }
    
    if (event === 'sync-status') {
      checkSyncStatus();
    }
  });
};



// Function to trigger sync update (called from character module and other modules)
export const triggerSyncUpdate = () => {
  if (!dataStoreReady) {
    console.warn('Data store not ready for sync update');
    return;
  }
  
  // Refresh local state from Yjs store
  const journalData = getJournal();
  state = journalData;
  
  console.log('Sync update triggered - state refreshed from Yjs store');
};

// Initialize app
export const init = async () => {
  try {
    // Load data from Yjs store (with migration if needed)
    await loadData();
    
    renderEntries();
    displayCharacterSummary();
    setupEventHandlers();
    setupSyncListener();
    
    // Make sync trigger available globally for character module
    if (typeof window !== 'undefined') {
      window.triggerSyncUpdate = triggerSyncUpdate;
    }
    
    // Initialize summarization
    try {
      await runAutoSummarization();
    } catch (error) {
      console.error('Failed to initialize summarization:', error);
    }
    
    // Display AI prompt
    await displayAIPrompt();
    
    console.log('App initialized successfully');
    
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
  const initialState = createInitialJournalState();
  state = { ...initialState };
  // Force update all properties
  state.character = { ...initialState.character };
  state.entries = [...initialState.entries];
  // Update global state reference for tests
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};

// Reset sync cache (for testing)
export const resetSyncCache = () => {
  yjsSync = null;
  resetSyncState();
};

// Export state for testing
export { state };

// Start when DOM is ready (only in browser environment, not in tests)
if (typeof document !== 'undefined' && document.addEventListener && 
    !(typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test')) {
  document.addEventListener('DOMContentLoaded', init);
}

// Export for testing (backward compatibility)
if (typeof global !== 'undefined') {
  global.loadData = loadData;
  global.saveData = saveData;
  global.state = state;
  global.resetState = resetState;
}