# D&D Journal Test Suite

This test suite uses **Mocha** and **Chai** with should notation for testing the D&D Journal application.

## Test Structure

```
test/
├── setup.js           # Test environment configuration
├── app.test.js        # Unit tests for core functionality
├── integration.test.js # Integration tests for user workflows
└── README.md          # This file
```

## Running Tests

### Local Development
```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run setup script (includes initial test run)
./scripts/setup-dev.sh
```

### Automated Testing
- **GitHub Actions**: Tests run automatically on push/PR to main branch
- **Pre-commit Hook**: Run `./scripts/pre-commit.sh` before commits

## Test Coverage

### Unit Tests (`app.test.js`)
- **generateId**: Unique ID generation
- **formatDate**: Date formatting functionality  
- **State Management**: localStorage save/load operations
- **DOM Manipulation**: Entry creation, rendering, form handling
- **Error Handling**: localStorage errors, corrupted data

### Integration Tests (`integration.test.js`)
- **Full User Workflow**: Complete character creation and journaling
- **Empty State Handling**: Clean initial state
- **Data Integrity**: Multiple operations and persistence

## Should Notation Examples

```javascript
// Basic assertions
value.should.be.a('string');
array.should.have.length(3);
object.should.have.property('name');

// Equality
actual.should.equal(expected);
result.should.not.equal(oldValue);

// Existence
(element === null).should.be.true;
data.should.not.be.null;

// Array/Object content
entries.should.include('expectedEntry');
character.name.should.equal('Aragorn');
```

## Test Environment

- **JSDOM**: Simulates browser DOM environment
- **Mock localStorage**: In-memory storage for testing
- **Console suppression**: Reduces test output noise
- **Isolated state**: Each test runs with clean state

## Adding New Tests

1. Add test cases to appropriate file (`app.test.js` for units, `integration.test.js` for workflows)
2. Use descriptive `describe()` and `it()` blocks
3. Follow should notation for assertions
4. Use `beforeEach()` for test setup when needed
5. Ensure tests are independent and can run in any order

## Best Practices

- ✅ Test one thing per test case
- ✅ Use descriptive test names
- ✅ Use should notation consistently
- ✅ Mock external dependencies
- ✅ Test both success and failure cases
- ✅ Keep tests fast and independent
