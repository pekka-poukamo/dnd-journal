# GitHub Workflows

## Test Suite (`test.yml`)

**Purpose**: Automated test suite running on PR creation and changes.

**Triggers**:
- Pull requests to `main` branch
- Pushes to `main` branch  

**What it does**:
1. ✅ Runs tests on Node.js 16.x, 18.x, and 20.x
2. 📊 Generates coverage report (80% target)
3. 💬 Comments coverage status on PRs

**Commands used**:
- `npm ci` - Install dependencies
- `npm test` - Run test suite (Mocha + Chai)
- `npm run coverage` - Generate coverage with c8

**Compliance**:
- **ADR-0005**: Mandatory testing for all code
- **ADR-0006**: No build tools (uses npm scripts only)
- **ADR-0013**: Radical simplicity (minimal, focused workflow)

---

*This workflow ensures all code changes are tested before merging, maintaining code quality without complexity.*