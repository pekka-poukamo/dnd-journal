// D&D Journal - Simplified Architecture with Direct Y.js Integration
import { initApp } from './app-controller.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Failed to load application. Please refresh the page.';
    document.body.appendChild(errorDiv);
  }
});

// Export for testing
export { initApp };