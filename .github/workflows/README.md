# GitHub Workflows

## Test Suite (`tests.yml`)

**Purpose**: Automated test suite running on multiple Node.js versions.

**Triggers**:
- Pull requests to any branch
- Pushes to any branch  

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

## Deploy to Surge (`deploy.yml`)

**Purpose**: Automated deployment to Surge.sh on main branch updates.

**Triggers**:
- Pushes to `main` branch only

**What it does**:
1. ✅ Runs tests to ensure code quality
2. 🚀 Deploys static files to dnd-journal.surge.sh
3. 📝 Uses existing npm deploy script

**Commands used**:
- `npm ci` - Install dependencies
- `npm test` - Run test suite (ensures quality before deploy)
- `npm run deploy` - Deploy to Surge.sh

**Required Secrets**:
- `SURGE_LOGIN` - Surge.sh account email
- `SURGE_TOKEN` - Surge.sh authentication token

**Compliance**:
- **ADR-0008**: Surge.sh deployment only
- **ADR-0006**: No build tools (direct static file deployment)
- **ADR-0013**: Radical simplicity (minimal deployment workflow)

## Legacy Workflows

- `ci.yml` - Simple CI workflow (superseded by tests.yml)

## Compliance

**ADR-0005**: Mandatory testing with coverage feedback
**ADR-0006**: No build tools (uses npm scripts only)  
**ADR-0013**: Radical simplicity (minimal, focused workflows)

---

*These workflows ensure all code changes are tested with coverage feedback and automatically deployed to production, maintaining code quality and deployment simplicity.*
