import './setup.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

import * as YjsModule from '../js/yjs.js';
import * as Character from '../js/character.js';

const workspaceRoot = '/workspace';

const loadHtmlIntoDom = (absoluteHtmlPath) => {
  const html = fs.readFileSync(absoluteHtmlPath, 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost', pretendToBeVisual: true, resources: 'usable' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  return dom;
};

describe('UI Contracts - Character Page (character.html)', function() {
  afterEach(function() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.remove());
  });

  beforeEach(async function() {
    loadHtmlIntoDom(path.join(workspaceRoot, 'character.html'));
    YjsModule.resetYjs();
    await YjsModule.initYjs();
  });

  it('should contain required form fields and initialize without errors', function() {
    expect(document.getElementById('character-form')).to.exist;
    expect(document.querySelector('#character-form [name="name"]')).to.exist;
    expect(document.querySelector('#character-form [name="race"]')).to.exist;
    expect(document.querySelector('#character-form [name="class"]')).to.exist;
    expect(document.querySelector('#character-form [name="backstory"]')).to.exist;
    expect(document.querySelector('#character-form [name="notes"]')).to.exist;

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
    YjsModule.setSummary(state, 'character:backstory', 'A brief summary');

    Character.initCharacterPage(state);

    const refreshBtn = document.getElementById('refresh-summaries');
    refreshBtn.click();

    const summariesDiv = document.getElementById('summaries-content');
    expect(summariesDiv.textContent).to.include('A brief summary');
  });

  it('should generate summaries when AI enabled and content present', async function() {
    const state = YjsModule.getYjsState();
    YjsModule.setSetting(state, 'openai-api-key', 'sk-abc123');
    YjsModule.setSetting(state, 'ai-enabled', true);

    Character.initCharacterPage(state);
    const backstory = document.getElementById('character-backstory');
    backstory.value = 'Long backstory to summarize';

    Character.updateSummariesDisplay(state);
    const generateBtn = document.getElementById('generate-summaries');
    expect(generateBtn.style.display).to.equal('inline-block');

    generateBtn.click();
    await new Promise(r => setTimeout(r, 10));

    const notification = document.querySelector('.notification');
    expect(notification).to.exist;
    const summariesDiv = document.getElementById('summaries-content');
    expect(summariesDiv.innerHTML).to.include('summary-word-count');
  });
});