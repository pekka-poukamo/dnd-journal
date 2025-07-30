// Form Utilities - Simple form handling functions
// Following radical simplicity principles

import { getElementValue, setElementValue } from './dom-utils.js';

// Simple form data extraction
export const getFormData = (fieldIds) => {
  const data = {};
  fieldIds.forEach(fieldId => {
    const value = getElementValue(fieldId);
    // Convert field ID to property name (e.g., 'entry-title' -> 'title')
    const propertyName = fieldId.includes('-') ? fieldId.split('-').pop() : fieldId;
    data[propertyName] = value.trim();
  });
  return data;
};

// Simple form clearing
export const clearFormFields = (fieldIds) => {
  fieldIds.forEach(fieldId => setElementValue(fieldId, ''));
};

// Simple form population
export const populateFormFields = (fieldMapping) => {
  Object.entries(fieldMapping).forEach(([fieldId, value]) => {
    setElementValue(fieldId, value || '');
  });
};

// Simple validation
export const validateFormData = (formData, requiredFields = []) => {
  const missing = requiredFields.filter(field => 
    !formData[field] || formData[field].trim() === ''
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return formData;
};

// Entry form helpers
export const getEntryFormData = () => {
  return getFormData(['entry-title', 'entry-content']);
};

export const clearEntryForm = () => {
  clearFormFields(['entry-title', 'entry-content']);
};

export const validateEntryData = (entryData) => {
  return validateFormData(entryData, ['title', 'content']);
};

// Character form helpers
export const getCharacterFormData = () => {
  return getFormData([
    'character-name',
    'character-race', 
    'character-class',
    'character-backstory',
    'character-notes'
  ]);
};

export const populateCharacterForm = (characterData) => {
  const fieldMapping = {
    'character-name': characterData.name,
    'character-race': characterData.race,
    'character-class': characterData.class,
    'character-backstory': characterData.backstory,
    'character-notes': characterData.notes
  };
  populateFormFields(fieldMapping);
};

export const validateCharacterData = (characterData) => {
  // Character validation is lenient - no required fields
  return characterData;
};