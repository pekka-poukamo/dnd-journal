// Character UI - Simple re-render approach
// Just render everything fresh on changes

import { parseMarkdown } from './utils.js';

// Simple state for edit mode
let editingCharacter = false;
let editData = { name: '', race: '', class: '', backstory: '', notes: '' };

// Callback for triggering UI updates
let uiUpdateCallback = null;

// Set the UI update callback (called by app.js)
export const setCharacterUIUpdateCallback = (callback) => {
  uiUpdateCallback = callback;
};

// Trigger UI update if callback is available
const triggerUIUpdate = () => {
  if (uiUpdateCallback) {
    uiUpdateCallback();
  }
};

// Create character HTML (view mode)
const createCharacterViewHTML = (character) => {
  const hasData = Boolean(
    character.name?.trim() ||
    character.race?.trim() ||
    character.class?.trim() ||
    character.backstory?.trim() ||
    character.notes?.trim()
  );

  if (!hasData) {
    return `
      <div class="character-summary empty">
        <div class="character-header">
          <h2 class="character-name">No Character</h2>
          <button class="edit-btn" data-action="edit-character" title="Create character">✏️</button>
        </div>
        <p class="character-details">Create a character to see their details here.</p>
      </div>
    `;
  }

  const displayName = character.name?.trim() || 'Unnamed Character';
  const details = [];
  if (character.race?.trim()) details.push(character.race.trim());
  if (character.class?.trim()) details.push(character.class.trim());
  
  return `
    <div class="character-summary">
      <div class="character-header">
        <h2 class="character-name">${displayName}</h2>
        <button class="edit-btn" data-action="edit-character" title="Edit character">✏️</button>
      </div>
      <div class="character-basic">
        <span id="display-name">${displayName}</span>
        <span id="display-race">${character.race?.trim() || '—'}</span>
        <span id="display-class">${character.class?.trim() || '—'}</span>
      </div>
      ${character.backstory?.trim() ? `<div class="character-backstory">${parseMarkdown(character.backstory)}</div>` : ''}
      ${character.notes?.trim() ? `<div class="character-notes">${parseMarkdown(character.notes)}</div>` : ''}
      ${details.length > 0 ? `<p class="character-details">${details.join(', ')}</p>` : ''}
    </div>
  `;
};

// Create character HTML (edit mode)
const createCharacterEditHTML = (character) => `
  <div class="character-summary character-editing">
    <div class="edit-form">
      <input type="text" class="edit-name-input" value="${character.name || ''}" placeholder="Character name">
      <input type="text" class="edit-race-input" value="${character.race || ''}" placeholder="Race">
      <input type="text" class="edit-class-input" value="${character.class || ''}" placeholder="Class">
      <textarea class="edit-backstory-textarea" placeholder="Character backstory">${character.backstory || ''}</textarea>
      <textarea class="edit-notes-textarea" placeholder="Character notes">${character.notes || ''}</textarea>
      <div class="edit-actions">
        <button data-action="save-character">Save</button>
        <button data-action="cancel-character">Cancel</button>
      </div>
    </div>
  </div>
`;

// Render character (simple approach)
export const renderCharacter = (character = {}) => {
  const container = document.getElementById('character-summary') || document.querySelector('.character-summary');
  if (!container) {
    console.warn('Character container not found');
    return;
  }

  // If editing, render edit form
  if (editingCharacter) {
    // Use current edit data or character data
    const characterToEdit = {
      name: editData.name || character.name || '',
      race: editData.race || character.race || '',
      class: editData.class || character.class || '',
      backstory: editData.backstory || character.backstory || '',
      notes: editData.notes || character.notes || ''
    };
    container.outerHTML = createCharacterEditHTML(characterToEdit);
    
    // Set up event listeners using event delegation
    setupCharacterEventListeners();
    
    // Focus first field and setup input handlers
    const nameInput = document.querySelector('.edit-name-input');
    if (nameInput) {
      nameInput.focus();
      // Update edit data when inputs change
      nameInput.oninput = (e) => editData.name = e.target.value;
      document.querySelector('.edit-race-input').oninput = (e) => editData.race = e.target.value;
      document.querySelector('.edit-class-input').oninput = (e) => editData.class = e.target.value;
      document.querySelector('.edit-backstory-textarea').oninput = (e) => editData.backstory = e.target.value;
      document.querySelector('.edit-notes-textarea').oninput = (e) => editData.notes = e.target.value;
    }
  } else {
    // Otherwise render normal view
    container.outerHTML = createCharacterViewHTML(character);
    setupCharacterEventListeners();
  }
};

// Set up event listeners for character actions
const setupCharacterEventListeners = () => {
  const characterContainer = document.querySelector('.character-summary');
  if (characterContainer) {
    characterContainer.removeEventListener('click', handleCharacterAction);
    characterContainer.addEventListener('click', handleCharacterAction);
  }
};

// Handle character actions via event delegation
const handleCharacterAction = (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  
  event.preventDefault();
  
  switch (action) {
    case 'edit-character':
      startCharacterEdit();
      break;
    case 'save-character':
      saveCharacterEdit();
      break;
    case 'cancel-character':
      cancelCharacterEdit();
      break;
  }
};

// Start editing character
export const startCharacterEdit = () => {
  editingCharacter = true;
  editData = { name: '', race: '', class: '', backstory: '', notes: '' }; // Reset edit data
  triggerUIUpdate();
};

// Save character edit
export const saveCharacterEdit = () => {
  const nameInput = document.querySelector('.edit-name-input');
  const raceInput = document.querySelector('.edit-race-input');
  const classInput = document.querySelector('.edit-class-input');
  const backstoryInput = document.querySelector('.edit-backstory-textarea');
  const notesInput = document.querySelector('.edit-notes-textarea');
  
  if (!nameInput || !raceInput || !classInput || !backstoryInput || !notesInput) return;
  
  const newName = nameInput.value.trim();
  const newRace = raceInput.value.trim();
  const newClass = classInput.value.trim();
  const newBackstory = backstoryInput.value.trim();
  const newNotes = notesInput.value.trim();

  // Import and update character data directly in YJS
  import('./yjs-direct.js').then(({ saveCharacter }) => {
    saveCharacter({
      name: newName,
      race: newRace,
      class: newClass,
      backstory: newBackstory,
      notes: newNotes
    });
  });
  
  // Exit edit mode
  editingCharacter = false;
  editData = { name: '', race: '', class: '', backstory: '', notes: '' };
};

// Cancel character edit
export const cancelCharacterEdit = () => {
  editingCharacter = false;
  editData = { name: '', race: '', class: '', backstory: '', notes: '' };
  triggerUIUpdate();
};

// Export for compatibility
export { 
  renderCharacter as displayCharacterSummary,
  startCharacterEdit,
  saveCharacterEdit,
  cancelCharacterEdit
};