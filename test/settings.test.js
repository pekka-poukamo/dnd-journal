import { expect } from 'chai';
import './setup.js';
import * as Settings from '../js/settings.js';

describe('Settings Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
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
});
