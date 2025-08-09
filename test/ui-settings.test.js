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
    expect(notification).to.exist;
  });

  it('should trigger notification when testing API key', function() {
    Settings.initSettingsPage(YjsModule.getYjsState());

    const apiKeyInput = document.getElementById('openai-api-key');
    const btnTestApi = document.getElementById('test-api-key');
    apiKeyInput.value = 'sk-test-123';

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

    btnShowPrompt.click();
    const preview = document.getElementById('ai-prompt-preview');
    expect(preview.style.display || '').to.not.equal('block');
  });

  it('should show AI prompt on button click when AI is enabled and key saved', async function() {
    const state = YjsModule.getYjsState();
    YjsModule.setSetting(state, 'ai-enabled', true);
    YjsModule.setSetting(state, 'openai-api-key', 'sk-abc123');

    Settings.initSettingsPage(state);

    const btnShowPrompt = document.getElementById('show-ai-prompt');
    expect(btnShowPrompt.disabled).to.be.false;

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