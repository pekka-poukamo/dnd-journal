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

// Mock IndexedDB for Yjs
global.indexedDB = {
  open: function(name, version) {
    return {
      addEventListener: function() {},
      removeEventListener: function() {},
      result: {
        objectStoreNames: { contains: () => false },
        createObjectStore: () => ({
          createIndex: () => {},
          transaction: () => ({
            objectStore: () => ({
              put: () => ({ addEventListener: () => {} }),
              get: () => ({ addEventListener: () => {} }),
              delete: () => ({ addEventListener: () => {} })
            })
          })
        }),
        transaction: () => ({
          objectStore: () => ({
            put: () => ({ addEventListener: () => {} }),
            get: () => ({ addEventListener: () => {} }),
            delete: () => ({ addEventListener: () => {} })
          })
        })
      },
      onsuccess: null,
      onerror: null
    };
  }
};

// Mock WebSocket for Yjs
global.WebSocket = class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
    
    // Simulate connection failure after a short delay
    setTimeout(() => {
      this.readyState = 3; // CLOSED
      if (this.onerror) {
        this.onerror(new Error('Mock WebSocket connection failed'));
      }
    }, 10);
  }
  
  send(data) {
    // Mock send - do nothing
  }
  
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
  }
};

global.console = {
  error: function() {},
  warn: function() {},
  log: function() {},
  info: function() {},
  debug: function() {}
};

global.fetch = async function(url, options) {
  // Mock OpenAI API responses
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
