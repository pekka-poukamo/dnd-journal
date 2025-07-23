# D&D Journal - Sync Setup

Simple cross-device synchronization for your D&D Journal.

## Quick Setup

### 1. Install Yjs Server (Optional)

On your Raspberry Pi or computer:

```bash
# Install the sync server
npm install -g y-websocket

# Start the server
y-websocket-server --port 1234
```

Or from this repo:
```bash
npm install
npm run sync-server
```

### 2. Configure in App

Go to Settings → Sync Settings and enter your server URL:
```
ws://192.168.1.100:1234
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