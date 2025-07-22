// js/pages/Journal.js - Functional journal editor

import { getStorage } from '../utils/storage.js';
import { debounce } from '../utils/dom.js';
import { showSuccess, showError } from '../utils/notifications.js';
import { parseTags, formatTags, getWordCount } from '../utils/formatters.js';

// Pure functions for form data processing
const parseFormData = (form) => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const editorContent = document.getElementById('editor').innerHTML;
  
  return {
    title: data.title.trim() || 'Untitled Entry',
    content: editorContent,
    type: data.type,
    tags: parseTags(data.tags || ''),
    characterId: data.characterId || null,
    date: new Date().toISOString().split('T')[0]
  };
};

// Pure functions for editor commands
const formatText = (command) => () => {
  document.execCommand(command, false, null);
  document.getElementById('editor').focus();
  updateWordCount();
};

const createToolbarHandlers = () => ({
  bold: formatText('bold'),
  italic: formatText('italic'),
  heading: () => {
    document.execCommand('formatBlock', false, '<h3>');
    document.getElementById('editor').focus();
    updateWordCount();
  },
  list: () => {
    document.execCommand('insertUnorderedList', false, null);
    document.getElementById('editor').focus();
    updateWordCount();
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
const saveEntry = (entryData, currentEntryId = null, isDraft = false) => {
  const validation = validateEntry(entryData);
  
  if (!validation.isValid && !isDraft) {
    return { success: false, errors: validation.errors };
  }
  
  const entry = {
    ...entryData,
    id: currentEntryId || undefined,
    isDraft: isDraft
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
  document.getElementById('tags').value = formatTags(entry.tags);
  document.getElementById('character-select').value = entry.characterId || '';
  document.getElementById('editor').innerHTML = entry.content;
  
  updateWordCount();
};

const loadCharacterOptions = () => {
  const storage = getStorage();
  const characters = storage.getAllCharacters();
  const select = document.getElementById('character-select');
  
  select.innerHTML = '<option value="">Select Character (Optional)</option>';
  
  characters.forEach(character => {
    const option = document.createElement('option');
    option.value = character.id;
    option.textContent = character.name;
    
    const settings = storage.getSettings();
    if (character.id === settings.currentCharacter) {
      option.selected = true;
    }
    
    select.appendChild(option);
  });
};

// Word count functionality
const updateWordCount = () => {
  const editor = document.getElementById('editor');
  const wordCountElement = document.getElementById('word-count');
  
  if (editor && wordCountElement) {
    const count = getWordCount(editor.innerHTML);
    wordCountElement.textContent = `${count} words`;
  }
};

// Auto-save functionality
const createAutoSave = (getCurrentEntry) => {
  let hasChanges = false;
  let saveTimeout = null;
  
  const markChanged = () => { 
    hasChanges = true;
    const statusElement = document.getElementById('auto-save-status');
    if (statusElement) {
      statusElement.textContent = 'Unsaved changes';
      statusElement.className = 'editor-status saving';
    }
  };
  
  const markSaved = () => { 
    hasChanges = false;
    const statusElement = document.getElementById('auto-save-status');
    if (statusElement) {
      statusElement.textContent = 'Draft saved';
      statusElement.className = 'editor-status';
      
      // Clear status after a few seconds
      setTimeout(() => {
        if (statusElement.textContent === 'Draft saved') {
          statusElement.textContent = '';
        }
      }, 2000);
    }
  };
  
  const markError = () => {
    const statusElement = document.getElementById('auto-save-status');
    if (statusElement) {
      statusElement.textContent = 'Save failed';
      statusElement.className = 'editor-status error';
    }
  };
  
  const autoSave = debounce(() => {
    if (hasChanges) {
      const form = document.getElementById('entry-form');
      const entryData = parseFormData(form);
      const currentEntry = getCurrentEntry();
      
      const result = saveEntry(entryData, currentEntry?.id, true);
      
      if (result.success) {
        markSaved();
        // Update current entry if this was a new entry
        if (!currentEntry && result.data) {
          window.history.replaceState(null, '', `journal.html?id=${result.data.id}`);
        }
      } else {
        markError();
      }
    }
  }, 2000);
  
  return { markChanged, autoSave };
};

// Link modal functionality
const setupLinkModal = () => {
  const linkBtn = document.getElementById('link-btn');
  const linkModal = document.getElementById('link-modal');
  const closeLinkModal = document.getElementById('close-link-modal');
  const insertLink = document.getElementById('insert-link');
  const cancelLink = document.getElementById('cancel-link');
  
  let selectedText = '';
  
  const openLinkModal = () => {
    const selection = window.getSelection();
    selectedText = selection.toString();
    
    document.getElementById('link-text').value = selectedText;
    document.getElementById('link-url').value = '';
    
    linkModal.classList.remove('hidden');
    document.getElementById('link-text').focus();
  };
  
  const closeLinkModalFn = () => {
    linkModal.classList.add('hidden');
    document.getElementById('editor').focus();
  };
  
  const insertLinkFn = () => {
    const linkText = document.getElementById('link-text').value.trim();
    const linkUrl = document.getElementById('link-url').value.trim();
    
    if (!linkText || !linkUrl) {
      showError('Please enter both link text and URL');
      return;
    }
    
    const link = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
    document.execCommand('insertHTML', false, link);
    
    closeLinkModalFn();
    updateWordCount();
  };
  
  linkBtn.addEventListener('click', openLinkModal);
  closeLinkModal.addEventListener('click', closeLinkModalFn);
  insertLink.addEventListener('click', insertLinkFn);
  cancelLink.addEventListener('click', closeLinkModalFn);
  
  // Close on overlay click
  linkModal.addEventListener('click', (e) => {
    if (e.target === linkModal || e.target.classList.contains('modal-overlay')) {
      closeLinkModalFn();
    }
  });
};

// Image modal functionality
const setupImageModal = () => {
  const imageBtn = document.getElementById('image-btn');
  const imageModal = document.getElementById('image-modal');
  const closeImageModal = document.getElementById('close-image-modal');
  const insertImage = document.getElementById('insert-image');
  const cancelImage = document.getElementById('cancel-image');
  
  const openImageModal = () => {
    document.getElementById('image-url').value = '';
    document.getElementById('image-alt').value = '';
    
    imageModal.classList.remove('hidden');
    document.getElementById('image-url').focus();
  };
  
  const closeImageModalFn = () => {
    imageModal.classList.add('hidden');
    document.getElementById('editor').focus();
  };
  
  const insertImageFn = () => {
    const imageUrl = document.getElementById('image-url').value.trim();
    const imageAlt = document.getElementById('image-alt').value.trim();
    
    if (!imageUrl) {
      showError('Please enter an image URL');
      return;
    }
    
    const img = `<img src="${imageUrl}" alt="${imageAlt}" />`;
    document.execCommand('insertHTML', false, img);
    
    closeImageModalFn();
    updateWordCount();
  };
  
  imageBtn.addEventListener('click', openImageModal);
  closeImageModal.addEventListener('click', closeImageModalFn);
  insertImage.addEventListener('click', insertImageFn);
  cancelImage.addEventListener('click', closeImageModalFn);
  
  // Close on overlay click
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal || e.target.classList.contains('modal-overlay')) {
      closeImageModalFn();
    }
  });
};

// Main initialization
const initJournalEditor = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const entryId = urlParams.get('id');
  
  let currentEntry = null;
  
  // Load existing entry if editing
  if (entryId) {
    const storage = getStorage();
    currentEntry = storage.getEntry(entryId);
    if (currentEntry) {
      populateForm(currentEntry);
      document.getElementById('page-title').textContent = 'Edit Entry';
    }
  }
  
  // Load character options
  loadCharacterOptions();
  
  // Setup toolbar handlers
  const toolbarHandlers = createToolbarHandlers();
  document.getElementById('bold-btn').addEventListener('click', toolbarHandlers.bold);
  document.getElementById('italic-btn').addEventListener('click', toolbarHandlers.italic);
  document.getElementById('heading-btn').addEventListener('click', toolbarHandlers.heading);
  document.getElementById('list-btn').addEventListener('click', toolbarHandlers.list);
  
  // Setup modals
  setupLinkModal();
  setupImageModal();
  
  // Setup auto-save
  const { markChanged, autoSave } = createAutoSave(() => currentEntry);
  
  const storage = getStorage();
  const settings = storage.getSettings();
  
  if (settings.preferences?.autoSave !== false) {
    document.getElementById('editor').addEventListener('input', () => {
      markChanged();
      autoSave();
      updateWordCount();
    });
    
    // Track changes in other fields too
    ['title', 'type', 'character-select', 'tags'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => {
          markChanged();
          autoSave();
        });
      }
    });
  }
  
  // Setup save draft button
  document.getElementById('save-draft').addEventListener('click', () => {
    const form = document.getElementById('entry-form');
    const entryData = parseFormData(form);
    const result = saveEntry(entryData, currentEntry?.id, true);
    
    if (result.success) {
      showSuccess('Draft saved successfully!');
      if (!currentEntry && result.data) {
        currentEntry = result.data;
        window.history.replaceState(null, '', `journal.html?id=${result.data.id}`);
      }
    } else {
      showError('Failed to save draft: ' + (result.errors || [result.error]).join(', '));
    }
  });
  
  // Setup form submission
  document.getElementById('entry-form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    const entryData = parseFormData(event.target);
    const result = saveEntry(entryData, currentEntry?.id, false);
    
    if (result.success) {
      showSuccess('Entry published successfully!');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } else {
      showError('Failed to publish: ' + result.errors.join(', '));
    }
  });
  
  // Setup keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      document.getElementById('save-draft').click();
    }
    
    if (e.key === 'Escape') {
      // Close any open modals
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });
    }
  });
  
  // Initial word count
  updateWordCount();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initJournalEditor);

export { initJournalEditor };