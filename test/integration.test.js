import { expect } from 'chai';
import './setup.js';
import * as App from '../js/app.js';
import * as Character from '../js/character.js';
import * as Settings from '../js/settings.js';
import * as Utils from '../js/utils.js';
import { createSystem, clearSystem } from '../js/yjs.js';

describe('D&D Journal Integration Tests', function() {
  beforeEach(async function() {
    // Clear and reinitialize Yjs mock system
    clearSystem();
    await createSystem();
    
    // Clear DOM
    document.body.innerHTML = `
      <input type="text" id="entry-title" />
      <textarea id="entry-content"></textarea>
      <button id="add-entry-btn">Add Entry</button>
      <div id="entries-container"></div>
      <div id="display-name">Unnamed Character</div>
      <div id="display-race">Unknown</div>
      <div id="display-class">Unknown</div>
    `;
    
    // Reset app state
    App.resetState();
  });

  afterEach(function() {
    // Clean up after each test
    clearSystem();
  });

  it('should handle data validation and error cases', function() {
    // Test basic validation
    const validEntry = {
      id: 'test-1',
      title: 'Valid Entry',
      content: 'Valid content',
      timestamp: Date.now()
    };
    
    expect(Utils.isValidEntry(validEntry)).to.be.true;
    
    const invalidEntry = { id: '', title: '', content: '' };
    expect(Utils.isValidEntry(invalidEntry)).to.be.false;
  });

  it('should integrate with utility functions', function() {
    // Test utility function integration
    const testId = Utils.generateId();
    expect(testId).to.be.a('string');
    expect(testId.length).to.be.greaterThan(0);
    
    const testDate = Utils.formatDate(Date.now());
    expect(testDate).to.be.a('string');
    expect(testDate).to.include('/');
  });

  it('should handle character and entry integration', function() {
    // Test basic character-entry integration
    const testCharacter = {
      name: 'Test Character',
      race: 'Human',
      class: 'Fighter',
      backstory: 'A test character',
      notes: 'For testing'
    };
    
    const result = Character.saveCharacterData(testCharacter);
    expect(result.success).to.be.true;
    
    const loadedCharacter = Character.loadCharacterData();
    expect(loadedCharacter.name).to.equal('Test Character');
  });

  it('should show "Unnamed Character" when character name is empty string', function() {
    App.state.character = {
      name: '',
      race: 'Human',
      class: 'Fighter'
    };
    
    App.displayCharacterSummary();
    
    const nameDisplay = document.getElementById('display-name');
    expect(nameDisplay.textContent).to.equal('Unnamed Character');
  });

  it('should handle potential sync override issue with character data', function() {
    // Test that character data persists correctly
    const testCharacter = {
      name: 'Persistent Character',
      race: 'Elf',
      class: 'Wizard',
      backstory: 'A character that should persist',
      notes: 'Testing persistence'
    };
    
    Character.saveCharacterData(testCharacter);
    const loadedCharacter = Character.loadCharacterData();
    
    expect(loadedCharacter.name).to.equal('Persistent Character');
    expect(loadedCharacter.race).to.equal('Elf');
    expect(loadedCharacter.class).to.equal('Wizard');
  });
});
