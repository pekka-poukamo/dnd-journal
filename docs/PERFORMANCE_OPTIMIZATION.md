# Performance Optimization Guide

## Overview

This document outlines performance optimizations implemented to reduce the 1-2 second lag from HTML load to first display of data, while maintaining compliance with project ADRs.

## Root Causes Identified

1. **Large Node Modules Payload**: 85MB node_modules includes server-only dependencies  
2. **No Module Preloading**: Critical modules loaded on-demand instead of preemptively
3. **No HTTP Compression**: Large JavaScript files transferred uncompressed
4. **Server Dependencies in Client**: y-leveldb (5.4MB) and leveldown (2.2MB) not needed in browser

## Optimizations Implemented

### 1. Deployment Size Reduction
**Before**: 85MB deployment including all dev dependencies and server modules
**After**: 4.9MB optimized deployment with only client-side essentials

**Implementation**: `deploy.sh` script that:
- Copies only client-needed modules (yjs, lib0, y-protocols, y-indexeddb)  
- Excludes server-only dependencies (y-leveldb, leveldown)
- Removes documentation, tests, examples, source maps
- **Result**: 94% size reduction (85MB → 4.9MB)

### 2. Module Preloading
Added `<link rel="modulepreload">` for critical modules:
- `yjs.mjs` (293KB) - Core library
- `yjs.js` - App's YJS wrapper
- `journal.js` - Main application module  
- `navigation-cache.js` - Performance-critical caching

**Impact**: Modules start downloading immediately instead of waiting for dependency resolution.

### 3. Local-First Fonts
**Before**: External Google Fonts CDN
```html
<link href="https://fonts.googleapis.com/css2?family=Bitter:wght@..."/>
```

**After**: Local font stack with fallbacks
```css
--font-serif: 'Bitter', 'Georgia', 'Times New Roman', serif;
--font-system: system-ui, -apple-system, BlinkMacSystemFont, serif;
```

**Impact**: 
- Eliminates DNS lookup + SSL handshake for fonts
- Complies with ADR-0014 (local-first modules)
- Instant text rendering with system font fallbacks

### 4. Browser Caching Strategy

The app already implements navigation caching via `navigation-cache.js`:
- 15-minute cache for cross-page state
- SessionStorage for temporary state preservation
- Smart cache invalidation based on data changes

**Cache Headers Recommendation** (for production):
```
Cache-Control: public, max-age=31536000, immutable  # For node_modules/*
Cache-Control: public, max-age=3600                 # For app JS/CSS
```

## Expected Performance Gains

### Network Requests Reduction
- **Before**: 22+ sequential module requests + Google Fonts CDN
- **After**: ~5-8 module requests + 0 external requests

### Loading Time Estimates
- **Module preloading**: ~300-500ms improvement  
- **Simplified import map**: ~200-400ms improvement
- **Local fonts**: ~100-300ms improvement (depending on network)
- **Total estimated improvement**: 600-1200ms reduction

## Cross-App Navigation Optimizations

### For Cross-App Cache/Prefetch:
The browser automatically caches modules across navigation when using:
1. **HTTP Cache Headers**: Set on static assets
2. **Module Preloading**: Browser keeps modules in memory
3. **Service Worker** (future enhancement): Could prefetch critical modules

### Navigation Cache Enhancement:
Current `navigation-cache.js` preserves UI state. To enhance:
```javascript
// Could prefetch modules for likely next page
const prefetchModules = () => {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = './js/character.js'; // If user likely to visit character page
  document.head.appendChild(link);
};
```

## Monitoring Performance

### Development Testing:
Use the included `performance_test.html` to measure:
- Total module loading time
- Individual module resolution time
- Network waterfall analysis

### Production Monitoring:
```javascript
// Add to main modules
performance.mark('app-start');
// ... after app initialization
performance.mark('app-ready');
performance.measure('app-load', 'app-start', 'app-ready');
```

## Compliance with ADRs

- ✅ **ADR-0006**: No build tools - Uses native browser features only
- ✅ **ADR-0013**: Radical simplicity - Simplifies import map, removes external deps
- ✅ **ADR-0014**: Local-first - Eliminates Google Fonts CDN dependency
- ✅ **ADR-0010**: ES6 modules - Maintains pure ES module approach

## Future Considerations

### If Performance Issues Persist:
1. **Service Worker**: Cache modules across sessions (maintains no-build principle)
2. **HTTP/2 Push**: Server-side optimization for critical modules
3. **Module Bundling**: Would require relaxing ADR-0006 (not recommended)

### Node Modules Minification:
Since no build tools are allowed, minified versions would need to be:
- Available from npm packages directly
- Manually substituted in import maps (violates radical simplicity)
- Currently, compression at HTTP level is the recommended approach