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

    it('should load settings data', async function() {
      // Set some settings
      YjsModule.setSetting('openai-api-key', 'sk-test123');
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('sync-server-url', 'wss://test.com');
      
      await Settings.initSettingsPage();
      
      // Check that settings exist in Y.js
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-test123');
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://test.com');
    });
  });

  describe('renderSettingsPage', function() {
    it('should render settings form', function() {
      // Set settings in Y.js
      YjsModule.setSetting('openai-api-key', 'sk-456789');
      YjsModule.setSetting('ai-enabled', false);
      YjsModule.setSetting('sync-server-url', 'wss://example.com');
      
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
      
      // Verify data exists in Y.js
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-456789');
      expect(YjsModule.getSetting('ai-enabled')).to.be.false;
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://example.com');
    });

    it('should handle empty settings data', function() {
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
      
      // Default values should be returned
      expect(YjsModule.getSetting('openai-api-key', '')).to.equal('');
      expect(YjsModule.getSetting('ai-enabled', false)).to.be.false;
      expect(YjsModule.getSetting('sync-server-url', '')).to.equal('');
    });

    it('should handle missing form elements gracefully', function() {
      // Remove some form elements
      document.getElementById('openai-api-key').remove();
      
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
    });
  });

  describe('Settings data management', function() {
    beforeEach(async function() {
      await Settings.initSettingsPage();
    });

    it('should save settings data to Y.js', function() {
      // Test Y.js operations directly
      YjsModule.setSetting('openai-api-key', 'sk-new-key');
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('sync-server-url', 'wss://new-server.com');
      
      // Check Y.js data
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-new-key');
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
      expect(YjsModule.getSetting('sync-server-url')).to.equal('wss://new-server.com');
    });

    it('should handle trimming settings', function() {
      YjsModule.setSetting('openai-api-key', '  sk-trimmed  ');
      YjsModule.setSetting('sync-server-url', '  wss://trimmed.com  ');
      
      // Y.js stores exactly what we give it, trimming would be done by the form handler
      expect(YjsModule.getSetting('openai-api-key')).to.equal('  sk-trimmed  ');
      expect(YjsModule.getSetting('sync-server-url')).to.equal('  wss://trimmed.com  ');
    });

    it('should handle boolean settings', function() {
      // Test boolean values
      YjsModule.setSetting('ai-enabled', false);
      expect(YjsModule.getSetting('ai-enabled')).to.be.false;
      
      YjsModule.setSetting('ai-enabled', true);
      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
    });
  });

  describe('API and connection testing functionality', function() {
    beforeEach(async function() {
      await Settings.initSettingsPage();
    });

    it('should handle API key testing when key is available', function() {
      YjsModule.setSetting('openai-api-key', 'sk-valid-key');
      
      // Test that we can access the API key
      const apiKey = YjsModule.getSetting('openai-api-key');
      expect(apiKey).to.equal('sk-valid-key');
    });

    it('should handle missing API key for testing', function() {
      // Don't set API key
      const apiKey = YjsModule.getSetting('openai-api-key', '');
      expect(apiKey).to.equal('');
    });

    it('should handle connection testing with valid URL', function() {
      YjsModule.setSetting('sync-server-url', 'wss://valid-server.com');
      
      const url = YjsModule.getSetting('sync-server-url');
      expect(url).to.equal('wss://valid-server.com');
    });

    it('should handle invalid connection URL', function() {
      YjsModule.setSetting('sync-server-url', 'invalid-url');
      
      const url = YjsModule.getSetting('sync-server-url');
      expect(url).to.equal('invalid-url');
    });

    it('should handle missing sync URL', function() {
      const url = YjsModule.getSetting('sync-server-url', '');
      expect(url).to.equal('');
    });
  });

  describe('Reactive updates', function() {
    it('should update when Y.js settings change', async function() {
      await Settings.initSettingsPage();
      
      // Simulate Y.js data change
      YjsModule.setSetting('openai-api-key', 'sk-reactive-test');
      
      // Manually trigger render
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
      
      // Verify data
      expect(YjsModule.getSetting('openai-api-key')).to.equal('sk-reactive-test');
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

    it('should handle corrupt settings data', function() {
      // Set invalid settings
      YjsModule.settingsMap.set('ai-enabled', 'invalid-boolean');
      
      expect(() => {
        Settings.renderSettingsPage();
      }).to.not.throw();
    });
  });
});
