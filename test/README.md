# D&D Journal - Test Suite

This directory contains comprehensive tests for the D&D Journal application, with **strict measures to prevent real API calls and costs**.

## 🔒 API Safety Guarantee

**CRITICAL: All tests are designed to NEVER make real API calls to OpenAI or any external services.**

### How We Prevent API Costs:

1. **Global Fetch Mocking** (`setup.js`):
   - Intercepts ALL network requests during testing
   - Returns mock responses for OpenAI API calls
   - Prevents any real HTTP requests from reaching external APIs

2. **Fake API Keys Only**:
   - All tests use clearly fake keys like `sk-test123`
   - No real OpenAI API keys are used anywhere in tests
   - No environment variables are checked for real keys

3. **Dedicated Safety Tests** (`api-safety.test.js`):
   - Explicitly verifies no real API calls are made
   - Tests that mocking is working correctly
   - Logs and validates all intercepted requests

4. **Visual Confirmation**:
   - Running `npm test` shows: "🔒 Running tests with API mocking - no real API calls will be made"
   - Tests run quickly (< 1 second) confirming no network delays
   - All 267+ tests pass without any external dependencies

## Test Structure

```
test/
├── setup.js              # Global test setup with API mocking
├── api-safety.test.js     # Explicit API safety verification
├── ai.test.js            # AI module tests (mocked)
├── app.test.js           # Main app functionality
├── character.test.js     # Character management
├── integration.test.js   # Full workflow tests
├── openai-wrapper.test.js # OpenAI wrapper (fully mocked)
├── settings.test.js      # Settings including API key validation (mocked)
├── storytelling.test.js  # Storytelling features (mocked)
├── summarization.test.js # Text summarization (mocked)
├── sync.test.js          # Sync functionality
└── utils.test.js         # Utility functions
```

## Running Tests

```bash
# Run all tests (with API safety confirmation)
npm test

# Run tests in watch mode
npm test:watch

# Run with coverage
npm coverage
```

## Test Environment

- **Framework**: Mocha + Chai
- **DOM Environment**: JSDOM for browser simulation
- **API Mocking**: Complete global fetch override
- **Coverage**: c8 for code coverage analysis

## Adding New Tests

When adding tests that might interact with AI features:

1. **Always use the existing mocks** - they're already configured
2. **Use fake API keys** like `sk-test123` 
3. **Never bypass the global fetch mock** without explicit safety measures
4. **Test error conditions** to ensure graceful degradation when APIs are unavailable

## Verification Commands

```bash
# Verify no real API keys in test files
grep -r "sk-[a-zA-Z0-9]" test/ | grep -v "test123\|test456\|invalid"

# Verify no environment variable usage
grep -r "process.env" test/

# Run safety-specific tests only
npx mocha test/api-safety.test.js
```

## Developer Notes

- Tests run completely offline - no internet connection required
- All AI functionality is thoroughly tested through mocking
- Real API integration is tested through the application itself, not the test suite
- The test suite focuses on logic, error handling, and edge cases rather than external API behavior

**Remember**: These safety measures are critical for preventing unexpected API charges during development and CI/CD processes.
