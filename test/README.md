# Testing Setup

This project uses **Mocha** and **Chai** with **should notation** for testing, providing a simple and readable testing framework.

## Test Structure

- **Framework**: Mocha (test runner) + Chai (assertion library)
- **Notation**: Should notation for readable assertions
- **Coverage**: Core functionality, edge cases, and integration tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

## Test Files

- `test/journal-core.test.js` - Tests for the core journal functionality

## Test Categories

### Core Functionality Tests
- **generateId**: ID generation and uniqueness
- **formatDate**: Date formatting with different timestamps
- **addEntry**: Entry creation with validation
- **updateCharacter**: Character data management
- **getEntries**: Entry retrieval and sorting
- **getCharacter**: Character data retrieval
- **getEntryById**: Entry lookup by ID
- **deleteEntry**: Entry deletion
- **saveData/loadData**: Data persistence
- **clearData**: Data cleanup

### Edge Cases and Integration Tests
- Multiple entries with same timestamp
- Very long content handling
- Special characters and emojis
- Empty storage handling
- Corrupted data recovery

## Test Patterns

### Should Notation Examples
```javascript
expect(value).to.be.a('string');
expect(array).to.have.length(3);
expect(object).to.have.property('name');
expect(result).to.equal('expected');
expect(function).to.not.throw();
```

### Mock Storage
Tests use a mock localStorage implementation to avoid browser dependencies:
```javascript
const mockStorage = {
  data: {},
  getItem: function(key) { return this.data[key] || null; },
  setItem: function(key, value) { this.data[key] = value; },
  removeItem: function(key) { delete this.data[key]; }
};
```

## Continuous Integration

Tests are automatically run on:
- Push to main/master branch
- Pull requests
- Multiple Node.js versions (16.x, 18.x, 20.x)

## Adding New Tests

1. Create test file in `test/` directory
2. Use descriptive test names with "should" format
3. Group related tests in `describe` blocks
4. Use `beforeEach` for setup when needed
5. Test both success and failure cases
6. Include edge cases and error handling
