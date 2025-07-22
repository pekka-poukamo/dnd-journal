// js/pages/AIAssistant.js - AI Assistant functionality

import { getStorage } from '../utils/storage.js';
import { query, show, hide } from '../utils/dom.js';
import { showSuccess, showError } from '../utils/notifications.js';

// Pure functions for API key management
const getApiKey = () => {
  const storage = getStorage();
  const settings = storage.getSettings();
  return settings.openaiApiKey;
};

const setApiKey = (apiKey) => {
  const storage = getStorage();
  return storage.updateSettings({ openaiApiKey: apiKey });
};

// Pure functions for prompt building
const buildCharacterContext = (character) => 
  character ? `
Character: ${character.name} (${character.race} ${character.class}, Level ${character.level})
Traits: ${character.traits || 'Not specified'}
Backstory: ${character.backstory ? character.backstory.substring(0, 500) + '...' : 'None'}
` : 'No character selected';

const buildRecentEventsContext = (entries) => {
  if (entries.length === 0) return 'Recent Events: None';
  
  const eventSummaries = entries
    .slice(0, 3)
    .map(entry => `- ${entry.title}: ${entry.content.substring(0, 100)}...`);
    
  return `Recent Events:\n${eventSummaries.join('\n')}`;
};

const createPromptTemplate = (type) => {
  const templates = {
    roleplay: (context, userInput) => 
      `${context}\n\nBased on this character, suggest how they would react to: ${userInput}\n\nProvide 2-3 specific roleplay suggestions with dialogue options. Consider the character's personality, background, and recent experiences.`,
    
    character: (context, userInput) => 
      `${context}\n\nSuggest character development ideas focusing on: ${userInput}\n\nInclude personality growth opportunities, potential relationships, backstory elements, and how recent events might shape the character.`,
    
    scenario: (context, userInput) => 
      `${context}\n\nGenerate an interesting scenario or challenge related to: ${userInput}\n\nInclude potential obstacles, meaningful choices, consequences, and how this fits the character's level and experience. Make it engaging and appropriate for D&D.`
  };
  
  return templates[type] || templates.roleplay;
};

const buildPrompt = (type, character, recentEntries, userInput) => {
  const characterContext = buildCharacterContext(character);
  const eventsContext = buildRecentEventsContext(recentEntries);
  const fullContext = characterContext + '\n' + eventsContext;
  
  const templateFn = createPromptTemplate(type);
  return templateFn(fullContext, userInput);
};

// API interaction
const callOpenAI = async (prompt, apiKey) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful D&D assistant that provides creative roleplay suggestions. Keep responses concise, actionable, and true to D&D themes. Format your response clearly with bullet points or numbered suggestions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API error: ${response.status} ${response.statusText}${errorData.error?.message ? ' - ' + errorData.error.message : ''}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
};

// Test API key functionality
const testApiKey = async (apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Main AI generation function
const generateAIResponse = async (type, characterId, userInput) => {
  try {
    let apiKey = getApiKey();
    
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key required. Please set it in API Settings.' };
    }
    
    const storage = getStorage();
    const character = storage.getCharacter(characterId);
    
    if (!character) {
      return { success: false, error: 'Character not found' };
    }
    
    const recentEntries = storage.getEntriesForCharacter(characterId).slice(0, 3);
    const prompt = buildPrompt(type, character, recentEntries, userInput);
    const content = await callOpenAI(prompt, apiKey);
    
    return { success: true, content };
    
  } catch (error) {
    console.error('AI generation failed:', error);
    
    if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
      return { success: false, error: 'Invalid API key. Please check your OpenAI API key in settings.' };
    }
    
    if (error.message.includes('429')) {
      return { success: false, error: 'Rate limit exceeded. Please try again in a moment.' };
    }
    
    if (error.message.includes('insufficient_quota')) {
      return { success: false, error: 'API quota exceeded. Please check your OpenAI account billing.' };
    }
    
    return { success: false, error: 'Failed to generate response. Please try again.' };
  }
};

// UI helper functions
const createLoadingState = () => {
  const responseDiv = query('#ai-response');
  responseDiv.className = 'ai-response loading';
  responseDiv.innerHTML = '<p>🤔 Generating suggestions...</p>';
  show(responseDiv);
};

const createErrorState = (error) => {
  const responseDiv = query('#ai-response');
  responseDiv.className = 'ai-response error';
  responseDiv.innerHTML = `<p>❌ ${error}</p>`;
  show(responseDiv);
};

const createSuccessState = (content, type, character) => {
  const responseDiv = query('#ai-response');
  responseDiv.className = 'ai-response success';
  
  const typeLabels = {
    roleplay: '🎭 Roleplay Suggestions',
    character: '🌟 Character Development',
    scenario: '📖 Story Scenario'
  };
  
  responseDiv.innerHTML = `
    <div class="flex justify-between items-center">
      <h3>${typeLabels[type]} for ${character.name}</h3>
      <button id="save-suggestion" class="button button--small">Save as Entry</button>
    </div>
    <div class="response-content">${content.replace(/\n/g, '<br>')}</div>
  `;
  
  // Add save functionality
  const saveBtn = query('#save-suggestion');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveSuggestionAsEntry(content, type, character));
  }
  
  show(responseDiv);
};

