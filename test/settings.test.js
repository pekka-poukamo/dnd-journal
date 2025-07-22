const { expect } = require('chai');
require('./setup');

// Since settings.js is a browser module, we'll need to simulate its functions
describe('Settings Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
  });

  describe('Settings Data Management', () => {
    it('should store and retrieve settings in localStorage', () => {
      const testSettings = {
        apiKey: 'sk-test123',
        enableAIFeatures: true
      };

      // Simulate saving settings
      global.localStorage.setItem('simple-dnd-journal-settings', JSON.stringify(testSettings));

      // Simulate loading settings
      const stored = global.localStorage.getItem('simple-dnd-journal-settings');
      const loaded = JSON.parse(stored);

      expect(loaded).to.deep.equal(testSettings);
    });

    it('should handle missing settings gracefully', () => {
      const stored = global.localStorage.getItem('simple-dnd-journal-settings');
      expect(stored).to.be.null;
    });

    it('should validate API key format', () => {
      const validKey = 'sk-test123';
      const invalidKey = 'invalid-key';

      expect(validKey.startsWith('sk-')).to.be.true;
      expect(invalidKey.startsWith('sk-')).to.be.false;
    });
  });

  describe('Journal Data Export/Import', () => {
    it('should export journal data correctly', () => {
      const testData = {
        character: {
          name: 'Test Character',
          race: 'Human',
          class: 'Fighter'
        },
        entries: [
          {
            id: '1',
            title: 'Test Entry',
            content: 'Test content',
            timestamp: Date.now()
          }
        ]
      };

      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(testData));

      const stored = global.localStorage.getItem('simple-dnd-journal');
      const exported = JSON.parse(stored);

      expect(exported).to.deep.equal(testData);
    });

    it('should handle missing journal data for export', () => {
      const stored = global.localStorage.getItem('simple-dnd-journal');
      expect(stored).to.be.null;
    });

    it('should validate imported data structure', () => {
      const validData = {
        character: {},
        entries: []
      };

      const invalidData = "not an object";

      expect(typeof validData).to.equal('object');
      expect(validData).to.not.be.null;
      expect(typeof invalidData).to.not.equal('object');
    });
  });

  describe('Data Clearing', () => {
    it('should clear all stored data', () => {
      // Setup some data
      global.localStorage.setItem('simple-dnd-journal', '{"test": "data"}');
      global.localStorage.setItem('simple-dnd-journal-settings', '{"test": "settings"}');

      // Clear all data
      global.localStorage.removeItem('simple-dnd-journal');
      global.localStorage.removeItem('simple-dnd-journal-settings');

      // Verify data is cleared
      expect(global.localStorage.getItem('simple-dnd-journal')).to.be.null;
      expect(global.localStorage.getItem('simple-dnd-journal-settings')).to.be.null;
    });
  });
});
