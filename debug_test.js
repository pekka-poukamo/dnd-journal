import './test/setup.js';
import * as App from './js/app.js';
import * as Utils from './js/utils.js';

// Set some state
App.state.character.name = 'TestCharacter';
console.log('Initial state:', App.state.character.name);

// Set corrupted localStorage
global.localStorage.setItem(Utils.STORAGE_KEYS.JOURNAL, 'invalid json');

// Call loadData
App.loadData();

console.log('Final state:', App.state.character.name);
console.log('Expected: empty string');
console.log('Test passes:', App.state.character.name === '');