// Simple Yjs System Registry - No circular dependencies
// This provides a clean way to share the Yjs system without coupling modules

let yjsSystemInstance = null;

// Set the Yjs system instance (called from app.js)
export const setYjsSystem = (yjsSystem) => {
  yjsSystemInstance = yjsSystem;
};

// Get the Yjs system instance (called from other modules)
export const getYjsSystem = () => yjsSystemInstance;

// Clear the Yjs system instance (for testing)
export const clearYjsSystem = () => {
  yjsSystemInstance = null;
};