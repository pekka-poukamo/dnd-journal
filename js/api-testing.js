// API Testing - API key validation and testing functionality
// Following functional programming principles and style guide

import { handleError, createSuccess, createError, safeExecute } from './error-handling.js';

// Pure function to validate API key format
export const validateApiKeyFormat = (apiKey) => {
  if (!apiKey) {
    return createError('API key is required');
  }
  
  if (typeof apiKey !== 'string') {
    return createError('API key must be a string');
  }
  
  const trimmedKey = apiKey.trim();
  
  if (!trimmedKey) {
    return createError('API key cannot be empty');
  }
  
  if (!trimmedKey.startsWith('sk-')) {
    return createError('API key must start with "sk-"');
  }
  
  if (trimmedKey.length < 20) {
    return createError('API key appears to be too short');
  }
  
  return createSuccess(trimmedKey);
};

// Pure function to create API test request configuration
export const createApiTestConfig = (apiKey) => ({
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

// Pure function to parse API test response
export const parseApiTestResponse = async (response) => {
  try {
    if (response.ok) {
      return createSuccess({
        status: response.status,
        message: 'API key is valid and working!'
      });
    }
    
    // Try to parse error response
    let errorMessage = 'Invalid API key';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // If JSON parsing fails, use default message
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    return createError(errorMessage);
  } catch (error) {
    return handleError('parseApiTestResponse', error);
  }
};

// Function to test API key with OpenAI
export const testApiKey = async (apiKey) => {
  // Validate format first
  const validation = validateApiKeyFormat(apiKey);
  if (!validation.success) {
    return validation;
  }
  
  const validatedKey = validation.data;
  
  return safeExecute(async () => {
    const config = createApiTestConfig(validatedKey);
    
    const response = await fetch('https://api.openai.com/v1/models', config);
    
    const result = await parseApiTestResponse(response);
    return result.data;
  }, 'API key test');
};

// Pure function to create test result display data
export const createTestResultDisplay = (result) => {
  if (!result) {
    return {
      className: 'api-test-result',
      message: ''
    };
  }
  
  if (result.success) {
    return {
      className: 'api-test-result success',
      message: result.message || result.data?.message || 'API key is valid!'
    };
  }
  
  return {
    className: 'api-test-result error',
    message: result.error || 'API key test failed'
  };
};

// Pure function to create loading state display data
export const createLoadingDisplay = () => ({
  className: 'api-test-result loading',
  message: 'Testing API key...'
});

// Function to test multiple API endpoints (for comprehensive testing)
export const testApiKeyComprehensive = async (apiKey) => {
  const validation = validateApiKeyFormat(apiKey);
  if (!validation.success) {
    return validation;
  }
  
  const validatedKey = validation.data;
  const config = createApiTestConfig(validatedKey);
  
  const endpoints = [
    { name: 'Models', url: 'https://api.openai.com/v1/models' },
    { name: 'Usage', url: 'https://api.openai.com/v1/usage' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await safeExecute(async () => {
      const response = await fetch(endpoint.url, config);
      const parsed = await parseApiTestResponse(response);
      return {
        endpoint: endpoint.name,
        ...parsed
      };
    }, `test ${endpoint.name} endpoint`);
    
    results.push(result);
  }
  
  // Return success if at least one endpoint works
  const hasSuccess = results.some(r => r.success);
  
  if (hasSuccess) {
    return createSuccess({
      message: 'API key is valid and working!',
      details: results
    });
  }
  
  return createError('API key validation failed on all endpoints');
};

// Pure function to check API availability without authentication
export const checkApiAvailability = async () => {
  return safeExecute(async () => {
    // Test connection to OpenAI without authentication
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'HEAD' // Just check if endpoint is reachable
    });
    
    // Even without auth, we should get a response (likely 401)
    // If we get no response, there's a network issue
    return createSuccess({
      available: true,
      status: response.status
    });
  }, 'API availability check');
};

// Pure function to estimate API key strength
export const estimateApiKeyStrength = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      strength: 'invalid',
      score: 0,
      issues: ['Invalid API key format']
    };
  }
  
  const issues = [];
  let score = 0;
  
  // Check format
  if (apiKey.startsWith('sk-')) {
    score += 30;
  } else {
    issues.push('Must start with "sk-"');
  }
  
  // Check length
  if (apiKey.length >= 50) {
    score += 40;
  } else if (apiKey.length >= 30) {
    score += 20;
  } else {
    issues.push('API key appears too short');
  }
  
  // Check character variety
  const hasNumbers = /\d/.test(apiKey);
  const hasLetters = /[a-zA-Z]/.test(apiKey);
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(apiKey);
  
  if (hasNumbers) score += 10;
  if (hasLetters) score += 10;
  if (hasSpecialChars) score += 10;
  
  if (!hasNumbers && !hasLetters) {
    issues.push('Should contain both letters and numbers');
  }
  
  let strength = 'weak';
  if (score >= 80) strength = 'strong';
  else if (score >= 60) strength = 'medium';
  
  return {
    strength,
    score,
    issues: issues.length > 0 ? issues : ['API key format looks good']
  };
};