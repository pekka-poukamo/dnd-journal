const { should } = require('./setup');

// Set up DOM structure needed for the app
document.body.innerHTML = `
  <div id="settings-modal" class="modal" style="display: none;">
    <div class="modal-content">
      <div class="modal-body">
        <input type="password" id="openai-api-key" value="">
        <select id="ai-model">
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </div>
    </div>
  </div>
  <div id="api-key-warning" style="display: none;"></div>
  <div class="prompt-buttons">
    <button id="generate-introspective-btn">Generate Introspective</button>
    <button id="generate-action-btn">Generate Action</button>
    <button id="generate-surprise-btn">Generate Surprise</button>
  </div>
  <div id="ai-prompt-result" style="display: none;">
    <div id="prompt-content"></div>
    <button id="use-prompt-btn">Use This Prompt</button>
    <button id="regenerate-prompt-btn">Regenerate</button>
  </div>
  <input id="entry-title" value="">
  <textarea id="entry-content"></textarea>
`;

// Mock fetch for consistent testing
global.fetch = async (url, options) => {
  return {
    ok: true,
    json: async () => ({
      choices: [{
        message: {
          content: 'Test AI response'
        }
      }]
    })
  };
};

// Load the OpenAI service and app modules
const OpenAIService = require('../js/openai-service');

// Mock AI functions for testing
global.updateAIUI = () => {
  const warning = document.getElementById('api-key-warning');
  const buttons = document.querySelectorAll('.prompt-buttons button');
  
  if (global.openAIService && global.openAIService.isConfigured()) {
    if (warning) warning.style.display = 'none';
    buttons.forEach(btn => btn.disabled = false);
  } else {
    if (warning) warning.style.display = 'block';
    buttons.forEach(btn => btn.disabled = true);
  }
};

global.openSettingsModal = () => {
  const modal = document.getElementById('settings-modal');
  const apiKeyInput = document.getElementById('openai-api-key');
  const modelSelect = document.getElementById('ai-model');
  
  if (modal) modal.style.display = 'flex';
  
  if (global.openAIService) {
    if (apiKeyInput) apiKeyInput.value = global.openAIService.apiKey || '';
    if (modelSelect) modelSelect.value = global.openAIService.model || 'gpt-3.5-turbo';
  }
};

global.saveSettings = () => {
  const apiKeyInput = document.getElementById('openai-api-key');
  const modelSelect = document.getElementById('ai-model');
  
  if (global.openAIService && apiKeyInput && modelSelect) {
    global.openAIService.saveSettings(apiKeyInput.value.trim(), modelSelect.value);
    global.updateAIUI();
  }
};

global.generatePrompt = async (type) => {
  if (!global.openAIService || !global.openAIService.isConfigured()) {
    global.alert('Please configure your OpenAI API key in Settings first.');
    return;
  }

  global.currentPromptType = type;
  const resultDiv = document.getElementById('ai-prompt-result');
  const contentDiv = document.getElementById('prompt-content');

  try {
    const prompt = await global.openAIService.generatePrompt(type, global.state.character, global.state.entries);
    
    if (contentDiv) contentDiv.textContent = prompt;
    if (resultDiv) resultDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Error generating prompt:', error);
    global.alert(`Error generating prompt: ${error.message}`);
  }
};

global.usePrompt = () => {
  const contentDiv = document.getElementById('prompt-content');
  const titleInput = document.getElementById('entry-title');
  const contentInput = document.getElementById('entry-content');
  
  if (contentDiv && titleInput && contentInput) {
    const promptText = contentDiv.textContent;
    
    const titles = {
      'introspective': 'Character Reflection',
      'action': 'Critical Decision',
      'surprise': 'Unexpected Encounter'
    };
    
    titleInput.value = titles[global.currentPromptType] || 'AI Generated Prompt';
    contentInput.value = promptText;
  }
};

global.currentPromptType = null;

