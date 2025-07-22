# ADR-0005: Mandatory Testing for All Code

## Status
Accepted

## Context
Testing practices vary widely from no tests to comprehensive test suites. Given that AI agents will be implementing features, we need clear testing requirements.

## Decision
**Every function must have tests** using Mocha + Chai with should notation.

## Rationale
- **AI Agent Safety**: Prevents agents from breaking existing functionality
- **Refactoring Confidence**: Tests enable safe code changes
- **Documentation**: Tests serve as executable documentation
- **Quality Gate**: No untested code enters the codebase
- **Functional Programming**: Pure functions are easy to test
- **Regression Prevention**: Catches bugs introduced by changes

## Consequences
### Positive
- High confidence in code changes
- Living documentation of expected behavior
- Easy to catch regressions
- Forces better function design

### Negative
- More code to write and maintain
- Slower initial development
- Test maintenance overhead

## Compliance
**Requirements:**
- Every function in `js/app.js` must have a test
- Use `should` notation: `result.should.equal(expected)`
- Test success cases, edge cases, and error cases
- Tests must pass before any code is merged

**Forbidden:**
- Shipping code without tests
- Using different testing frameworks
- Skipping edge case testing
- Mock-heavy tests (prefer pure functions)

## Implementation
```javascript
// Required test structure:
describe('functionName', () => {
  it('should handle normal case', () => {
    const result = functionName(validInput);
    result.should.equal(expectedOutput);
  });
  
  it('should handle edge case', () => {
    const result = functionName(edgeInput);
    result.should.not.be.null;
  });
  
  it('should handle error case', () => {
    (() => functionName(invalidInput)).should.throw();
  });
});
```

**Test files:**
- Unit tests: `test/app.test.js`
- Integration tests: `test/integration.test.js`
- Run with: `npm test`
