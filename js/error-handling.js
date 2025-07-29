// Error Handling Utilities - Standardized error management
// Following functional programming principles and style guide

// Pure function to create success result
export const createSuccess = (data = null) => ({
  success: true,
  data,
  error: null
});

// Pure function to create error result  
export const createError = (message, originalError = null) => ({
  success: false,
  data: null,
  error: message,
  originalError
});

// Pure function to handle and log errors consistently
export const handleError = (operation, error, shouldLog = true) => {
  const errorMessage = error?.message || error || 'Unknown error';
  const fullMessage = `Error in ${operation}: ${errorMessage}`;
  
  if (shouldLog) {
    console.error(fullMessage, error);
  }
  
  return createError(fullMessage, error);
};

// Pure function to handle operation results with error catching
export const safeExecute = async (operation, operationName = 'operation') => {
  try {
    const result = await operation();
    return createSuccess(result);
  } catch (error) {
    return handleError(operationName, error);
  }
};

// Pure function to handle synchronous operations with error catching
export const safeExecuteSync = (operation, operationName = 'operation') => {
  try {
    const result = operation();
    return createSuccess(result);
  } catch (error) {
    return handleError(operationName, error);
  }
};

// Pure function to validate required parameters
export const validateRequired = (params, requiredFields) => {
  const missing = requiredFields.filter(field => 
    params[field] === undefined || params[field] === null || params[field] === ''
  );
  
  if (missing.length > 0) {
    return createError(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return createSuccess();
};

// Pure function to handle API responses consistently
export const handleApiResponse = (response, operationName) => {
  if (!response || response.error) {
    return handleError(operationName, response?.error || 'API call failed');
  }
  
  return createSuccess(response);
};

// Pure function to handle DOM operations safely
export const safeDomOperation = (operation, operationName = 'DOM operation') => {
  try {
    const result = operation();
    return createSuccess(result);
  } catch (error) {
    // Don't log DOM errors by default as they're often expected
    return handleError(operationName, error, false);
  }
};