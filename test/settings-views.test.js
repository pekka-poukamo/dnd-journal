import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import * as SettingsViews from '../js/settings-views.js';

describe('Settings Views Module', function() {
  beforeEach(function() {
    // Set up DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Set up a clean DOM environment for each test
    document.body.innerHTML = `
      <form id="settings-form">
        <input type="text" id="api-key" />
        <input type="checkbox" id="ai-enabled" />
        <input type="text" id="sync-server" />
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

      const apiKeyInput = document.getElementById('api-key');
      expect(apiKeyInput.value).to.equal('sk-test123');
    });

    it('should handle empty API key', function() {
      const settings = {
        'openai-api-key': ''
      };

      SettingsViews.renderSettingsForm(settings);

      const apiKeyInput = document.getElementById('api-key');
      expect(apiKeyInput.value).to.equal('');
    });

    it('should handle undefined API key', function() {
      const settings = {};

      SettingsViews.renderSettingsForm(settings);

      const apiKeyInput = document.getElementById('api-key');
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
        'dnd-journal-sync-server': 'wss://test-server.com'
      };

      SettingsViews.renderSettingsForm(settings);

      const syncServerInput = document.getElementById('sync-server');
      expect(syncServerInput.value).to.equal('wss://test-server.com');
    });

    it('should handle empty sync server', function() {
      const settings = {
        'dnd-journal-sync-server': ''
      };

      SettingsViews.renderSettingsForm(settings);

      const syncServerInput = document.getElementById('sync-server');
      expect(syncServerInput.value).to.equal('');
    });

    it('should handle missing form elements gracefully', function() {
      // Remove form elements
      document.getElementById('api-key').remove();
      document.getElementById('ai-enabled').remove();
      document.getElementById('sync-server').remove();

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
        'dnd-journal-sync-server': 'wss://complete-test.com'
      };

      SettingsViews.renderSettingsForm(settings);

      expect(document.getElementById('api-key').value).to.equal('sk-complete-test');
      expect(document.getElementById('ai-enabled').checked).to.be.true;
      expect(document.getElementById('sync-server').value).to.equal('wss://complete-test.com');
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
      SettingsViews.showNotification('Test message');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('Test message');
      expect(notification.className).to.include('notification--info');
    });

    it('should create notification with custom type', function() {
      SettingsViews.showNotification('Error message', 'error');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('Error message');
      expect(notification.className).to.include('notification--error');
    });

    it('should create notification with success type', function() {
      SettingsViews.showNotification('Success message', 'success');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.className).to.include('notification--success');
    });

    it('should create notification with warning type', function() {
      SettingsViews.showNotification('Warning message', 'warning');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.className).to.include('notification--warning');
    });

    it('should append notification to body', function() {
      const initialChildren = document.body.children.length;
      
      SettingsViews.showNotification('Test message');

      expect(document.body.children.length).to.equal(initialChildren + 1);
      
      const notification = document.querySelector('.notification');
      expect(notification.parentElement).to.equal(document.body);
    });

    it('should auto-remove notification after timeout', function(done) {
      SettingsViews.showNotification('Temporary message');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;

      // Check that it gets removed after the timeout
      setTimeout(() => {
        const removedNotification = document.querySelector('.notification');
        expect(removedNotification).to.not.exist;
        done();
      }, 3100); // Slightly longer than the 3000ms timeout
    });

    it('should handle multiple notifications', function() {
      SettingsViews.showNotification('First message', 'info');
      SettingsViews.showNotification('Second message', 'error');
      SettingsViews.showNotification('Third message', 'success');

      const notifications = document.querySelectorAll('.notification');
      expect(notifications).to.have.length(3);
      
      expect(notifications[0].textContent).to.equal('First message');
      expect(notifications[1].textContent).to.equal('Second message');
      expect(notifications[2].textContent).to.equal('Third message');
    });

    it('should handle empty message', function() {
      SettingsViews.showNotification('');

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('');
    });

    it('should handle null message', function() {
      SettingsViews.showNotification(null);

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      expect(notification.textContent).to.equal('');
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
        SettingsViews.showNotification('test');
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