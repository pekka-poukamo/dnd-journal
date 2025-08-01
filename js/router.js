// Router - Pure Functional Navigation (ADR-0002 Compliant)
// No classes, no 'this', pure functions only

import { 
  createJournalPageTemplate, 
  createCharacterPageTemplate, 
  createSettingsPageTemplate,
  injectPageTemplate 
} from './page-templates.js';

// Internal router state (private module state)
let currentRoute = null;
let routes = {};
let isInitialized = false;

// Pure route configuration
export const createRoutes = () => ({
  '/': {
    title: 'D&D Journal',
    template: createJournalPageTemplate,
    loader: () => import('./journal.js').then(m => m.initJournalPage)
  },
  '/character': {
    title: 'Character Details - D&D Journal', 
    template: createCharacterPageTemplate,
    loader: () => import('./character.js').then(m => m.initCharacterPage)
  },
  '/settings': {
    title: 'Settings - D&D Journal',
    template: createSettingsPageTemplate,
    loader: () => import('./settings.js').then(m => m.initSettingsPage)
  }
});

// Pure function to initialize router
export const initRouter = (routeConfig = null) => {
  if (isInitialized) return;
  
  routes = routeConfig || createRoutes();
  
  // Set up event listeners functionally
  setupNavigationHandlers();
  
  // Load initial route
  const initialPath = getCurrentPath();
  loadRoute(initialPath);
  
  isInitialized = true;
};

// Pure function to get current browser path
const getCurrentPath = () => {
  return window.location.pathname;
};

// Pure function to check if link is internal
const isInternalLink = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
};

// Pure function to extract path from link
const getLinkPath = (linkElement) => {
  const href = linkElement.getAttribute('href');
  if (!href) return null;
  
  // Handle relative paths
  if (href.startsWith('/')) return href;
  if (href.startsWith('./')) return href.slice(1);
  if (!href.includes('://')) return '/' + href.replace(/^\.?\//, '');
  
  return null;
};

// Pure event handler for link clicks
const handleLinkClick = (event) => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  
  const path = getLinkPath(link);
  if (path && routes[path]) {
    event.preventDefault();
    navigateTo(path);
  }
};

// Pure event handler for browser navigation
const handlePopState = () => {
  const path = getCurrentPath();
  loadRoute(path);
};

// Pure function to set up event listeners
const setupNavigationHandlers = () => {
  // Remove existing listeners if any (for testing)
  document.removeEventListener('click', handleLinkClick);
  window.removeEventListener('popstate', handlePopState);
  
  // Add new listeners
  document.addEventListener('click', handleLinkClick);
  window.addEventListener('popstate', handlePopState);
};

// Pure function for programmatic navigation
export const navigateTo = (path) => {
  if (!routes[path]) {
    console.warn(`Route not found: ${path}`);
    return;
  }
  
  // Update browser history
  window.history.pushState(null, '', path);
  
  // Load the route
  loadRoute(path);
};

// Pure function to load a route
const loadRoute = async (path) => {
  const route = routes[path];
  if (!route) {
    console.warn(`Route not found: ${path}, falling back to /`);
    if (path !== '/') {
      navigateTo('/');
    }
    return;
  }
  
  try {
    // Update page title
    document.title = route.title;
    
    // Clear current content
    clearMainContent();
    
    // Inject page template
    const template = route.template();
    injectPageTemplate(template);
    
    // Load and execute the page module
    const pageInitFn = await route.loader();
    await pageInitFn();
    
    // Update current route state
    currentRoute = path;
    
    // Update navigation highlighting
    updateNavigationHighlight(path);
    
  } catch (error) {
    console.error(`Failed to load route ${path}:`, error);
    showRouteError(path, error);
  }
};

// Pure function to clear page content area
const clearMainContent = () => {
  const pageContent = document.getElementById('page-content');
  if (pageContent) {
    pageContent.innerHTML = '';
  }
};

// Pure function to show route loading error
const showRouteError = (path, error) => {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'route-error';
    errorDiv.innerHTML = `
      <h2>Navigation Error</h2>
      <p>Failed to load page: ${path}</p>
      <p>Error: ${error.message}</p>
      <a href="/">Return to Journal</a>
    `;
    mainContent.appendChild(errorDiv);
  }
};

// Pure function to get current route
export const getCurrentRoute = () => currentRoute;

// Pure function to check if router is initialized
export const isRouterInitialized = () => isInitialized;

// Pure function for testing - reset router state
export const resetRouter = () => {
  currentRoute = null;
  routes = {};
  isInitialized = false;
  
  // Remove event listeners
  document.removeEventListener('click', handleLinkClick);
  window.removeEventListener('popstate', handlePopState);
};

// Pure helper function to add route dynamically
export const addRoute = (path, config) => {
  if (!isInitialized) {
    throw new Error('Router not initialized. Call initRouter() first.');
  }
  
  routes[path] = config;
};

// Pure helper function to remove route
export const removeRoute = (path) => {
  if (!isInitialized) {
    throw new Error('Router not initialized. Call initRouter() first.');
  }
  
  delete routes[path];
};

// Pure function to get all routes
export const getRoutes = () => ({ ...routes });

// Pure function to update navigation highlighting
const updateNavigationHighlight = (currentPath) => {
  const navLinks = document.querySelectorAll('.main-navigation__link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('main-navigation__link--active');
    } else {
      link.classList.remove('main-navigation__link--active');
    }
  });
};