# D&D Journal

![Test Suite](https://github.com/pekka-poukamo/dnd-journal/workflows/Test%20Suite/badge.svg)
![Coverage](https://github.com/pekka-poukamo/dnd-journal/workflows/Coverage/badge.svg)

A simple D&D journal built with vanilla JavaScript.

## Quick Start

Open `index.html` in a browser.

## Cross-Device Sync & Server Persistence

The journal features robust server persistence using Yjs libraries with real-time sync across multiple devices.

### Features

✅ **Local-First Architecture**: Data persists locally in IndexedDB  
✅ **Real-Time Sync**: Instant synchronization across devices  
✅ **Conflict Resolution**: Automatic CRDT-based merging  
✅ **Offline Resilience**: Works completely offline  
✅ **Health Monitoring**: Real-time persistence status tracking  
✅ **Provider Reconnection**: Automatic reconnection on server changes  

### Sync Status

Check the sync status in Settings page. Journal automatically syncs across devices when online and persists data to IndexedDB locally.

### Local Development Server

For development or local hosting:
```bash
npm run server:dev        # Local server (localhost:1234)
npm run server:public     # Public server (0.0.0.0:1234)
npm run server 8080       # Custom port
```

### Setting Up Your Own Sync Server

#### Option 1: Built-in Server (Recommended)
```bash
# Development (localhost only)
npm run server:dev

# Production (accessible from network)
npm run server:public

# Custom configuration
HOST=0.0.0.0 PORT=8080 npm run server
```

#### Option 2: y-websocket Server
```bash
npm install -g y-websocket
HOST=0.0.0.0 PORT=1234 npx y-websocket
```

#### Configuration
1. Open Settings in your journal
2. Set sync server to: `ws://your-server-ip:port`
3. Save settings - providers will automatically reconnect

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
