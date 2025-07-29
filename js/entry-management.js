// Entry Management - CRUD operations for journal entries
// Following functional programming principles and style guide

import { generateId, isValidEntry } from './utils.js';
import { handleError, createSuccess, createError, validateRequired } from './error-handling.js';
import { getEntryFormData, clearEntryForm, validateEntryData } from './form-utils.js';
import { getSystem } from './yjs.js';

// Pure function to create entry object
export const createEntryObject = (title, content) => ({
  id: generateId(),
  title: title.trim(),
  content: content.trim(),
  timestamp: Date.now()
});

// Pure function to add entry to YJS system
export const addEntryToSystem = (entry) => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.journalMap) {
      return createError('YJS system not available');
    }

    let entriesArray = yjsSystem.journalMap.get('entries');
    if (!entriesArray) {
      entriesArray = yjsSystem.ydoc.getArray('entriesArray');
      yjsSystem.journalMap.set('entries', entriesArray);
    }

    const entryMap = yjsSystem.ydoc.getMap();
    entryMap.set('id', entry.id);
    entryMap.set('title', entry.title);
    entryMap.set('content', entry.content);
    entryMap.set('timestamp', entry.timestamp);

    entriesArray.push([entryMap]);
    yjsSystem.journalMap.set('lastModified', Date.now());

    return createSuccess(entry);
  } catch (error) {
    return handleError('addEntryToSystem', error);
  }
};

// Pure function to update entry in YJS system
export const updateEntryInSystem = (entryId, updates) => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.journalMap) {
      return createError('YJS system not available');
    }

    const entriesArray = yjsSystem.journalMap.get('entries');
    if (!entriesArray) {
      return createError('No entries found');
    }

    const entries = entriesArray.toArray();
    const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);

    if (entryIndex === -1) {
      return createError(`Entry with ID ${entryId} not found`);
    }

    const entryMap = entries[entryIndex];
    Object.entries(updates).forEach(([key, value]) => {
      entryMap.set(key, value);
    });
    entryMap.set('timestamp', Date.now());

    yjsSystem.journalMap.set('lastModified', Date.now());
    return createSuccess({ id: entryId, ...updates });
  } catch (error) {
    return handleError('updateEntryInSystem', error);
  }
};

// Pure function to delete entry from YJS system
export const deleteEntryFromSystem = (entryId) => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.journalMap) {
      return createError('YJS system not available');
    }

    const entriesArray = yjsSystem.journalMap.get('entries');
    if (!entriesArray) {
      return createError('No entries found');
    }

    const entries = entriesArray.toArray();
    const entryIndex = entries.findIndex(entryMap => entryMap.get('id') === entryId);

    if (entryIndex === -1) {
      return createError(`Entry with ID ${entryId} not found`);
    }

    entriesArray.delete(entryIndex, 1);
    yjsSystem.journalMap.set('lastModified', Date.now());

    return createSuccess({ deletedId: entryId });
  } catch (error) {
    return handleError('deleteEntryFromSystem', error);
  }
};

// Pure function to get all entries from YJS system
export const getEntriesFromSystem = () => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.journalMap) {
      return createSuccess([]);
    }

    const entriesArray = yjsSystem.journalMap.get('entries');
    if (!entriesArray) {
      return createSuccess([]);
    }

    const entries = entriesArray.toArray().map(entryMap => ({
      id: entryMap.get('id'),
      title: entryMap.get('title'),
      content: entryMap.get('content'),
      timestamp: entryMap.get('timestamp')
    }));

    return createSuccess(entries);
  } catch (error) {
    return handleError('getEntriesFromSystem', error);
  }
};

// Composed function to add new entry from form data
export const addNewEntry = () => {
  try {
    // Get form data
    const formResult = getEntryFormData();
    if (!formResult.success) {
      return formResult;
    }

    // Validate entry data
    const validationResult = validateEntryData(formResult.data);
    if (!validationResult.success) {
      return validationResult;
    }

    // Create entry object
    const entry = createEntryObject(formResult.data.title, formResult.data.content);

    // Add to system
    const addResult = addEntryToSystem(entry);
    if (!addResult.success) {
      return addResult;
    }

    // Clear form on success
    clearEntryForm();

    return createSuccess(entry);
  } catch (error) {
    return handleError('addNewEntry', error);
  }
};

// Pure function to update existing entry
export const updateEntry = (entryId, newTitle, newContent) => {
  const validation = validateRequired(
    { title: newTitle, content: newContent },
    ['title', 'content']
  );

  if (!validation.success) {
    return validation;
  }

  const updates = {
    title: newTitle.trim(),
    content: newContent.trim()
  };

  return updateEntryInSystem(entryId, updates);
};

// Pure function to delete entry with confirmation
export const deleteEntry = (entryId, entryTitle = 'this entry') => {
  try {
    const confirmed = confirm(`Are you sure you want to delete "${entryTitle}"?`);
    if (!confirmed) {
      return createError('Deletion cancelled by user');
    }

    return deleteEntryFromSystem(entryId);
  } catch (error) {
    return handleError('deleteEntry', error);
  }
};