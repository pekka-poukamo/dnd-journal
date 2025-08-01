// Cache Utilities - Shared Navigation Cache Functions (ADR-0002 Compliant)
// Pure functional utilities to eliminate duplication across page modules

import {
  saveNavigationCache,
  saveCurrentFormData
} from './navigation-cache.js';

// Pure function to set up universal navigation caching for any page
export const setupNavigationCaching = (pageType, state, getFormDataFn) => {
  // Save cache before page unload
  const handleBeforeUnload = () => {
    saveNavigationCache(state);
    
    // Save any current form data
    if (getFormDataFn) {
      const formData = getFormDataFn();
      if (formData) {
        saveCurrentFormData(pageType, formData);
      }
    }
  };
  
  // Set up event listener
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Save cache on data changes
  const handleDataChange = () => {
    saveNavigationCache(state);
  };
  
  // Save on user activity (debounced)
  let activityTimeout;
  const debouncedActivity = () => {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
      handleDataChange();
      
      // Also save form data if function provided
      if (getFormDataFn) {
        const formData = getFormDataFn();
        if (formData) {
          saveCurrentFormData(pageType, formData);
        }
      }
    }, 2000); // 2 second delay
  };
  
  return {
    handleDataChange,
    debouncedActivity,
    cleanup: () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(activityTimeout);
    }
  };
};

// Pure function to set up form-specific caching
export const setupFormCaching = (pageType, formElement, getFormDataFn) => {
  if (!formElement || !getFormDataFn) return { cleanup: () => {} };
  
  // Save on form changes (debounced)
  let formTimeout;
  const debouncedFormSave = () => {
    clearTimeout(formTimeout);
    formTimeout = setTimeout(() => {
      const formData = getFormDataFn();
      if (formData) {
        saveCurrentFormData(pageType, formData);
      }
    }, 1000); // 1 second delay
  };
  
  // Listen for form changes
  formElement.addEventListener('input', debouncedFormSave);
  formElement.addEventListener('change', debouncedFormSave);
  
  return {
    cleanup: () => {
      clearTimeout(formTimeout);
      formElement.removeEventListener('input', debouncedFormSave);
      formElement.removeEventListener('change', debouncedFormSave);
    }
  };
};

// Pure function to enhance Yjs observers with cache saving
export const withCacheSaving = (observerCallback, state) => {
  return (...args) => {
    // Call original observer
    const result = observerCallback(...args);
    
    // Save to cache after changes
    saveNavigationCache(state);
    
    return result;
  };
};

// Pure function to create standard page initialization pattern
export const createPageInitializer = (pageType, config) => {
  const {
    getDOMElements,
    renderCachedContent,
    initializeYjs,
    setupObservers,
    renderFreshContent,
    setupFormHandlers,
    setupAdditional,
    getFormData
  } = config;
  
  return async (stateParam = null) => {
    try {
      // 1. Get DOM elements first
      const elements = getDOMElements();
      if (!elements.isValid) {
        console.warn(`Required ${pageType} elements not found`);
        return;
      }
      
      // 2. Show cached content immediately
      if (renderCachedContent) {
        renderCachedContent(elements);
      }
      
      // 3. Initialize Yjs in background
      const state = stateParam || (await initializeYjs());
      
      // 4. Set up reactive updates with cache saving
      if (setupObservers) {
        setupObservers(state, (callback) => withCacheSaving(callback, state));
      }
      
      // 5. Replace cached content with fresh data
      if (renderFreshContent) {
        renderFreshContent(state, elements);
      }
      
      // 6. Set up form handling
      if (setupFormHandlers) {
        setupFormHandlers(state, elements);
      }
      
      // 7. Set up additional features
      if (setupAdditional) {
        setupAdditional(state, elements);
      }
      
      // 8. Set up navigation caching
      const cacheHandlers = setupNavigationCaching(pageType, state, getFormData);
      const formCacheHandlers = getFormData && elements.formElement 
        ? setupFormCaching(pageType, elements.formElement, getFormData)
        : { cleanup: () => {} };
      
      // Return cleanup function for testing
      return {
        cleanup: () => {
          cacheHandlers.cleanup();
          formCacheHandlers.cleanup();
        }
      };
      
    } catch (error) {
      console.error(`Failed to initialize ${pageType} page:`, error);
    }
  };
};