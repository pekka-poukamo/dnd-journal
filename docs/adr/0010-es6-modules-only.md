# ADR-0010: ES6 Modules Only

## Status
Accepted

## Context
The codebase was using a hybrid module system with `window` and `global` object exports for browser and Node.js compatibility. This created maintenance overhead and violated functional programming principles by relying on global state mutations.

## Decision
We will use **ES6 modules exclusively** with `import` and `export` statements throughout the entire codebase, including tests.

## Rationale
- **Consistency**: Single module system across all environments
- **Functional Programming Compliance**: Eliminates global state mutations
- **Modern Standards**: ES6 modules are the current JavaScript standard
- **Tree Shaking**: Enables better optimization and dead code elimination
- **Type Safety**: Better IDE support and static analysis
- **Maintainability**: Clear dependency relationships and explicit imports
- **Future-Proof**: ES6 modules are the future of JavaScript

## Consequences
### Positive
- Eliminates global state pollution
- Clear dependency relationships
- Better IDE support and autocomplete
- Enables static analysis tools
- Consistent with modern JavaScript practices
- Easier to reason about code structure

### Negative
- Requires Node.js ESM support for testing
- Some JSDOM limitations in test environment
- Migration effort required for existing code

## Compliance
**Forbidden patterns:**
- `window.ModuleName = { ... }` exports
- `global.ModuleName = { ... }` exports
- `if (typeof global !== 'undefined')` conditional exports
- `require()` statements in test files
- Global object mutations for module exposure

**Required patterns:**
- `export const functionName = () => {}`
- `export { functionName }`
- `import { functionName } from './module.js'`
- `import * as ModuleName from './module.js'`
- `"type": "module"` in package.json

## Implementation
```javascript
// ✅ Allowed
export const createEntry = (data) => ({ id: generateId(), ...data });
export { createEntry, updateEntry, deleteEntry };

import { createEntry } from './entries.js';
import * as Utils from './utils.js';

// ❌ Forbidden
window.Entries = { createEntry, updateEntry };
if (typeof global !== 'undefined') global.Entries = { createEntry };
const Entries = require('./entries.js');
```

## Testing Compliance
- All test files must use ES6 `import` statements
- Node.js must be configured with `"type": "module"` in package.json
- JSDOM setup must handle ES6 module compatibility
- No CommonJS `require()` statements allowed