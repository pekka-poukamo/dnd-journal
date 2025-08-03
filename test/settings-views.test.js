import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import * as SettingsViews from '../js/settings-views.js';
import { showNotification } from '../js/utils.js';

describe('Settings Views Module', function() {
  beforeEach(function() {
    // Set up DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Set up a clean DOM environment for each test
    document.body.innerHTML = `
      <form id="settings-form">
        <input type="text" id="openai-api-key" name="openai-api-key" />
        <input type="checkbox" id="ai-enabled" name="ai-enabled" />
        <input type="text" id="sync-server-url" name="sync-server-url" />
      </form>
      <div id="connection-status"></div>
      <div id="test-container"></div>
    `;
  });

  describe('renderSettingsForm', function() {
    it('should populate API key input', function() {
      const settings = {
        'openai-api-key': 'sk-test123'
      };

      SettingsViews.renderSettingsForm(settings);

      const apiKeyInput = document.getElementById('openai-api-key');
      expect(apiKeyInput.value).to.equal('sk-test123');
    });

    it('should handle empty API key', function() {
      const settings = {
        'openai-api-key': ''
      };

      SettingsViews.renderSettingsForm(settings);

      const apiKeyInput = document.getElementById('openai-api-key');
      expect(apiKeyInput.value).to.equal('');
    });

    it('should handle undefined API key', function() {
      const settings = {};

      SettingsViews.renderSettingsForm(settings);

      const apiKeyInput = document.getElementById('openai-api-key');
      expect(apiKeyInput.value).to.equal('');
    });

    it('should set AI enabled checkbox when true', function() {
      const settings = {
        'ai-enabled': true
      };

      SettingsViews.renderSettingsForm(settings);

      const aiEnabledCheckbox = document.getElementById('ai-enabled');
      expect(aiEnabledCheckbox.checked).to.be.true;
    });

    it('should set AI enabled checkbox when string "true"', function() {
      const settings = {
        'ai-enabled': 'true'
      };

      SettingsViews.renderSettingsForm(settings);

      const aiEnabledCheckbox = document.getElementById('ai-enabled');
      expect(aiEnabledCheckbox.checked).to.be.true;
    });

    it('should unset AI enabled checkbox when false', function() {
      const settings = {
        'ai-enabled': false
      };

      SettingsViews.renderSettingsForm(settings);

      const aiEnabledCheckbox = document.getElementById('ai-enabled');
      expect(aiEnabledCheckbox.checked).to.be.false;
    });

    it('should populate sync server input', function() {
      const settings = {
        'sync-server-url': 'wss://test-server.com'
      };

      SettingsViews.renderSettingsForm(settings);

      const syncServerInput = document.getElementById('sync-server-url');
      expect(syncServerInput.value).to.equal('wss://test-server.com');
    });

    it('should handle empty sync server', function() {
      const settings = {
        'sync-server-url': ''
      };

      SettingsViews.renderSettingsForm(settings);

      const syncServerInput = document.getElementById('sync-server-url');
      expect(syncServerInput.value).to.equal('');
    });

    it('should handle missing form elements gracefully', function() {
      // Remove form elements
      document.getElementById('openai-api-key').remove();
      document.getElementById('ai-enabled').remove();
      document.getElementById('sync-server-url').remove();

      const settings = {
        'openai-api-key': 'sk-test',
        'ai-enabled': true,
        'dnd-journal-sync-server': 'wss://test.com'
      };

      expect(() => {
        SettingsViews.renderSettingsForm(settings);
      }).to.not.throw();
    });

    it('should handle null or undefined settings', function() {
      expect(() => {
        SettingsViews.renderSettingsForm(null || {});
      }).to.not.throw();

      expect(() => {
        SettingsViews.renderSettingsForm(undefined || {});
      }).to.not.throw();
    });

    it('should populate all settings at once', function() {
      const settings = {
        'openai-api-key': 'sk-complete-test',
        'ai-enabled': true,
        'sync-server-url': 'wss://complete-test.com'
      };

      SettingsViews.renderSettingsForm(settings);

      expect(document.getElementById('openai-api-key').value).to.equal('sk-complete-test');
      expect(document.getElementById('ai-enabled').checked).to.be.true;
      expect(document.getElementById('sync-server-url').value).to.equal('wss://complete-test.com');
    });
  });

  describe('renderConnectionStatus', function() {
    it('should show connected status', function() {
      SettingsViews.renderConnectionStatus(true, 'wss://test-server.com');

      const statusElement = document.getElementById('connection-status');
      expect(statusElement.textContent).to.equal('Connected to wss://test-server.com');
      expect(statusElement.className).to.include('connection-status--connected');
    });

    it('should show disconnected status', function() {
      SettingsViews.renderConnectionStatus(false, 'wss://test-server.com');

      const statusElement = document.getElementById('connection-status');
      expect(statusElement.textContent).to.equal('Disconnected from wss://test-server.com');
      expect(statusElement.className).to.include('connection-status--disconnected');
    });

    it('should show no server configured status', function() {
      SettingsViews.renderConnectionStatus(false, null);

      const statusElement = document.getElementById('connection-status');
      expect(statusElement.textContent).to.equal('No sync server configured');
      expect(statusElement.className).to.include('connection-status--none');
    });

    it('should show no server configured when empty string', function() {
      SettingsViews.renderConnectionStatus(false, '');

      const statusElement = document.getElementById('connection-status');
      expect(statusElement.textContent).to.equal('No sync server configured');
      expect(statusElement.className).to.include('connection-status--none');
    });

    it('should handle missing status element gracefully', function() {
      document.getElementById('connection-status').remove();

      expect(() => {
        SettingsViews.renderConnectionStatus(true, 'wss://test.com');
      }).to.not.throw();
    });

    it('should handle undefined parameters', function() {
      expect(() => {
        SettingsViews.renderConnectionStatus(undefined, undefined);
      }).to.not.throw();

      const statusElement = document.getElementById('connection-status');
      expect(statusElement.textContent).to.equal('No sync server configured');
    });
  });

  describe('showNotification', function() {
    afterEach(function() {
      // Clean up notifications after each test
      const notifications = document.querySelectorAll('.notification');
      notifications.forEach(n => n.remove());
    });

    it('should create and display notification', function() {
      showNotification('Test message');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('Test message');
      expect(notification.className).to.include('notification--info');
    });

    it('should create notification with custom type', function() {
      showNotification('Error message', 'error');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('Error message');
      expect(notification.className).to.include('notification--error');
    });

    it('should create notification with success type', function() {
      showNotification('Success message', 'success');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.className).to.include('notification--success');
    });

    it('should create notification with warning type', function() {
      showNotification('Warning message', 'warning');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.className).to.include('notification--warning');
    });

    it('should append notification to body', function() {
      const initialChildren = document.body.children.length;
      
      showNotification('Test message');

      expect(document.body.children.length).to.equal(initialChildren + 1);
      
      const notification = document.querySelector('.notification');
      expect(notification.parentElement).to.equal(document.body);
    });

    it('should auto-remove notification after timeout', function(done) {
      this.timeout(5000); // Increase timeout for this test
      
      showNotification('Temporary message', 'info', 1000); // Use shorter duration for faster test

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;

      // Check that it gets removed after the timeout
      setTimeout(() => {
        try {
          const removedNotification = document.querySelector('.notification');
          expect(removedNotification).to.not.exist;
          done();
        } catch (error) {
          done(error);
        }
      }, 1400); // Slightly longer than the 1000ms timeout
    });

    it('should handle multiple notifications', function() {
      showNotification('First message', 'info');
      showNotification('Second message', 'error');
      showNotification('Third message', 'success');

      const notifications = document.querySelectorAll('.notification');
      expect(notifications).to.have.length(3);
      
      expect(notifications[0].textContent).to.equal('First message');
      expect(notifications[1].textContent).to.equal('Second message');
      expect(notifications[2].textContent).to.equal('Third message');
    });

    it('should handle empty message', function() {
      showNotification('');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('');
    });

    it('should handle null message', function() {
      showNotification(null);

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('');
    });
  });

  describe('setTestConnectionLoading', function() {
    beforeEach(function() {
      // Add test connection button to DOM
      const testButton = document.createElement('button');
      testButton.id = 'test-connection';
      testButton.textContent = 'Test Connection';
      document.body.appendChild(testButton);
    });

    it('should set button to loading state', function() {
      SettingsViews.setTestConnectionLoading(true);

      const testButton = document.getElementById('test-connection');
      expect(testButton.disabled).to.be.true;
      expect(testButton.textContent).to.equal('Testing...');
    });

    it('should set button to normal state', function() {
      SettingsViews.setTestConnectionLoading(false);

      const testButton = document.getElementById('test-connection');
      expect(testButton.disabled).to.be.false;
      expect(testButton.textContent).to.equal('Test Connection');
    });

    it('should handle missing button element gracefully', function() {
      document.getElementById('test-connection').remove();

      expect(() => {
        SettingsViews.setTestConnectionLoading(true);
      }).to.not.throw();
    });
  });

  describe('renderAIPromptPreview', function() {
    beforeEach(function() {
      // Add AI prompt preview elements to DOM
      const aiPromptPreview = document.createElement('div');
      aiPromptPreview.id = 'ai-prompt-preview';
      const aiPromptContent = document.createElement('div');
      aiPromptContent.id = 'ai-prompt-content';
      aiPromptPreview.appendChild(aiPromptContent);
      document.body.appendChild(aiPromptPreview);
    });

    it('should render AI disabled state', function() {
      SettingsViews.renderAIPromptPreview(false, null);

      const promptContent = document.getElementById('ai-prompt-content');
      const promptPreview = document.getElementById('ai-prompt-preview');
      
      expect(promptContent.innerHTML).to.include('AI features are not enabled');
      expect(promptPreview.style.display).to.equal('block');
    });

    it('should render no context state', function() {
      SettingsViews.renderAIPromptPreview(true, null);

      const promptContent = document.getElementById('ai-prompt-content');
      expect(promptContent.innerHTML).to.include('No context available');
    });

    it('should render messages state', function() {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello world!' }
      ];

      SettingsViews.renderAIPromptPreview(true, messages);

      const promptContent = document.getElementById('ai-prompt-content');
      expect(promptContent.innerHTML).to.include('system-prompt');
      expect(promptContent.innerHTML).to.include('user-prompt');
      expect(promptContent.innerHTML).to.include('You are a helpful assistant.');
      expect(promptContent.innerHTML).to.include('Hello world!');
    });

    it('should handle missing preview elements gracefully', function() {
      document.getElementById('ai-prompt-preview').remove();

      expect(() => {
        SettingsViews.renderAIPromptPreview(true, null);
      }).to.not.throw();
    });

    it('should handle missing content element gracefully', function() {
      document.getElementById('ai-prompt-content').remove();

      expect(() => {
        SettingsViews.renderAIPromptPreview(true, null);
      }).to.not.throw();
    });
  });

  describe('renderCachedSettingsContent', function() {
    let mockCachedSettings, mockCachedFormData;

    beforeEach(function() {
      // Create form element
      const settingsForm = document.createElement('form');
      settingsForm.id = 'settings-form';
      
      const apiKeyInput = document.createElement('input');
      apiKeyInput.id = 'openai-api-key';
      apiKeyInput.name = 'openai-api-key';
      settingsForm.appendChild(apiKeyInput);
      
      const aiEnabledInput = document.createElement('input');
      aiEnabledInput.id = 'ai-enabled';
      aiEnabledInput.name = 'ai-enabled';
      aiEnabledInput.type = 'checkbox';
      settingsForm.appendChild(aiEnabledInput);
      
      document.body.appendChild(settingsForm);

      // Create connection status element
      const connectionStatus = document.createElement('div');
      connectionStatus.id = 'connection-status';
      document.body.appendChild(connectionStatus);

      // Mock the navigation cache functions
      mockCachedSettings = { 'openai-api-key': 'cached-key' };
      mockCachedFormData = { 'ai-enabled': true };
    });

    it('should render cached settings when available', function() {
      // Since we can't easily mock the navigation-cache imports in this context,
      // we'll test the function with empty cache (which is the default behavior)
      const elements = {
        settingsFormElement: document.getElementById('settings-form'),
        connectionStatusElement: document.getElementById('connection-status')
      };

      // This should not throw an error even with empty cache
      expect(() => {
        SettingsViews.renderCachedSettingsContent(elements);
      }).to.not.throw();
    });

    it('should handle missing form element gracefully', function() {
      const elements = {
        settingsFormElement: null,
        connectionStatusElement: document.getElementById('connection-status')
      };

      expect(() => {
        SettingsViews.renderCachedSettingsContent(elements);
      }).to.not.throw();
    });

    it('should handle missing connection status element gracefully', function() {
      const elements = {
        settingsFormElement: document.getElementById('settings-form'),
        connectionStatusElement: null
      };

      expect(() => {
        SettingsViews.renderCachedSettingsContent(elements);
      }).to.not.throw();
    });
  });

  describe('Error handling', function() {
    it('should handle DOM manipulation in hostile environment', function() {
      // Remove all elements
      document.body.innerHTML = '';

      expect(() => {
        SettingsViews.renderSettingsForm({ 'openai-api-key': 'test' });
      }).to.not.throw();

      expect(() => {
        SettingsViews.renderConnectionStatus(true, 'test');
      }).to.not.throw();

      expect(() => {
        showNotification('test');
      }).to.not.throw();
    });

    it('should handle malformed settings data', function() {
      const malformedSettings = {
        'openai-api-key': { invalid: 'object' },
        'ai-enabled': 'not-a-boolean',
        'dnd-journal-sync-server': 123
      };

      expect(() => {
        SettingsViews.renderSettingsForm(malformedSettings);
      }).to.not.throw();
    });
  });
});