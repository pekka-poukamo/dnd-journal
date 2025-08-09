import './setup.js';
import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

import * as YjsModule from '../js/yjs.js';
import * as Journal from '../js/journal.js';
import * as Character from '../js/character.js';
import * as Settings from '../js/settings.js';

const loadHtmlIntoDom = (absoluteHtmlPath) => {
  const html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  // Use full HTML to ensure we test actual markup; JSDOM will ignore external resources
  const dom = new JSDOM(html, { url: 'http://localhost', pretendToBeVisual: true, resources: 'usable' });
  global.window = dom.window;
  global.document = dom.window.document;
  // Ensure browser-like FormData that accepts HTMLFormElement
  global.FormData = dom.window.FormData;
  return dom;
};

const workspaceRoot = '/workspace';

describe('UI Contracts - Real Pages', function() {
  afterEach(function() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
  });
  describe('Journal Page (index.html)', function() {
    beforeEach(async function() {
      loadHtmlIntoDom(path.join(workspaceRoot, 'index.html'));
      YjsModule.resetYjs();
      await YjsModule.initYjs();
    });

    it('should contain required containers and initialize without errors', function() {
      // Verify critical containers from actual HTML
      expect(document.getElementById('entries-container')).to.exist;
      expect(document.getElementById('entry-form-container')).to.exist;
      expect(document.getElementById('ai-prompt-text')).to.exist;
      expect(document.getElementById('regenerate-prompt-btn')).to.exist;

      // Initialize page
      expect(() => Journal.initJournalPage(YjsModule.getYjsState())).to.not.throw();
    });

    it('should render entry form and add entry via handler', function() {
      Journal.initJournalPage(YjsModule.getYjsState());

      // Form should be created inside container by views
      const form = document.getElementById('entry-form');
      expect(form).to.exist;

      // Call the wired handler directly to avoid JSDOM FormData quirks
      Journal.handleAddEntry({ content: 'A brave new journey.' }, YjsModule.getYjsState());

      const entries = YjsModule.getEntries(YjsModule.getYjsState());
      expect(entries.length).to.be.greaterThan(0);
      expect(entries[0].content).to.equal('A brave new journey.');
    });
  });

  describe('Character Page (character.html)', function() {
    beforeEach(async function() {
      loadHtmlIntoDom(path.join(workspaceRoot, 'character.html'));
      YjsModule.resetYjs();
      await YjsModule.initYjs();
    });

    it('should contain required form fields and initialize without errors', function() {
      // Required fields
      expect(document.getElementById('character-form')).to.exist;
      expect(document.querySelector('#character-form [name="name"]')).to.exist;
      expect(document.querySelector('#character-form [name="race"]')).to.exist;
      expect(document.querySelector('#character-form [name="class"]')).to.exist;
      expect(document.querySelector('#character-form [name="backstory"]')).to.exist;
      expect(document.querySelector('#character-form [name="notes"]')).to.exist;

      // Buttons/sections
      expect(document.getElementById('refresh-summaries')).to.exist;

      expect(() => Character.initCharacterPage(YjsModule.getYjsState())).to.not.throw();
    });

    it('should submit form and persist data to Yjs', function() {
      Character.initCharacterPage(YjsModule.getYjsState());

      const form = document.getElementById('character-form');
      const nameInput = document.getElementById('character-name');
      const raceInput = document.getElementById('character-race');
      const classInput = document.getElementById('character-class');

      nameInput.value = 'Eowyn';
      raceInput.value = 'Human';
      classInput.value = 'Shieldmaiden';

      const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      const state = YjsModule.getYjsState();
      expect(YjsModule.getCharacter(state, 'name')).to.equal('Eowyn');
      expect(YjsModule.getCharacter(state, 'race')).to.equal('Human');
      expect(YjsModule.getCharacter(state, 'class')).to.equal('Shieldmaiden');
    });
  });

  describe('Settings Page (settings.html)', function() {
    beforeEach(async function() {
      loadHtmlIntoDom(path.join(workspaceRoot, 'settings.html'));
      YjsModule.resetYjs();
      await YjsModule.initYjs();
    });

    it('should contain required buttons and initialize handlers', function() {
      const form = document.getElementById('settings-form');
      expect(form).to.exist;

      const btnTestApi = document.getElementById('test-api-key');
      const btnTestConn = document.getElementById('test-connection');
      const btnShowPrompt = document.getElementById('show-ai-prompt');
      const btnClearSummaries = document.getElementById('clear-summaries');

      expect(btnTestApi).to.exist;
      expect(btnTestConn).to.exist;
      expect(btnShowPrompt).to.exist;
      expect(btnClearSummaries).to.exist;

      Settings.initSettingsPage(YjsModule.getYjsState());

      // Verify data-handler-attached attribute used by settings.js
      expect(btnTestApi.getAttribute('data-handler-attached')).to.equal('true');
      expect(btnTestConn.getAttribute('data-handler-attached')).to.equal('true');
      expect(btnShowPrompt.getAttribute('data-handler-attached')).to.equal('true');
      expect(btnClearSummaries.getAttribute('data-handler-attached')).to.equal('true');
    });

    it('should trigger notification when testing invalid sync URL', function() {
      Settings.initSettingsPage(YjsModule.getYjsState());

      const syncInput = document.getElementById('sync-server-url');
      const btnTestConn = document.getElementById('test-connection');
      syncInput.value = 'invalid-url';

      btnTestConn.click();

      const notification = document.querySelector('.notification');
      expect(notification).to.exist; // Presence indicates handler executed
    });

    it('should trigger notification when testing API key', function() {
      Settings.initSettingsPage(YjsModule.getYjsState());

      const apiKeyInput = document.getElementById('openai-api-key');
      const btnTestApi = document.getElementById('test-api-key');
      apiKeyInput.value = 'sk-test-123';

      // Click and expect at least one notification to appear
      btnTestApi.click();
      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
    });

    it('should not show AI prompt when button is disabled (AI not enabled)', async function() {
      Settings.initSettingsPage(YjsModule.getYjsState());
      const btnShowPrompt = document.getElementById('show-ai-prompt');
      expect(btnShowPrompt.disabled).to.be.true;

      // Attempt click should do nothing visible
      btnShowPrompt.click();
      const preview = document.getElementById('ai-prompt-preview');
      expect(preview.style.display || '').to.not.equal('block');
    });

    it('should show AI prompt on button click when AI is enabled and key saved', async function() {
      // Save settings into Yjs so renderSettingsForm enables the button
      const state = YjsModule.getYjsState();
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setSetting(state, 'openai-api-key', 'sk-abc123');

      Settings.initSettingsPage(state);

      const btnShowPrompt = document.getElementById('show-ai-prompt');
      expect(btnShowPrompt.disabled).to.be.false;

      // Click to trigger preview
      btnShowPrompt.click();

      const preview = document.getElementById('ai-prompt-preview');
      const content = document.getElementById('ai-prompt-content');
      expect(preview.style.display).to.equal('block');
      expect(content.innerHTML).to.satisfy((html) => html.includes('system-prompt') || html.includes('user-prompt'));
    });
  });
});