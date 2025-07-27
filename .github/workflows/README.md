# GitHub Workflows

## Test Suite (`test.yml`)

**Purpose**: Automated test suite running on multiple Node.js versions.

**Triggers**:
- Pull requests to `main` branch
- Pushes to `main` branch  

**What it does**:
1. ✅ Runs tests on Node.js 16.x, 18.x, 20.x, and 22.x

**Commands used**:
- `npm ci` - Install dependencies
- `npm test` - Run test suite (Mocha + Chai)

## Coverage Report (`coverage.yml`)

**Purpose**: Generate and comment coverage reports on pull requests.

**Triggers**:
- Pull requests to `main` branch

**What it does**:
1. 📊 Generates coverage report with c8
2. 💬 Comments coverage table on PRs (changed files only)
3. 🔄 Updates comments when PR is modified

**Commands used**:
- `npm ci` - Install dependencies
- `npm run coverage` - Generate coverage with c8 (JSON output)

## Legacy Workflows

- `ci.yml` - Simple CI workflow (superseded by test.yml)

## Compliance

**ADR-0005**: Mandatory testing with coverage feedback
**ADR-0006**: No build tools (uses npm scripts only)  
**ADR-0013**: Radical simplicity (minimal, focused workflows)

---

*These workflows ensure all code changes are tested and coverage is visible, maintaining code quality without complexity.*