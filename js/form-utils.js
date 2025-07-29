// Form Utilities - Common form handling functions
// Following functional programming principles and style guide

import { safeDomOperation, validateRequired, createSuccess, createError } from './error-handling.js';
import { getElementValue, setElementValue } from './dom-utils.js';

// Pure function to get form data from multiple fields
export const getFormData = (fieldIds) => {
  return safeDomOperation(() => {
    const data = {};
    fieldIds.forEach(fieldId => {
      const result = getElementValue(fieldId);
      if (result.success) {
        // Convert field ID to property name (e.g., 'entry-title' -> 'title')
        const propertyName = fieldId.includes('-') 
          ? fieldId.split('-').pop() 
          : fieldId;
        data[propertyName] = result.data.trim();
      }
    });
    return data;
  }, 'getFormData');
};

// Pure function to clear form fields
export const clearFormFields = (fieldIds) => {
  return safeDomOperation(() => {
    const results = fieldIds.map(fieldId => setElementValue(fieldId, ''));
    const failures = results.filter(result => !result.success);
    
    if (failures.length > 0) {
      throw new Error(`Failed to clear ${failures.length} fields`);
    }
    
    return results;
  }, 'clearFormFields');
};

// Pure function to populate form fields with data
export const populateFormFields = (fieldMapping) => {
  return safeDomOperation(() => {
    const results = Object.entries(fieldMapping).map(([fieldId, value]) => 
      setElementValue(fieldId, value || '')
    );
    
    const failures = results.filter(result => !result.success);
    
    if (failures.length > 0) {
      throw new Error(`Failed to populate ${failures.length} fields`);
    }
    
    return results;
  }, 'populateFormFields');
};

// Pure function to validate form data
export const validateFormData = (formData, requiredFields = []) => {
  // Check for required fields
  const requiredValidation = validateRequired(formData, requiredFields);
  if (!requiredValidation.success) {
    return requiredValidation;
  }
  
  // Additional validation can be added here
  return createSuccess(formData);
};

// Pure function to get entry form data (specific to journal entries)
export const getEntryFormData = () => {
  const fieldIds = ['entry-title', 'entry-content'];
  return getFormData(fieldIds);
};

// Pure function to clear entry form (specific to journal entries)
export const clearEntryForm = () => {
  const fieldIds = ['entry-title', 'entry-content'];
  return clearFormFields(fieldIds);
};

// Pure function to get character form data (specific to character data)
export const getCharacterFormData = () => {
  const fieldIds = [
    'character-name',
    'character-race', 
    'character-class',
    'character-backstory',
    'character-notes'
  ];
  return getFormData(fieldIds);
};

// Pure function to populate character form (specific to character data)
export const populateCharacterForm = (characterData) => {
  const fieldMapping = {
    'character-name': characterData.name,
    'character-race': characterData.race,
    'character-class': characterData.class,
    'character-backstory': characterData.backstory,
    'character-notes': characterData.notes
  };
  return populateFormFields(fieldMapping);
};

// Pure function to validate entry data
export const validateEntryData = (entryData) => {
  return validateFormData(entryData, ['title', 'content']);
};

// Pure function to validate character data
export const validateCharacterData = (characterData) => {
  // Character validation is more lenient - no required fields
  return createSuccess(characterData);
};

// Pure function to create form field configuration
export const createFieldConfig = (id, type = 'text', required = false, placeholder = '') => ({
  id,
  type,
  required,
  placeholder
});

// Pure function to handle form submission with validation
export const handleFormSubmission = (getDataFn, validateFn, onSuccess, onError) => {
  return safeDomOperation(() => {
    const dataResult = getDataFn();
    if (!dataResult.success) {
      if (onError) onError(dataResult.error);
      return dataResult;
    }
    
    const validationResult = validateFn(dataResult.data);
    if (!validationResult.success) {
      if (onError) onError(validationResult.error);
      return validationResult;
    }
    
    if (onSuccess) {
      const successResult = onSuccess(validationResult.data);
      return successResult || createSuccess(validationResult.data);
    }
    
    return validationResult;
  }, 'handleFormSubmission');
};