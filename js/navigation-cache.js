// Navigation Cache - Pure Functional State Bridging (ADR-0002 Compliant)
// Preserves UI state across page navigation without affecting persistence speed

import { formatDate } from './utils.js';

// Cache configuration (optimized for better performance)
const CACHE_KEY = 'dnd-journal-navigation-cache';
const CACHE_VERSION = '1.1'; // Bumped version for performance optimizations
const CACHE_EXPIRY_MS = 15 * 60 * 1000; // Increased to 15 minutes for better persistence

// Pure function to check if cache is available
export const isCacheAvailable = () => {
  try {
    // Check if sessionStorage exists and can be accessed
    if (typeof sessionStorage === 'undefined' || sessionStorage === null) {
      return false;
    }
    // Try to actually use sessionStorage to detect access errors
    sessionStorage.getItem('test');
    return true;
  } catch {
    return false;
  }
};

// Pure function to check if cached data is valid
const isCacheValid = (cacheData) => {
  if (!cacheData || !cacheData.timestamp || !cacheData.version) {
    return false;
  }
  
  // Check version compatibility
  if (cacheData.version !== CACHE_VERSION) {
    return false;
  }
  
  // Check expiry
  const age = Date.now() - cacheData.timestamp;
  return age < CACHE_EXPIRY_MS;
};

// Pure function to create cache data structure
const createCacheData = (yjsState, formData = {}) => ({
  version: CACHE_VERSION,
  timestamp: Date.now(),
  data: {
    // Journal entries for immediate display
    journalEntries: getEntriesForCache(yjsState),
    
    // Character data for forms
    characterData: getCharacterDataForCache(yjsState),
    
    // Settings for immediate display
    settings: getSettingsForCache(yjsState),
    
    // Form data preservation
    formData: formData
  }
});

// Pure function to extract journal entries for cache
const getEntriesForCache = (yjsState) => {
  try {
    if (!yjsState || !yjsState.journalArray) return [];
    
    const entries = yjsState.journalArray.toArray();
    
    // Cache only essential display data
    return entries.map(entry => ({
      id: entry.id,
      content: entry.content || '',
      timestamp: entry.timestamp || Date.now(),
      formattedDate: formatDate(entry.timestamp || Date.now())
    }));
  } catch (error) {
    console.warn('Failed to extract journal entries for cache:', error);
    return [];
  }
};

// Pure function to extract character data for cache
const getCharacterDataForCache = (yjsState) => {
  try {
    if (!yjsState || !yjsState.characterMap) return {};
    
    const characterMap = yjsState.characterMap;
    const data = {};
    
    // Extract common character fields
    const fields = ['name', 'race', 'class', 'backstory', 'notes'];
    fields.forEach(field => {
      data[field] = characterMap.get(field) || '';
    });
    
    return data;
  } catch (error) {
    console.warn('Failed to extract character data for cache:', error);
    return {};
  }
};

// Pure function to extract settings for cache
const getSettingsForCache = (yjsState) => {
  try {
    if (!yjsState || !yjsState.settingsMap) return {};
    
    const settingsMap = yjsState.settingsMap;
    const data = {};
    
    // Extract common settings
    const settings = ['sync-server-url', 'openai-api-key', 'theme'];
    settings.forEach(setting => {
      const value = settingsMap.get(setting);
      if (value !== undefined && value !== null) {
        data[setting] = value;
      }
    });
    
    return data;
  } catch (error) {
    console.warn('Failed to extract settings for cache:', error);
    return {};
  }
};

// Pure function to save navigation cache
export const saveNavigationCache = (yjsState, formData = {}) => {
  if (!isCacheAvailable() || !yjsState) {
    return false;
  }
  
  try {
    const cacheData = createCacheData(yjsState, formData);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.warn('Failed to save navigation cache:', error);
    return false;
  }
};

