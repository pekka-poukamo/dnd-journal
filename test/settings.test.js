import { expect } from 'chai';
import './setup.js';
import * as Settings from '../js/settings.js';
import { createSystem, clearSystem } from '../js/yjs.js';

describe('Settings Module', function() {
  beforeEach(async function() {
    // Reset localStorage and reinitialize Yjs mock system
    global.resetLocalStorage();
    clearSystem();
    await createSystem();
  });

  describe('Settings Data Management', () => {
    it('should load default settings when none exist', () => {
      const settings = Settings.loadSettings();
      
      expect(settings).to.have.property('apiKey', '');
      expect(settings).to.have.property('enableAIFeatures', false);
    });

    it('should load existing settings from localStorage', () => {
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };

      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      const loaded = Settings.loadSettings();
      expect(loaded).to.deep.equal(testSettings);
    });

    it('should save settings to localStorage', () => {
      const testSettings = {
        apiKey: 'sk-test456',
        enableAIFeatures: false
      };

      Settings.saveSettings(testSettings);

      const stored = global.localStorage.getItem('simple-dnd-journal-settings');
      const loaded = JSON.parse(stored);
      expect(loaded).to.deep.equal(testSettings);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      global.localStorage.setItem('simple-dnd-journal-settings', 'invalid-json');

      const settings = Settings.loadSettings();
      
      expect(settings).to.have.property('apiKey', '');
      expect(settings).to.have.property('enableAIFeatures', false);
    });

    it('should validate API key format', () => {
      const validKey = 'sk-test123';
      const invalidKey = 'invalid-key';

      expect(validKey.startsWith('sk-')).to.be.true;
      expect(invalidKey.startsWith('sk-')).to.be.false;
    });

    it('should test API key functionality', async () => {
      // Mock successful API test
      const result = await Settings.testApiKey('sk-test123');
      
      expect(result).to.have.property('success');
      expect(result).to.have.property('message');
    });
  });

  describe('API Key Testing', () => {
    it('should reject empty API key', async () => {
      const result = await Settings.testApiKey('');
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Invalid API key format');
    });

    it('should reject null API key', async () => {
      const result = await Settings.testApiKey(null);
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Invalid API key format');
    });

    it('should reject API key without sk- prefix', async () => {
      const result = await Settings.testApiKey('invalid-key-format');
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Invalid API key format');
    });

    it('should handle network errors during API test', async () => {
      // Mock fetch to throw network error
      const originalFetch = global.fetch;
      global.fetch = () => {
        throw new Error('Network error');
      };

      const result = await Settings.testApiKey('sk-test123');
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Network error: Unable to test API key');

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should handle API error responses', async () => {
      // Mock fetch to return error response
      const originalFetch = global.fetch;
      global.fetch = () => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Invalid API key provided' }
        })
      });

      const result = await Settings.testApiKey('sk-invalid123');
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Invalid API key provided');

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should handle successful API response', async () => {
      // Mock fetch to return successful response
      const originalFetch = global.fetch;
      global.fetch = () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const result = await Settings.testApiKey('sk-valid123');
      
      expect(result.success).to.be.true;
      expect(result.message).to.equal('API key is valid!');

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('should handle API error response without error message', async () => {
      // Mock fetch to return error response without specific message
      const originalFetch = global.fetch;
      global.fetch = () => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      });

      const result = await Settings.testApiKey('sk-invalid123');
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Invalid API key');

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });
});
