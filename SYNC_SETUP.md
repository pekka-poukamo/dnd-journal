# D&D Journal - Sync Setup

Simple cross-device synchronization for your D&D Journal.

## For Users

**Nothing to configure!** The app automatically:
1. Uses free public relay servers
2. Auto-detects local Pi servers when on same network
3. Supports URL parameter for testing: `?sync=ws://192.168.1.100:1234`

## For Developers/Self-Hosters

### Option 1: Meta Tag (Recommended)

Add to your HTML `<head>`:
```html
<meta name="sync-server" content="ws://your-pi-ip:1234">
```

### Option 2: URL Parameter

For testing/development:
```
https://your-app.com?sync=ws://192.168.1.100:1234
```

### Option 3: Auto-Detection

If serving from the same host as your Pi server, it auto-detects:
- `ws://localhost:1234`
- `ws://your-current-host:1234` 
- `ws://raspberrypi.local:1234`

### Start Your Pi Server

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
- **Smart Detection**: Finds local servers automatically

## Deployment Examples

### Static Host with Meta Tag
```html
<!-- In your deployed index.html -->
<meta name="sync-server" content="ws://your-domain.com:1234">
```

### Docker Compose
```yaml
# docker-compose.yml
services:
  sync:
    image: node:18
    command: npx y-websocket-server --port 1234
    ports:
      - "1234:1234"
  
  app:
    # Your static file server
    environment:
      SYNC_SERVER: ws://sync:1234
```

### Simple Development
```bash
# Terminal 1: Start sync server
y-websocket-server --port 1234

# Terminal 2: Start app with sync parameter
open "http://localhost:8000?sync=ws://localhost:1234"
```

## Network Setup

Your server will run on:
- **WebSocket**: `ws://your-ip:1234`

Make sure port 1234 is open on your firewall.

## Troubleshooting

**App won't sync?**
- Check browser console for connection attempts
- Ensure Pi server is running on port 1234
- Try the URL parameter method for testing

**Server won't start?**
- Check if port 1234 is already in use: `lsof -i :1234`
- Try a different port: `y-websocket-server --port 8080`

That's it! Your D&D Journal will automatically sync across devices.