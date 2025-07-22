const chai = require('chai');

// Enable should syntax
chai.should();

// Lightweight DOM mocking without JSDOM
global.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    textContent: '',
    children: [],
    appendChild: function(child) { this.children.push(child); },
    querySelector: function(selector) { 
      return this.children.find(child => 
        child.className === selector.replace('.', '') ||
        child.id === selector.replace('#', '')
      ) || null;
    },
    querySelectorAll: function(selector) {
      return this.children.filter(child => 
        child.className === selector.replace('.', '') ||
        child.id === selector.replace('#', '')
      );
    },
    setAttribute: function(name, value) { this[name] = value; },
    id: '',
    src: '',
    alt: '',
    style: { display: '' },
    value: '',
    addEventListener: () => {},
    focus: () => {}
  }),
  getElementById: (id) => ({
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    appendChild: () => {},
    replaceChildren: () => {},
    addEventListener: () => {},
    focus: () => {}
  }),
  body: {
    innerHTML: '',
    appendChild: () => {},
    replaceChildren: () => {}
  }
};

global.window = { document: global.document };
global.HTMLElement = function() {};
global.localStorage = {
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

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: () => {},
  warn: () => {},
  log: () => {}
};

module.exports = { chai, should: chai.should() };
