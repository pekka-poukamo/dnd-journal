// js/pages/Character.js - Character management functionality

import { getStorage } from '../utils/storage.js';
import { createCharacterCard, createEmptyState } from '../components/Cards.js';
import { query, replaceContent, show, hide, getFormData, setFormData } from '../utils/dom.js';
import { showSuccess, showError } from '../utils/notifications.js';
import { formatCharacterSummary, createPreview } from '../utils/formatters.js';

// Pure functions for character data processing
const parseCharacterFormData = (form) => {
  const formData = getFormData(form);
  return {
    name: formData.name.trim(),
    level: parseInt(formData.level) || 1,
    race: formData.race,
    class: formData.class,
    traits: formData.traits.trim(),
    backstory: formData.backstory.trim()
  };
};

// Pure function for character validation
const validateCharacter = (character) => {
  const errors = [];
  
  if (!character.name.trim()) {
    errors.push('Character name is required');
  }
  
  if (character.level < 1 || character.level > 20) {
    errors.push('Level must be between 1 and 20');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Pure functions for sorting and filtering
const sortCharacters = (characters, sortBy) => {
  const sorted = [...characters];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'level':
      return sorted.sort((a, b) => b.level - a.level);
    case 'created':
      return sorted.sort((a, b) => b.created - a.created);
    default:
      return sorted;
  }
};

const filterCharactersByClass = (characters, classFilter) => {
  if (!classFilter) return characters;
  return characters.filter(character => character.class === classFilter);
};

// Pure function for getting unique classes
const getUniqueClasses = (characters) => {
  const classes = characters
    .map(char => char.class)
    .filter(cls => cls && cls.trim() !== '');
  return [...new Set(classes)].sort();
};

// State management
let currentEditingCharacter = null;

// Character list rendering
const renderCharacterList = (characters, container) => {
  if (!container) return;
  
  if (characters.length === 0) {
    const emptyState = createEmptyState(
      'No characters created yet. Create your first character to get started!',
      'Create Character',
      null
    );
    replaceContent(container, emptyState);
    return;
  }
  
  const characterCards = characters.map(character => {
    const card = createCharacterCard(character);
    
    // Add edit functionality
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      editCharacter(character);
    });
    
    return card;
  });
  
  replaceContent(container, ...characterCards);
};

// Filter options rendering
const renderFilterOptions = () => {
  const storage = getStorage();
  const characters = storage.getAllCharacters();
  const uniqueClasses = getUniqueClasses(characters);
  const filterSelect = query('#filter-class');
  
  if (!filterSelect) return;
  
  filterSelect.innerHTML = '<option value="">All Classes</option>';
  
  uniqueClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    filterSelect.appendChild(option);
  });
};

// Character form management
const showCharacterForm = (character = null) => {
  const formSection = query('#character-form-section');
  const formTitle = query('#form-title');
  const deleteButton = query('#delete-character');
  const form = query('#character-form');
  
  if (!formSection || !form) return;
  
  currentEditingCharacter = character;
  
  if (character) {
    formTitle.textContent = 'Edit Character';
    setFormData(form, character);
    show(deleteButton);
  } else {
    formTitle.textContent = 'Create New Character';
    form.reset();
    hide(deleteButton);
  }
  
  show(formSection);
  query('#character-name').focus();
};

const hideCharacterForm = () => {
  const formSection = query('#character-form-section');
  if (formSection) {
    hide(formSection);
  }
  currentEditingCharacter = null;
};

const editCharacter = (character) => {
  showCharacterForm(character);
  // Scroll to form
  query('#character-form-section').scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
};

// Character operations
const saveCharacter = (characterData) => {
  const validation = validateCharacter(characterData);
  
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  const storage = getStorage();
  
  if (currentEditingCharacter) {
    return storage.updateCharacter(currentEditingCharacter.id, characterData);
  } else {
    return storage.saveCharacter(characterData);
  }
};

const deleteCharacter = (characterId) => {
  const storage = getStorage();
  return storage.deleteCharacter(characterId);
};

const setCurrentCharacter = (characterId) => {
  const storage = getStorage();
  return storage.updateSettings({ currentCharacter: characterId });
};

