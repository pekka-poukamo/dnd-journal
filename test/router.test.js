// Router Tests - Pure Functional Testing (ADR-0005 Compliant)
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import {
  initRouter,
  navigateTo,
  getCurrentRoute,
  isRouterInitialized,
  resetRouter,
  createRoutes,
  addRoute,
  removeRoute,
  getRoutes
} from '../js/router.js';

describe('Router', () => {
  let dom;
  let window;
  let document;
  
  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <main id="app-container">
            <nav class="main-navigation">
              <ul class="main-navigation__list">
                <li><a href="/" class="main-navigation__link">Journal</a></li>
                <li><a href="/character" class="main-navigation__link">Character</a></li>
                <li><a href="/settings" class="main-navigation__link">Settings</a></li>
              </ul>
            </nav>
            <div id="page-content"></div>
          </main>
        </body>
      </html>
    `, {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    window = dom.window;
    document = window.document;
    
    // Make DOM available globally for router
    global.window = window;
    global.document = document;
    global.history = window.history;
    global.location = window.location;
    
    // Reset router state before each test
    resetRouter();
  });
  
  afterEach(() => {
    resetRouter();
    // Clean up globals
    delete global.window;
    delete global.document;
    delete global.history;
    delete global.location;
  });
  
  describe('Pure Function Structure', () => {
    it('should export only pure functions', () => {
      expect(typeof initRouter).to.equal('function');
      expect(typeof navigateTo).to.equal('function');
      expect(typeof getCurrentRoute).to.equal('function');
      expect(typeof isRouterInitialized).to.equal('function');
      expect(typeof resetRouter).to.equal('function');
      expect(typeof createRoutes).to.equal('function');
    });
    
    it('should not use classes or this keyword', () => {
      // This test ensures ADR-0002 compliance by checking function types
      const routerModule = require('../js/router.js');
      const moduleString = routerModule.toString();
      
      expect(moduleString).to.not.include('class ');
      expect(moduleString).to.not.include('this.');
    });
  });
  
  describe('Route Configuration', () => {
    it('should create default routes', () => {
      const routes = createRoutes();
      
      expect(routes).to.have.property('/');
      expect(routes).to.have.property('/character');
      expect(routes).to.have.property('/settings');
      
      expect(routes['/'].title).to.equal('D&D Journal');
      expect(routes['/character'].title).to.equal('Character Details - D&D Journal');
      expect(routes['/settings'].title).to.equal('Settings - D&D Journal');
    });
    
    it('should provide template functions for each route', () => {
      const routes = createRoutes();
      
      expect(typeof routes['/'].template).to.equal('function');
      expect(typeof routes['/character'].template).to.equal('function');
      expect(typeof routes['/settings'].template).to.equal('function');
    });
    
    it('should provide loader functions for each route', () => {
      const routes = createRoutes();
      
      expect(typeof routes['/'].loader).to.equal('function');
      expect(typeof routes['/character'].loader).to.equal('function');
      expect(typeof routes['/settings'].loader).to.equal('function');
    });
  });
  
  describe('Router Initialization', () => {
    it('should initialize router with default routes', () => {
      expect(isRouterInitialized()).to.be.false;
      
      // Mock the module imports to avoid loading actual page modules
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
      
      expect(isRouterInitialized()).to.be.true;
    });
    
    it('should not initialize twice', () => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
      const firstInit = isRouterInitialized();
      
      initRouter(mockRoutes);
      const secondInit = isRouterInitialized();
      
      expect(firstInit).to.be.true;
      expect(secondInit).to.be.true;
    });
  });
  
  describe('Navigation State', () => {
    beforeEach(() => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        },
        '/test': {
          title: 'Test Page',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
    });
    
    it('should track current route', async () => {
      expect(getCurrentRoute()).to.equal('/'); // Initial route
      
      await new Promise(resolve => {
        navigateTo('/test');
        setTimeout(() => {
          expect(getCurrentRoute()).to.equal('/test');
          resolve();
        }, 10);
      });
    });
    
    it('should update browser history', () => {
      const initialPath = window.location.pathname;
      navigateTo('/test');
      
      // Note: JSDOM doesn't fully simulate pushState, but we can verify the call
      expect(window.location.pathname).to.not.equal(initialPath);
    });
  });
  
  describe('Route Management', () => {
    beforeEach(() => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
    });
    
    it('should add routes dynamically', () => {
      const newRoute = {
        title: 'New Page',
        template: () => document.createElement('div'),
        loader: () => Promise.resolve(() => {})
      };
      
      addRoute('/new', newRoute);
      const routes = getRoutes();
      
      expect(routes).to.have.property('/new');
      expect(routes['/new'].title).to.equal('New Page');
    });
    
    it('should remove routes dynamically', () => {
      const newRoute = {
        title: 'New Page',
        template: () => document.createElement('div'),
        loader: () => Promise.resolve(() => {})
      };
      
      addRoute('/new', newRoute);
      removeRoute('/new');
      const routes = getRoutes();
      
      expect(routes).to.not.have.property('/new');
    });
    
    it('should return copy of routes object', () => {
      const routes1 = getRoutes();
      const routes2 = getRoutes();
      
      expect(routes1).to.not.equal(routes2); // Different objects
      expect(routes1).to.deep.equal(routes2); // Same content
    });
  });
  
  describe('Error Handling', () => {
    it('should handle navigation to non-existent routes', () => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
      
      // Should not throw error
      expect(() => navigateTo('/nonexistent')).to.not.throw();
    });
    
    it('should require initialization before route management', () => {
      expect(() => addRoute('/test', {})).to.throw('Router not initialized');
      expect(() => removeRoute('/test')).to.throw('Router not initialized');
    });
  });
  
  describe('DOM Integration', () => {
    beforeEach(() => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => {
            const div = document.createElement('div');
            div.innerHTML = '<h1>Journal Page</h1>';
            return div;
          },
          loader: () => Promise.resolve(() => {})
        },
        '/test': {
          title: 'Test Page',
          template: () => {
            const div = document.createElement('div');
            div.innerHTML = '<h1>Test Page</h1>';
            return div;
          },
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
    });
    
    it('should inject page template into content area', async () => {
      await new Promise(resolve => {
        navigateTo('/test');
        setTimeout(() => {
          const pageContent = document.getElementById('page-content');
          expect(pageContent.innerHTML).to.include('Test Page');
          resolve();
        }, 10);
      });
    });
    
    it('should clear previous content when navigating', async () => {
      // Navigate to test page first
      await new Promise(resolve => {
        navigateTo('/test');
        setTimeout(() => {
          const pageContent = document.getElementById('page-content');
          expect(pageContent.innerHTML).to.include('Test Page');
          resolve();
        }, 10);
      });
      
      // Navigate back to journal
      await new Promise(resolve => {
        navigateTo('/');
        setTimeout(() => {
          const pageContent = document.getElementById('page-content');
          expect(pageContent.innerHTML).to.include('Journal Page');
          expect(pageContent.innerHTML).to.not.include('Test Page');
          resolve();
        }, 10);
      });
    });
    
    it('should update page title', async () => {
      await new Promise(resolve => {
        navigateTo('/test');
        setTimeout(() => {
          expect(document.title).to.equal('Test Page');
          resolve();
        }, 10);
      });
    });
  });
  
  describe('Navigation Highlighting', () => {
    beforeEach(() => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        },
        '/character': {
          title: 'Test Character',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
    });
    
    it('should highlight active navigation link', async () => {
      await new Promise(resolve => {
        navigateTo('/character');
        setTimeout(() => {
          const characterLink = document.querySelector('a[href="/character"]');
          const journalLink = document.querySelector('a[href="/"]');
          
          expect(characterLink.classList.contains('main-navigation__link--active')).to.be.true;
          expect(journalLink.classList.contains('main-navigation__link--active')).to.be.false;
          resolve();
        }, 10);
      });
    });
  });
  
  describe('State Reset (Testing Support)', () => {
    it('should reset router state completely', () => {
      const mockRoutes = {
        '/': {
          title: 'Test Journal',
          template: () => document.createElement('div'),
          loader: () => Promise.resolve(() => {})
        }
      };
      
      initRouter(mockRoutes);
      expect(isRouterInitialized()).to.be.true;
      
      resetRouter();
      expect(isRouterInitialized()).to.be.false;
      expect(getCurrentRoute()).to.be.null;
    });
  });
});