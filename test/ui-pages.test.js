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

    it('should disable regenerate button when AI not enabled and not throw on click', function() {
      Journal.initJournalPage(YjsModule.getYjsState());
      const btn = document.getElementById('regenerate-prompt-btn');
      expect(btn).to.exist;
      // When AI is not available, the view disables it
      expect(btn.disabled).to.be.true;
      expect(() => btn.click()).to.not.throw();
    });

    it('should support Edit and Delete buttons on entries', function() {
      const state = YjsModule.getYjsState();
      // Seed two entries
      YjsModule.addEntry(state, { id: 'e1', content: 'First', timestamp: Date.now() - 1000 });
      YjsModule.addEntry(state, { id: 'e2', content: 'Second', timestamp: Date.now() });

      Journal.initJournalPage(state);

      const entriesContainer = document.getElementById('entries-container');
      const firstEntry = entriesContainer.querySelector('[data-entry-id="e2"]');
      expect(firstEntry).to.exist;

      // Click Edit
      const editBtn = firstEntry.querySelector('.entry-actions button:first-child');
      expect(editBtn).to.exist;
      editBtn.click();
      const editForm = entriesContainer.querySelector('.entry-edit-form');
      expect(editForm).to.exist;

      // Submit updated content
      const textarea = editForm.querySelector('textarea');
      textarea.value = 'Updated Second';
      const submitEvt = new window.Event('submit', { bubbles: true, cancelable: true });
      editForm.dispatchEvent(submitEvt);

      // Verify update applied
      const updated = YjsModule.getEntries(state).find(e => e.id === 'e2');
      expect(updated.content).to.equal('Updated Second');

      // Click Delete
      const refreshedFirstEntry = entriesContainer.querySelector('[data-entry-id="e2"]');
      const deleteBtn = refreshedFirstEntry.querySelector('.entry-actions button:last-child');
      expect(deleteBtn).to.exist;
      const originalConfirm = global.confirm;
      global.confirm = () => true;
      deleteBtn.click();
      global.confirm = originalConfirm;

      const remaining = YjsModule.getEntries(state);
      expect(remaining.find(e => e.id === 'e2')).to.not.exist;
    });

    it('should generate AI prompt on regenerate click when AI enabled with context', async function() {
      const state = YjsModule.getYjsState();
      // Enable AI and add minimal context
      YjsModule.setSetting(state, 'openai-api-key', 'sk-abc123');
      YjsModule.setSetting(state, 'ai-enabled', true);
      YjsModule.setCharacter(state, 'name', 'Aragorn');
      YjsModule.addEntry(state, { id: 'cx', content: 'Travelled to Bree', timestamp: Date.now() });

      Journal.initJournalPage(state);

      const btn = document.getElementById('regenerate-prompt-btn');
      expect(btn.disabled).to.be.false;
      btn.click();

      // Wait a tick for mocked fetch and rendering
      await new Promise(r => setTimeout(r, 10));
      const prompt = document.getElementById('ai-prompt-text');
      expect(prompt.innerHTML).to.not.equal('');
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

    it('should refresh summaries when clicking Refresh Summaries', function() {
      const state = YjsModule.getYjsState();
      // Seed a summary so refresh has visible effect
      YjsModule.setSummary(state, 'character:backstory', 'A brief summary');

      Character.initCharacterPage(state);

      const refreshBtn = document.getElementById('refresh-summaries');
      refreshBtn.click();

      const summariesDiv = document.getElementById('summaries-content');
      expect(summariesDiv.textContent).to.include('A brief summary');
    });

    it('should generate summaries when AI enabled and content present', async function() {
      const state = YjsModule.getYjsState();
      // Enable AI and provide content
      YjsModule.setSetting(state, 'openai-api-key', 'sk-abc123');
      YjsModule.setSetting(state, 'ai-enabled', true);

      Character.initCharacterPage(state);
      // Fill backstory so generate has content
      const backstory = document.getElementById('character-backstory');
      backstory.value = 'Long backstory to summarize';

      // Button visibility toggled by toggleGenerateButton during updateSummariesDisplay
      Character.updateSummariesDisplay(state);
      const generateBtn = document.getElementById('generate-summaries');
      expect(generateBtn.style.display).to.equal('inline-block');

      generateBtn.click();
      // Wait a tick for mocked AI
      await new Promise(r => setTimeout(r, 10));

      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
      const summariesDiv = document.getElementById('summaries-content');
      expect(summariesDiv.innerHTML).to.include('summary-word-count');
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

    it('should save settings when clicking Save All Settings', function() {
      const state = YjsModule.getYjsState();
      Settings.initSettingsPage(state);

      const form = document.getElementById('settings-form');
      document.getElementById('openai-api-key').value = 'sk-form-123';
      document.getElementById('ai-enabled').checked = true;
      document.getElementById('sync-server-url').value = 'ws://form-server:1234';

      const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(YjsModule.getSetting(state, 'openai-api-key')).to.equal('sk-form-123');
      expect(YjsModule.getSetting(state, 'ai-enabled')).to.equal(true);
      expect(YjsModule.getSetting(state, 'sync-server-url')).to.equal('ws://form-server:1234');
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

    it('should clear all summaries after confirmation', function() {
      const state = YjsModule.getYjsState();
      YjsModule.setSummary(state, 'character:backstory', 'Will be cleared');

      Settings.initSettingsPage(state);
      const clearBtn = document.getElementById('clear-summaries');
      const originalConfirm = global.confirm;
      global.confirm = () => true;
      clearBtn.click();
      global.confirm = originalConfirm;

      // Verify cleared and notification shown
      expect(YjsModule.getSummary(state, 'character:backstory')).to.equal(null);
      const notification = document.querySelector('.notification');
      expect(notification).to.exist;
    });

    it('should call window.location.reload when clicking Refresh App', function() {
      // Provide a stub for reload
      const originalReload = (window.location && window.location.reload) || null;
      window.location.reload = () => { window.__reloaded = true; };

      Settings.initSettingsPage(YjsModule.getYjsState());

      const refreshBtn = document.getElementById('refresh-app');
      expect(refreshBtn).to.exist;
      refreshBtn.click();

      expect(window.__reloaded).to.equal(true);

      // Cleanup
      delete window.__reloaded;
      if (originalReload) {
        window.location.reload = originalReload;
      } else {
        delete window.location.reload;
      }
    });
  });
});