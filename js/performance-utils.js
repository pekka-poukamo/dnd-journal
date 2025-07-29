// Performance Utilities - Lazy loading and optimization helpers
// Following functional programming principles and style guide

import { safeExecute, createSuccess, createError } from './error-handling.js';

// Pure function to create a lazy loader
export const createLazyLoader = (importFn, name = 'module') => {
  let cached = null;
  let loading = false;
  
  return async () => {
    if (cached) return createSuccess(cached);
    
    if (loading) {
      // Wait for existing load to complete
      while (loading) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return cached ? createSuccess(cached) : createError(`Failed to load ${name}`);
    }
    
    loading = true;
    const result = await safeExecute(importFn, `lazy load ${name}`);
    loading = false;
    
    if (result.success) {
      cached = result.data;
    }
    
    return result;
  };
};

// Pure function to create a debounced function for performance
export const createDebounced = (fn, delay, name = 'function') => {
  let timeoutId = null;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = safeExecute(() => fn(...args), `debounced ${name}`);
      // Handle result if needed
    }, delay);
  };
};

// Pure function to create a throttled function for performance
export const createThrottled = (fn, delay, name = 'function') => {
  let lastCall = 0;
  
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return safeExecute(() => fn(...args), `throttled ${name}`);
    }
  };
};

// Pure function to check if feature should be loaded based on conditions
export const shouldLoadFeature = (conditions) => {
  return Object.entries(conditions).every(([key, value]) => {
    switch (key) {
      case 'hasApiKey':
        return value === true; // Will be checked dynamically
      case 'elementExists':
        return document.getElementById(value) !== null;
      case 'userInteracted':
        return value === true; // Will be set by user interaction
      default:
        return true;
    }
  });
};

// Lazy loader for AI features
export const loadAIFeatures = createLazyLoader(
  async () => {
    const [aiModule, summarizationModule] = await Promise.all([
      import('./ai.js'),
      import('./summarization.js')
    ]);
    return { ai: aiModule, summarization: summarizationModule };
  },
  'AI features'
);

// Lazy loader for character features
export const loadCharacterFeatures = createLazyLoader(
  async () => {
    const characterModule = await import('./character.js');
    return characterModule;
  },
  'character features'
);

// Lazy loader for storytelling features
export const loadStorytellingFeatures = createLazyLoader(
  async () => {
    const storytellingModule = await import('./storytelling.js');
    return storytellingModule;
  },
  'storytelling features'
);

// Pure function to initialize features based on conditions
export const initializeFeature = async (loader, conditions = {}) => {
  if (!shouldLoadFeature(conditions)) {
    return createSuccess(null);
  }
  
  return await loader();
};

// Pure function to create a performance monitor
export const createPerformanceMonitor = (name) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

// Pure function to batch DOM operations for better performance
export const batchDOMOperations = (operations, name = 'DOM operations') => {
  return safeExecute(() => {
    const monitor = createPerformanceMonitor(name);
    
    // Use document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    const results = operations.map(operation => {
      try {
        return operation(fragment);
      } catch (error) {
        console.warn(`Operation failed in batch: ${error.message}`);
        return null;
      }
    });
    
    // Append all at once for better performance
    if (fragment.children.length > 0) {
      const targetElement = document.body; // Default target
      targetElement.appendChild(fragment);
    }
    
    monitor.end();
    return results.filter(result => result !== null);
  }, `batch ${name}`);
};

// Pure function to defer non-critical operations
export const deferOperation = (operation, delay = 0, name = 'deferred operation') => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const result = await safeExecute(operation, name);
      resolve(result);
    }, delay);
  });
};

// Pure function to check if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Pure function to optimize animations based on user preferences
export const optimizeAnimation = (animationFn, fallbackFn = null) => {
  if (prefersReducedMotion() && fallbackFn) {
    return fallbackFn;
  }
  return animationFn;
};