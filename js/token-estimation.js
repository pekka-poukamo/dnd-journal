// Token Estimation - Tiktoken integration and token counting
// Following functional programming principles and style guide

import { handleError, createSuccess, safeExecute } from './error-handling.js';
import { getEncoding } from 'js-tiktoken';

// Global tiktoken encoder cache
let tiktokenEncoder = null;

// Pure function to check if tiktoken is available
export const isTiktokenAvailable = () => {
  return tiktokenEncoder !== null;
};

// Function to initialize tiktoken encoder
export const initializeTiktoken = async () => {
  if (tiktokenEncoder) {
    return createSuccess(tiktokenEncoder);
  }
  
  return safeExecute(async () => {
    // Use the npm-installed js-tiktoken with ES modules
    tiktokenEncoder = getEncoding('cl100k_base');
    return tiktokenEncoder;
  }, 'initialize tiktoken encoder');
};

// Pure function to estimate tokens using fallback method
export const estimateTokensFallback = (text) => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Fallback estimation: roughly 4 characters per token
  return Math.ceil(text.length / 4);
};

// Function to estimate tokens with tiktoken or fallback
export const estimateTokenCount = async (text) => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  
  // Try to use tiktoken if available
  const encoder = await initializeTiktoken();
  if (encoder.success && encoder.data) {
    return safeExecute(() => {
      return encoder.data.encode(text).length;
    }, 'tiktoken token counting').data || estimateTokensFallback(text);
  }
  
  // Fall back to estimation
  return estimateTokensFallback(text);
};

// Pure function to calculate message overhead tokens
export const calculateMessageOverhead = (message) => {
  // Each message has overhead for role, content structure, etc.
  const baseOverhead = 4;
  const roleOverhead = message.role ? message.role.length : 0;
  return baseOverhead + Math.ceil(roleOverhead / 4);
};

// Function to calculate total tokens for messages array
export const calculateTotalTokens = async (messages) => {
  if (!Array.isArray(messages)) {
    return 0;
  }
  
  let total = 0;
  
  for (const message of messages) {
    const contentTokens = await estimateTokenCount(message.content || '');
    const overhead = calculateMessageOverhead(message);
    total += contentTokens + overhead;
  }
  
  return total;
};

// Pure function to estimate tokens for prompt + response
export const estimatePromptAndResponseTokens = async (prompt, maxResponseTokens = 1000) => {
  const promptTokens = await estimateTokenCount(prompt);
  return {
    promptTokens,
    maxResponseTokens,
    totalEstimated: promptTokens + maxResponseTokens
  };
};

// Pure function to check if token count is within limits
export const isWithinTokenLimit = (tokenCount, maxTokens = 4096) => {
  return tokenCount <= maxTokens;
};

// Pure function to calculate optimal max tokens for response
export const calculateOptimalMaxTokens = async (prompt, totalLimit = 4096, minResponse = 100) => {
  const promptTokens = await estimateTokenCount(prompt);
  const availableTokens = totalLimit - promptTokens;
  
  if (availableTokens < minResponse) {
    return {
      maxTokens: 0,
      viable: false,
      promptTokens,
      availableTokens
    };
  }
  
  return {
    maxTokens: Math.min(availableTokens - 50, 2000), // Leave buffer, cap at 2000
    viable: true,
    promptTokens,
    availableTokens
  };
};

// Pure function to create token usage report
export const createTokenUsageReport = (promptTokens, responseTokens, maxTokens) => {
  const totalUsed = promptTokens + responseTokens;
  const efficiency = responseTokens > 0 ? (responseTokens / maxTokens) * 100 : 0;
  
  return {
    promptTokens,
    responseTokens,
    totalUsed,
    maxTokens,
    efficiency: Math.round(efficiency),
    withinLimit: totalUsed <= maxTokens
  };
};

// Function to validate token usage for request
export const validateTokenUsage = async (prompt, maxResponseTokens = 1000, totalLimit = 4096) => {
  const promptTokens = await estimateTokenCount(prompt);
  const estimatedTotal = promptTokens + maxResponseTokens;
  
  if (estimatedTotal > totalLimit) {
    return createSuccess({
      valid: false,
      promptTokens,
      estimatedTotal,
      limit: totalLimit,
      suggestion: `Reduce prompt size by ${estimatedTotal - totalLimit + 100} tokens`
    });
  }
  
  return createSuccess({
    valid: true,
    promptTokens,
    estimatedTotal,
    limit: totalLimit,
    remainingTokens: totalLimit - estimatedTotal
  });
};

// Pure function to truncate text to fit token limit
export const truncateToTokenLimit = async (text, maxTokens) => {
  const currentTokens = await estimateTokenCount(text);
  
  if (currentTokens <= maxTokens) {
    return text;
  }
  
  // Estimate characters needed
  const charactersPerToken = text.length / currentTokens;
  const targetCharacters = Math.floor(maxTokens * charactersPerToken * 0.9); // 90% to be safe
  
  return text.substring(0, targetCharacters) + '...';
};