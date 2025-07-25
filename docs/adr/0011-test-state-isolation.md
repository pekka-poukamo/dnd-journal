# ADR-0011: Test State Isolation

## Status

Accepted

## Context

Tests were failing due to state pollution between test runs. The application state, localStorage data, and DOM elements were persisting across tests, causing:
- Unpredictable test behavior
- Interdependent test failures
- Difficult debugging
- Non-deterministic results

## Decision

Implement proper test state isolation with explicit cleanup between tests.

## Rationale

- **Test Reliability**: Each test runs in isolation
- **Predictable Behavior**: Tests don't depend on previous state
- **Easier Debugging**: Clear test boundaries
- **Maintainability**: Tests are self-contained
- **Functional Programming**: Aligns with ADR-0002 (pure functions, no side effects)

## Consequences

### Positive
- Reliable, deterministic tests
- Easier to debug individual test failures
- Tests can run in any order
- Clear test boundaries
- Better test maintainability

### Negative
- Slightly more verbose test setup
- Need to remember cleanup in all tests

## Compliance

### Required
- Use `beforeEach` hooks for setup
- Use `afterEach` hooks for cleanup
- Call `App.resetState()` before each test
- Call `global.resetLocalStorage()` before and after each test
- Clean up DOM elements between tests

### Forbidden
- Tests depending on previous test state
- Shared state between tests
- Persistent localStorage data across tests
- DOM elements persisting between tests

## Implementation

### Test Setup
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

### Test Files
```javascript
// test/app.test.js
describe('App Module', () => {
  beforeEach(() => {
    global.resetLocalStorage();
    App.resetState();
  });

  afterEach(() => {
    global.resetLocalStorage();
  });
});
```

### App Module
```javascript
// js/app.js
export const resetState = () => {
  state = createInitialJournalState();
  if (typeof global !== 'undefined') {
    global.state = state;
  }
};
```

## State Management Rules

1. **App State**: Reset using `App.resetState()` in `beforeEach`
2. **localStorage**: Reset using `global.resetLocalStorage()` in `beforeEach` and `afterEach`
3. **DOM**: Clean up any created elements in `afterEach`
4. **Global Mocks**: Restore original functions after tests that mock them