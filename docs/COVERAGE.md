# Coverage Reporting Setup

This project uses [c8](https://github.com/bcoe/c8) for JavaScript code coverage reporting, with automated PR comments showing coverage for changed files.

## 🚀 Quick Start

### Running Coverage Locally

```bash
# Run tests with coverage
npm run coverage

# Analyze coverage with detailed report
npm run coverage:analyze

# Just generate coverage reports (without analysis)
npm run coverage:report
```

### Viewing Coverage Reports

After running coverage, you can view detailed reports:

- **Terminal output**: Basic coverage summary
- **HTML report**: Open `coverage/index.html` in your browser for interactive coverage exploration
- **JSON reports**: `coverage/coverage-final.json` and `coverage/coverage-summary.json` for programmatic access

## 📊 Coverage Thresholds

This project maintains minimum coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%  
- **Branches**: 80%
- **Statements**: 80%

## 🔄 Automated PR Coverage Comments

Every pull request automatically gets a coverage comment that includes:

### Overall Coverage Summary
- Current coverage percentages for all metrics
- Changes compared to the base branch
- Color-coded indicators (🟢🟡🟠🔴) based on coverage levels

### Changed Files Coverage
- Detailed coverage breakdown for each modified JavaScript file
- File-by-file comparison with the base branch
- Clear visibility into how your changes affect coverage

### Example PR Comment

```
## 📊 Coverage Report

### Overall Coverage

| Type | Coverage | Change |
|------|----------|--------|
| Lines | 🟢 85% (+2%) | |
| Functions | 🟡 82% (+1%) | |
| Branches | 🟠 78% (-1%) | |
| Statements | 🟢 84% (+2%) | |

### Coverage for Changed Files

| File | Lines | Functions | Branches | Statements |
|------|-------|-----------|----------|-----------|
| `js/app.js` | 🟢 92% (+5%) | 🟢 88% (+3%) | 🟡 82% (+2%) | 🟢 90% (+4%) |
| `js/utils.js` | 🟡 85% | 🟢 90% | 🟠 75% (-2%) | 🟡 87% |
```

## 🛠️ Configuration

### c8 Configuration

Coverage settings are defined in `.c8rc.json`:

```json
{
  "reporter": ["text", "json", "html"],
  "reports-dir": "coverage",
  "exclude": [
    "test/**",
    "node_modules/**", 
    "coverage/**",
    "**/*.config.js",
    "**/*.test.js"
  ],
  "include": [
    "js/**/*.js",
    "*.js"
  ],
  "all": true,
  "check-coverage": true,
  "lines": 80,
  "functions": 80,
  "branches": 80,
  "statements": 80
}
```

### GitHub Workflow

The coverage workflow (`.github/workflows/coverage.yml`) runs on every PR and:

1. Runs coverage on the current branch
2. Checks out and runs coverage on the base branch for comparison
3. Identifies changed JavaScript files
4. Generates a detailed coverage report
5. Posts/updates the PR comment with results

## 💡 Best Practices

### Writing Tests for Better Coverage

1. **Test Edge Cases**: Focus on error conditions, boundary values, and unusual inputs
2. **Test All Branches**: Ensure if/else statements and switch cases are covered
3. **Test Function Parameters**: Cover different parameter combinations
4. **Mock External Dependencies**: Use proper mocking for API calls and external services

### Improving Low Coverage

When coverage falls below thresholds:

1. **Run the analyzer**: `npm run coverage:analyze` to see detailed breakdown
2. **Open HTML report**: `coverage/index.html` shows exactly which lines need coverage
3. **Focus on uncovered lines**: The analyzer shows specific line numbers
4. **Add targeted tests**: Write tests specifically for uncovered code paths

### Coverage Anti-Patterns to Avoid

❌ **Don't write tests just for coverage**: Tests should verify behavior, not just execute code  
❌ **Don't ignore complex edge cases**: These are often the most important to test  
❌ **Don't exclude files arbitrarily**: Only exclude files that genuinely shouldn't be tested  
❌ **Don't aim for 100% everywhere**: Focus on critical paths and business logic  

## 🎯 Coverage Goals by File Type

- **Core logic files** (`js/app.js`, `js/utils.js`): Aim for 90%+ coverage
- **UI interaction files**: Aim for 85%+ coverage  
- **Configuration files**: 70%+ may be acceptable
- **Utility/helper files**: Aim for 95%+ coverage

## 🔧 Troubleshooting

### Coverage Not Running
- Ensure c8 is installed: `npm ci`
- Check that tests pass: `npm test`
- Verify c8 configuration is valid

### Missing Files in Coverage
- Check the `include` patterns in `.c8rc.json`
- Ensure files aren't excluded by the `exclude` patterns
- Verify files are actually imported/required by tests

### PR Comments Not Appearing
- Check that the GitHub workflow has proper permissions
- Verify the workflow file syntax is correct
- Ensure the repository has Actions enabled

## 📚 Additional Resources

- [c8 Documentation](https://github.com/bcoe/c8)
- [Mocha Testing Framework](https://mochajs.org/)
- [Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)