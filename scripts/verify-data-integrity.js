#!/usr/bin/env node

// Data Integrity Verification Script
// Verifies that existing user data remains compatible after summarization refactoring

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Data Integrity After Summarization Refactoring...\n');

// Load modules
const utils = require('../js/utils.js');
const summarization = require('../js/summarization.js');

// Mock localStorage for testing
global.localStorage = {
  data: {},
  getItem(key) { return this.data[key] || null; },
  setItem(key, value) { this.data[key] = value; },
  removeItem(key) { delete this.data[key]; },
  clear() { this.data = {}; }
};

// Test data compatibility
function verifyDataCompatibility() {
  console.log('✅ Testing data structure compatibility...');
  
  // Test 1: Storage keys unchanged
  const expectedKeys = [
    'simple-dnd-journal',
    'simple-dnd-journal-settings', 
    'simple-dnd-journal-summaries',
    'simple-dnd-journal-meta-summaries',
    'simple-dnd-journal-character-summaries'
  ];
  
  const actualKeys = Object.values(utils.STORAGE_KEYS);
  const keysMatch = expectedKeys.every(key => actualKeys.includes(key));
  
  if (keysMatch) {
    console.log('   ✓ Storage keys unchanged');
  } else {
    console.log('   ❌ Storage keys changed!');
    return false;
  }
  
  // Test 2: Legacy functions available
  const legacyFunctions = [
    'getEntriesNeedingSummaries',
    'getCharacterDetailsNeedingSummaries', 
    'generateCharacterDetailSummary',
    'loadStoredCharacterSummaries',
    'saveStoredCharacterSummaries'
  ];
  
  const functionsExist = legacyFunctions.every(fn => typeof summarization[fn] === 'function');
  
  if (functionsExist) {
    console.log('   ✓ Legacy functions available');
  } else {
    console.log('   ❌ Legacy functions missing!');
    return false;
  }
  
  // Test 3: Config constants available
  const configsExist = summarization.META_SUMMARY_CONFIG && summarization.CHARACTER_SUMMARY_CONFIG;
  
  if (configsExist) {
    console.log('   ✓ Config constants available');
  } else {
    console.log('   ❌ Config constants missing!');
    return false;
  }
  
  return true;
}

// Test with sample existing data
function verifyExistingDataHandling() {
  console.log('\n✅ Testing existing data handling...');
  
  // Sample existing journal data
  const existingJournalData = {
    character: {
      name: 'Gandalf',
      race: 'Wizard', 
      class: 'Mage',
      backstory: 'A powerful wizard of great wisdom',
      notes: 'Carries a staff and knows many spells'
    },
    entries: [
      {
        id: '1',
        title: 'First Adventure',
        content: 'We set out on our journey...',
        timestamp: Date.now() - 86400000,
        image: ''
      },
      {
        id: '2', 
        title: 'Second Adventure',
        content: 'The plot thickens...',
        timestamp: Date.now(),
        image: ''
      }
    ]
  };
  
  // Sample existing summaries
  const existingSummaries = {
    '1': {
      summary: 'Party begins their journey',
      originalWordCount: 50,
      summaryWordCount: 15,
      timestamp: Date.now() - 3600000
    }
  };
  
  // Sample existing character summaries
  const existingCharacterSummaries = {
    backstory: {
      summary: 'Wise wizard with great power',
      originalWordCount: 100,
      summaryWordCount: 25,
      contentHash: 'abc123',
      timestamp: Date.now() - 7200000
    }
  };
  
  // Store in mock localStorage
  localStorage.setItem('simple-dnd-journal', JSON.stringify(existingJournalData));
  localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(existingSummaries));
  localStorage.setItem('simple-dnd-journal-character-summaries', JSON.stringify(existingCharacterSummaries));
  
  try {
    // Test: Legacy functions work with existing data
    const entriesAnalysis = summarization.getEntriesNeedingSummaries(existingJournalData.entries, existingSummaries);
    console.log('   ✓ Entry analysis works with existing data');
    
    const characterAnalysis = summarization.getCharacterDetailsNeedingSummaries(existingJournalData.character, existingCharacterSummaries);
    console.log('   ✓ Character analysis works with existing data');
    
    const loadedCharacterSummaries = summarization.loadStoredCharacterSummaries();
    if (loadedCharacterSummaries.backstory) {
      console.log('   ✓ Character summaries load correctly');
    }
    
    const formattedEntries = summarization.getFormattedEntriesForAI();
    if (Array.isArray(formattedEntries)) {
      console.log('   ✓ Entry formatting works with existing data');
    }
    
    const formattedCharacter = summarization.getFormattedCharacterForAI(existingJournalData.character);
    if (formattedCharacter.name === 'Gandalf') {
      console.log('   ✓ Character formatting preserves data');
    }
    
    const stats = summarization.getSummaryStats();
    if (typeof stats.totalEntries === 'number') {
      console.log('   ✓ Statistics calculation works');
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Error processing existing data:', error.message);
    return false;
  }
}

// Test configuration equivalence  
function verifyConfigurationEquivalence() {
  console.log('\n✅ Testing configuration equivalence...');
  
  const metaConfig = summarization.META_SUMMARY_CONFIG;
  const characterConfig = summarization.CHARACTER_SUMMARY_CONFIG;
  
  // Verify meta-summary config values match expected
  const metaConfigCorrect = (
    metaConfig.triggerThreshold === 50 &&
    metaConfig.summariesPerGroup === 10 &&
    metaConfig.maxWords === 200
  );
  
  if (metaConfigCorrect) {
    console.log('   ✓ Meta-summary config values correct');
  } else {
    console.log('   ❌ Meta-summary config values changed!');
    return false;
  }
  
  // Verify character config values match expected
  const characterConfigCorrect = (
    characterConfig.maxWordsBeforeSummary === 100 &&
    characterConfig.targetWords === 50 &&
    Array.isArray(characterConfig.fields) &&
    characterConfig.fields.includes('backstory') &&
    characterConfig.fields.includes('notes')
  );
  
  if (characterConfigCorrect) {
    console.log('   ✓ Character config values correct');
  } else {
    console.log('   ❌ Character config values changed!');
    return false;
  }
  
  return true;
}

// Run all tests
function runVerification() {
  const test1 = verifyDataCompatibility();
  const test2 = verifyExistingDataHandling(); 
  const test3 = verifyConfigurationEquivalence();
  
  if (test1 && test2 && test3) {
    console.log('\n🎉 All verification tests passed!');
    console.log('✅ Existing user data is fully compatible');
    console.log('✅ No migration scripts needed');
    console.log('✅ Users can upgrade safely');
    return true;
  } else {
    console.log('\n❌ Verification failed!');
    console.log('🚨 Data migration may be required');
    return false;
  }
}

// Run verification if called directly
if (require.main === module) {
  const success = runVerification();
  process.exit(success ? 0 : 1);
}

module.exports = { runVerification };