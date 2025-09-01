import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import * as Settings from '../js/settings.js';

describe('Settings Page', function() {
  let state;

  beforeEach(async function() {
    // Set up DOM
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="settings-form">
            <input id="journal-name" name="journal-name" />
            <button type="submit">Save Settings</button>
          </form>
          <div id="connection-status"></div>
          <div id="ai-status"></div>
        </body>
      </html>
    `);
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Reset and initialize Y.js
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initSettingsPage', function() {
    it('should initialize without errors', function() {
      expect(() => Settings.initSettingsPage(state)).to.not.throw();
    });

    it('should load settings data', function() {
      YjsModule.setSetting(state, 'journal-name', 'jn');
      
      Settings.initSettingsPage(state);
      Settings.renderSettingsPage(state);
      
      expect(document.getElementById('journal-name').value).to.equal('jn');
    });
  });

  describe('renderSettingsPage', function() {
    it('should render settings form', function() {
      YjsModule.setSetting(state, 'journal-name', 'abc');
      
      Settings.initSettingsPage(state);
      
      expect(document.getElementById('journal-name').value).to.equal('abc');
    });

    it('should handle empty settings data', function() {
      const apiKey = YjsModule.getSetting(state, 'openai-api-key', '');
      expect(apiKey).to.equal('');
      
      expect(() => Settings.renderSettingsPage(state)).to.not.throw();
    });

    it('should handle missing form elements gracefully', function() {
      document.getElementById('settings-form').remove();
      
      expect(() => Settings.renderSettingsPage(state)).to.not.throw();
    });
  });

  describe('Settings data management', function() {
    it('should save settings data to Y.js', function() {
      // Initialize the page first to set up form element reference
      Settings.initSettingsPage(state);
      
      const form = document.getElementById('settings-form');
      document.getElementById('journal-name').value = 'jn-1';
      
      Settings.saveSettings(state);
      
      expect(YjsModule.getSetting(state, 'journal-name')).to.equal('jn-1');
    });

    it('should handle trimming settings', function() {
      // Initialize the page first to set up form element reference
      Settings.initSettingsPage(state);
      
      document.getElementById('journal-name').value = '  jn  ';
      
      Settings.saveSettings(state);
      
      // Settings should be trimmed when saved
      expect(YjsModule.getSetting(state, 'journal-name')).to.equal('jn');
    });

    // ai-enabled setting removed
  });

  describe('Journal name conflict flow', function() {
    let originalFetch;
    beforeEach(function() {
      // Stub fetch to simulate room existence
      originalFetch = global.fetch;
      global.fetch = (url) => Promise.resolve({ ok: true, json: () => Promise.resolve({ exists: true }) });
    });
    afterEach(function() {
      // Restore original fetch to avoid leaking into other suites
      global.fetch = originalFetch;
    });
    
    it('should cancel when modal returns cancel', async function() {
      // Inject modal to always return cancel
      Settings.setShowChoiceModal(() => Promise.resolve('cancel'));

      Settings.initSettingsPage(state);
      document.getElementById('journal-name').value = 'my-journal';
      await Settings.saveSettings(state);
      // Journal name should remain unchanged (empty)
      expect(YjsModule.getSetting(state, 'journal-name', '')).to.equal('');
    });

    it('should choose merge and keep settings', async function() {
      Settings.setShowChoiceModal(() => Promise.resolve('merge'));

      Settings.initSettingsPage(state);
      document.getElementById('journal-name').value = 'merge-journal';
      await Settings.saveSettings(state);
      expect(YjsModule.getSetting(state, 'journal-name', '')).to.equal('merge-journal');
      // Ensure no reset happened in merge flow by adding a value and reading it back
      YjsModule.setSetting(state, 'probe', 'ok');
      expect(YjsModule.getSetting(state, 'probe')).to.equal('ok');
    });

    it('should choose replace and reset Y.Doc then apply settings', async function() {
      Settings.setShowChoiceModal(() => Promise.resolve('replace'));

      Settings.initSettingsPage(state);
      document.getElementById('journal-name').value = 'server-journal';
      await Settings.saveSettings(state);
      // After replace flow, the setting should be stored
      const newState = YjsModule.getYjsState();
      expect(YjsModule.getSetting(newState, 'journal-name', '')).to.equal('server-journal');
    });
  });

  describe('API testing functionality', function() {
    it('should handle API key testing when key is available', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      expect(() => Settings.testAPIKey(state)).to.not.throw();
    });

    it('should handle missing API key for testing', function() {
      const apiKey = YjsModule.getSetting(state, 'openai-api-key', '');
      expect(apiKey).to.equal('');
      
      expect(() => Settings.testAPIKey(state)).to.not.throw();
    });

  });

  describe('Reactive updates', function() {
    it('should update when Y.js settings change', function() {
      Settings.initSettingsPage(state);
      
      YjsModule.setSetting(state, 'journal-name', 'reactive');
      
      // Note: In real app, Y.js observers would trigger updates
      Settings.renderSettingsPage(state);
      
      expect(document.getElementById('journal-name').value).to.equal('reactive');
    });
  });

  describe('AI Prompt functionality', function() {
    beforeEach(function() {
      // Add AI prompt preview elements to DOM
      const aiPromptPreview = document.createElement('div');
      aiPromptPreview.id = 'ai-prompt-preview';
      const aiPromptContent = document.createElement('div');
      aiPromptContent.id = 'ai-prompt-content';
      aiPromptPreview.appendChild(aiPromptContent);
      document.body.appendChild(aiPromptPreview);
    });

    // AI disabled case removed; server indicates availability when needed

    // No API key case removed

    it('should show AI prompt preview when available', async function() {
      await Settings.showCurrentAIPrompt();
      const promptPreview = document.getElementById('ai-prompt-preview');
      expect(promptPreview.style.display).to.equal('block');
    });

    it('should handle errors when showing AI prompt', async function() {
      // Remove AI prompt elements to trigger error
      document.getElementById('ai-prompt-preview').remove();
      
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      
      expect(async () => await Settings.showCurrentAIPrompt()).to.not.throw();
    });
  });

  describe('Error handling', function() {
    it('should handle missing form gracefully', function() {
      document.body.innerHTML = '';
      
      expect(() => Settings.initSettingsPage(state)).to.not.throw();
      expect(() => Settings.renderSettingsPage(state)).to.not.throw();
      expect(() => Settings.saveSettings(state)).to.not.throw();
    });

    it('should handle missing status elements gracefully', function() {
      document.getElementById('connection-status').remove();
      
      expect(() => Settings.initSettingsPage(state)).to.not.throw();
      expect(() => Settings.renderSettingsPage(state)).to.not.throw();
    });

    it('should handle corrupt settings data', function() {
      YjsModule.setSetting(state, 'openai-api-key', null);
      YjsModule.setSetting(state, 'ai-enabled', 'invalid');
      
      expect(() => Settings.renderSettingsPage(state)).to.not.throw();
    });
  });
});
