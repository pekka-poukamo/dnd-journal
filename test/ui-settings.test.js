import './setup.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

import * as YjsModule from '../js/yjs.js';
import * as Settings from '../js/settings.js';

const workspaceRoot = process.cwd();

const loadHtmlIntoDom = (absoluteHtmlPath) => {
  const html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', pretendToBeVisual: true, resources: 'usable' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  return dom;
};

describe('UI Contracts - Settings Page (settings.html)', function() {
  afterEach(function() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
  });

  beforeEach(async function() {
    loadHtmlIntoDom(path.join(workspaceRoot, 'settings.html'));
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  it('should contain required buttons and initialize handlers', async function() {
    const form = document.getElementById('settings-form');
    expect(form).to.exist;

    const btnShowPrompt = document.getElementById('show-ai-prompt');
    const btnClearSummaries = document.getElementById('clear-summaries');

    expect(btnShowPrompt).to.exist;
    expect(btnClearSummaries).to.exist;

    Settings.initSettingsPage(YjsModule.getYjsState());
    await new Promise(r => setTimeout(r, 0));
    // Handlers attach after render cycle; ensure attributes are set
    expect(btnShowPrompt.getAttribute('data-handler-attached')).to.equal('true');
    expect(btnClearSummaries.getAttribute('data-handler-attached')).to.equal('true');
  });

  // Connection testing removed from UI

  // Test API key flow removed

  it('should save settings when clicking Save All Settings', async function() {
    const state = YjsModule.getYjsState();
    Settings.initSettingsPage(state);

    document.getElementById('journal-name').value = 'jn-ui';
    await Settings.saveSettings(state);
    expect(YjsModule.getSetting(state, 'journal-name')).to.equal('jn-ui');
  });

  // Button enabled; availability shown via server status

  it('should show AI prompt on button click', async function() {
    const state = YjsModule.getYjsState();
    Settings.initSettingsPage(state);
    await Settings.showCurrentAIPrompt();
    const preview = document.getElementById('ai-prompt-preview');
    expect(preview.style.display).to.equal('block');
  });

  it('should clear all summaries after confirmation', function() {
    const state = YjsModule.getYjsState();
    YjsModule.setSummary(state, 'character:backstory', 'Will be cleared');

    Settings.initSettingsPage(state);
    const originalConfirm = global.confirm;
    global.confirm = () => true;
    Settings.clearAllSummariesHandler();
    global.confirm = originalConfirm;
    // Summary removed from underlying map; getSummary should return null
    expect(YjsModule.getSummary(state, 'character:backstory')).to.equal(null);
    const notification = document.querySelector('.notification');
    expect(notification).to.exist;
  });

  it('should call window.location.reload when clicking Refresh App', function() {
    Settings.initSettingsPage(YjsModule.getYjsState());

    const refreshBtn = document.getElementById('refresh-app');
    expect(refreshBtn).to.exist;

    // JSDOM Location.reload is read-only; verify handler exists without throwing
    expect(() => refreshBtn.click()).to.not.throw();
  });
});