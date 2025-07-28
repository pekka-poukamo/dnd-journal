# D&D Journal

![Test Suite](https://github.com/pekka-poukamo/dnd-journal/workflows/Test%20Suite/badge.svg)
![Coverage](https://github.com/pekka-poukamo/dnd-journal/workflows/Coverage/badge.svg)

A simple D&D journal built with vanilla JavaScript.

## Quick Start

Open `index.html` in a browser.

## Cross-Device Sync

Real-time sync across devices using Yjs. Data persists locally and optionally syncs through a server.

### Local Server
```bash
npm run server  # Installs server deps and starts server
```

Then in Settings, set sync server to `ws://localhost:1234`. Documents persist in LevelDB at `./server/data/`.

### Manual Server Setup
```bash
cd server
npm install
npm start
```

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
├── lib/                # Client-only Yjs dependencies
├── server/             # Server with separate dependencies
├── test/               # Tests
└── docs/adr/           # Architecture decisions
```

**Dependencies separated:**
- **Client** (`./lib/`): Only Yjs files needed for browser
- **Server** (`./server/`): LevelDB and server dependencies
