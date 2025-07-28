import { JSDOM } from 'jsdom';
import chai from 'chai';

// Enable should syntax
chai.should();

// Increase max listeners to prevent warnings during tests
if (typeof process !== 'undefined' && process.setMaxListeners) {
  process.setMaxListeners(30);
}

// Setup DOM environment (JSDOM sets up window, document, navigator, HTMLElement)
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
// JSDOM already sets global.navigator and global.HTMLElement

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
    
    // Simulate connection failure immediately to speed up tests
    setImmediate(() => {
      this.readyState = 3; // CLOSED
      if (this.onerror) {
        this.onerror(new Error('Mock WebSocket connection failed'));
      }
    });
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

// Mock console to reduce noise during tests
global.console = {
  error: function() {},
  warn: function() {},
  log: function() {},
  info: function() {},
  debug: function() {}
};

// Mock alert for character.js tests
global.alert = function(message) {
  // Mock alert - do nothing or store message for test verification
  global.lastAlert = message;
};

// Also mock window.alert for tests that expect it
global.window.alert = function(message) {
  global.lastAlert = message;
};

global.fetch = async function(url, options) {
  // Mock OpenAI API responses
  if (url.includes('openai.com')) {
    // Use setImmediate for faster test execution
    await new Promise(function(resolve) { setImmediate(resolve); });
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

export { chai };
export const should = chai.should();
