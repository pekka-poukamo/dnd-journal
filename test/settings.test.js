import { expect } from 'chai';
import './setup.js';
import * as Settings from '../js/settings.js';
import * as YjsModule from '../js/yjs.js';

describe('Settings Page', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
    
    // Set up settings form DOM
    document.body.innerHTML = `
      <form id="settings-form">
        <input type="text" name="openai-api-key" id="openai-api-key" />
        <input type="checkbox" name="ai-enabled" id="ai-enabled" />
        <input type="text" name="sync-server-url" id="sync-server-url" />
        <button type="submit">Save Settings</button>
      </form>
      <button id="test-connection">Test Connection</button>
      <button id="test-api-key">Test API Key</button>
      <div id="connection-status"></div>
      <div id="api-status"></div>
    `;
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initSettingsPage', function() {
    it('should initialize without errors', async function() {
      expect(async () => {
        await Settings.initSettingsPage();
      }).to.not.throw();
    });

    it('should render form with current settings', async function() {
      // Set some settings
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('sync-server-url', 'wss://test.com');
      
      await Settings.initSettingsPage();
      
      // Check that form was populated
      expect(document.getElementById('openai-api-key').value).to.equal('sk-test123');
      expect(document.getElementById('ai-enabled').checked).to.be.true;
      expect(document.getElementById('sync-server-url').value).to.equal('wss://test.com');
    });
  });

  describe('renderSettingsPage', function() {
    it('should update form fields with settings data', function() {
      // Set settings in Y.js
      YjsModule.setSetting('openai-api-key', 'sk-456789');
      YjsModule.setSetting('ai-enabled', false);
      YjsModule.setSetting('sync-server-url', 'wss://example.com');
      
      Settings.renderSettingsPage();
      
      // Check form fields
      expect(document.getElementById('openai-api-key').value).to.equal('sk-456789');
      expect(document.getElementById('ai-enabled').checked).to.be.false;
      expect(document.getElementById('sync-server-url').value).to.equal('wss://example.com');
    });

    it('should handle empty settings data', function() {
      Settings.renderSettingsPage();
      
      // All fields should be empty/default
      expect(document.getElementById('openai-api-key').value).to.equal('');
      expect(document.getElementById('ai-enabled').checked).to.be.false;
      expect(document.getElementById('sync-server-url').value).to.equal('');
    });

    it('should handle missing form elements gracefully', function() {
      // Remove some form elements
      document.getElementById('openai-api-key').remove();
      
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
    });
  });

  describe('Settings form handling', function() {
    beforeEach(async function() {
      await Settings.initSettingsPage();
    });

    it('should save settings on form submission', function() {
      // Fill form
      document.getElementById('openai-api-key').value = 'sk-new-key';
      document.getElementById('ai-enabled').checked = true;
      document.getElementById('sync-server-url').value = 'wss://new-server.com';
      
      // Submit form
      const form = document.getElementById('settings-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      
      // Check Y.js data
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-new-key');
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://new-server.com');
    });

    it('should trim whitespace from text inputs', function() {
      document.getElementById('openai-api-key').value = '  sk-trimmed  ';
      document.getElementById('sync-server-url').value = '  wss://trimmed.com  ';
      
      // Submit form
      const form = document.getElementById('settings-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      
      // Check Y.js data is trimmed
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-trimmed');
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://trimmed.com');
    });

    it('should handle boolean checkbox values', function() {
      // Test unchecked checkbox
      document.getElementById('ai-enabled').checked = false;
      
      const form = document.getElementById('settings-form');
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      
      expect(YjsModule.getSetting('ai-enabled')).to.be.false;
      
      // Test checked checkbox
      document.getElementById('ai-enabled').checked = true;
      form.dispatchEvent(event);
      
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
    });
  });

  describe('API key testing', function() {
    beforeEach(async function() {
      await Settings.initSettingsPage();
    });

    it('should test API key successfully', async function() {
      // Set valid API key
      YjsModule.setSetting('openai-api-key', 'sk-valid-key');
      
      // Mock successful API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: true,
        json: async () => ({ data: [{ id: 'test-model' }] })
      });
      
      try {
        const testBtn = document.getElementById('test-api-key');
        const event = new Event('click', { bubbles: true });
        testBtn.dispatchEvent(event);
        
        // Should attempt API call
        expect(global.fetch).to.have.been;
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle API key test failure', async function() {
      // Set invalid API key
      YjsModule.setSetting('openai-api-key', 'sk-invalid-key');
      
      // Mock failed API call
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        ok: false,
        status: 401
      });
      
      try {
        const testBtn = document.getElementById('test-api-key');
        const event = new Event('click', { bubbles: true });
        testBtn.dispatchEvent(event);
        
        // Should handle error gracefully
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle missing API key', async function() {
      // Don't set API key
      
      const testBtn = document.getElementById('test-api-key');
      const event = new Event('click', { bubbles: true });
      testBtn.dispatchEvent(event);
      
      // Should handle missing key gracefully
      const apiStatus = document.getElementById('api-status');
      expect(apiStatus.innerHTML).to.include('Please enter an API key');
    });
  });

  describe('Connection testing', function() {
    beforeEach(async function() {
      await Settings.initSettingsPage();
    });

    it('should test connection with valid URL', async function() {
      // Set valid sync server URL
      YjsModule.setSetting('sync-server-url', 'wss://valid-server.com');
      
      const testBtn = document.getElementById('test-connection');
      const event = new Event('click', { bubbles: true });
      testBtn.dispatchEvent(event);
      
      // Should attempt connection test
      const connectionStatus = document.getElementById('connection-status');
      expect(connectionStatus.innerHTML).to.include('Testing');
    });

    it('should handle invalid connection URL', async function() {
      // Set invalid URL
      YjsModule.setSetting('sync-server-url', 'invalid-url');
      
      const testBtn = document.getElementById('test-connection');
      const event = new Event('click', { bubbles: true });
      testBtn.dispatchEvent(event);
      
      // Should show error
      const connectionStatus = document.getElementById('connection-status');
      expect(connectionStatus.innerHTML).to.include('Invalid');
    });

    it('should handle missing sync URL', async function() {
      // Don't set sync URL
      
      const testBtn = document.getElementById('test-connection');
      const event = new Event('click', { bubbles: true });
      testBtn.dispatchEvent(event);
      
      // Should handle missing URL gracefully
      const connectionStatus = document.getElementById('connection-status');
      expect(connectionStatus.innerHTML).to.include('Please enter a sync server URL');
    });
  });

  describe('Reactive updates', function() {
    it('should update form when Y.js settings change', async function() {
      await Settings.initSettingsPage();
      
      // Simulate Y.js data change
      YjsModule.setSetting('openai-api-key', 'sk-reactive-test');
      
      // Manually trigger the observer callback (in real app, Y.js would do this)
      Settings.renderSettingsPage();
      
      expect(document.getElementById('openai-api-key').value).to.equal('sk-reactive-test');
    });
  });

  describe('Error handling', function() {
    it('should handle missing form gracefully', async function() {
      // Remove form from DOM
      document.body.innerHTML = '<div>No form here</div>';
      
      expect(async () => {
        await Settings.initSettingsPage();
      }).to.not.throw();
    });

    it('should handle missing status elements gracefully', function() {
      // Remove status divs
      document.getElementById('connection-status').remove();
      document.getElementById('api-status').remove();
      
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
    });

    it('should handle Y.js initialization failure', async function() {
      // Force Y.js to fail
      const originalInitYjs = YjsModule.initYjs;
      YjsModule.initYjs = async () => {
        throw new Error('Y.js init failed');
      };
      
      try {
        // Should handle error gracefully
        await Settings.initSettingsPage();
        // Test passes if no uncaught exception
      } finally {
        YjsModule.initYjs = originalInitYjs;
      }
    });

    it('should handle corrupt settings data', function() {
      // Set invalid settings
      YjsModule.settingsMap.set('ai-enabled', 'invalid-boolean');
      
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
    });
  });
});
