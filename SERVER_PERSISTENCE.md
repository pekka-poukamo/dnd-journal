# Server Persistence

Simple Yjs WebSocket server with file persistence.

## Usage

```bash
npm run server
```

Set sync server in Settings to `ws://localhost:1234`.

## Implementation

**`server.js`** - 30 lines
- WebSocket server using `y-websocket`
- Auto-saves documents to `./data/` directory
- Graceful shutdown

## Files
- Added: `server.js`
- Modified: `package.json` (added `ws` dependency)
- Modified: `.gitignore` (ignore `data/` directory)