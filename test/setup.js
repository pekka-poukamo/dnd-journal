import { JSDOM } from 'jsdom';
import chai from 'chai';

// Enable should syntax
chai.should();

// Setup DOM environment (JSDOM sets up window, document, navigator, HTMLElement)
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
// JSDOM already sets global.navigator and global.HTMLElement

// Create a robust localStorage mock
const createLocalStorageMock = () => ({
  data: {},
  getItem: function(key) { 
    return this.data[key] || null; 
  },
  setItem: function(key, value) { 
    this.data[key] = value; 
  },
  removeItem: function(key) { 
    delete this.data[key]; 
  },
  clear: function() { 
    this.data = {}; 
  }
});

// Initialize localStorage
global.localStorage = createLocalStorageMock();

// Add or override missing globals
if (!global.btoa) {
  global.btoa = function(str) { return Buffer.from(str, 'binary').toString('base64'); };
}
if (!global.atob) {
  global.atob = function(str) { return Buffer.from(str, 'base64').toString('binary'); };
}

global.console = {
  error: function() {},
  warn: function() {},
  log: function() {},
  info: function() {},
  debug: function() {}
};

// =============================================================================
// CRITICAL: GLOBAL FETCH MOCK - PREVENTS REAL API CALLS AND COSTS
// =============================================================================
// This mock intercepts ALL network requests during testing to ensure:
// 1. No real API calls are made to OpenAI or any external services
// 2. No API costs are incurred during test runs
// 3. Tests run predictably without network dependencies
// 4. All OpenAI API calls return consistent mock responses
global.fetch = async function(url, options) {
  // Mock OpenAI API responses to prevent real API calls and costs
  if (url.includes('openai.com')) {
    await new Promise(function(resolve) { setTimeout(resolve, 10); });
    return {
      ok: true,
      status: 200,
      json: async function() {
        return {
          choices: [{
            message: {
              content: "1. What pivotal moment shaped your character?\n2. What internal conflict drives you?\n3. How might recent events change your path?\n4. What unexpected truth about yourself have you yet to discover?"
            }
          }]
        };
      }
    };
  }
  
  // All other URLs return 404 to prevent accidental real requests
  return {
    ok: false,
    status: 404,
    json: async function() { return {}; }
  };
};

// Add cleanup function to reset localStorage between tests
global.resetLocalStorage = () => {
  global.localStorage = createLocalStorageMock();
};

export { chai };
export const should = chai.should();
