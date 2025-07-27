// Import Map Configuration for YJS modules
// This script dynamically injects the import map to avoid repetition across HTML files

(function() {
  // Define the import map configuration
  const importMap = {
    "imports": {
      "yjs": "./node_modules/yjs/dist/yjs.mjs",
      "y-websocket": "./node_modules/y-websocket/src/y-websocket.js",
      "y-indexeddb": "./node_modules/y-indexeddb/src/y-indexeddb.js"
    }
  };

  // Create and inject the import map script element
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify(importMap, null, 2);
  
  // Insert the import map before any other scripts
  const firstScript = document.querySelector('script');
  if (firstScript) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
})();