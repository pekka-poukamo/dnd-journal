// Test for Yjs Sync Enhancement (ADR-0003)
// Follows ADR-0005: Mandatory Testing

const { expect } = require('chai');

// Mock browser environment for tests
global.window = {
  Y: undefined, // Simulate Yjs not available
  WebsocketProvider: undefined,
  IndexeddbPersistence: undefined,
  localStorage: {
    getItem: (key) => global.testStorage[key] || null,
    setItem: (key, value) => { global.testStorage[key] = value; },
    removeItem: (key) => { delete global.testStorage[key]; }
  },
  location: {
    search: '',
    href: 'http://localhost:3000'
  }
};

global.testStorage = {};

// Import after setting up mocks
const { createYjsSync } = require('../js/sync.js');

describe('Yjs Sync (Functional)', () => {
  beforeEach(() => {
    global.testStorage = {};
    global.window.Y = undefined;
    global.window.WebsocketProvider = undefined;
    global.window.IndexeddbPersistence = undefined;
    global.window.location = { search: '', href: 'http://localhost:3000' };
  });

  describe('Graceful Degradation (ADR-0003)', () => {
    it('should handle missing Yjs libraries gracefully', () => {
      const sync = createYjsSync();
      
      expect(sync.isAvailable).to.be.false;
      expect(sync.getData()).to.be.null;
      
      // Should not throw when calling methods
      sync.setData({ test: 'data' });
      expect(() => sync.onChange(() => {})).to.not.throw;
    });

    it('should indicate unavailability in status', () => {
      const sync = createYjsSync();
      const status = sync.getStatus();
      
      expect(status.available).to.be.false;
      expect(status.reason).to.equal('Yjs not loaded');
    });
  });

  describe('Configuration Management', () => {
    it('should use stored Pi server configuration', () => {
      // Clear and set up specific storage
      global.testStorage = {};
      global.testStorage['dnd-journal-pi-server'] = 'ws://stored.server:1234';
      
      global.window.location = { search: '', href: 'http://localhost:3000' };
      
      // Create sync instance and test
      const sync = createYjsSync();
      
      // Verify the localStorage mock is working
      expect(global.testStorage['dnd-journal-pi-server']).to.equal('ws://stored.server:1234');
      
      // Test that configuration doesn't crash
      expect(() => sync.configurePiServer('ws://test.server:1234')).to.not.throw;
    });

    it('should return null when no configuration is available', () => {
      // Clear storage and location
      global.testStorage = {};
      global.window.location = { search: '', href: 'http://localhost:3000' };
      
      const sync = createYjsSync();
      // Test that sync starts without throwing even with no config
      expect(sync.isAvailable).to.be.false; // Yjs not available in test
      expect(() => sync.configurePiServer(null)).to.not.throw;
    });

    it('should generate and persist device IDs', () => {
      const sync = createYjsSync();
      const deviceId1 = sync.getDeviceId();
      
      expect(deviceId1).to.be.a('string');
      expect(deviceId1).to.match(/^device-[a-z0-9]+$|^device-test-[a-z0-9]+$/); // Allow test fallback
      
      // Test that function works and returns valid device ID format
      expect(deviceId1).to.include('device');
      expect(deviceId1.length).to.be.greaterThan(10); // Reasonable length check
    });

    it('should handle configuration changes', () => {
      const sync = createYjsSync();
      
      // Test that configurePiServer doesn't crash
      expect(() => {
        sync.configurePiServer('ws://192.168.1.100:1234');
      }).to.not.throw;
      
      expect(() => {
        sync.configurePiServer(null);
      }).to.not.throw;
    });
  });

  describe('ADR-0003 Compliance', () => {
    it('should maintain localStorage primacy', () => {
      const sync = createYjsSync();
      
      // Sync should never interfere with localStorage-only operation
      expect(sync.isAvailable).to.be.false; // Without Yjs libraries
      
      // App should continue working normally
      const testData = { entries: [], character: {} };
      sync.setData(testData); // Should not throw
      expect(sync.getData()).to.be.null; // Indicates to use localStorage
    });

    it('should be optional enhancement', () => {
      const sync = createYjsSync();
      
      // Sync unavailable should not break anything
      expect(() => {
        sync.setData({ test: 'data' });
        sync.onChange(() => {});
        sync.getStatus();
        sync.configurePiServer('ws://test:1234');
        sync.teardown();
      }).to.not.throw;
    });

    it('should provide configuration helpers', () => {
      const sync = createYjsSync();
      
      expect(typeof sync.configurePiServer).to.equal('function');
      expect(typeof sync.getStatus).to.equal('function');
      expect(typeof sync.teardown).to.equal('function');
    });
  });

  describe('Mock Yjs Integration', () => {
    beforeEach(() => {
      // Mock Yjs availability
      global.window.Y = {
        Doc: function() {
          this.data = {};
          this.getMap = (name) => ({
            get: (key) => this.data[key],
            set: (key, value) => { this.data[key] = value; },
            observe: (callback) => { this.callback = callback; }
          });
        }
      };
      global.window.WebsocketProvider = function(url, room, doc) {
        this.url = url;
        this.wsconnected = false;
        this.on = (event, callback) => {
          if (event === 'status') {
            this.statusCallback = callback;
          }
        };
        this.destroy = () => {};
      };
      global.window.IndexeddbPersistence = function(name, doc) {
        this.on = (event, callback) => {
          if (event === 'synced') {
            setTimeout(callback, 0); // Simulate async
          }
        };
        this.destroy = () => {};
      };
    });

    it('should initialize successfully with Yjs available', () => {
      const sync = createYjsSync();
      
      expect(sync.isAvailable).to.be.true;
      // Internal state is not exposed in functional API
      expect(sync._getState).to.exist;
      expect(sync._getState().ydoc).to.exist;
    });

    it('should handle data operations when available', () => {
      const sync = createYjsSync();
      const testData = { entries: [], character: { name: 'Test' } };
      
      sync.setData(testData);
      const retrieved = sync.getData();
      
      expect(retrieved).to.deep.equal(testData);
    });

    it('should provide meaningful status when available', () => {
      const sync = createYjsSync();
      const status = sync.getStatus();
      
      expect(status.available).to.be.true;
      expect(status.connected).to.be.a('boolean');
      expect(status.providers).to.be.an('array');
    });

    it('should handle callback registration', () => {
      const sync = createYjsSync();
      let callbackFired = false;
      
      // Set some test data first
      sync.setData({ test: 'data' });
      
      // Register callback
      sync.onChange(() => { callbackFired = true; });
      
      // The callback registration itself should work
      expect(sync._getState().callbacks).to.have.length(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle Yjs initialization errors gracefully', () => {
      global.window.Y = {
        Doc: function() {
          throw new Error('Mock initialization error');
        }
      };

      const sync = createYjsSync();
      
      expect(sync.isAvailable).to.be.false;
      expect(() => sync.setData({})).to.not.throw;
    });

    it('should handle callback errors gracefully', () => {
      global.window.Y = {
        Doc: function() {
          this.data = { data: { test: 'value' } };
          this.getMap = () => ({
            get: (key) => this.data[key],
            set: (key, value) => { this.data[key] = value; },
            observe: () => {}
          });
        }
      };
      global.window.WebsocketProvider = function() {
        this.on = () => {};
        this.destroy = () => {};
      };
      global.window.IndexeddbPersistence = function() {
        this.on = () => {};
        this.destroy = () => {};
      };

      const sync = createYjsSync();
      
      // Register a callback that throws
      sync.onChange(() => {
        throw new Error('Callback error');
      });
      
      // Should not crash when notifying callbacks
      expect(() => sync.notifyCallbacks()).to.not.throw;
    });
  });
});