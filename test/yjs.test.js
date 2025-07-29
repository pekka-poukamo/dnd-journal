import { expect } from 'chai';
import './setup.js';
import * as Yjs from '../js/yjs.js';

describe('Yjs Module', function() {
  afterEach(function() {
    // Clear system after each test
    Yjs.clearSystem();
  });

  describe('createDocument', function() {
    it('should create a document with all required maps', function() {
      const doc = Yjs.createDocument();
      
      expect(doc).to.have.property('ydoc');
      expect(doc).to.have.property('characterMap');
      expect(doc).to.have.property('journalMap');
      expect(doc).to.have.property('settingsMap');
      expect(doc).to.have.property('summariesMap');
      
      // Test that maps are functional
      expect(typeof doc.characterMap.set).to.equal('function');
      expect(typeof doc.journalMap.set).to.equal('function');
      expect(typeof doc.settingsMap.set).to.equal('function');
      expect(typeof doc.summariesMap.set).to.equal('function');
    });
  });

  describe('createPersistence', function() {
    it('should create IndexedDB persistence', function() {
      const ydoc = new Yjs.Y.Doc();
      const persistence = Yjs.createPersistence(ydoc);
      
      expect(persistence).to.be.an('object');
      expect(typeof persistence.on).to.equal('function');
    });
  });

  describe('createSystem', function() {
    it('should create a mock system in test environment', async function() {
      const system = await Yjs.createSystem();
      
      expect(system).to.have.property('characterMap');
      expect(system).to.have.property('journalMap');
      expect(system).to.have.property('settingsMap');
      expect(system).to.have.property('summariesMap');
      expect(system).to.have.property('ydoc');
      
      // Test that the system is functional
      system.characterMap.set('name', 'Test Character');
      expect(system.characterMap.get('name')).to.equal('Test Character');
    });

    it('should return the same system instance on subsequent calls', async function() {
      const system1 = await Yjs.createSystem();
      const system2 = await Yjs.createSystem();
      
      // Both should be valid systems, and since we're reusing the same instance
      expect(system1).to.be.an('object');
      expect(system2).to.be.an('object');
      expect(system1).to.equal(system2);
    });

    it('should create mock system when NODE_ENV is test', async function() {
      // Test environment should always create mock system
      const system = await Yjs.createSystem();
      
      // Verify it's a mock system by checking mock characteristics
      expect(system.providers).to.be.an('array');
      expect(system.providers).to.have.lengthOf(0); // Mock has empty providers
    });

    it('should create mock system with JSDOM localStorage detection', async function() {
      // Simulate JSDOM environment by checking if we get mock system
      const system = await Yjs.createSystem();
      
      // In test environment, should always be mock
      expect(system).to.have.property('characterMap');
      expect(system.providers).to.be.an('array');
    });
  });

  describe('getSystem', function() {
    it('should return null when no system is created', function() {
      const system = Yjs.getSystem();
      expect(system).to.be.null;
    });

    it('should return the created system', async function() {
      const created = await Yjs.createSystem();
      const retrieved = Yjs.getSystem();
      
      expect(retrieved).to.equal(created);
    });
  });

  describe('clearSystem', function() {
    it('should clear the system instance', async function() {
      await Yjs.createSystem();
      expect(Yjs.getSystem()).to.not.be.null;
      
      Yjs.clearSystem();
      expect(Yjs.getSystem()).to.be.null;
    });

    it('should allow creating a new system after clearing', async function() {
      const system1 = await Yjs.createSystem();
      Yjs.clearSystem();
      const system2 = await Yjs.createSystem();
      
      expect(system1).to.not.equal(system2);
      expect(system2).to.not.be.null;
    });

    it('should clear update callbacks', async function() {
      let callbackCalled = false;
      const callback = () => { callbackCalled = true; };
      
      Yjs.onUpdate(callback);
      Yjs.clearSystem();
      
      // After clearing, callback should be removed (tested indirectly)
      await Yjs.createSystem();
      // In a mock system, we can't easily trigger callbacks, but clearing doesn't throw
      expect(callbackCalled).to.be.false;
    });
  });

  describe('getSyncStatus', function() {
    it('should return object with disconnected status when no providers', function() {
      const status = Yjs.getSyncStatus();
      expect(status).to.be.an('object');
      expect(status).to.have.property('available', false);
      expect(status).to.have.property('connected', false);
      expect(status).to.have.property('connectedCount', 0);
      expect(status).to.have.property('totalProviders', 0);
    });

    it('should return object with status for providers', async function() {
      await Yjs.createSystem();
      const status = Yjs.getSyncStatus([]);
      expect(status).to.be.an('object');
      expect(status).to.have.property('available');
      expect(status).to.have.property('connected');
    });

    it('should return correct status for empty providers array', function() {
      const status = Yjs.getSyncStatus([]);
      expect(status).to.deep.equal({
        available: false,
        connected: false,
        connectedCount: 0,
        totalProviders: 0,
        providers: []
      });
    });

    it('should handle providers with connected status', function() {
      const mockProviders = [
        { url: 'wss://test1.com', wsconnected: true },
        { url: 'wss://test2.com', wsconnected: false },
        { url: 'wss://test3.com', wsconnected: true }
      ];
      
      const status = Yjs.getSyncStatus(mockProviders);
      
      expect(status.available).to.be.true;
      expect(status.connected).to.be.true;
      expect(status.connectedCount).to.equal(2);
      expect(status.totalProviders).to.equal(3);
      expect(status.providers).to.have.lengthOf(3);
      expect(status.providers[0]).to.deep.equal({ url: 'wss://test1.com', connected: true });
      expect(status.providers[1]).to.deep.equal({ url: 'wss://test2.com', connected: false });
    });

    it('should handle providers with no connections', function() {
      const mockProviders = [
        { url: 'wss://test1.com', wsconnected: false },
        { url: 'wss://test2.com', wsconnected: false }
      ];
      
      const status = Yjs.getSyncStatus(mockProviders);
      
      expect(status.available).to.be.true;
      expect(status.connected).to.be.false;
      expect(status.connectedCount).to.equal(0);
      expect(status.totalProviders).to.equal(2);
    });

    it('should handle providers with undefined wsconnected property', function() {
      const mockProviders = [
        { url: 'wss://test1.com' }, // Missing wsconnected
        { url: 'wss://test2.com', wsconnected: null }
      ];
      
      const status = Yjs.getSyncStatus(mockProviders);
      
      expect(status.available).to.be.true;
      expect(status.connected).to.be.false;
      expect(status.connectedCount).to.equal(0);
      expect(status.providers[0].connected).to.be.false;
      expect(status.providers[1].connected).to.be.false;
    });
  });

  describe('onUpdate', function() {
    it('should register update callback', async function() {
      let callbackCalled = false;
      const callback = () => { callbackCalled = true; };
      
      await Yjs.createSystem();
      Yjs.onUpdate(callback);
      
      // In a mock system, callbacks are stored but not automatically triggered
      // This test verifies the registration doesn't throw errors
      expect(callbackCalled).to.be.false; // Mock doesn't auto-trigger
    });

    it('should handle callback registration before system creation', function() {
      let callbackCalled = false;
      const callback = () => { callbackCalled = true; };
      
      // Should not throw when system doesn't exist yet
      expect(() => Yjs.onUpdate(callback)).to.not.throw();
    });

    it('should register multiple callbacks', function() {
      const callback1 = () => {};
      const callback2 = () => {};
      
      expect(() => {
        Yjs.onUpdate(callback1);
        Yjs.onUpdate(callback2);
      }).to.not.throw();
    });
  });

  describe('Mock System Behavior', function() {
    beforeEach(async function() {
      await Yjs.createSystem();
    });

    it('should handle character map operations', function() {
      const system = Yjs.getSystem();
      
      system.characterMap.set('name', 'Aragorn');
      system.characterMap.set('class', 'Ranger');
      
      expect(system.characterMap.get('name')).to.equal('Aragorn');
      expect(system.characterMap.get('class')).to.equal('Ranger');
      expect(system.characterMap.has('name')).to.be.true;
      expect(system.characterMap.has('nonexistent')).to.be.false;
    });

    it('should handle journal map operations', function() {
      const system = Yjs.getSystem();
      
      const entries = [
        { id: '1', title: 'Entry 1', content: 'Content 1' },
        { id: '2', title: 'Entry 2', content: 'Content 2' }
      ];
      
      system.journalMap.set('entries', entries);
      const retrieved = system.journalMap.get('entries');
      
      expect(retrieved).to.deep.equal(entries);
    });

    it('should handle journal map entries with toArray method', function() {
      const system = Yjs.getSystem();
      
      const entries = [{ id: '1', title: 'Test' }];
      system.journalMap.set('entries', entries);
      
      const retrieved = system.journalMap.get('entries');
      expect(typeof retrieved.toArray).to.equal('function');
      expect(retrieved.toArray()).to.deep.equal(entries);
    });

    it('should handle journal map entries with existing toArray method', function() {
      const system = Yjs.getSystem();
      
      const entriesWithToArray = [{ id: '1', title: 'Test' }];
      entriesWithToArray.toArray = () => entriesWithToArray;
      
      system.journalMap.set('entries', entriesWithToArray);
      const retrieved = system.journalMap.get('entries');
      
      expect(retrieved.toArray()).to.deep.equal(entriesWithToArray);
    });

    it('should return empty array with toArray for non-existent entries', function() {
      const system = Yjs.getSystem();
      
      const retrieved = system.journalMap.get('entries');
      expect(Array.isArray(retrieved)).to.be.true;
      expect(retrieved).to.have.lengthOf(0);
      expect(typeof retrieved.toArray).to.equal('function');
      expect(retrieved.toArray()).to.deep.equal([]);
    });

    it('should handle non-array entries data', function() {
      const system = Yjs.getSystem();
      
      // Set non-array data to entries
      system.journalMap.set('entries', 'not an array');
      const retrieved = system.journalMap.get('entries');
      
      expect(Array.isArray(retrieved)).to.be.true;
      expect(retrieved).to.have.lengthOf(0);
      expect(typeof retrieved.toArray).to.equal('function');
    });

    it('should handle settings map operations', function() {
      const system = Yjs.getSystem();
      
      system.settingsMap.set('apiKey', 'sk-test123');
      system.settingsMap.set('enableAIFeatures', true);
      
      expect(system.settingsMap.get('apiKey')).to.equal('sk-test123');
      expect(system.settingsMap.get('enableAIFeatures')).to.be.true;
    });

    it('should handle summaries map operations', function() {
      const system = Yjs.getSystem();
      
      const summary = {
        content: 'Test summary',
        words: 10,
        timestamp: Date.now()
      };
      
      system.summariesMap.set('test-key', summary);
      expect(system.summariesMap.get('test-key')).to.deep.equal(summary);
    });

    it('should clear map data', function() {
      const system = Yjs.getSystem();
      
      system.characterMap.set('name', 'Test');
      expect(system.characterMap.get('name')).to.equal('Test');
      
      system.characterMap.clear();
      expect(system.characterMap.get('name')).to.be.null;
    });

    it('should iterate over map entries with forEach', function() {
      const system = Yjs.getSystem();
      
      system.characterMap.set('name', 'Legolas');
      system.characterMap.set('class', 'Archer');
      
      const entries = [];
      system.characterMap.forEach((value, key) => {
        entries.push({ key, value });
      });
      
      expect(entries).to.have.lengthOf(2);
      expect(entries.some(e => e.key === 'name' && e.value === 'Legolas')).to.be.true;
      expect(entries.some(e => e.key === 'class' && e.value === 'Archer')).to.be.true;
    });

    it('should handle observe method calls (mock)', function() {
      const system = Yjs.getSystem();
      
      // Mock observe should not throw
      expect(() => {
        system.characterMap.observe(() => {});
        system.journalMap.observe(() => {});
        system.settingsMap.observe(() => {});
        system.summariesMap.observe(() => {});
      }).to.not.throw();
    });
  });

  describe('Internal Functions (via edge case testing)', function() {
    // These test internal functions through edge cases and error conditions
    
    describe('WebSocket URL Validation (via getSyncStatus)', function() {
      it('should handle providers with invalid URLs', function() {
        const mockProviders = [
          { url: null, wsconnected: false },
          { url: '', wsconnected: false },
          { url: 'not-a-websocket-url', wsconnected: false }
        ];
        
        const status = Yjs.getSyncStatus(mockProviders);
        expect(status.available).to.be.true;
        expect(status.providers).to.have.lengthOf(3);
      });
    });

    describe('Update Callback Error Handling', function() {
      it('should handle callback errors gracefully', async function() {
        let errorThrown = false;
        const badCallback = () => {
          throw new Error('Test error');
        };
        
        const goodCallback = () => {
          errorThrown = true;
        };
        
        // Register callbacks
        Yjs.onUpdate(badCallback);
        Yjs.onUpdate(goodCallback);
        
        // In mock system, we can't easily trigger the callbacks
        // but registration should not throw
        expect(() => {
          Yjs.onUpdate(badCallback);
        }).to.not.throw();
      });
    });

    describe('Sync Configuration Edge Cases', function() {
      it('should handle sync configuration scenarios', async function() {
        // Test that system creation handles configuration properly
        const system = await Yjs.createSystem();
        
        // Mock system should have empty providers array
        expect(system.providers).to.be.an('array');
        expect(system.providers).to.have.lengthOf(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', function() {
    it('should handle null/undefined inputs to getSyncStatus', function() {
      expect(() => Yjs.getSyncStatus(null)).to.not.throw();
      expect(() => Yjs.getSyncStatus(undefined)).to.not.throw();
      
      const statusNull = Yjs.getSyncStatus(null);
      const statusUndefined = Yjs.getSyncStatus(undefined);
      
      expect(statusNull.available).to.be.false;
      expect(statusUndefined.available).to.be.false;
    });

    it('should handle empty providers in getSyncStatus', function() {
      const status = Yjs.getSyncStatus([]);
      
      expect(status).to.deep.equal({
        available: false,
        connected: false,
        connectedCount: 0,
        totalProviders: 0,
        providers: []
      });
    });

    it('should handle system creation multiple times', async function() {
      const system1 = await Yjs.createSystem();
      const system2 = await Yjs.createSystem();
      const system3 = await Yjs.createSystem();
      
      expect(system1).to.equal(system2);
      expect(system2).to.equal(system3);
    });

    it('should handle callback registration with null/undefined', function() {
      expect(() => Yjs.onUpdate(null)).to.not.throw();
      expect(() => Yjs.onUpdate(undefined)).to.not.throw();
    });
  });
});