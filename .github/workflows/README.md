# GitHub Workflows

## Test Suite (`tests.yml`)

**Purpose**: Automated test suite running on PR creation and changes.

**Triggers**:
- Pull requests to any branch
- Pushes to any branch  

**What it does**:
1. ✅ Runs tests on Node.js 22
2. 📊 Ensures code quality before merging

**Commands used**:
- `npm ci` - Install dependencies
- `npm test` - Run test suite (Mocha + Chai)
- `npm run coverage` - Generate coverage with c8

**Compliance**:
- **ADR-0005**: Mandatory testing for all code
- **ADR-0006**: No build tools (uses npm scripts only)
- **ADR-0013**: Radical simplicity (minimal, focused workflow)

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

---

*These workflows ensure all code changes are tested before merging and automatically deployed to production, maintaining code quality and deployment simplicity.*