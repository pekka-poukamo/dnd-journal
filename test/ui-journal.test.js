import './setup.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

import * as YjsModule from '../js/yjs.js';
import * as Journal from '../js/journal.js';

const workspaceRoot = process.cwd();

const loadHtmlIntoDom = (absoluteHtmlPath) => {
  const html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', pretendToBeVisual: true, resources: 'usable' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  return dom;
};

describe('UI Contracts - Journal Page (index.html)', function() {
  afterEach(function() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
  });

  beforeEach(async function() {
    loadHtmlIntoDom(path.join(workspaceRoot, 'index.html'));
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  it('should contain required containers and initialize without errors', function() {
    expect(document.getElementById('entries-container')).to.exist;
    expect(document.getElementById('entry-form-container')).to.exist;
    expect(document.getElementById('ai-prompt-text')).to.exist;
    expect(document.getElementById('regenerate-prompt-btn')).to.exist;

    expect(() => Journal.initJournalPage(YjsModule.getYjsState())).to.not.throw();
  });

  it('should render entry form and add entry via handler', function() {
    Journal.initJournalPage(YjsModule.getYjsState());

    const form = document.getElementById('entry-form');
    expect(form).to.exist;

    Journal.handleAddEntry({ content: 'A brave new journey.' }, YjsModule.getYjsState());

    const entries = YjsModule.getEntries(YjsModule.getYjsState());
    expect(entries.length).to.be.greaterThan(0);
    expect(entries[0].content).to.equal('A brave new journey.');
  });

  it('should disable regenerate button when AI not enabled and not throw on click', function() {
    Journal.initJournalPage(YjsModule.getYjsState());
    const btn = document.getElementById('regenerate-prompt-btn');
    expect(btn).to.exist;
    expect(btn.disabled).to.be.true;
    expect(() => btn.click()).to.not.throw();
  });

  it('should support Edit and Delete buttons on entries', function() {
    const state = YjsModule.getYjsState();
    YjsModule.addEntry(state, { id: 'e1', content: 'First', timestamp: Date.now() - 1000 });
    YjsModule.addEntry(state, { id: 'e2', content: 'Second', timestamp: Date.now() });

    Journal.initJournalPage(state);

    const entriesContainer = document.getElementById('entries-container');
    const firstEntry = entriesContainer.querySelector('[data-entry-id="e2"]');
    expect(firstEntry).to.exist;

    const editBtn = firstEntry.querySelector('.entry-actions button:first-child');
    expect(editBtn).to.exist;
    editBtn.click();
    const editForm = entriesContainer.querySelector('.entry-edit-form');
    expect(editForm).to.exist;

    const textarea = editForm.querySelector('textarea');
    textarea.value = 'Updated Second';
    const submitEvt = new window.Event('submit', { bubbles: true, cancelable: true });
    editForm.dispatchEvent(submitEvt);

    const updated = YjsModule.getEntries(state).find(e => e.id === 'e2');
    expect(updated.content).to.equal('Updated Second');

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
    YjsModule.setSetting(state, 'openai-api-key', 'sk-abc123');
    YjsModule.setSetting(state, 'ai-enabled', true);
    YjsModule.setCharacter(state, 'name', 'Aragorn');
    YjsModule.addEntry(state, { id: 'cx', content: 'Travelled to Bree', timestamp: Date.now() });

    Journal.initJournalPage(state);

    const btn = document.getElementById('regenerate-prompt-btn');
    expect(btn).to.exist;
    btn.click();

    await new Promise(r => setTimeout(r, 10));
    const prompt = document.getElementById('ai-prompt-text');
    expect(prompt.innerHTML).to.not.equal('');
  });
});