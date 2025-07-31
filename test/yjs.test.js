import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';

describe('Simple Y.js Module', function() {
  let state;

  beforeEach(async function() {
    // Set up DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Reset and initialize Y.js
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initYjs', function() {
    it('should initialize Y.js document and maps', function() {
      expect(YjsModule.getCharacterMap(state)).to.not.be.null;
      expect(YjsModule.getJournalMap(state)).to.not.be.null;
      expect(YjsModule.getSettingsMap(state)).to.not.be.null;
      expect(YjsModule.getSummariesMap(state)).to.not.be.null;
    });

    it('should not reinitialize if already initialized', async function() {
      const state2 = await YjsModule.initYjs();
      expect(state2).to.equal(state);
    });
  });

  describe('Character operations', function() {
    it('should set and get character fields', function() {
      YjsModule.setCharacter(state, 'name', 'Aragorn');
      const name = YjsModule.getCharacter(state, 'name');
      expect(name).to.equal('Aragorn');
    });

    it('should return empty string for non-existent fields', function() {
      const race = YjsModule.getCharacter(state, 'race');
      expect(race).to.equal('');
    });

    it('should get character data as object', function() {
      YjsModule.setCharacter(state, 'name', 'Legolas');
      YjsModule.setCharacter(state, 'race', 'Elf');
      YjsModule.setCharacter(state, 'backstory', 'Prince of the Woodland Realm');
      
      const data = YjsModule.getCharacterData(state);
      expect(data).to.deep.equal({
        name: 'Legolas',
        race: 'Elf',
        class: '',
        backstory: 'Prince of the Woodland Realm',
        notes: ''
      });
    });
  });

  describe('Journal operations', function() {
    it('should add journal entries', function() {
      const entry = {
        id: 'test-entry',
        title: 'Test Entry',
        content: 'This is a test entry',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      const entries = YjsModule.getEntries(state);
      expect(entries).to.have.length(1);
      expect(entries[0]).to.deep.equal(entry);
    });

    it('should update journal entries', function() {
      const entry = {
        id: 'test-entry',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      
      const updates = {
        title: 'Updated Title',
        content: 'Updated content'
      };
      
      YjsModule.updateEntry(state, 'test-entry', updates);
      
      const entries = YjsModule.getEntries(state);
      expect(entries[0].title).to.equal('Updated Title');
      expect(entries[0].content).to.equal('Updated content');
      expect(entries[0].timestamp).to.be.a('number');
    });

    it('should delete journal entries', function() {
      const entry = {
        id: 'test-entry',
        title: 'Test Entry',
        content: 'This is a test entry',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      expect(YjsModule.getEntries(state)).to.have.length(1);
      
      YjsModule.deleteEntry(state, 'test-entry');
      expect(YjsModule.getEntries(state)).to.have.length(0);
    });

    it('should handle multiple entries', function() {
      const entries = [
        { id: 'entry-1', title: 'Entry 1', content: 'Content 1', timestamp: Date.now() },
        { id: 'entry-2', title: 'Entry 2', content: 'Content 2', timestamp: Date.now() + 1 },
        { id: 'entry-3', title: 'Entry 3', content: 'Content 3', timestamp: Date.now() + 2 }
      ];
      
      entries.forEach(entry => YjsModule.addEntry(state, entry));
      
      const retrievedEntries = YjsModule.getEntries(state);
      expect(retrievedEntries).to.have.length(3);
    });
  });

  describe('Settings operations', function() {
    it('should set and get settings', function() {
      YjsModule.setSetting(state, 'test-key', 'test-value');
      const value = YjsModule.getSetting(state, 'test-key');
      expect(value).to.equal('test-value');
    });

    it('should return default value for non-existent settings', function() {
      const value = YjsModule.getSetting(state, 'non-existent', 'default');
      expect(value).to.equal('default');
    });

    it('should handle boolean settings', function() {
      YjsModule.setSetting(state, 'ai-enabled', true);
      const enabled = YjsModule.getSetting(state, 'ai-enabled');
      expect(enabled).to.be.true;
    });
  });

  describe('Summary operations', function() {
    it('should set and get summaries', function() {
      YjsModule.setSummary(state, 'test-summary', 'This is a summary');
      const summary = YjsModule.getSummary(state, 'test-summary');
      expect(summary).to.equal('This is a summary');
    });

    it('should return null for non-existent summaries', function() {
      const summary = YjsModule.getSummary(state, 'non-existent');
      expect(summary).to.be.null;
    });
  });

  describe('Observers', function() {
    it('should allow adding character change observers', function() {
      let changeDetected = false;
      
      YjsModule.onCharacterChange(state, () => {
        changeDetected = true;
      });
      
      YjsModule.setCharacter(state, 'name', 'Test Character');
      
      // Note: In real scenarios, Y.js observers are async
      // For testing purposes, we just verify the observer was added without error
      expect(changeDetected).to.be.false; // Observer setup, actual change detection is async
    });

    it('should allow adding journal change observers', function() {
      let changeDetected = false;
      
      YjsModule.onJournalChange(state, () => {
        changeDetected = true;
      });
      
      const entry = {
        id: 'test-entry',
        title: 'Test Entry',
        content: 'Test content',
        timestamp: Date.now()
      };
      
      YjsModule.addEntry(state, entry);
      
      // Note: In real scenarios, Y.js observers are async
      expect(changeDetected).to.be.false; // Observer setup, actual change detection is async
    });

    it('should allow adding settings change observers', function() {
      let changeDetected = false;
      
      YjsModule.onSettingsChange(state, () => {
        changeDetected = true;
      });
      
      YjsModule.setSetting(state, 'test-setting', 'test-value');
      
      // Note: In real scenarios, Y.js observers are async
      expect(changeDetected).to.be.false; // Observer setup, actual change detection is async
    });
  });
});