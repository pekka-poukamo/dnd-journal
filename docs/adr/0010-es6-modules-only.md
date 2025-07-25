# ADR-0010: ES6 Modules Only

## Status

Accepted

## Context

The codebase was using a hybrid module system with `window` and `global` exports for browser and Node.js compatibility. This created:
- Global state pollution
- Unclear dependencies
- Inconsistent patterns
- Testing complexity

## Decision

Use ES6 modules exclusively throughout the application and tests.

## Rationale

- **Consistency**: Single module system across browser and Node.js
- **Functional Programming**: Aligns with ADR-0002 (pure functions, no global state)
- **Modern Standards**: ES6 modules are the standard JavaScript module system
- **Tree Shaking**: Better optimization potential
- **Type Safety**: Better IDE support and error detection
- **Maintainability**: Clear import/export dependencies
- **Future-Proof**: Native support in all modern environments

## Consequences

### Positive
- Eliminates global state pollution
- Clear dependency relationships
- Better IDE support and autocomplete
- Consistent with modern JavaScript practices
- Easier to understand and maintain

### Negative
- Requires Node.js ESM support for testing
- Some JSDOM limitations in test environment
- Migration effort required

## Compliance

### Required
- Use `export const` for all functions and constants
- Use `import` statements for dependencies
- Configure `"type": "module"` in package.json
- Use `.js` extensions in import paths

### Forbidden
- `window.ModuleName = { ... }` exports
- `global.ModuleName = { ... }` exports
- `require()` statements
- Conditional exports based on environment

## Implementation

### Before
```javascript
// js/utils.js
const generateId = () => Date.now().toString();

if (typeof global !== 'undefined') {
  global.Utils = { generateId };
}
```

### After
```javascript
// js/utils.js
export const generateId = () => Date.now().toString();
```

### Testing Compliance
- All test files use ES6 `import` statements
- Node.js configured with `"type": "module"`
- JSDOM compatibility maintained
- No global object dependencies