# Server Persistence

Simple Yjs WebSocket server with y-leveldb persistence.

## Usage

```bash
npm run server
```

Set sync server in Settings to `ws://localhost:1234`.

## Implementation

**`server.js`** - 22 lines
- WebSocket server using `y-websocket`
- LevelDB persistence using `y-leveldb`
- Auto-saves handled by y-leveldb

## Files
- Added: `server.js`
- Modified: `package.json` (added `y-leveldb` dependency)
- Modified: `.gitignore` (ignore `data/` directory)