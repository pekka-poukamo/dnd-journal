# ADR-0012: Test State Isolation

## Status
Accepted

## Context
During the ES6 module migration, tests were failing due to state pollution between test runs. The application state and localStorage were persisting across tests, causing unpredictable test behavior.

## Decision
We will implement **proper test state isolation** with explicit cleanup between tests and isolated state management.

## Rationale
- **Test Reliability**: Tests should be independent and not affect each other
- **Predictable Behavior**: Each test should start with a clean, known state
- **Debugging**: Easier to isolate failures when tests are truly independent
- **Maintainability**: Tests that don't interfere with each other are easier to maintain
- **Functional Programming**: Aligns with pure function principles in testing

## Consequences
### Positive
- Tests are truly independent and reliable
- Easier to debug test failures
- Predictable test behavior
- Better test maintainability
- Aligns with functional programming principles

### Negative
- Slightly more verbose test setup
- Need to explicitly manage state cleanup
- Requires careful attention to state management

## Compliance
**Required patterns:**
- `beforeEach` hooks to reset state
- `afterEach` hooks to clean up
- Explicit state reset functions: `App.resetState()`
- localStorage cleanup: `global.resetLocalStorage()`
- DOM cleanup between tests

**Forbidden patterns:**
- Tests that depend on state from previous tests
- Global state mutations that persist across tests
- localStorage data that carries over between tests
- DOM elements that persist between tests

## Implementation
```javascript
// test/setup.js
export const createLocalStorageMock = () => {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
};

global.resetLocalStorage = createLocalStorageMock;
```

```javascript
// js/app.js
export const resetState = () => {
  state = createInitialJournalState();
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};
```

```javascript
// test/example.test.js
describe('Example', () => {
  beforeEach(() => {
    global.resetLocalStorage();
    App.resetState();
  });

  afterEach(() => {
    global.resetLocalStorage();
  });
});
```

## State Management Rules
- Application state must be reset before each test
- localStorage must be cleared between tests
- DOM elements must be properly cleaned up
- Global mocks must be restored after tests
- No test should depend on the execution order of other tests
