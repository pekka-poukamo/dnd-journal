const { JSDOM } = require('jsdom');
const chai = require('chai');

// Enable should syntax
chai.should();

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Make DOM globals available
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
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

// Mock fetch to prevent actual network calls in tests
global.fetch = async (url, options) => {
  // Mock OpenAI API responses
  if (url.includes('openai.com')) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Return mock successful response
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{
          message: {
            content: "1. What pivotal moment shaped your character?\n2. What internal conflict drives you?\n3. How might recent events change your path?\n4. What unexpected truth about yourself have you yet to discover?"
          }
        }]
      })
    };
  }
  
  // For any other URLs, return empty response
  return {
    ok: false,
    status: 404,
    json: async () => ({})
  };
};

module.exports = { chai, should: chai.should() };
