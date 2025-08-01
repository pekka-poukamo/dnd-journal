// Navigation Cache Tests - Pure Functional Testing (ADR-0005 Compliant)
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import {
  isCacheAvailable,
  saveNavigationCache,
  loadNavigationCache,
  clearNavigationCache,
  getCachedJournalEntries,
  getCachedCharacterData,
  getCachedSettings,
  getCachedFormData,
  saveCurrentFormData,
  getFormDataForPage,
  getCacheAge,
  getCacheInfo
} from '../js/navigation-cache.js';

describe('Navigation Cache', () => {
  let dom;
  let window;
  let document;
  let mockSessionStorage;
  
  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    
    // Mock sessionStorage
    mockSessionStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      }
    };
    
    // Make globals available
    global.sessionStorage = mockSessionStorage;
    global.window = window;
    global.document = document;
  });
  
  afterEach(() => {
    // Clean up globals
    delete global.sessionStorage;
    delete global.window; 
    delete global.document;
  });
  
  describe('Pure Function Structure', () => {
    it('should export only pure functions', () => {
      expect(typeof isCacheAvailable).to.equal('function');
      expect(typeof saveNavigationCache).to.equal('function');
      expect(typeof loadNavigationCache).to.equal('function');
      expect(typeof clearNavigationCache).to.equal('function');
      expect(typeof getCachedJournalEntries).to.equal('function');
      expect(typeof getCachedCharacterData).to.equal('function');
      expect(typeof getCachedSettings).to.equal('function');
    });
  });
  
  describe('Cache Availability', () => {
    it('should detect when sessionStorage is available', () => {
      expect(isCacheAvailable()).to.be.true;
    });
    
    it('should handle when sessionStorage is unavailable', () => {
      delete global.sessionStorage;
      expect(isCacheAvailable()).to.be.false;
    });
    
    it('should handle sessionStorage access errors', () => {
      global.sessionStorage = {
        getItem() { throw new Error('Access denied'); }
      };
      expect(isCacheAvailable()).to.be.false;
    });
  });
  
  describe('Cache Data Structure', () => {
    it('should save and load complete cache data', () => {
      const mockYjsState = {
        journalArray: {
          toArray: () => [
            { id: '1', title: 'Entry 1', content: 'Content 1', timestamp: 1234567890 },
            { id: '2', title: 'Entry 2', content: 'Content 2', timestamp: 1234567891 }
          ]
        },
        characterMap: {
          get: (key) => {
            const data = { name: 'Aragorn', race: 'Human', class: 'Ranger' };
            return data[key];
          }
        },
        settingsMap: {
          get: (key) => {
            const data = { 'sync-server-url': 'ws://localhost:1234', 'theme': 'dark' };
            return data[key];
          }
        }
      };
      
      const formData = { journal: { title: 'Draft entry' } };
      
      const saved = saveNavigationCache(mockYjsState, formData);
      expect(saved).to.be.true;
      
      const loaded = loadNavigationCache();
      expect(loaded).to.not.be.null;
      expect(loaded.journalEntries).to.have.length(2);
      expect(loaded.journalEntries[0].title).to.equal('Entry 1');
      expect(loaded.formData).to.deep.equal(formData);
    });
    
    it('should include version and timestamp in cache', () => {
      const mockYjsState = { journalArray: { toArray: () => [] } };
      saveNavigationCache(mockYjsState);
      
      const cacheKey = 'dnd-journal-navigation-cache';
      const rawCache = mockSessionStorage.getItem(cacheKey);
      const cacheData = JSON.parse(rawCache);
      
      expect(cacheData.version).to.equal('1.0');
      expect(cacheData.timestamp).to.be.a('number');
      expect(cacheData.data).to.be.an('object');
    });
  });
  
  describe('Cache Validation', () => {
    it('should reject expired cache data', (done) => {
      const mockYjsState = { journalArray: { toArray: () => [] } };
      saveNavigationCache(mockYjsState);
      
      // Manually modify timestamp to simulate expired cache
      const cacheKey = 'dnd-journal-navigation-cache';
      const rawCache = mockSessionStorage.getItem(cacheKey);
      const cacheData = JSON.parse(rawCache);
      cacheData.timestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      mockSessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      const loaded = loadNavigationCache();
      expect(loaded).to.be.null;
      
      // Should have cleared expired cache
      expect(mockSessionStorage.getItem(cacheKey)).to.be.null;
      done();
    });
    
    it('should reject incompatible cache versions', () => {
      const mockYjsState = { journalArray: { toArray: () => [] } };
      saveNavigationCache(mockYjsState);
      
      // Manually modify version
      const cacheKey = 'dnd-journal-navigation-cache';
      const rawCache = mockSessionStorage.getItem(cacheKey);
      const cacheData = JSON.parse(rawCache);
      cacheData.version = '2.0';
      mockSessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      const loaded = loadNavigationCache();
      expect(loaded).to.be.null;
    });
    
    it('should handle corrupted cache data', () => {
      const cacheKey = 'dnd-journal-navigation-cache';
      mockSessionStorage.setItem(cacheKey, 'invalid json');
      
      const loaded = loadNavigationCache();
      expect(loaded).to.be.null;
      
      // Should have cleared corrupted cache
      expect(mockSessionStorage.getItem(cacheKey)).to.be.null;
    });
  });
  
  describe('Data Extraction', () => {
    it('should extract journal entries correctly', () => {
      const mockYjsState = {
        journalArray: {
          toArray: () => [
            { id: '1', title: 'Test Entry', content: 'Test Content', timestamp: 1234567890 }
          ]
        }
      };
      
      saveNavigationCache(mockYjsState);
      const entries = getCachedJournalEntries();
      
      expect(entries).to.have.length(1);
      expect(entries[0].id).to.equal('1');
      expect(entries[0].title).to.equal('Test Entry');
      expect(entries[0].formattedDate).to.be.a('string');
    });
    
    it('should extract character data correctly', () => {
      const characterData = { name: 'Legolas', race: 'Elf', class: 'Ranger' };
      const mockYjsState = {
        characterMap: {
          get: (key) => characterData[key]
        }
      };
      
      saveNavigationCache(mockYjsState);
      const cached = getCachedCharacterData();
      
      expect(cached.name).to.equal('Legolas');
      expect(cached.race).to.equal('Elf');
      expect(cached.class).to.equal('Ranger');
    });
    
    it('should extract settings correctly', () => {
      const settingsData = { 'sync-server-url': 'ws://test:1234', 'theme': 'light' };
      const mockYjsState = {
        settingsMap: {
          get: (key) => settingsData[key]
        }
      };
      
      saveNavigationCache(mockYjsState);
      const cached = getCachedSettings();
      
      expect(cached['sync-server-url']).to.equal('ws://test:1234');
      expect(cached['theme']).to.equal('light');
    });
  });
  
  describe('Form Data Preservation', () => {
    it('should save and retrieve form data by page type', () => {
      const journalFormData = { title: 'Draft Title', content: 'Draft Content' };
      const characterFormData = { name: 'New Character', class: 'Wizard' };
      
      saveCurrentFormData('journal', journalFormData);
      saveCurrentFormData('character', characterFormData);
      
      expect(getFormDataForPage('journal')).to.deep.equal(journalFormData);
      expect(getFormDataForPage('character')).to.deep.equal(characterFormData);
      expect(getFormDataForPage('settings')).to.deep.equal({});
    });
    
    it('should merge form data with existing cache', () => {
      // First save some Yjs data
      const mockYjsState = { journalArray: { toArray: () => [] } };
      saveNavigationCache(mockYjsState);
      
      // Then save form data
      const formData = { title: 'Form Title' };
      saveCurrentFormData('journal', formData);
      
      // Should preserve both
      const cached = loadNavigationCache();
      expect(cached.journalEntries).to.be.an('array');
      expect(cached.formData.journal).to.deep.equal(formData);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle missing Yjs state gracefully', () => {
      const result = saveNavigationCache(null);
      expect(result).to.be.false;
    });
    
    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage error
      global.sessionStorage.setItem = () => {
        throw new Error('Storage full');
      };
      
      const mockYjsState = { journalArray: { toArray: () => [] } };
      const result = saveNavigationCache(mockYjsState);
      expect(result).to.be.false;
    });
    
    it('should return empty data when cache unavailable', () => {
      delete global.sessionStorage;
      
      expect(getCachedJournalEntries()).to.deep.equal([]);
      expect(getCachedCharacterData()).to.deep.equal({});
      expect(getCachedSettings()).to.deep.equal({});
      expect(getCachedFormData()).to.deep.equal({});
    });
  });
  
  describe('Cache Management', () => {
    it('should clear cache completely', () => {
      const mockYjsState = { journalArray: { toArray: () => [] } };
      saveNavigationCache(mockYjsState);
      
      expect(loadNavigationCache()).to.not.be.null;
      
      clearNavigationCache();
      
      expect(loadNavigationCache()).to.be.null;
    });
    
    it('should provide cache information', () => {
      const mockYjsState = {
        journalArray: { toArray: () => [{ id: '1' }] },
        characterMap: { get: () => 'test' },
        settingsMap: { get: () => 'setting' }
      };
      
      saveNavigationCache(mockYjsState, { journal: { test: 'data' } });
      
      const info = getCacheInfo();
      expect(info.available).to.be.true;
      expect(info.hasData).to.be.true;
      expect(info.age).to.be.a('number');
      expect(info.entriesCount).to.equal(1);
      expect(info.hasCharacterData).to.be.true;
      expect(info.hasSettings).to.be.true;
      expect(info.hasFormData).to.be.true;
    });
    
    it('should calculate cache age correctly', () => {
      const mockYjsState = { journalArray: { toArray: () => [] } };
      saveNavigationCache(mockYjsState);
      
      const age = getCacheAge();
      expect(age).to.be.a('number');
      expect(age).to.be.at.least(0);
      expect(age).to.be.below(1000); // Should be very recent
    });
  });
  
  describe('Graceful Degradation', () => {
    it('should work without sessionStorage', () => {
      delete global.sessionStorage;
      
      // Should not throw errors
      expect(() => saveNavigationCache({})).to.not.throw();
      expect(() => loadNavigationCache()).to.not.throw();
      expect(() => clearNavigationCache()).to.not.throw();
      
      // Should return appropriate fallback values
      expect(isCacheAvailable()).to.be.false;
      expect(loadNavigationCache()).to.be.null;
    });
    
    it('should handle Yjs state extraction errors', () => {
      const badYjsState = {
        journalArray: {
          toArray: () => { throw new Error('Yjs error'); }
        }
      };
      
      // Should not throw, should save with empty arrays
      expect(() => saveNavigationCache(badYjsState)).to.not.throw();
      
      const cached = loadNavigationCache();
      expect(cached.journalEntries).to.deep.equal([]);
    });
  });
});