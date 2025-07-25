# Coverage

Simple test coverage for JavaScript files.

## Usage

```bash
npm run coverage
```

Shows line coverage percentage. Target is 80%.

## PR Comments

Each PR gets a comment showing coverage for changed files only:

| File | Lines Covered | Percentage |
|------|---------------|------------|
| `js/app.js` | 45/62 | ✅ 73% |
| `js/utils.js` | 89/91 | ✅ 98% |

- ✅ 80%+ coverage
- ⚠️ 60-79% coverage  
- ❌ <60% coverage

Coverage warns but does not block PRs.

## Configuration

See `.c8rc.json` for settings.