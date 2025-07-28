# D&D Journal

![Test Suite](https://github.com/pekka-poukamo/dnd-journal/workflows/Test%20Suite/badge.svg)
![Coverage](https://github.com/pekka-poukamo/dnd-journal/workflows/Coverage/badge.svg)

A simple D&D journal built with vanilla JavaScript.

## Quick Start

Open `index.html` in a browser.

## Cross-Device Sync

The journal supports real-time sync across multiple devices using Yjs.

### Sync Status

Check the sync status in Settings page. Journal automatically syncs across devices when online.

### Setting Up Sync Server with Persistence

**Quick Setup** (recommended):
```bash
npm run sync-server
```
Then configure in Settings: `ws://localhost:1234`

**Manual Setup**:
1. Install y-websocket server: `npm install -g y-websocket`
2. Run server: `HOST=0.0.0.0 PORT=1234 npx y-websocket`
3. Configure in Settings: `ws://your-server-ip:1234`

See [SYNC_SETUP.md](SYNC_SETUP.md) for detailed configuration options.

## Development

```bash
npm install
npm test
npm run coverage  # Test coverage (80% target)
```

## CI/CD

Automated testing and deployment via GitHub Actions:

- **Pull Requests**: Tests + coverage report for changed files
- **Main Branch**: Tests + automatic deployment to [dnd-journal.surge.sh](http://dnd-journal.surge.sh)
- **Test Matrix**: Node.js 16.x, 18.x, and 20.x
- **Zero Build**: Static files deployed directly (ADR-0006)

## Architecture

- Vanilla JavaScript only
- Functional programming
- ES6 modules
- localStorage only
- No build tools
- All code tested

## Structure

```
├── index.html          # Main app
├── character.html      # Character page
├── settings.html       # Settings page
├── js/                 # JavaScript modules
├── css/                # Styles
├── test/               # Tests
└── docs/adr/           # Architecture decisions
```
