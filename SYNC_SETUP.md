# D&D Journal - Sync Setup

Dead simple cross-device sync. No build tools (ADR-0006).

## For Users

**Nothing to configure!** Just works:
1. Auto-detects local servers
2. Falls back to free public servers
3. Test with: `?sync=ws://192.168.1.100:1234`

## For Developers

### Option 1: Auto-Detection (Recommended)
Just start your server and it's automatically found:
```bash
npm run sync-server
# Auto-detects ws://localhost:1234
```

### Option 2: Manual Global (If Needed)
Add one line to your HTML:
```html
<script>window.SYNC_SERVER = 'ws://192.168.1.100:1234';</script>
```

### Option 3: URL Parameter
For testing different servers:
```
http://localhost:8000?sync=ws://pi.local:1234
```

## Start Your Server

```bash
# Install once
npm install -g y-websocket

# Start server
y-websocket-server --port 1234
```

Or use the repo script:
```bash
npm run sync-server
```

## How It Works

1. **Local First**: App works without sync
2. **Auto-Discovery**: Finds `ws://localhost:1234` and `ws://raspberrypi.local:1234` 
3. **Public Fallback**: Uses free servers if local not found
4. **Zero Config**: Perfect for users
5. **No Build Tools**: Direct HTML/JS per ADR-0006

## Examples

### Local Development
```bash
# Terminal 1: Start server
npm run sync-server

# Terminal 2: Open app
open http://localhost:8000
# Automatically connects to ws://localhost:1234
```

### Raspberry Pi
```bash
# On Pi
y-websocket-server --port 1234

# On other devices (same network)
# Automatically tries ws://raspberrypi.local:1234
```

### Custom Server
```html
<!-- Add to your HTML if needed -->
<script>window.SYNC_SERVER = 'ws://my-server.com:1234';</script>
```

## Network Setup

- **Port**: 1234 (WebSocket)
- **Protocol**: `ws://` (local) or `wss://` (HTTPS)
- **Firewall**: Open port 1234

## Troubleshooting

**Not syncing?**
- Check browser console for connection logs
- Ensure server is running: `lsof -i :1234`
- Try URL parameter: `?sync=ws://localhost:1234`

**Server won't start?**
- Port in use: `lsof -i :1234`
- Try different port: `y-websocket-server --port 8080`

That's it! Zero configuration, zero build tools, just works.
