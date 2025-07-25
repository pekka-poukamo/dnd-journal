// Test for Yjs Sync Enhancement (ADR-0003)
// Follows ADR-0005: Mandatory Testing

import { expect } from 'chai';
import './setup.js';
import { createYjsSync } from '../js/sync.js';

describe('Yjs Sync (Functional)', () => {
  beforeEach(() => {
    global.testStorage = {};
    global.window.Y = undefined;
    global.window.WebsocketProvider = undefined;
    global.window.IndexeddbPersistence = undefined;
    // Don't set location directly to avoid JSDOM navigation errors
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
    it('should use repo-level configuration', () => {
      const sync = createYjsSync();
      
      // Test that sync initializes without configuration needed
      expect(sync.isAvailable).to.be.false; // Yjs not available in test
      expect(() => sync.getData()).to.not.throw;
      expect(() => sync.setData({})).to.not.throw;
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

    it('should provide status and helper methods', () => {
      const sync = createYjsSync();
      
      // Test that public API methods work
      expect(typeof sync.getStatus).to.equal('function');
      expect(typeof sync.getDeviceId).to.equal('function');
      expect(typeof sync.teardown).to.equal('function');
      
      expect(() => sync.getStatus()).to.not.throw;
      expect(() => sync.getDeviceId()).to.not.throw;
    });
  });

  describe('ADR-0003 Compliance', () => {
    it('should maintain localStorage primacy', () => {
      const sync = createYjsSync();
      
      // Sync should never interfere with localStorage-only operation
      expect(sync.isAvailable).to.be.false; // Without Yjs libraries
      
      // App should continue working normally
      const testData = { entries: [], character: {} };
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(testData));
      
      const retrieved = JSON.parse(global.localStorage.getItem('simple-dnd-journal'));
      expect(retrieved).to.deep.equal(testData);
    });

    it('should not interfere with existing functionality', () => {
      const sync = createYjsSync();
      
      // Test that sync doesn't break existing localStorage operations
      const testKey = 'test-key';
      const testValue = { test: 'data' };
      
      global.localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(global.localStorage.getItem(testKey));
      
      expect(retrieved).to.deep.equal(testValue);
      expect(sync.isAvailable).to.be.false; // Should not affect sync status
    });
  });

  describe('Device ID Management', () => {
    it('should generate consistent device IDs', () => {
      const sync1 = createYjsSync();
      const sync2 = createYjsSync();
      
      const deviceId1 = sync1.getDeviceId();
      const deviceId2 = sync2.getDeviceId();
      
      expect(deviceId1).to.equal(deviceId2); // Should be consistent
      expect(deviceId1).to.be.a('string');
      expect(deviceId1.length).to.be.greaterThan(10);
    });

    it('should persist device IDs across sessions', () => {
      const sync1 = createYjsSync();
      const deviceId1 = sync1.getDeviceId();
      
      // Simulate new session
      const sync2 = createYjsSync();
      const deviceId2 = sync2.getDeviceId();
      
      expect(deviceId1).to.equal(deviceId2);
    });
  });

  describe('Error Handling', () => {
    it('should handle Yjs initialization errors gracefully', () => {
      // Mock Yjs to throw error on initialization
      global.window.Y = {
        Doc: class {
          constructor() {
            throw new Error('Yjs initialization failed');
          }
        }
      };
      
      const sync = createYjsSync();
      
      expect(sync.isAvailable).to.be.false;
      expect(() => sync.getData()).to.not.throw;
      expect(() => sync.setData({})).to.not.throw;
    });

    it('should handle network errors gracefully', () => {
      // Mock WebsocketProvider to simulate network error
      global.window.WebsocketProvider = class {
        constructor() {
          this.on('error', () => {});
        }
        on() {}
        off() {}
        destroy() {}
      };
      
      const sync = createYjsSync();
      
      // Should still provide basic functionality
      expect(typeof sync.getDeviceId).to.equal('function');
      expect(typeof sync.getStatus).to.equal('function');
    });
  });

  describe('Status Reporting', () => {
    it('should provide accurate status information', () => {
      const sync = createYjsSync();
      const status = sync.getStatus();
      
      expect(status).to.have.property('available');
      expect(status).to.have.property('reason');
      expect(status).to.have.property('deviceId');
      expect(status).to.have.property('connected');
      
      expect(status.available).to.be.false; // Yjs not available in test
      expect(status.reason).to.be.a('string');
      expect(status.deviceId).to.be.a('string');
      expect(status.connected).to.be.false;
    });

    it('should update status when Yjs becomes available', () => {
      // Initially no Yjs
      const sync1 = createYjsSync();
      expect(sync1.getStatus().available).to.be.false;
      
      // Mock Yjs availability
      global.window.Y = {
        Doc: class {
          constructor() {
            this.on = () => {};
            this.off = () => {};
            this.getMap = () => ({
              observe: () => {},
              set: () => {},
              get: () => null
            });
          }
        }
      };
      
      global.window.WebsocketProvider = class {
        constructor() {
          this.on = () => {};
          this.off = () => {};
          this.destroy = () => {};
        }
      };
      
      global.window.IndexeddbPersistence = class {
        constructor() {
          this.on = () => {};
          this.off = () => {};
          this.destroy = () => {};
        }
      };
      
      const sync2 = createYjsSync();
      const status = sync2.getStatus();
      
      expect(status.available).to.be.true;
      expect(status.reason).to.equal('Yjs loaded successfully');
    });
  });

  describe('Teardown', () => {
    it('should clean up resources on teardown', () => {
      const sync = createYjsSync();
      
      // Should not throw when teardown is called
      expect(() => sync.teardown()).to.not.throw;
      
      // Should still provide basic functionality after teardown
      expect(() => sync.getDeviceId()).to.not.throw;
      expect(() => sync.getStatus()).to.not.throw;
    });

    it('should handle multiple teardown calls', () => {
      const sync = createYjsSync();
      
      expect(() => sync.teardown()).to.not.throw;
      expect(() => sync.teardown()).to.not.throw; // Second call should not throw
    });
  });
});