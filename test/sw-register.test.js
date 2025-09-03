import { describe, it, beforeEach, afterEach } from 'mocha';

describe('Service Worker Registration', () => {
  let originalServiceWorker;
  let originalWindow;

  beforeEach(() => {
    originalServiceWorker = (global.navigator && global.navigator.serviceWorker) || undefined;
    originalWindow = global.window;
  });

  afterEach(() => {
    if (originalServiceWorker === undefined) {
      if (global.navigator && 'serviceWorker' in global.navigator) {
        delete global.navigator.serviceWorker;
      }
    } else {
      global.navigator.serviceWorker = originalServiceWorker;
    }
    global.window = originalWindow;
  });

  it('should auto-register with versioned sw URL when available', async () => {
    let capturedUrl;
    global.navigator.serviceWorker = {
      register(url) {
        capturedUrl = url;
        return Promise.resolve();
      }
    };

    // Dynamic import so module executes after our stub is set
    const mod = await import('../js/sw-register.js');

    // Auto-register on import should have been called
    capturedUrl.should.equal('/sw.js?v=dev');

    // And calling explicitly should also work
    await mod.registerServiceWorker();
    capturedUrl.should.equal('/sw.js?v=dev');
  });

  it('should not throw when service workers are unavailable', async () => {
    if (global.navigator && 'serviceWorker' in global.navigator) {
      delete global.navigator.serviceWorker;
    }

    const mod = await import('../js/sw-register.js');

    // No error expected when calling explicitly
    (() => mod.registerServiceWorker()).should.not.throw();
  });

  it('should no-op when window is undefined (non-browser)', async () => {
    // Temporarily remove window
    global.window = undefined;

    const mod = await import('../js/sw-register.js');

    // Should not throw even without window
    (() => mod.registerServiceWorker()).should.not.throw();
  });
});

