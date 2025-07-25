# Vendor Libraries - Self-Hosted Yjs

This directory contains self-hosted versions of the Yjs libraries used for collaborative sync functionality. By hosting these locally, we improve reliability and eliminate dependency on external CDNs.

## Libraries Included

- **yjs.js** - Core Yjs CRDT library (v13.6.27)
- **y-websocket.js** - WebSocket provider for Yjs (v3.0.0)  
- **y-indexeddb.js** - IndexedDB persistence provider (v9.0.12)

## Building

The vendor libraries are built from the npm packages using the `bundle-vendor.cjs` script:

```bash
# Install dependencies
npm install

# Build vendor libraries
npm run build:vendor
```

## Why Self-Hosted?

1. **Reliability** - No dependency on external CDN availability
2. **Offline Support** - Libraries work when offline
3. **Performance** - No external network requests for core libraries
4. **Predictability** - Version control over exact library versions
5. **Privacy** - No external tracking from CDN providers

## File Sizes

- yjs.js: ~300KB (core CRDT functionality)
- y-websocket.js: ~18KB (WebSocket sync provider)
- y-indexeddb.js: ~7KB (local persistence)

Total: ~325KB for complete sync functionality

## Browser Compatibility

The bundled libraries are compatible with all modern browsers that support:
- ES5+ JavaScript
- WebSockets
- IndexedDB

## Updates

To update the libraries:

1. Update versions in `package.json`
2. Run `npm install`
3. Run `npm run build:vendor`
4. Test functionality 
5. Commit the updated vendor files

## Fallback Strategy

If you prefer CDN usage, you can modify the HTML files to load from CDN with vendor as fallback:

```html
<script src="https://cdn.jsdelivr.net/npm/yjs@13.6.27/dist/yjs.mjs" 
        onerror="this.src='vendor/yjs.js'"></script>
```

However, the current self-hosted approach is recommended for better reliability.