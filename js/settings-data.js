// Settings Data Management - Settings persistence and data operations
// Following functional programming principles and style guide

import { handleError, createSuccess, createError } from './error-handling.js';
import { getSystem } from './yjs.js';

// Pure function to create default settings
export const createDefaultSettings = () => ({
  apiKey: '',
  enableAIFeatures: false,
  syncServer: ''
});

// Pure function to validate settings data
export const validateSettingsData = (settings) => {
  if (!settings || typeof settings !== 'object') {
    return createError('Invalid settings data');
  }
  
  // Validate API key format if provided
  if (settings.apiKey && !settings.apiKey.startsWith('sk-')) {
    return createError('API key must start with "sk-"');
  }
  
  // Validate sync server URL format if provided
  if (settings.syncServer && settings.syncServer.trim()) {
    const serverUrl = settings.syncServer.trim();
    if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
      return createError('Sync server URL must start with ws:// or wss://');
    }
  }
  
  return createSuccess(settings);
};

// Pure function to load settings from YJS system
export const loadSettingsFromSystem = () => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.settingsMap) {
      return createSuccess(createDefaultSettings());
    }
    
    const settings = {
      apiKey: yjsSystem.settingsMap.get('apiKey') || '',
      enableAIFeatures: yjsSystem.settingsMap.get('enableAIFeatures') || false,
      syncServer: yjsSystem.settingsMap.get('dnd-journal-sync-server') || ''
    };
    
    return createSuccess(settings);
  } catch (error) {
    return handleError('loadSettingsFromSystem', error);
  }
};

// Pure function to save settings to YJS system
export const saveSettingsToSystem = (settings) => {
  try {
    const validation = validateSettingsData(settings);
    if (!validation.success) {
      return validation;
    }
    
    const yjsSystem = getSystem();
    if (!yjsSystem?.settingsMap) {
      return createError('YJS system not available');
    }
    
    // Save settings to YJS
    yjsSystem.settingsMap.set('apiKey', settings.apiKey || '');
    yjsSystem.settingsMap.set('enableAIFeatures', Boolean(settings.enableAIFeatures));
    
    if (settings.syncServer !== undefined) {
      yjsSystem.settingsMap.set('dnd-journal-sync-server', settings.syncServer || '');
    }
    
    return createSuccess(settings);
  } catch (error) {
    return handleError('saveSettingsToSystem', error);
  }
};

// Pure function to get specific setting value
export const getSettingValue = (key) => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.settingsMap) {
      return createSuccess(null);
    }
    
    const value = yjsSystem.settingsMap.get(key);
    return createSuccess(value);
  } catch (error) {
    return handleError('getSettingValue', error);
  }
};

// Pure function to set specific setting value
export const setSettingValue = (key, value) => {
  try {
    const yjsSystem = getSystem();
    if (!yjsSystem?.settingsMap) {
      return createError('YJS system not available');
    }
    
    yjsSystem.settingsMap.set(key, value);
    return createSuccess({ key, value });
  } catch (error) {
    return handleError('setSettingValue', error);
  }
};

// Pure function to check if AI features are enabled
export const isAIEnabled = () => {
  const result = getSettingValue('enableAIFeatures');
  return result.success ? Boolean(result.data) : false;
};

// Pure function to check if API key is configured
export const hasValidApiKey = () => {
  const result = getSettingValue('apiKey');
  if (!result.success || !result.data) {
    return false;
  }
  
  const apiKey = result.data;
  return typeof apiKey === 'string' && apiKey.startsWith('sk-') && apiKey.length > 10;
};

// Pure function to get sync server URL
export const getSyncServerUrl = () => {
  const result = getSettingValue('dnd-journal-sync-server');
  return result.success ? (result.data || '') : '';
};

// Pure function to create settings update object
export const createSettingsUpdate = (currentSettings, updates) => {
  return {
    ...currentSettings,
    ...updates,
    // Ensure boolean values are properly handled
    enableAIFeatures: Boolean(updates.enableAIFeatures !== undefined 
      ? updates.enableAIFeatures 
      : currentSettings.enableAIFeatures)
  };
};

// Composed function to update specific settings
export const updateSettings = (updates) => {
  try {
    // Load current settings
    const currentResult = loadSettingsFromSystem();
    if (!currentResult.success) {
      return currentResult;
    }
    
    // Merge with updates
    const updatedSettings = createSettingsUpdate(currentResult.data, updates);
    
    // Save updated settings
    return saveSettingsToSystem(updatedSettings);
  } catch (error) {
    return handleError('updateSettings', error);
  }
};

// Pure function to reset settings to defaults
export const resetSettingsToDefaults = () => {
  const defaultSettings = createDefaultSettings();
  return saveSettingsToSystem(defaultSettings);
};