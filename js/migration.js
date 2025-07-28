// Migration from localStorage to Yjs Data Store
// Handles one-time migration of existing user data

import { STORAGE_KEYS } from './utils.js';
import { 
  initializeDataStore, 
  waitForReady, 
  setCharacter, 
  addEntry, 
  setSettings, 
  setSummary 
} from './data-store.js';

// Check if migration is needed
export const needsMigration = () => {
  // Check if any localStorage data exists
  const hasJournal = localStorage.getItem(STORAGE_KEYS.JOURNAL) !== null;
  const hasSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS) !== null;
  const hasSummaries = localStorage.getItem(STORAGE_KEYS.SUMMARIES) !== null;
  
  return hasJournal || hasSettings || hasSummaries;
};

// Migrate data from localStorage to Yjs
export const migrateToYjs = async () => {
  console.log('Starting migration from localStorage to Yjs...');
  
  try {
    // Initialize data store
    await initializeDataStore();
    await waitForReady();
    
    let migrationCount = 0;
    
    // Migrate journal data (character + entries)
    const journalData = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    if (journalData) {
      try {
        const journal = JSON.parse(journalData);
        
        // Migrate character
        if (journal.character) {
          setCharacter(journal.character);
          console.log('Migrated character data');
          migrationCount++;
        }
        
        // Migrate entries
        if (journal.entries && Array.isArray(journal.entries)) {
          // Add entries in reverse order to maintain chronological order
          journal.entries.reverse().forEach(entry => {
            addEntry(entry);
          });
          console.log(`Migrated ${journal.entries.length} journal entries`);
          migrationCount++;
        }
      } catch (e) {
        console.warn('Failed to migrate journal data:', e);
      }
    }
    
    // Migrate settings
    const settingsData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsData) {
      try {
        const settings = JSON.parse(settingsData);
        setSettings(settings);
        console.log('Migrated settings');
        migrationCount++;
      } catch (e) {
        console.warn('Failed to migrate settings:', e);
      }
    }
    
    // Migrate summaries
    const summariesData = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
    if (summariesData) {
      try {
        const summaries = JSON.parse(summariesData);
        Object.entries(summaries).forEach(([key, summary]) => {
          setSummary(key, summary);
        });
        console.log(`Migrated ${Object.keys(summaries).length} summaries`);
        migrationCount++;
      } catch (e) {
        console.warn('Failed to migrate summaries:', e);
      }
    }
    
    // Migrate meta summaries
    const metaSummariesData = localStorage.getItem(STORAGE_KEYS.META_SUMMARIES);
    if (metaSummariesData) {
      try {
        const metaSummaries = JSON.parse(metaSummariesData);
        Object.entries(metaSummaries).forEach(([key, summary]) => {
          setSummary(`meta:${key}`, summary);
        });
        console.log(`Migrated ${Object.keys(metaSummaries).length} meta summaries`);
        migrationCount++;
      } catch (e) {
        console.warn('Failed to migrate meta summaries:', e);
      }
    }
    
    // Migrate character summaries
    const characterSummariesData = localStorage.getItem(STORAGE_KEYS.CHARACTER_SUMMARIES);
    if (characterSummariesData) {
      try {
        const characterSummaries = JSON.parse(characterSummariesData);
        Object.entries(characterSummaries).forEach(([key, summary]) => {
          setSummary(`character:${key}`, summary);
        });
        console.log(`Migrated ${Object.keys(characterSummaries).length} character summaries`);
        migrationCount++;
      } catch (e) {
        console.warn('Failed to migrate character summaries:', e);
      }
    }
    
    if (migrationCount > 0) {
      console.log(`Migration completed: ${migrationCount} data types migrated`);
      
      // Create backup of localStorage data
      createLocalStorageBackup();
      
      // Clear localStorage after successful migration
      clearLocalStorageData();
      
      return { success: true, migrationCount };
    } else {
      console.log('No data to migrate');
      return { success: true, migrationCount: 0 };
    }
    
  } catch (e) {
    console.error('Migration failed:', e);
    return { success: false, error: e.message };
  }
};

// Create backup of localStorage data before clearing
const createLocalStorageBackup = () => {
  try {
    const backup = {};
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        backup[key] = data;
      }
    });
    
    // Store backup with timestamp
    const backupKey = `dnd-journal-backup-${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    console.log(`Created localStorage backup: ${backupKey}`);
  } catch (e) {
    console.warn('Failed to create localStorage backup:', e);
  }
};

// Clear localStorage data after migration
const clearLocalStorageData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('Cleared migrated localStorage data');
  } catch (e) {
    console.warn('Failed to clear localStorage data:', e);
  }
};

// Emergency rollback function (in case of issues)
export const rollbackMigration = () => {
  try {
    // Find most recent backup
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('dnd-journal-backup-'))
      .sort()
      .reverse();
    
    if (backupKeys.length === 0) {
      console.warn('No backup found for rollback');
      return false;
    }
    
    const latestBackup = backupKeys[0];
    const backupData = JSON.parse(localStorage.getItem(latestBackup));
    
    // Restore each storage key
    Object.entries(backupData).forEach(([key, data]) => {
      localStorage.setItem(key, data);
    });
    
    console.log(`Rolled back to backup: ${latestBackup}`);
    return true;
    
  } catch (e) {
    console.error('Rollback failed:', e);
    return false;
  }
};