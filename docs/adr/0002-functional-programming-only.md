# ADR-0002: Functional Programming Only

## Status
Accepted

## Context
JavaScript supports multiple programming paradigms including object-oriented programming with classes, and functional programming. We need to establish which approach to use.

## Decision
We will use **functional programming only** with pure functions and immutable data.

## Rationale
- **Predictability**: Pure functions always return the same output for the same input
- **Testability**: Pure functions are trivial to test in isolation
- **Debuggability**: No hidden state changes to track down bugs
- **AI Agent Safety**: Prevents agents from introducing complex OOP patterns
- **Simplicity**: Functions are simpler than classes and inheritance
- **Performance**: No object instantiation overhead

## Consequences
### Positive
- All functions are easily testable
- No side effects or hidden mutations
- Code is more predictable and reliable
- Easier to reason about data flow

### Negative
- More verbose for some operations
- Requires disciplined approach to avoid mutations
- May require more function parameters

## Compliance
**Forbidden patterns:**
- `class` declarations
- `new` keyword (except for built-ins like `Date`, `Set`)
- `this` keyword
- Prototype modifications
- Mutable operations on arrays/objects

**Required patterns:**
- Arrow functions: `const fn = () => {}`
- Spread operator for copying: `[...array]`, `{...object}`
- Array methods: `map`, `filter`, `reduce`
- Immutable updates only

## Implementation
```javascript
// ✅ Allowed
const addEntry = (entries, entry) => [...entries, entry];
const updateEntry = (entry, updates) => ({...entry, ...updates});

// ❌ Forbidden  
class EntryManager { }
const badAdd = (entries, entry) => { entries.push(entry); return entries; };
```