// Pure function to load navigation cache
export const loadNavigationCache = () => {
  if (!isCacheAvailable()) {
    return null;
  }
  
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    
    if (!isCacheValid(cacheData)) {
      clearNavigationCache();
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn('Failed to load navigation cache:', error);
    clearNavigationCache();
    return null;
  }
};

// Pure function to clear navigation cache
export const clearNavigationCache = () => {
  if (!isCacheAvailable()) {
    return false;
  }
  
  try {
    sessionStorage.removeItem(CACHE_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear navigation cache:', error);
    return false;
  }
};

// Pure function to get specific cached data
export const getCachedJournalEntries = () => {
  const cache = loadNavigationCache();
  return cache?.journalEntries || [];
};

export const getCachedCharacterData = () => {
  const cache = loadNavigationCache();
  return cache?.characterData || {};
};

export const getCachedSettings = () => {
  const cache = loadNavigationCache();
  return cache?.settings || {};
};

export const getCachedFormData = () => {
  const cache = loadNavigationCache();
  return cache?.formData || {};
};

// Pure function to save current form data
export const saveCurrentFormData = (pageType, formData) => {
  if (!isCacheAvailable()) {
    return false;
  }
  
  const existingCache = loadNavigationCache();
  const currentFormData = existingCache?.formData || {};
  
  const updatedFormData = {
    ...currentFormData,
    [pageType]: formData
  };
  
  // If we have existing cache, preserve the Yjs data and just update form data
  if (existingCache) {
    const yjsState = {
      journalArray: { toArray: () => existingCache.journalEntries || [] },
      characterMap: { get: (key) => existingCache.characterData?.[key] },
      settingsMap: { get: (key) => existingCache.settings?.[key] }
    };
    return saveNavigationCache(yjsState, updatedFormData);
  } else {
    // Create minimal Yjs state for form-only cache
    const yjsState = {
      journalArray: { toArray: () => [] },
      characterMap: { get: () => undefined },
      settingsMap: { get: () => undefined }
    };
    return saveNavigationCache(yjsState, updatedFormData);
  }
};

// Pure function to get form data for specific page
export const getFormDataForPage = (pageType) => {
  const formData = getCachedFormData();
  return formData[pageType] || {};
};

// Pure function to check cache age for debugging
export const getCacheAge = () => {
  const cache = loadNavigationCache();
  if (!cache) return null;
  
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cacheData = JSON.parse(cached);
    return Date.now() - cacheData.timestamp;
  } catch {
    return null;
  }
};

// Pure function to get cache info for debugging
export const getCacheInfo = () => {
  if (!isCacheAvailable()) {
    return { available: false };
  }
  
  const cache = loadNavigationCache();
  const age = getCacheAge();
  
  return {
    available: true,
    hasData: cache !== null,
    age: age,
    expired: cache === null && age !== null,
    entriesCount: cache?.journalEntries?.length || 0,
    hasCharacterData: Object.keys(cache?.characterData || {}).length > 0,
    hasSettings: Object.keys(cache?.settings || {}).length > 0,
    hasFormData: Object.keys(cache?.formData || {}).length > 0
  };
};

// Pre-warm cache for faster subsequent loads (performance optimization)
export const preWarmCache = (yjsState) => {
  if (!isCacheAvailable() || !yjsState) {
    return false;
  }
  
  try {
    // Save a lightweight version of current state for instant loading
    return saveNavigationCache(yjsState);
  } catch (error) {
    console.warn('Failed to pre-warm navigation cache:', error);
    return false;
  }
};

// Enhanced cache validation with performance focus
export const isCacheRecentAndValid = () => {
  const cache = loadNavigationCache();
  if (!cache) return false;
  
  // Check if cache is recent (within last 2 minutes for immediate use)
  const age = getCacheAge();
  const isRecent = age !== null && age < (2 * 60 * 1000); // 2 minutes for instant loading
  
  return isRecent && cache.data && (
    cache.data.journalEntries?.length > 0 || 
    Object.keys(cache.data.characterData || {}).length > 0
  );
};