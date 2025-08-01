// Character Views - Pure Rendering Functions for Character Page
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
export const renderSummaries = (backstorySummary, notesSummary) => {
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
    summariesHTML += `
      <div class="summary-item">
        <h3>Backstory Summary</h3>
        <p>${backstorySummary}</p>
      </div>
    `;
  }
  
  if (notesSummary) {
    summariesHTML += `
      <div class="summary-item">
        <h3>Notes Summary</h3>
        <p>${notesSummary}</p>
      </div>
    `;
  }
  
  summariesContainer.innerHTML = summariesHTML;
};

// Show/hide generate summaries button
export const toggleGenerateButton = (isAPIAvailable) => {
  const generateBtn = document.getElementById('generate-summaries');
  if (generateBtn) {
    generateBtn.style.display = isAPIAvailable ? 'inline-block' : 'none';
  }
};

// Show notification message
export const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
};

// Get form data from any form
export const getFormData = (form) => {
  // Try FormData first, fallback to manual extraction for test environments
  try {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    // If FormData worked but no entries were found, fall back to manual method
    if (Object.keys(data).length === 0) {
      throw new Error('FormData returned empty, falling back to manual method');
    }
    return data;
  } catch (error) {
    // Fallback: manually extract form data for test environments where FormData might not work
    const data = {};
    const elements = form.querySelectorAll('input, textarea, select');
    elements.forEach(element => {
      if (element.name) {
        if (element.type === 'checkbox') {
          data[element.name] = element.checked;
        } else {
          data[element.name] = element.value || '';
        }
      }
    });
    return data;
  }
};

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
      
      // Add visual indicator that form has cached data
      if (Object.keys(cachedFormData).length > 0) {
        characterFormElement.classList.add('character-form--has-cached-data');
      }
    }
    
    // Show loading indicator for summaries
    if (summariesContainer) {
      summariesContainer.innerHTML = '<p class="summaries__loading">Loading AI summaries...</p>';
    }
  }
};