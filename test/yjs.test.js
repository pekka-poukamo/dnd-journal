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
  });
});