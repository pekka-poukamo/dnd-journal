# D&D Journal Test Suite

This test suite uses **Mocha** and **Chai** with should notation for testing the D&D Journal application.

## Testing Philosophy

Our tests focus on **behavior and functionality** rather than implementation details:

✅ **Test behaviors**: How functions work, what they return, error handling
✅ **Test user workflows**: Complete user interactions from start to finish  
✅ **Test data flow**: Input → processing → output validation
✅ **Test edge cases**: Error conditions, empty states, invalid input

❌ **Don't test implementation**: CSS class names, object structure, variable names
❌ **Don't test framework details**: DOM structure specifics, internal APIs
❌ **Don't test style/conventions**: These are enforced by code review and linting

## Test Structure

```
test/
├── setup.js           # Test environment configuration
├── app.test.js        # Unit tests for core journal functionality
├── character.test.js  # Unit tests for character management
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

### Automated Coverage Checks
- **`npm run coverage:warn`**: Non-blocking coverage warnings for development
- **`npm run coverage:check`**: Strict 95% threshold check (ADR-0005 compliance)
- **`npm run coverage:html`**: Detailed HTML coverage reports
- **`npm run pre-commit`**: Pre-commit coverage warnings

### Coverage Targets (ADR-0005 Compliance)
- **Lines**: 95% target, 80% warning, 50% critical
- **Functions**: 90% target, 70% warning, 40% critical  
- **Branches**: 85% target, 65% warning, 35% critical

### Current Coverage Status
Run `npm run coverage:warn` for latest coverage report with:
- 🟢 Files meeting targets
- 🟡 Files needing improvement  
- 🔴 Critical ADR-0005 violations

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
