# Sync Server Setup Guide

> **Following ADR-0003 (Yjs Sync Enhancement) and ADR-0013 (Radical Simplicity)**

## Quick Start - Zero Configuration

The simplest way to get sync working with persistence:

```bash
# Start the sync server with persistence
npm run sync-server
```

**That's it!** Your sync server is now running with:
- ✅ **Persistent storage** - data survives server restarts
- ✅ **Cross-device sync** - real-time updates across devices  
- ✅ **Local-first** - localStorage remains primary, sync is enhancement
- ✅ **Zero dependencies** - uses built-in y-websocket server

## Configuration

Configure clients by setting the server URL in **Settings**:
```
ws://localhost:1234
```

Or for network access:
```
ws://192.168.1.100:1234
```

## What This Does

1. **Starts y-websocket server** on `localhost:1234`
2. **Enables LevelDB persistence** in `./y-leveldb-data/`
3. **Provides CRDT sync layer** - Yjs syncs data between devices
4. **Maintains localStorage as primary** - follows ADR-0003

## Advanced Configuration

Environment variables (all optional):

```bash
# Custom host (default: 0.0.0.0)
HOST=192.168.1.100 npm run sync-server

# Custom port (default: 1234)  
PORT=8080 npm run sync-server

# Custom persistence directory (default: ./y-leveldb-data)
YPERSISTENCE=/path/to/storage npm run sync-server
```

## Testing Setup

1. **Start server**: `npm run sync-server`
2. **Open Settings** in the D&D Journal app
3. **Set Sync Server**: `ws://localhost:1234`
4. **Test Connection** - should show "Connected"
5. **Open app on another device** - Yjs will sync changes through server

## Troubleshooting

**Connection failed?**
- Check server is running: `npm run sync-server`
- Verify URL format: `ws://` not `http://`
- Try localhost: `ws://localhost:1234`

**Not syncing across devices?**
- Use network IP instead of localhost
- Check firewall allows port 1234
- Ensure both devices use same server URL

## Architecture

```
Device A ←→ localStorage ←→ Yjs CRDT ←→ WebSocket ←→ Sync Server ←→ LevelDB
Device B ←→ localStorage ←→ Yjs CRDT ←→ WebSocket ←→ Sync Server ←→ LevelDB
```

**Key Points:**
- **localStorage remains data store** - app works without sync
- **Yjs provides sync layer** - CRDT handles conflict resolution
- **Server provides persistence** - data survives restarts
- **Zero breaking changes** - existing localStorage code unchanged

## Production Setup

For production use:
1. **Run on dedicated server** (Raspberry Pi, VPS, etc.)
2. **Use wss://** for secure connections (add SSL proxy)
3. **Backup persistence directory** regularly
4. **Monitor server logs** for issues

This setup follows the radical simplicity principle - minimal configuration, maximum functionality.