// Delete modal management
const showDeleteModal = (character) => {
  const modal = query('#delete-modal');
  const characterName = query('#delete-character-name');
  
  if (modal && characterName) {
    characterName.textContent = character.name;
    show(modal);
  }
};

const hideDeleteModal = () => {
  const modal = query('#delete-modal');
  if (modal) {
    hide(modal);
  }
};

// Main character list refresh
const refreshCharacterList = () => {
  const storage = getStorage();
  const characters = storage.getAllCharacters();
  const sortBy = query('#sort-characters').value;
  const classFilter = query('#filter-class').value;
  
  const filtered = filterCharactersByClass(characters, classFilter);
  const sorted = sortCharacters(filtered, sortBy);
  
  const container = query('#characters-list');
  renderCharacterList(sorted, container);
  renderFilterOptions();
};

// Event handlers
const setupEventHandlers = () => {
  // New character button
  const newCharacterBtn = query('#new-character-btn');
  if (newCharacterBtn) {
    newCharacterBtn.addEventListener('click', () => showCharacterForm());
  }
  
  // Cancel form button
  const cancelFormBtn = query('#cancel-form');
  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', hideCharacterForm);
  }
  
  // Character form submission
  const characterForm = query('#character-form');
  if (characterForm) {
    characterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const characterData = parseCharacterFormData(e.target);
      const result = saveCharacter(characterData);
      
      if (result.success) {
        showSuccess(`Character ${currentEditingCharacter ? 'updated' : 'created'} successfully!`);
        hideCharacterForm();
        refreshCharacterList();
      } else {
        showError('Failed to save character: ' + result.errors.join(', '));
      }
    });
  }
  
  // Set current character button
  const setCurrentBtn = query('#set-current');
  if (setCurrentBtn) {
    setCurrentBtn.addEventListener('click', () => {
      if (currentEditingCharacter) {
        const result = setCurrentCharacter(currentEditingCharacter.id);
        if (result.success) {
          showSuccess(`${currentEditingCharacter.name} set as current character!`);
        } else {
          showError('Failed to set current character');
        }
      }
    });
  }
  
  // Delete character button
  const deleteCharacterBtn = query('#delete-character');
  if (deleteCharacterBtn) {
    deleteCharacterBtn.addEventListener('click', () => {
      if (currentEditingCharacter) {
        showDeleteModal(currentEditingCharacter);
      }
    });
  }
  
  // Delete modal handlers
  const closeDeleteModalBtn = query('#close-delete-modal');
  const cancelDeleteBtn = query('#cancel-delete');
  const confirmDeleteBtn = query('#confirm-delete');
  
  if (closeDeleteModalBtn) {
    closeDeleteModalBtn.addEventListener('click', hideDeleteModal);
  }
  
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (currentEditingCharacter) {
        const result = deleteCharacter(currentEditingCharacter.id);
        
        if (result.success) {
          showSuccess('Character deleted successfully!');
          hideDeleteModal();
          hideCharacterForm();
          refreshCharacterList();
        } else {
          showError('Failed to delete character: ' + result.error);
        }
      }
    });
  }
  
  // Sort and filter handlers
  const sortSelect = query('#sort-characters');
  const filterSelect = query('#filter-class');
  
  if (sortSelect) {
    sortSelect.addEventListener('change', refreshCharacterList);
  }
  
  if (filterSelect) {
    filterSelect.addEventListener('change', refreshCharacterList);
  }
  
  // Modal overlay clicks
  const deleteModal = query('#delete-modal');
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal || e.target.classList.contains('modal-overlay')) {
        hideDeleteModal();
      }
    });
  }
  
  // Keyboard handlers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideDeleteModal();
      if (!query('#delete-modal').classList.contains('hidden')) {
        return; // Don't hide form if modal is open
      }
      hideCharacterForm();
    }
  });
};

// URL parameter handling for direct character editing
const handleUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const characterId = urlParams.get('id');
  
  if (characterId) {
    const storage = getStorage();
    const character = storage.getCharacter(characterId);
    
    if (character) {
      editCharacter(character);
    } else {
      showError('Character not found');
      window.history.replaceState(null, '', 'character.html');
    }
  }
};

// Main initialization
const initCharacterManagement = () => {
  refreshCharacterList();
  setupEventHandlers();
  handleUrlParams();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCharacterManagement);

export { initCharacterManagement, refreshCharacterList };