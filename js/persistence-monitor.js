// Persistence Monitor - Health checks and metrics for server persistence
// Following functional programming principles and style guide

import { getSystem, getSyncStatus, getPersistenceMetrics } from './yjs.js';

// Monitor state
let monitoringInterval = null;
let lastHealthCheck = null;

// Health check callback storage
const healthCallbacks = [];

// Register health callback
export const onHealthChange = (callback) => {
  healthCallbacks.push(callback);
};

// Trigger health callbacks
const triggerHealthCallbacks = (health) => {
  healthCallbacks.forEach(callback => {
    try {
      callback(health);
    } catch (e) {
      console.warn('Error in health callback:', e);
    }
  });
};

// Perform comprehensive health check
export const performHealthCheck = () => {
  const system = getSystem();
  
  if (!system) {
    return {
      status: 'offline',
      score: 0,
      timestamp: Date.now(),
      details: {
        system: 'not initialized',
        persistence: 'unavailable',
        sync: 'unavailable'
      }
    };
  }
  
  // Check sync status
  const syncStatus = getSyncStatus(system.providers);
  
  // Check persistence metrics
  const metrics = getPersistenceMetrics();
  
  // Calculate health score (0-100)
  let score = 0;
  
  // System availability (30 points)
  if (system.ydoc && system.characterMap && system.journalMap) {
    score += 30;
  }
  
  // Local persistence (30 points)
  if (system.persistence) {
    score += 30;
  }
  
  // Network sync (25 points)
  if (syncStatus.connected) {
    score += 25;
  } else if (syncStatus.available) {
    score += 10; // Partial credit for available but not connected
  }
  
  // Metrics health (15 points)
  if (metrics.isHealthy) {
    score += 15;
  } else if (metrics.errors < 20) {
    score += 5; // Partial credit for manageable errors
  }
  
  // Determine status
  let status = 'offline';
  if (score >= 80) status = 'healthy';
  else if (score >= 60) status = 'degraded';
  else if (score >= 30) status = 'limited';
  
  const health = {
    status,
    score,
    timestamp: Date.now(),
    details: {
      system: system ? 'initialized' : 'not initialized',
      persistence: system?.persistence ? 'active' : 'unavailable',
      sync: syncStatus.connected ? 'connected' : syncStatus.available ? 'available' : 'unavailable',
      providers: syncStatus.providers?.length || 0,
      connectedProviders: syncStatus.connectedCount || 0,
      syncCount: metrics.syncCount,
      errors: metrics.errors,
      lastSync: metrics.lastSync
    }
  };
  
  // Store result
  lastHealthCheck = health;
  
  // Trigger callbacks
  triggerHealthCallbacks(health);
  
  return health;
};

// Get last health check result
export const getLastHealthCheck = () => lastHealthCheck;

// Start continuous monitoring
export const startMonitoring = (intervalMs = 10000) => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  // Perform initial check
  performHealthCheck();
  
  // Set up interval
  monitoringInterval = setInterval(performHealthCheck, intervalMs);
  
  console.log(`Persistence monitoring started (${intervalMs}ms interval)`);
};

// Stop monitoring
export const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('Persistence monitoring stopped');
  }
};

// Get monitoring status
export const isMonitoring = () => !!monitoringInterval;

// Format health status for display
export const formatHealthStatus = (health) => {
  if (!health) return 'Unknown';
  
  const statusEmojis = {
    healthy: '✅',
    degraded: '⚠️',
    limited: '🔶',
    offline: '❌'
  };
  
  const emoji = statusEmojis[health.status] || '❓';
  const percentage = health.score;
  
  return `${emoji} ${health.status.toUpperCase()} (${percentage}%)`;
};

// Clear last health check (for testing)
const clearLastHealthCheck = () => {
  lastHealthCheck = null;
};

// Export for testing
export const _internals = {
  healthCallbacks,
  triggerHealthCallbacks,
  clearLastHealthCheck
};