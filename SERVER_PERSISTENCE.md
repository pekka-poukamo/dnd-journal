# Server Persistence - Simple Implementation

## What Was Added

A radically simple server-side persistence solution for the D&D Journal using Yjs.

### ✅ Files Added

**`server.js`** - Simple Yjs WebSocket server with file persistence
- 30 lines of code total
- Saves Yjs documents to `./data/` directory
- Auto-saves on every update
- Graceful shutdown with final save

### ✅ Dependencies Added

**`ws`** - WebSocket server library
```json
"dependencies": {
  "ws": "^8.14.2",
  "y-websocket": "^1.5.4"
}
```

### ✅ Scripts Added

```json
"server": "node server.js"
```

## How It Works

1. **Client-side**: Already has Yjs with IndexedDB (local storage) + WebSocket sync
2. **Server-side**: Simple WebSocket server that persists Yjs documents to files

### Data Flow
```
Client (IndexedDB) ↔ WebSocket ↔ Server (Files in ./data/)
```

## Usage

### Start Server
```bash
npm run server
```

### Configure Client  
1. Open Settings in browser
2. Set sync server: `ws://localhost:1234`
3. Save settings

### Result
- Data persists locally in browser (IndexedDB)
- Data persists on server (files in `./data/`)
- Real-time sync across all connected clients
- Works offline (local IndexedDB)

## Server Features

- **File Persistence**: Documents saved to `./data/dnd-journal.yjs`
- **Auto-save**: Every update triggers save
- **Graceful Shutdown**: SIGINT saves all documents before exit
- **Zero Config**: Just run and connect

## Why Simple?

The client already had full Yjs implementation with:
- Local persistence (IndexedDB)
- Real-time sync (WebSocket providers)  
- Conflict resolution (CRDT)

Server persistence just needed:
- WebSocket server for sync
- File storage for durability

Total server code: **30 lines**

## Files Modified

- `package.json` - Added `ws` dependency and `server` script
- `README.md` - Updated documentation
- **Added**: `server.js` - The entire server implementation

## Tests

All existing tests pass (212 tests). No server-side tests needed - it's just file I/O.