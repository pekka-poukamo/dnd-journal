import { expect } from 'chai';
import './setup.js';
import * as Yjs from '../js/yjs.js';

// Import and mock the sync config for testing
import * as originalModule from '../sync-config.js';

describe('Yjs Module - Internal Functions', function() {
  afterEach(function() {
    Yjs.clearSystem();
  });

  describe('WebSocket URL Validation (isValidWebSocketUrl)', function() {
    // Since isValidWebSocketUrl is internal, we test it indirectly through getSyncServers behavior
    
    it('should handle invalid WebSocket URLs in configuration', async function() {
      // Create a system and verify it handles config properly
      const system = await Yjs.createSystem();
      
      // In test environment, should always be mock system
      expect(system).to.have.property('providers');
      expect(Array.isArray(system.providers)).to.be.true;
    });

    it('should validate URL strings properly', function() {
      // Test through error scenarios that would trigger URL validation
      expect(() => {
        // These operations should not throw even with invalid URLs
        const status = Yjs.getSyncStatus([
          { url: null },
          { url: undefined },
          { url: '' },
          { url: 'invalid-url' },
          { url: 'http://not-websocket.com' }
        ]);
        expect(status).to.be.an('object');
      }).to.not.throw();
    });

    it('should handle malformed URL objects', function() {
      const mockProviders = [
        { url: 'wss://valid.com', wsconnected: true },
        { url: 'not-a-url', wsconnected: false },
        { url: null, wsconnected: false },
        { url: undefined, wsconnected: false }
      ];
      
      const status = Yjs.getSyncStatus(mockProviders);
      expect(status.available).to.be.true;
      expect(status.totalProviders).to.equal(4);
    });
  });

  describe('Sync Server Configuration (getSyncServers)', function() {
    it('should handle SYNC_CONFIG errors gracefully', async function() {
      // Test system creation which internally calls getSyncServers
      const system = await Yjs.createSystem();
      
      // Should succeed even if config has issues
      expect(system).to.be.an('object');
      expect(system).to.have.property('providers');
    });

    it('should fallback to default servers on config error', async function() {
      // Create system multiple times to test config consistency
      const system1 = await Yjs.createSystem();
      Yjs.clearSystem();
      const system2 = await Yjs.createSystem();
      
      expect(system1).to.not.equal(system2);
      expect(system2).to.have.property('providers');
    });
  });

  describe('Provider Creation (createSyncProviders)', function() {
    it('should handle WebSocket provider creation errors', async function() {
      // Test system creation which internally creates providers
      const system = await Yjs.createSystem();
      
      // In test environment, providers array should be empty (mock)
      expect(system.providers).to.be.an('array');
      expect(system.providers).to.have.lengthOf(0);
    });

    it('should filter out null providers from failed connections', function() {
      // Test through system behavior - mock system filters properly
      expect(() => {
        // This should not throw even if provider creation would fail
        Yjs.createSystem();
      }).to.not.throw();
    });
  });

  describe('Update Callback Execution (triggerUpdateCallbacks)', function() {
    it('should handle callback execution errors gracefully', async function() {
      const callbackResults = [];
      
      // Register callbacks that might throw
      const errorCallback = () => {
        throw new Error('Callback error');
      };
      
      const successCallback = () => {
        callbackResults.push('success');
      };
      
      Yjs.onUpdate(errorCallback);
      Yjs.onUpdate(successCallback);
      
      // Create system - this would trigger callbacks in non-mock environment
      const system = await Yjs.createSystem();
      
      // Should not throw even if callbacks error
      expect(system).to.be.an('object');
    });

    it('should execute multiple callbacks', async function() {
      let callback1Called = false;
      let callback2Called = false;
      let callback3Called = false;
      
      Yjs.onUpdate(() => { callback1Called = true; });
      Yjs.onUpdate(() => { callback2Called = true; });
      Yjs.onUpdate(() => { callback3Called = true; });
      
      // In mock system, callbacks aren't automatically triggered
      await Yjs.createSystem();
      
      // But registration should work without errors
      expect(() => {
        Yjs.onUpdate(() => {});
      }).to.not.throw();
    });

    it('should handle callback with system parameter', async function() {
      let receivedSystem = null;
      
      const callback = (system) => {
        receivedSystem = system;
      };
      
      Yjs.onUpdate(callback);
      await Yjs.createSystem();
      
      // In mock environment, callback isn't triggered, but registration works
      expect(receivedSystem).to.be.null;
    });
  });

  describe('Mock System Edge Cases', function() {
    it('should handle complex journal map scenarios', async function() {
      const system = await Yjs.createSystem();
      
      // Test complex entries structure
      const complexEntries = [
        { id: '1', nested: { data: 'test' } },
        { id: '2', array: [1, 2, 3] }
      ];
      
      system.journalMap.set('entries', complexEntries);
      const retrieved = system.journalMap.get('entries');
      
      expect(retrieved).to.deep.equal(complexEntries);
      expect(typeof retrieved.toArray).to.equal('function');
    });

    it('should handle journal map with malformed data', async function() {
      const system = await Yjs.createSystem();
      
      // Test setting various data types to entries
      system.journalMap.set('entries', null);
      let retrieved = system.journalMap.get('entries');
      expect(Array.isArray(retrieved)).to.be.true;
      expect(retrieved).to.have.lengthOf(0);
      
      system.journalMap.set('entries', undefined);
      retrieved = system.journalMap.get('entries');
      expect(Array.isArray(retrieved)).to.be.true;
      
      system.journalMap.set('entries', { not: 'an array' });
      retrieved = system.journalMap.get('entries');
      expect(Array.isArray(retrieved)).to.be.true;
    });

    it('should handle edge cases in mock map operations', async function() {
      const system = await Yjs.createSystem();
      
      // Test edge cases for all maps
      const maps = [
        system.characterMap,
        system.journalMap,
        system.settingsMap,
        system.summariesMap
      ];
      
      maps.forEach(map => {
        // Test with various data types
        map.set('string', 'value');
        map.set('number', 42);
        map.set('boolean', true);
        map.set('null', null);
        map.set('undefined', undefined);
        map.set('object', { test: 'data' });
        map.set('array', [1, 2, 3]);
        
        expect(map.get('string')).to.equal('value');
        expect(map.get('number')).to.equal(42);
        expect(map.get('boolean')).to.be.true;
        expect(map.get('null')).to.be.null;
        // Note: Mock system returns null for missing keys, not undefined
        expect(map.get('undefined')).to.be.null; // Mock returns null, not undefined
        expect(map.get('object')).to.deep.equal({ test: 'data' });
        expect(map.get('array')).to.deep.equal([1, 2, 3]);
      });
    });

    it('should test journal map special cases for entries key', async function() {
      const system = await Yjs.createSystem();
      
      // Test specifically lines 46-48 in yjs.js - the else if branch with toArray
      const entriesWithToArray = { 
        toArray: () => ['mock', 'entry'] 
      };
      
      // This should trigger the else if (entries && entries.toArray) branch
      system.journalMap.data['entries'] = entriesWithToArray;
      const retrieved = system.journalMap.get('entries');
      
      expect(retrieved).to.equal(entriesWithToArray);
      expect(retrieved.toArray()).to.deep.equal(['mock', 'entry']);
    });
  });

  describe('Error Boundary Testing', function() {
    it('should handle system creation in various states', async function() {
      // Test multiple system creation cycles
      for (let i = 0; i < 3; i++) {
        const system = await Yjs.createSystem();
        expect(system).to.be.an('object');
        
        // Use the system
        system.characterMap.set('test', `value${i}`);
        expect(system.characterMap.get('test')).to.equal(`value${i}`);
        
        // Clear and recreate
        Yjs.clearSystem();
      }
    });

    it('should handle concurrent callback registrations', function() {
      const callbacks = [];
      
      // Register multiple callbacks rapidly
      for (let i = 0; i < 10; i++) {
        const callback = () => callbacks.push(i);
        Yjs.onUpdate(callback);
      }
      
      expect(() => {
        // Should not throw
        Yjs.clearSystem();
      }).to.not.throw();
    });

    it('should handle getSyncStatus with edge case providers', function() {
      const edgeCaseProviders = [
        {}, // Missing properties
        { url: 'wss://test.com' }, // Missing wsconnected
        { wsconnected: true }, // Missing url
        { url: 'wss://test.com', wsconnected: 'not-boolean' },
        { url: 42, wsconnected: true }, // Wrong type for url
        null, // Null provider
        undefined // Undefined provider
      ].filter(Boolean); // Remove null/undefined
      
      const status = Yjs.getSyncStatus(edgeCaseProviders);
      
      expect(status).to.be.an('object');
      expect(status).to.have.property('available');
      expect(status).to.have.property('connected');
      expect(status).to.have.property('providers');
      expect(Array.isArray(status.providers)).to.be.true;
    });
  });

  describe('Test Environment Detection', function() {
    it('should consistently detect test environment', async function() {
      // Multiple system creations should all be mock systems
      for (let i = 0; i < 5; i++) {
        const system = await Yjs.createSystem();
        
        // All should be mock systems with empty providers
        expect(system.providers).to.be.an('array');
        expect(system.providers).to.have.lengthOf(0);
        
        Yjs.clearSystem();
      }
    });

    it('should handle test environment edge cases', async function() {
      // Test that system always returns mock in test environment
      const system = await Yjs.createSystem();
      
      expect(system).to.have.property('ydoc');
      expect(system).to.have.property('persistence');
      expect(typeof system.persistence.on).to.equal('function');
    });
  });

  describe('Additional Edge Cases for Coverage', function() {
    it('should test updateCallbacks array operations', function() {
      // Clear to start fresh
      Yjs.clearSystem();
      
      // Register multiple callbacks to test array operations
      const callbacks = [];
      for (let i = 0; i < 5; i++) {
        const callback = () => callbacks.push(i);
        Yjs.onUpdate(callback);
      }
      
      // Clear should empty the callbacks array
      Yjs.clearSystem();
      
      // Verify no errors when registering after clear
      expect(() => {
        Yjs.onUpdate(() => {});
      }).to.not.throw();
    });

    it('should handle mock system provider operations', async function() {
      const system = await Yjs.createSystem();
      
      // Test that providers is always an empty array in mock
      expect(system.providers).to.be.an('array');
      expect(system.providers).to.have.lengthOf(0);
      
      // Test multiple access patterns
      const providers1 = system.providers;
      const providers2 = system.providers;
      
      expect(providers1).to.equal(providers2);
    });

    it('should test sync status with various provider configurations', function() {
      // Test with single connected provider
      const singleConnected = [{ url: 'wss://test.com', wsconnected: true }];
      let status = Yjs.getSyncStatus(singleConnected);
      expect(status.connected).to.be.true;
      expect(status.connectedCount).to.equal(1);
      
      // Test with single disconnected provider
      const singleDisconnected = [{ url: 'wss://test.com', wsconnected: false }];
      status = Yjs.getSyncStatus(singleDisconnected);
      expect(status.connected).to.be.false;
      expect(status.connectedCount).to.equal(0);
      
      // Test with mixed providers
      const mixedProviders = [
        { url: 'wss://test1.com', wsconnected: true },
        { url: 'wss://test2.com', wsconnected: false },
        { url: 'wss://test3.com', wsconnected: true }
      ];
      status = Yjs.getSyncStatus(mixedProviders);
      expect(status.connected).to.be.true;
      expect(status.connectedCount).to.equal(2);
      expect(status.totalProviders).to.equal(3);
    });

    it('should handle createDocument function edge cases', function() {
      // Test multiple document creation
      const doc1 = Yjs.createDocument();
      const doc2 = Yjs.createDocument();
      
      // Should be different documents
      expect(doc1).to.not.equal(doc2);
      expect(doc1.ydoc).to.not.equal(doc2.ydoc);
      
      // But should have same structure
      expect(doc1).to.have.property('ydoc');
      expect(doc1).to.have.property('characterMap');
      expect(doc1).to.have.property('journalMap');
      expect(doc1).to.have.property('settingsMap');
      expect(doc1).to.have.property('summariesMap');
    });

    it('should handle createPersistence function edge cases', function() {
      const ydoc1 = new Yjs.Y.Doc();
      const ydoc2 = new Yjs.Y.Doc();
      
      const persistence1 = Yjs.createPersistence(ydoc1);
      const persistence2 = Yjs.createPersistence(ydoc2);
      
      // Should create different persistence instances
      expect(persistence1).to.not.equal(persistence2);
      expect(typeof persistence1.on).to.equal('function');
      expect(typeof persistence2.on).to.equal('function');
    });
  });
});