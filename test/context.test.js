import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

import * as YjsModule from '../js/yjs.js';
import { hasContext, getContextData, buildContext } from '../js/context.js';
import { SO_FAR_LATEST_KEY, RECENT_SUMMARY_KEY } from '../js/parts.js';
import { setSummary, getYjsState } from '../js/yjs.js';

describe('Context Module', function() {
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

  describe('hasContext', function() {
    it('should return false with no data', function() {
      const character = {};
      const entries = [];
      
      const result = hasContext(character, entries);
      expect(result).to.be.false;
    });

    it('should return true with character name', function() {
      const character = { name: 'Aragorn' };
      const entries = [];
      
      const result = hasContext(character, entries);
      expect(result).to.be.true;
    });

    it('should return true with character backstory', function() {
      const character = { backstory: 'A ranger from the North' };
      const entries = [];
      
      const result = hasContext(character, entries);
      expect(result).to.be.true;
    });

    it('should return true with character notes', function() {
      const character = { notes: 'Some character notes' };
      const entries = [];
      
      const result = hasContext(character, entries);
      expect(result).to.be.true;
    });

    it('should return true with journal entries', function() {
      const character = {};
      const entries = [
        {
          title: 'First Adventure',
          content: 'Today I started my journey',
          timestamp: Date.now()
        }
      ];
      
      const result = hasContext(character, entries);
      expect(result).to.be.true;
    });
  });

  describe('getContextData', function() {
    it('should return character and entries data', function() {
      const character = {
        name: 'Gandalf',
        race: 'Maiar',
        class: 'Wizard'
      };
      
      const entries = [
        {
          title: 'The Grey Pilgrim',
          content: 'I have wandered Middle-earth for many years',
          timestamp: Date.now()
        }
      ];
      
      const context = getContextData(character, entries);
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context).to.have.property('hasContent');
      expect(context.character).to.deep.equal(character);
      expect(context.entries).to.deep.equal(entries);
      expect(context.hasContent).to.be.true;
    });

    it('should return empty context with no data', function() {
      const character = {};
      const entries = [];
      
      const context = getContextData(character, entries);
      
      expect(context).to.have.property('character');
      expect(context).to.have.property('entries');
      expect(context).to.have.property('hasContent');
      expect(context.character).to.deep.equal({});
      expect(context.entries).to.deep.equal([]);
      expect(context.hasContent).to.be.false;
    });
  });

  describe('buildContext', function() {
    it('should build context string from character and entries', async function() {
      const character = {
        name: 'Bilbo',
        race: 'Hobbit',
        class: 'Burglar'
      };
      
      const entries = [
        {
          id: 'entry-1',
          content: 'I went on an unexpected journey',
          timestamp: Date.now()
        }
      ];
      
      // Pre-populate parts-based summaries (no fallback to raw entries)
      const state = getYjsState();
      setSummary(state, SO_FAR_LATEST_KEY, 'A grand tale across closed parts.');
      setSummary(state, RECENT_SUMMARY_KEY, 'Recent happenings in the open part.');
      
      const context = await buildContext(character, entries);
      
      expect(context).to.be.a('string');
      expect(context).to.include('Bilbo');
      expect(context).to.include('Hobbit');
      expect(context).to.include('Burglar');
      expect(context).to.include('Adventure So Far');
      expect(context).to.include('Recent Adventures');
    });

    it('should handle character with no name', async function() {
      const character = {
        race: 'Human',
        class: 'Fighter'
      };
      
      const entries = [];
      
      const context = await buildContext(character, entries);
      
      expect(context).to.include('unnamed adventurer');
      expect(context).to.include('Human');
      expect(context).to.include('Fighter');
    });

    it('should handle no entries', async function() {
      const character = {
        name: 'Solo',
        race: 'Human'
      };
      
      const entries = [];
      
      const context = await buildContext(character, entries);
      
      expect(context).to.include('Solo');
      expect(context).to.include('No journal entries yet');
    });

    it('should summarize long backstory and notes', async function() {
      const longText = new Array(1000).fill('lorem').join(' ');
      const character = { name: 'LongOne', backstory: longText, notes: longText };
      const entries = [];
      // Enable AI so summarize can run
      const s = getYjsState();
      YjsModule.setSetting(s, 'ai-enabled', true);
      YjsModule.setSetting(s, 'openai-api-key', 'test');
      const ctx = await buildContext(character, entries);
      expect(ctx).to.include('Backstory (Summary):');
      expect(ctx).to.include('Notes (Summary):');
    });
  });
});