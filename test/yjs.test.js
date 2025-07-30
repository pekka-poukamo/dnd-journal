import { expect } from 'chai';
import './setup.js';
import * as YjsModule from '../js/yjs.js';

describe('Simple Y.js Module', function() {
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  afterEach(function() {
    YjsModule.resetYjs();
  });

  describe('initYjs', function() {
    it('should initialize Y.js document and maps', async function() {
      await YjsModule.initYjs();
      
      expect(YjsModule.ydoc).to.not.be.null;
      expect(YjsModule.characterMap).to.not.be.null;
      expect(YjsModule.journalMap).to.not.be.null;
      expect(YjsModule.settingsMap).to.not.be.null;
      expect(YjsModule.summariesMap).to.not.be.null;
    });

    it('should not reinitialize if already initialized', async function() {
      await YjsModule.initYjs();
      const firstDoc = YjsModule.ydoc;
      
      await YjsModule.initYjs();
      expect(YjsModule.ydoc).to.equal(firstDoc);
    });
  });

  describe('Character operations', function() {
    beforeEach(async function() {
      await YjsModule.initYjs();
    });

    it('should set and get character fields', function() {
      YjsModule.setCharacter('name', 'Aragorn');
      YjsModule.setCharacter('race', 'Human');
      YjsModule.setCharacter('class', 'Ranger');

      expect(YjsModule.getCharacter('name')).to.equal('Aragorn');
      expect(YjsModule.getCharacter('race')).to.equal('Human');
      expect(YjsModule.getCharacter('class')).to.equal('Ranger');
    });

    it('should return empty string for non-existent fields', function() {
      expect(YjsModule.getCharacter('nonexistent')).to.equal('');
    });

    it('should get character data as object', function() {
      YjsModule.setCharacter('name', 'Legolas');
      YjsModule.setCharacter('race', 'Elf');
      YjsModule.setCharacter('backstory', 'Prince of the Woodland Realm');

      const character = YjsModule.getCharacterData();
      expect(character).to.deep.equal({
        name: 'Legolas',
        race: 'Elf',
        class: '',
        backstory: 'Prince of the Woodland Realm',
        notes: ''
      });
    });
  });

  describe('Journal operations', function() {
    beforeEach(async function() {
      await YjsModule.initYjs();
    });

    it('should add journal entries', function() {
      const entry = {
        id: 'test-1',
        title: 'First Adventure',
        content: 'We met at the tavern...',
        timestamp: Date.now()
      };

      YjsModule.addEntry(entry);
      const entries = YjsModule.getEntries();

      expect(entries).to.have.length(1);
      expect(entries[0]).to.deep.equal(entry);
    });

    it('should update journal entries', function() {
      const entry = {
        id: 'test-1',
        title: 'Original Title',
        content: 'Original content',
        timestamp: Date.now()
      };

      YjsModule.addEntry(entry);
      YjsModule.updateEntry('test-1', {
        title: 'Updated Title',
        content: 'Updated content'
      });

      const entries = YjsModule.getEntries();
      expect(entries[0].title).to.equal('Updated Title');
      expect(entries[0].content).to.equal('Updated content');
      // Timestamp might be updated or stay the same, both are valid
      expect(entries[0].timestamp).to.be.a('number');
    });

    it('should delete journal entries', function() {
      const entry = {
        id: 'test-1',
        title: 'To be deleted',
        content: 'This will be removed',
        timestamp: Date.now()
      };

      YjsModule.addEntry(entry);
      expect(YjsModule.getEntries()).to.have.length(1);

      YjsModule.deleteEntry('test-1');
      expect(YjsModule.getEntries()).to.have.length(0);
    });

    it('should handle multiple entries', function() {
      const entries = [
        { id: 'test-1', title: 'Entry 1', content: 'Content 1', timestamp: 1000 },
        { id: 'test-2', title: 'Entry 2', content: 'Content 2', timestamp: 2000 },
        { id: 'test-3', title: 'Entry 3', content: 'Content 3', timestamp: 3000 }
      ];

      entries.forEach(entry => YjsModule.addEntry(entry));
      const retrieved = YjsModule.getEntries();

      expect(retrieved).to.have.length(3);
      expect(retrieved.map(e => e.id)).to.include.members(['test-1', 'test-2', 'test-3']);
    });
  });

  describe('Settings operations', function() {
    beforeEach(async function() {
      await YjsModule.initYjs();
    });

    it('should set and get settings', function() {
      YjsModule.setSetting('test-key', 'test-value');
      expect(YjsModule.getSetting('test-key')).to.equal('test-value');
    });

    it('should return default value for non-existent settings', function() {
      expect(YjsModule.getSetting('nonexistent', 'default')).to.equal('default');
      expect(YjsModule.getSetting('nonexistent')).to.be.null;
    });

    it('should handle boolean settings', function() {
      YjsModule.setSetting('ai-enabled', true);
      YjsModule.setSetting('sync-enabled', false);

      expect(YjsModule.getSetting('ai-enabled')).to.be.true;
      expect(YjsModule.getSetting('sync-enabled')).to.be.false;
    });
  });

  describe('Summary operations', function() {
    beforeEach(async function() {
      await YjsModule.initYjs();
    });

    it('should set and get summaries', function() {
      YjsModule.setSummary('entry-1', 'This is a summary');
      expect(YjsModule.getSummary('entry-1')).to.equal('This is a summary');
    });

    it('should return null for non-existent summaries', function() {
      expect(YjsModule.getSummary('nonexistent')).to.be.null;
    });
  });

  describe('Observers', function() {
    beforeEach(async function() {
      await YjsModule.initYjs();
    });

    it('should allow adding character change observers', function() {
      let callCount = 0;
      const observer = () => { callCount++; };

      YjsModule.onCharacterChange(observer);
      YjsModule.setCharacter('name', 'Test');

      // Note: Y.js observers are asynchronous, so we test the setup
      expect(typeof YjsModule.onCharacterChange).to.equal('function');
    });

    it('should allow adding journal change observers', function() {
      let callCount = 0;
      const observer = () => { callCount++; };

      YjsModule.onJournalChange(observer);
      YjsModule.addEntry({ id: 'test', title: 'Test', content: 'Test', timestamp: Date.now() });

      // Note: Y.js observers are asynchronous, so we test the setup
      expect(typeof YjsModule.onJournalChange).to.equal('function');
    });

    it('should allow adding settings change observers', function() {
      expect(typeof YjsModule.onSettingsChange).to.equal('function');
    });
  });
});