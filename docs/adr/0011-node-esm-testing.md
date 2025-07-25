# ADR-0011: Node.js Native ESM Testing

## Status
Accepted

## Context
After migrating to ES6 modules, we needed to decide how to handle testing in the Node.js environment. Options included custom loaders, bundlers, or using Node.js's native ESM support.

## Decision
We will use **Node.js native ESM support** for testing with `"type": "module"` in package.json and direct ES6 imports in test files.

## Rationale
- **Simplicity**: No additional build tools or custom loaders required
- **Native Support**: Uses Node.js's built-in ES6 module capabilities
- **Consistency**: Same module system in browser and test environments
- **Performance**: No compilation overhead during testing
- **Maintenance**: Fewer dependencies and configuration files
- **Future-Proof**: Aligns with Node.js's direction toward ESM

## Consequences
### Positive
- No build step required for testing
- Consistent module system across environments
- Faster test execution
- Simpler project configuration
- Fewer dependencies to maintain

### Negative
- Some JSDOM limitations with global object assignments
- Requires careful handling of browser-specific APIs in tests
- May need workarounds for certain JSDOM behaviors

## Compliance
**Required configuration:**
- `"type": "module"` in package.json
- All test files must use `.js` extension
- All imports must include file extensions: `import './setup.js'`

**Forbidden patterns:**
- Custom ESM loaders or transpilers
- `--experimental-loader` flags
- `require()` statements in test files
- Missing file extensions in imports

**Required patterns:**
- `import { expect } from 'chai';`
- `import * as Module from '../js/module.js';`
- `import './setup.js';`

## Implementation
```json
// package.json
{
  "type": "module",
  "scripts": {
    "test": "mocha test/**/*.test.js --timeout 10000"
  }
}
```

```javascript
// test/example.test.js
import { expect } from 'chai';
import './setup.js';
import * as Utils from '../js/utils.js';

describe('Example', () => {
  it('should work', () => {
    expect(Utils.generateId()).to.be.a('string');
  });
});
```

## JSDOM Compatibility
- Avoid direct assignment to `global.window.location` (causes navigation errors)
- Use conditional assignments for browser APIs: `if (!global.btoa) global.btoa = ...`
- Mock localStorage with proper cleanup between tests
- Handle read-only JSDOM properties carefully