# ADR-0014: Local-First Modules via npm and Import Maps

## Status
Accepted

## Context
Modern web applications often load external dependencies from CDNs (Content Delivery Networks) for convenience and performance. However, this creates external dependencies, potential privacy concerns, and reliability issues. Given our commitment to local-first principles (ADR-0003, ADR-0004) and no-build-tools approach (ADR-0006), we need to decide how to handle external JavaScript modules like Yjs.

Previous attempts used CDN imports like `https://cdn.jsdelivr.net/npm/yjs@13.6.27/+esm`, which violated local-first principles and created network dependencies during development and potentially in production.

## Decision
We will use **npm-installed packages with import maps** for all external JavaScript dependencies, completely avoiding CDN usage.

## Implementation
- Install dependencies via npm as documented in `package.json`
- Use browser-native import maps to resolve bare module specifiers to local file paths
- Point import maps to npm-installed packages in `node_modules/`
- Use proper ES module entry points as defined in each package's `package.json`

### Import Map Configuration
```html
<script type="importmap">
{
  "imports": {
    "yjs": "./node_modules/yjs/dist/yjs.mjs",
    "y-websocket": "./node_modules/y-websocket/src/y-websocket.js", 
    "y-indexeddb": "./node_modules/y-indexeddb/src/y-indexeddb.js"
  }
}
</script>
```

### Module Usage
```javascript
// Clean bare module imports work in all environments
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
```

## Rationale
- **Local-First Consistency**: Aligns with localStorage-first (ADR-0004) and local sync principles (ADR-0003)
- **No Network Dependencies**: Works completely offline during development and deployment
- **Security**: No third-party CDN access, reducing attack vectors
- **Privacy**: No external requests that could leak usage data
- **Reliability**: No CDN outages or network issues affecting functionality
- **Version Control**: Exact versions locked in package-lock.json
- **Standards Compliance**: Uses native browser import maps (supported in all modern browsers)
- **No Build Tools**: Maintains ADR-0006 principle while using proper ES modules (ADR-0010)
- **Performance**: No external network requests after initial page load

## Consequences

### Positive
- Complete independence from external services
- Faster development (no network requests for modules)
- Predictable behavior across all environments
- Better security posture
- Aligns with local-first philosophy
- Version locking prevents surprise breaking changes

### Negative
- Slightly larger initial deployment size (dependencies included)
- Need to manually update dependencies via npm
- `node_modules/` must be deployed to production (or dependencies copied)

## Alternatives Considered

### CDN with Fallback
**Rejected**: Still creates external dependencies and complexity

### Bundling Tools
**Rejected**: Violates ADR-0006 (no build tools)

### Global Script Tags
**Rejected**: Violates ADR-0010 (ES6 modules only) and modern best practices

### ESM CDN Services (esm.sh, skypack)
**Rejected**: Still external dependencies, potential privacy/security issues

## Migration Notes
- Existing CDN imports have been replaced with bare module specifiers
- Import maps added to all HTML files (settings.html, index.html, character.html)
- Dependencies moved from optional to regular dependencies in package.json
- All functionality preserved while eliminating external dependencies

## Browser Support
Import maps are supported in:
- Chrome/Edge 89+
- Firefox 108+ 
- Safari 16.4+

This covers >90% of browsers and aligns with our modern browser requirements.