# ADR-0005: Mandatory Testing for All Code

## Status
Accepted

## Context
Testing practices vary widely from no tests to comprehensive test suites. Given that AI agents will be implementing features, we need clear testing requirements.

## Decision
**Every function must have tests** using Mocha + Chai with should notation, with **automated coverage verification** using C8.

## Rationale
- **AI Agent Safety**: Prevents agents from breaking existing functionality
- **Refactoring Confidence**: Tests enable safe code changes
- **Documentation**: Tests serve as executable documentation
- **Quality Gate**: No untested code enters the codebase
- **Functional Programming**: Pure functions are easy to test
- **Regression Prevention**: Catches bugs introduced by changes
- **Coverage Verification**: Automated tools ensure compliance with testing requirements
- **Continuous Monitoring**: Coverage reports provide ongoing visibility into test completeness

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
- Every function in all `js/*.js` files must have a test
- Use `should` notation: `result.should.equal(expected)`
- Test success cases, edge cases, and error cases
- Tests must pass before any code is merged
- **Coverage targets**: 95% lines, 90% functions, 85% branches
- Use C8 for coverage measurement (aligns with ADR-0006: No Build Tools)

**Forbidden:**
- Shipping code without tests
- Using different testing frameworks or coverage tools
- Skipping edge case testing
- Mock-heavy tests (prefer pure functions)
- Merging code below critical coverage thresholds (50% lines, 40% functions)

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
- Unit tests: `test/app.test.js`, `test/utils.test.js`, etc.
- Integration tests: `test/integration.test.js`
- Run with: `npm test`

## Coverage Automation

**Coverage Commands:**
```bash
npm run test:coverage      # Basic coverage report
npm run coverage:warn      # Development warnings (non-blocking)
npm run coverage:html      # Detailed HTML coverage report
npm run coverage:check     # Strict coverage check (95% threshold)
npm run pre-commit         # Pre-commit coverage warnings
```

**Coverage Thresholds:**
- **Target**: 95% lines, 90% functions, 85% branches (ADR compliance)
- **Warning**: 80% lines, 70% functions, 65% branches (needs improvement)
- **Critical**: 50% lines, 40% functions, 35% branches (ADR violation)

**Coverage Reports:**
- **🟢 Excellent**: Above target thresholds
- **🟡 Good**: Above warning thresholds
- **🟠 Warning**: Between warning and critical thresholds
- **🔴 Critical**: Below critical thresholds (blocks merges)

**Automation:**
- GitHub Actions run coverage checks on all PRs
- Coverage comments posted automatically on PRs
- Pre-commit hooks provide warnings (non-blocking)
- HTML coverage reports generated for detailed analysis

**Tool Rationale:**
- **C8**: Uses Node.js native V8 coverage engine
- **No instrumentation**: Aligns with ADR-0006 (No Build Tools)
- **ES6 module support**: Works with vanilla JavaScript (ADR-0001)
- **Lightweight**: Minimal dependencies and fast execution
