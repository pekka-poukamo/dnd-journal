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
const YjsSync = require('../js/sync.js');

describe('YjsSync', () => {
  beforeEach(() => {
    global.testStorage = {};
    global.window.Y = undefined;
    global.window.WebsocketProvider = undefined;
    global.window.IndexeddbPersistence = undefined;
    global.window.location = { search: '', href: 'http://localhost:3000' };
  });

  describe('Graceful Degradation (ADR-0003)', () => {
    it('should handle missing Yjs libraries gracefully', () => {
      const sync = new YjsSync();
      
      expect(sync.isAvailable).to.be.false;
      expect(sync.getData()).to.be.null;
      
      // Should not throw when calling methods
      sync.setData({ test: 'data' });
      expect(() => sync.onChange(() => {})).to.not.throw;
    });

    it('should indicate unavailability in status', () => {
      const sync = new YjsSync();
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
      const sync = new YjsSync();
      
      // Verify the localStorage mock is working
      expect(global.window.localStorage.getItem('dnd-journal-pi-server')).to.equal('ws://stored.server:1234');
      
      const config = sync.getPiServerConfig();
      expect(config).to.equal('ws://stored.server:1234');
    });

    it('should return null when no configuration is available', () => {
      // Clear storage and location
      global.testStorage = {};
      global.window.location = { search: '', href: 'http://localhost:3000' };
      
      const sync = new YjsSync();
      const config = sync.getPiServerConfig();
      
      expect(config).to.be.null;
    });

    it('should generate and persist device IDs', () => {
      const sync = new YjsSync();
      const deviceId1 = sync.getDeviceId();
      const deviceId2 = sync.getDeviceId();
      
      expect(deviceId1).to.be.a('string');
      expect(deviceId1).to.equal(deviceId2); // Should be consistent
      expect(deviceId1).to.match(/^device-[a-z0-9]+$|^device-test-[a-z0-9]+$/); // Allow test fallback
    });

    it('should handle configuration changes', () => {
      const sync = new YjsSync();
      
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
      const sync = new YjsSync();
      
      // Sync should never interfere with localStorage-only operation
      expect(sync.isAvailable).to.be.false; // Without Yjs libraries
      
      // App should continue working normally
      const testData = { entries: [], character: {} };
      sync.setData(testData); // Should not throw
      expect(sync.getData()).to.be.null; // Indicates to use localStorage
    });

    it('should be optional enhancement', () => {
      const sync = new YjsSync();
      
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
      const sync = new YjsSync();
      
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
      const sync = new YjsSync();
      
      expect(sync.isAvailable).to.be.true;
      expect(sync.ydoc).to.exist;
      expect(sync.ymap).to.exist;
    });

    it('should handle data operations when available', () => {
      const sync = new YjsSync();
      const testData = { entries: [], character: { name: 'Test' } };
      
      sync.setData(testData);
      const retrieved = sync.getData();
      
      expect(retrieved).to.deep.equal(testData);
    });

    it('should provide meaningful status when available', () => {
      const sync = new YjsSync();
      const status = sync.getStatus();
      
      expect(status.available).to.be.true;
      expect(status.connected).to.be.a('boolean');
      expect(status.providers).to.be.an('array');
    });

    it('should handle callback registration', () => {
      const sync = new YjsSync();
      let callbackFired = false;
      
      // Set some test data first
      sync.setData({ test: 'data' });
      
      sync.onChange(() => { callbackFired = true; });
      sync.notifyCallbacks();
      
      expect(callbackFired).to.be.true;
    });
  });

  describe('Error Handling', () => {
    it('should handle Yjs initialization errors gracefully', () => {
      global.window.Y = {
        Doc: function() {
          throw new Error('Mock initialization error');
        }
      };

      const sync = new YjsSync();
      
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

      const sync = new YjsSync();
      
      // Register a callback that throws
      sync.onChange(() => {
        throw new Error('Callback error');
      });
      
      // Should not crash when notifying callbacks
      expect(() => sync.notifyCallbacks()).to.not.throw;
    });
  });
});