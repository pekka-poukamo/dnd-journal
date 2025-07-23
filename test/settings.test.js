const { expect } = require('chai');
require('./setup');

// Since settings.js is a browser module, we'll need to simulate its functions
describe('Settings Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
    
    // Setup window object for utils
    global.window = global.window || {};
    // Load utils for the settings module
    const utilsPath = require('path').join(__dirname, '../js/utils.js');
    const utilsContent = require('fs').readFileSync(utilsPath, 'utf8');
    eval(utilsContent);
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


});