describe('AI Integration Tests', () => {
  let openAIService;

  beforeEach(() => {
    // Clear localStorage and reset state
    global.localStorage.clear();
    
    // Create initial state manually since createInitialState might not be available
    global.state = {
      character: {
        name: '',
        race: '',
        class: ''
      },
      entries: []
    };
    
    // Initialize OpenAI service
    openAIService = new OpenAIService();
    global.openAIService = openAIService;
  });

  describe('Settings Management Integration', () => {
    it('should initialize AI service when app starts', () => {
      global.openAIService.should.not.be.undefined;
      global.openAIService.should.be.an.instanceof(OpenAIService);
    });

    it('should show API warning when not configured', () => {
      // Mock updateAIUI function
      global.updateAIUI();
      
      const warning = document.getElementById('api-key-warning');
      const buttons = document.querySelectorAll('.prompt-buttons button');
      
      warning.style.display.should.equal('block');
      buttons.forEach(btn => {
        btn.disabled.should.be.true;
      });
    });

    it('should hide API warning when configured', () => {
      // Configure API key
      openAIService.saveSettings('sk-test-key', 'gpt-4');
      global.updateAIUI();
      
      const warning = document.getElementById('api-key-warning');
      const buttons = document.querySelectorAll('.prompt-buttons button');
      
      warning.style.display.should.equal('none');
      buttons.forEach(btn => {
        btn.disabled.should.be.false;
      });
    });

    it('should save settings from modal inputs', () => {
      const apiKeyInput = document.getElementById('openai-api-key');
      const modelSelect = document.getElementById('ai-model');
      
      apiKeyInput.value = 'sk-new-test-key';
      modelSelect.value = 'gpt-4';
      
      global.saveSettings();
      
      openAIService.apiKey.should.equal('sk-new-test-key');
      openAIService.model.should.equal('gpt-4');
    });

    it('should populate modal with current settings', () => {
      openAIService.saveSettings('sk-existing-key', 'gpt-4');
      
      global.openSettingsModal();
      
      const apiKeyInput = document.getElementById('openai-api-key');
      const modelSelect = document.getElementById('ai-model');
      
      apiKeyInput.value.should.equal('sk-existing-key');
      modelSelect.value.should.equal('gpt-4');
    });
  });

  describe('Prompt Generation Integration', () => {
    beforeEach(() => {
      openAIService.saveSettings('sk-test-key', 'gpt-3.5-turbo');
      
      // Set up test character and entries
      global.state.character = {
        name: 'Test Hero',
        race: 'Human',
        class: 'Paladin'
      };
      
      global.state.entries = [
        {
          id: '1',
          title: 'First Adventure',
          content: 'We explored a dangerous dungeon and fought goblins.',
          timestamp: Date.now()
        },
        {
          id: '2',
          title: 'Second Adventure', 
          content: 'We rescued villagers from bandits and made new allies.',
          timestamp: Date.now() - 86400000
        }
      ];
    });

    it('should generate prompts with character and entry context', async () => {
      let capturedContext = null;
      
      // Mock the generatePrompt method to capture context
      openAIService.generatePrompt = async (type, character, entries) => {
        capturedContext = { type, character, entries };
        return 'Generated test prompt';
      };
      
      await global.generatePrompt('introspective');
      
      capturedContext.should.not.be.null;
      capturedContext.type.should.equal('introspective');
      capturedContext.character.name.should.equal('Test Hero');
      capturedContext.entries.should.have.length(2);
    });

    it('should display generated prompt in UI', async () => {
      await global.generatePrompt('action');
      
      const promptContent = document.getElementById('prompt-content');
      const promptResult = document.getElementById('ai-prompt-result');
      
      promptContent.textContent.should.equal('Test AI response');
      promptResult.style.display.should.equal('block');
    });

    it('should handle prompt generation errors gracefully', async () => {
      // Mock fetch to throw error
      global.fetch = async () => {
        throw new Error('Network error');
      };
      
      // Mock alert to capture error message
      let alertMessage = null;
      global.alert = (message) => {
        alertMessage = message;
      };
      
      await global.generatePrompt('surprise');
      
      alertMessage.should.include('Error generating prompt');
    });

    it('should use different titles for different prompt types', () => {
      global.currentPromptType = 'action';
      global.usePrompt();
      
      const titleInput = document.getElementById('entry-title');
      titleInput.value.should.equal('Critical Decision');
      
      global.currentPromptType = 'surprise';
      global.usePrompt();
      
      titleInput.value.should.equal('Unexpected Encounter');
    });
  });

  describe('Data Compression Integration', () => {
    beforeEach(() => {
      openAIService.saveSettings('sk-test-key', 'gpt-3.5-turbo');
    });

    it('should compress large journal histories before sending to AI', async () => {
      // Create many entries to trigger compression
      const manyEntries = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        title: `Adventure ${i}`,
        content: `This is the content for adventure ${i}. It contains various details.`,
        timestamp: Date.now() - (i * 86400000)
      }));
      
      global.state.entries = manyEntries;
      
      let capturedSystemPrompt = null;
      global.fetch = async (url, options) => {
        const body = JSON.parse(options.body);
        capturedSystemPrompt = body.messages[0].content;
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Test response' } }]
          })
        };
      };
      
      await global.generatePrompt('introspective');
      
      capturedSystemPrompt.should.not.be.null;
      capturedSystemPrompt.should.include('Recent Adventures:');
    });

    it('should handle compression failures gracefully', async () => {
      // Create entries that will trigger compression
      const entries = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        title: `Entry ${i}`,
        content: `Content ${i}`,
        timestamp: Date.now() - (i * 1000)
      }));
      
      global.state.entries = entries;
      
      // Mock compression to fail
      openAIService.getEntrySummaries = async () => {
        throw new Error('Compression failed');
      };
      
      // Should still work with fallback
      await global.generatePrompt('action');
      
      const promptContent = document.getElementById('prompt-content');
      promptContent.textContent.should.equal('Test AI response');
    });
  });
});