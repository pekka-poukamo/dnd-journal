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
            <input id="openai-api-key" name="openai-api-key" />
            <input id="ai-enabled" name="ai-enabled" type="checkbox" />
            <input id="sync-server-url" name="sync-server-url" />
            <button type="submit">Save Settings</button>
          </form>
          <div id="connection-status"></div>
          <button id="test-api-key">Test API Key</button>
          <button id="test-connection">Test Connection</button>
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
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test123');
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'sync-server-url', 'ws://localhost:8080');
      
      Settings.initSettingsPage(state);
      Settings.renderSettingsPage(state);
      
      expect(document.getElementById('openai-api-key').value).to.equal('sk-test123');
      expect(document.getElementById('ai-enabled').checked).to.be.true;
      expect(document.getElementById('sync-server-url').value).to.equal('ws://localhost:8080');
    });
  });

  describe('renderSettingsPage', function() {
    it('should render settings form', function() {
      YjsModule.setSetting(state, 'openai-api-key', 'sk-test456');
      YjsModule.setSetting(state, 'ai-enabled', false);
      
      Settings.initSettingsPage(state);
      
      expect(document.getElementById('openai-api-key').value).to.equal('sk-test456');
      expect(document.getElementById('ai-enabled').checked).to.be.false;
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
      document.getElementById('openai-api-key').value = 'sk-newsecret';
      document.getElementById('ai-enabled').checked = true;
      document.getElementById('sync-server-url').value = 'ws://newserver:9000';
      
      Settings.saveSettings(state);
      
      expect(YjsModule.getSetting(state, 'openai-api-key')).to.equal('sk-newsecret');
      expect(YjsModule.getSetting(state, 'ai-enabled')).to.be.true;
      expect(YjsModule.getSetting(state, 'sync-server-url')).to.equal('ws://newserver:9000');
    });

    it('should handle trimming settings', function() {
      // Initialize the page first to set up form element reference
      Settings.initSettingsPage(state);
      
      document.getElementById('openai-api-key').value = '  sk-trimtest  ';
      document.getElementById('sync-server-url').value = '  ws://trimserver  ';
      
      Settings.saveSettings(state);
      
      // Settings should be trimmed when saved
      expect(YjsModule.getSetting(state, 'openai-api-key')).to.equal('sk-trimtest');
      expect(YjsModule.getSetting(state, 'sync-server-url')).to.equal('ws://trimserver');
    });

    it('should handle boolean settings', function() {
      // Initialize the page first to set up form element reference
      Settings.initSettingsPage(state);
      
      document.getElementById('ai-enabled').checked = true;
      
      Settings.saveSettings(state);
      
      expect(YjsModule.getSetting(state, 'ai-enabled')).to.be.true;
      
      document.getElementById('ai-enabled').checked = false;
      Settings.saveSettings(state);
      
      expect(YjsModule.getSetting(state, 'ai-enabled')).to.be.false;
    });
  });

  describe('API and connection testing functionality', function() {
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

    it('should handle connection testing with valid URL', function() {
      YjsModule.setSetting(state, 'sync-server-url', 'ws://localhost:8080');
      
      expect(() => Settings.testConnection(state)).to.not.throw();
    });

    it('should handle invalid connection URL', function() {
      YjsModule.setSetting(state, 'sync-server-url', 'invalid-url');
      
      expect(() => Settings.testConnection(state)).to.not.throw();
    });

    it('should handle missing sync URL', function() {
      const syncUrl = YjsModule.getSetting(state, 'sync-server-url', '');
      expect(syncUrl).to.equal('');
      
      expect(() => Settings.testConnection(state)).to.not.throw();
    });
  });

  describe('Reactive updates', function() {
    it('should update when Y.js settings change', function() {
      Settings.initSettingsPage(state);
      
      YjsModule.setSetting(state, 'openai-api-key', 'sk-reactive');
      YjsModule.setSetting(state, 'ai-enabled', true);
      
      // Note: In real app, Y.js observers would trigger updates
      Settings.renderSettingsPage(state);
      
      expect(document.getElementById('openai-api-key').value).to.equal('sk-reactive');
      expect(document.getElementById('ai-enabled').checked).to.be.true;
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
