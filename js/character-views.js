// Character Views - Pure Rendering Functions for Character Page
import { getFormData, showNotification } from './utils.js';
import { getWordCount } from './utils.js';
import {
  getCachedCharacterData,
  getFormDataForPage
} from './navigation-cache.js';

// Render character form with current data
export const renderCharacterForm = (form, character) => {
  if (!form) {
    form = document.getElementById('character-form');
  }
  if (!form) return;
  
  const fields = ['name', 'race', 'class', 'backstory', 'notes'];
  fields.forEach(field => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      // Set value, handling undefined/null/empty values
      input.value = character[field] || '';
    }
  });
};

// Update summaries display
export const renderSummaries = (backstorySummary, notesSummary, originals = {}) => {
  const summariesContainer = document.getElementById('character-summaries') || document.getElementById('summaries-content');
  if (!summariesContainer) return;
  
  if (!backstorySummary && !notesSummary) {
    summariesContainer.innerHTML = `
      <div class="summary-placeholder">
        <p>No character summaries available yet. Character summaries are automatically generated when your backstory or notes become lengthy.</p>
      </div>
    `;
    return;
  }
  
  let summariesHTML = '';
  
  if (backstorySummary) {
    const backstoryOriginal = originals.backstory || '';
    const backstorySummaryCount = getWordCount(backstorySummary || '');
    const backstoryOriginalCount = getWordCount(backstoryOriginal || '');
    summariesHTML += `
      <div class="summary-item">
        <h3>Backstory <span class="summary-word-count">${backstorySummaryCount} (${backstoryOriginalCount})</span></h3>
        <p>${backstorySummary}</p>
      </div>
    `;
  }
  
  if (notesSummary) {
    const notesOriginal = originals.notes || '';
    const notesSummaryCount = getWordCount(notesSummary || '');
    const notesOriginalCount = getWordCount(notesOriginal || '');
    summariesHTML += `
      <div class="summary-item">
        <h3>Notes <span class="summary-word-count">${notesSummaryCount} (${notesOriginalCount})</span></h3>
        <p>${notesSummary}</p>
      </div>
    `;
  }
  
  summariesContainer.innerHTML = summariesHTML;
};

// Show/hide generate summaries button
export const toggleGenerateButton = (isAPIAvailable, hasContent = false) => {
  const generateBtn = document.getElementById('generate-summaries');
  if (generateBtn) {
    generateBtn.style.display = (isAPIAvailable && hasContent) ? 'inline-block' : 'none';
  }
};

// showNotification function moved to utils.js for shared use across all view modules



// Pure function to render cached character content immediately
export const renderCachedCharacterContent = (elements) => {
  const { characterFormElement, summariesContainer } = elements;
  
  const cachedCharacter = getCachedCharacterData();
  const cachedFormData = getFormDataForPage('character');
  
  if (Object.keys(cachedCharacter).length > 0 || Object.keys(cachedFormData).length > 0) {
    // Merge cached character data with form data
    const displayData = { ...cachedCharacter, ...cachedFormData };
    
    // Render form with cached data
    if (characterFormElement) {
      renderCharacterForm(characterFormElement, displayData, {
        onSave: () => {}, // Disabled during cache phase
        onGenerate: () => {} // Disabled during cache phase
      });
      

    }
    
    // Show loading indicator for summaries
    if (summariesContainer) {
      summariesContainer.innerHTML = '<p>Loading AI summaries...</p>';
    }
  }
};