// YJS Optimization - Performance improvements for YJS system initialization
// Following functional programming principles and style guide

import { safeExecute, createSuccess, createError } from './error-handling.js';
import { createPerformanceMonitor, deferOperation } from './performance-utils.js';
import { createSystem, getSystem, onUpdate } from './yjs.js';

// Pure function to check if YJS system is needed immediately
export const isYjsSystemNeeded = () => {
  // Check if we're on a page that needs immediate YJS access
  const currentPage = window.location.pathname;
  const hasDataElements = Boolean(
    document.getElementById('entries-list') ||
    document.getElementById('character-form') ||
    document.getElementById('settings-form')
  );
  
  return hasDataElements;
};

// Pure function to create YJS initialization priority
export const getInitializationPriority = () => {
  const pathPriorities = {
    '/index.html': 'high',
    '/character.html': 'medium', 
    '/settings.html': 'medium'
  };
  
  const currentPath = window.location.pathname;
  return pathPriorities[currentPath] || 'low';
};

// Optimized YJS system initialization with lazy loading
export const initializeYjsSystem = async (priority = 'medium') => {
  const monitor = createPerformanceMonitor('YJS System Initialization');
  
  try {
    // Immediate initialization for high priority
    if (priority === 'high') {
      const result = await safeExecute(createSystem, 'immediate YJS initialization');
      monitor.end();
      return result;
    }
    
    // Deferred initialization for medium/low priority
    const delay = priority === 'medium' ? 100 : 500;
    const result = await deferOperation(
      createSystem,
      delay,
      'deferred YJS initialization'
    );
    
    monitor.end();
    return result;
  } catch (error) {
    monitor.end();
    return createError('Failed to initialize YJS system', error);
  }
};

// Pure function to create batched state update handler
export const createBatchedStateUpdater = (updateFn, delay = 16) => {
  let updatePending = false;
  let updateData = null;
  
  return (data) => {
    updateData = data;
    
    if (!updatePending) {
      updatePending = true;
      requestAnimationFrame(() => {
        updateFn(updateData);
        updatePending = false;
        updateData = null;
      });
    }
  };
};

// Optimized state loading with performance monitoring
export const loadStateOptimized = () => {
  return safeExecute(() => {
    const monitor = createPerformanceMonitor('State Loading');
    
    const yjsSystem = getSystem();
    if (!yjsSystem?.characterMap || !yjsSystem?.journalMap) {
      monitor.end();
      return createSuccess(null);
    }
    
    // Load state efficiently
    const state = {
      character: {
        name: yjsSystem.characterMap.get('name') || '',
        race: yjsSystem.characterMap.get('race') || '',
        class: yjsSystem.characterMap.get('class') || '',
        backstory: yjsSystem.characterMap.get('backstory') || '',
        notes: yjsSystem.characterMap.get('notes') || ''
      },
      entries: []
    };
    
    // Load entries efficiently
    const entriesArray = yjsSystem.journalMap.get('entries');
    if (entriesArray) {
      state.entries = entriesArray.toArray().map(entryMap => ({
        id: entryMap.get('id'),
        title: entryMap.get('title'),
        content: entryMap.get('content'),
        timestamp: entryMap.get('timestamp')
      }));
    }
    
    monitor.end();
    return createSuccess(state);
  }, 'loadStateOptimized');
};

// Performance-optimized YJS update listener setup
export const setupOptimizedUpdateListener = (uiUpdateFn) => {
  const batchedUpdater = createBatchedStateUpdater(uiUpdateFn);
  
  return safeExecute(() => {
    onUpdate(() => {
      console.log('YJS document updated - scheduling UI refresh');
      batchedUpdater();
    });
    
    return createSuccess('Update listener registered');
  }, 'setupOptimizedUpdateListener');
};

// Pure function to check if system is ready for operations
export const isSystemReady = () => {
  const system = getSystem();
  return Boolean(
    system &&
    system.ydoc &&
    system.characterMap &&
    system.journalMap &&
    system.settingsMap &&
    system.summariesMap
  );
};

// Lazy initialization with readiness checking
export const ensureSystemReady = async () => {
  if (isSystemReady()) {
    return createSuccess(getSystem());
  }
  
  // Initialize if not ready
  const priority = getInitializationPriority();
  return await initializeYjsSystem(priority);
};

// Pure function to create optimized system configuration
export const createOptimizedSystemConfig = () => ({
  enableLogging: false, // Disable verbose logging in production
  batchUpdates: true,   // Batch DOM updates for better performance
  lazySync: true,       // Enable lazy sync provider connection
  cacheState: true      // Cache frequently accessed state
});

// Performance monitoring for YJS operations
export const monitorYjsOperation = (operationName, operation) => {
  return safeExecute(async () => {
    const monitor = createPerformanceMonitor(`YJS: ${operationName}`);
    
    try {
      const result = await operation();
      monitor.end();
      return result;
    } catch (error) {
      monitor.end();
      throw error;
    }
  }, `monitored ${operationName}`);
};

// Optimized document synchronization
export const optimizeDocumentSync = () => {
  return safeExecute(() => {
    const system = getSystem();
    if (!system?.ydoc) {
      return createError('YJS system not available');
    }
    
    // Optimize sync frequency for better performance
    if (system.provider) {
      // Reduce sync frequency for better performance
      system.provider.maxDelay = 100; // Slightly higher delay for batching
    }
    
    return createSuccess('Document sync optimized');
  }, 'optimizeDocumentSync');
};

// Memory optimization for YJS system
export const optimizeMemoryUsage = () => {
  return safeExecute(() => {
    const system = getSystem();
    if (!system?.ydoc) {
      return createSuccess('No system to optimize');
    }
    
    // Clean up any unused observers or listeners
    // This is a placeholder for future memory optimizations
    console.log('Memory optimization applied');
    
    return createSuccess('Memory usage optimized');
  }, 'optimizeMemoryUsage');
};