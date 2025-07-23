# D&D Journal - Sync Setup

Simple cross-device synchronization for your D&D Journal.

## For Users

**Nothing to configure!** The app automatically syncs via free public servers.

## For Developers

### 1. Optional: Add Your Pi Server

Edit `js/sync-config.js` and set your Pi server:

```javascript
const SYNC_CONFIG = {
  piServer: 'ws://192.168.1.100:1234', // Your Pi's IP
  // ... rest stays the same
};
```

### 2. Start Your Pi Server

```bash
# Install and start
npm install -g y-websocket
y-websocket-server --port 1234
```

Or from this repo:
```bash
npm run sync-server
```

## How It Works

- **Local First**: App works normally without sync
- **Automatic**: Real-time sync when server available  
- **Free Fallback**: Uses public servers if yours is offline
- **No Account**: No sign-up or registration needed

## Network Setup

Your server will run on:
- **WebSocket**: `ws://your-ip:1234`

Make sure port 1234 is open on your firewall.

## Troubleshooting

**App won't sync?**
- Check server URL in Settings
- Ensure Pi and devices on same network
- Try restarting the sync server

**Server won't start?**
- Check if port 1234 is already in use
- Try a different port: `y-websocket-server --port 8080`

That's it! Your D&D Journal will sync automatically across devices.