const saveSuggestionAsEntry = (content, type, character) => {
  const storage = getStorage();
  
  const entry = {
    title: `AI Suggestion: ${type} for ${character.name}`,
    content: content,
    type: 'note',
    tags: ['ai-suggestion', type],
    characterId: character.id,
    date: new Date().toISOString().split('T')[0]
  };
  
  const result = storage.saveEntry(entry);
  
  if (result.success) {
    showSuccess('Suggestion saved as journal entry!');
  } else {
    showError('Failed to save suggestion: ' + result.error);
  }
};

// Form management
const loadCharacterOptions = () => {
  const storage = getStorage();
  const characters = storage.getAllCharacters();
  const select = query('#ai-character-select');
  
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Character</option>';
  
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
  
  updateGenerateButton();
};

const updateGenerateButton = () => {
  const characterSelected = query('#ai-character-select').value;
  const userInput = query('#user-input').value.trim();
  const generateBtn = query('#generate-btn');
  
  if (generateBtn) {
    generateBtn.disabled = !characterSelected || !userInput;
  }
};

// API Settings Modal
const openApiSettingsModal = () => {
  const modal = query('#api-settings-modal');
  const apiKeyInput = query('#openai-api-key');
  
  if (modal && apiKeyInput) {
    apiKeyInput.value = getApiKey() || '';
    show(modal);
    apiKeyInput.focus();
  }
};

const closeApiSettingsModal = () => {
  const modal = query('#api-settings-modal');
  if (modal) {
    hide(modal);
  }
};

const saveApiKeyFromModal = () => {
  const apiKeyInput = query('#openai-api-key');
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError('Please enter an API key');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    showError('Invalid API key format. OpenAI API keys start with "sk-"');
    return;
  }
  
  const result = setApiKey(apiKey);
  
  if (result.success) {
    showSuccess('API key saved successfully!');
    closeApiSettingsModal();
  } else {
    showError('Failed to save API key: ' + result.error);
  }
};

const testApiKeyFromModal = async () => {
  const apiKeyInput = query('#openai-api-key');
  const testBtn = query('#test-api-key');
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError('Please enter an API key first');
    return;
  }
  
  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  
  try {
    const isValid = await testApiKey(apiKey);
    
    if (isValid) {
      showSuccess('API key is valid!');
    } else {
      showError('API key is invalid or expired');
    }
  } catch (error) {
    showError('Failed to test API key: ' + error.message);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Connection';
  }
};

// Event handlers
const setupEventHandlers = () => {
  // API Settings
  const apiSettingsBtn = query('#api-settings-btn');
  const closeApiSettingsBtn = query('#close-api-settings');
  const saveApiKeyBtn = query('#save-api-key');
  const testApiKeyBtn = query('#test-api-key');
  
  if (apiSettingsBtn) {
    apiSettingsBtn.addEventListener('click', openApiSettingsModal);
  }
  
  if (closeApiSettingsBtn) {
    closeApiSettingsBtn.addEventListener('click', closeApiSettingsModal);
  }
  
  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', saveApiKeyFromModal);
  }
  
  if (testApiKeyBtn) {
    testApiKeyBtn.addEventListener('click', testApiKeyFromModal);
  }
  
  // Form validation
  const characterSelect = query('#ai-character-select');
  const userInput = query('#user-input');
  
  if (characterSelect) {
    characterSelect.addEventListener('change', updateGenerateButton);
  }
  
  if (userInput) {
    userInput.addEventListener('input', updateGenerateButton);
  }
  
  // Form submission
  const aiForm = query('#ai-form');
  if (aiForm) {
    aiForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const characterId = query('#ai-character-select').value;
      const promptType = query('#prompt-type').value;
      const userInputValue = query('#user-input').value.trim();
      
      if (!characterId || !userInputValue) {
        showError('Please select a character and enter your question');
        return;
      }
      
      const storage = getStorage();
      const character = storage.getCharacter(characterId);
      
      // Show loading state
      createLoadingState();
      
      // Generate response
      const result = await generateAIResponse(promptType, characterId, userInputValue);
      
      // Show result
      if (result.success) {
        createSuccessState(result.content, promptType, character);
      } else {
        createErrorState(result.error);
      }
    });
  }
  
  // Clear response
  const clearResponseBtn = query('#clear-response');
  if (clearResponseBtn) {
    clearResponseBtn.addEventListener('click', () => {
      const responseDiv = query('#ai-response');
      if (responseDiv) {
        hide(responseDiv);
      }
    });
  }
  
  // Modal overlay clicks
  const apiModal = query('#api-settings-modal');
  if (apiModal) {
    apiModal.addEventListener('click', (e) => {
      if (e.target === apiModal || e.target.classList.contains('modal-overlay')) {
        closeApiSettingsModal();
      }
    });
  }
  
  // Keyboard handlers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeApiSettingsModal();
    }
  });
};

// Main initialization
const initAIAssistant = () => {
  loadCharacterOptions();
  setupEventHandlers();
  
  // Check if API key is set and show helpful message
  const apiKey = getApiKey();
  if (!apiKey) {
    const responseDiv = query('#ai-response');
    if (responseDiv) {
      responseDiv.className = 'ai-response';
      responseDiv.innerHTML = `
        <p>👋 Welcome to the AI Assistant!</p>
        <p>To get started, you'll need to set up your OpenAI API key. Click "API Settings" above to configure it.</p>
        <p>Once configured, select a character and describe what you'd like suggestions for.</p>
      `;
      show(responseDiv);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAIAssistant);

export { initAIAssistant };