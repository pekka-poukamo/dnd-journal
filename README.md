# D&D Journal

![Test Suite](https://github.com/pekka-poukamo/dnd-journal/workflows/Test%20Suite/badge.svg)

A simple D&D journal built with vanilla JavaScript.

## Quick Start

Open `index.html` in a browser.

## Cross-Device Sync

The journal supports real-time sync across multiple devices using Yjs.

### Sync Status

Check the sync status on the main page:
- **Green dot**: Connected and syncing
- **Yellow dot**: Connecting...
- **Red dot**: Connection failed - working offline
- **Gray dot**: Sync unavailable

### Troubleshooting Sync Issues

If sync isn't working between devices:

1. **Check Sync Status**: Look for the sync status indicator on the main page
2. **Verify Connection**: Ensure both devices can access the internet
3. **Same Network**: Both devices should access the same journal address
4. **Clear Cache**: Use "Clear Sync Cache" button if issues persist
5. **Force Sync**: Use "Force Upload" or "Force Download" for manual sync
6. **Custom Server**: Configure your own sync server in Settings for better reliability

### Setting Up Your Own Sync Server

For private or local sync:
1. Install y-websocket server: `npm install -g y-websocket`
2. Run server: `HOST=0.0.0.0 PORT=1234 npx y-websocket`
3. Configure in Settings: `ws://your-server-ip:1234`

## Development

```bash
npm install
npm test
```

## CI/CD

Automated testing and deployment via GitHub Actions:

- **Pull Requests**: Tests run automatically on all PRs
- **Main Branch**: Tests + automatic deployment to [dnd-journal.surge.sh](https://dnd-journal.surge.sh)
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
