# D&D Journal - Sync Setup

Simple cross-device synchronization for your D&D Journal.

## For Users

**Nothing to configure!** The app automatically:
1. Uses free public relay servers
2. Auto-detects local Pi servers when on same network
3. Supports URL parameter for testing: `?sync=ws://192.168.1.100:1234`

## For Developers/Self-Hosters

### Static Website Configuration

Since static websites can't access environment variables at runtime, use **build-time injection**:

#### Option 1: Meta Tag (Recommended)

Inject during build/deployment:
```html
<!-- In your HTML head, injected during build -->
<meta name="sync-server" content="ws://your-pi-ip:1234">
```

#### Option 2: Build-Time Global

Set during build process:
```html
<!-- Injected during build -->
<script>window.SYNC_SERVER_URL = 'ws://your-pi-ip:1234';</script>
```

#### Option 3: URL Parameter

For testing/development:
```
https://your-app.com?sync=ws://192.168.1.100:1234
```

#### Option 4: Auto-Detection

Automatically tries common local servers:
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

## Build-Time Injection Examples

### Netlify

```toml
# netlify.toml
[build]
  command = """
    # Inject sync server during build
    sed -i 's|</head>|<meta name="sync-server" content="'$SYNC_SERVER_URL'"></head>|' index.html &&
    npm run build
  """

[context.production.environment]
  SYNC_SERVER_URL = "wss://your-production-server.com:1234"

[context.deploy-preview.environment]
  SYNC_SERVER_URL = "ws://staging-pi.local:1234"
```

### Vercel

```json
// package.json
{
  "scripts": {
    "build": "node scripts/inject-config.js && next build"
  }
}
```

```javascript
// scripts/inject-config.js
const fs = require('fs');
const syncServer = process.env.SYNC_SERVER_URL;

if (syncServer) {
  // Inject into HTML template or create config file
  const configScript = `<script>window.SYNC_SERVER_URL='${syncServer}';</script>`;
  // ... injection logic
}
```

### GitHub Pages

```yaml
# .github/workflows/deploy.yml
- name: Build with config
  run: |
    # Inject sync server into built files
    sed -i 's|</head>|<meta name="sync-server" content="${{ secrets.SYNC_SERVER_URL }}"></head>|' index.html
    npm run build
```

### Simple Build Script

```bash
#!/bin/bash
# build.sh - Simple build-time injection

SYNC_SERVER="${SYNC_SERVER_URL:-ws://localhost:1234}"

# Inject meta tag
sed -i "s|</head>|<meta name=\"sync-server\" content=\"$SYNC_SERVER\"></head>|" index.html

echo "✅ Injected sync server: $SYNC_SERVER"
```

## How It Works

- **Local First**: App works normally without sync
- **Build-Time Config**: Server URLs injected during deployment
- **Automatic Fallback**: Uses public servers if yours is offline
- **No Runtime Secrets**: All config happens at build time
- **Smart Detection**: Finds local servers automatically
- **Zero User Config**: Perfect UX with no setup required

## Configuration Priority

1. **URL Parameter** (highest - for testing)
2. **Meta Tag** (injected during build)
3. **Build-Time Global** (window.SYNC_SERVER_URL)
4. **Auto-Detection** (local network discovery)
5. **Public Relays** (lowest - always available fallback)

## Security Notes

- **Build-Time Only**: No runtime environment variables needed
- **Public Config**: Server URLs are visible in client code (not secrets)
- **Separate Secrets**: Use different servers for production/staging
- **No API Keys**: Sync server requires no authentication

## Network Setup

Your server will run on:
- **WebSocket**: `ws://your-ip:1234`

Make sure port 1234 is open on your firewall.

## Troubleshooting

**App won't sync?**
- Check browser console for connection attempts
- Verify meta tag or global is set correctly
- Ensure Pi server is running on port 1234
- Try the URL parameter method for testing

**Build injection not working?**
- Check build scripts have proper permissions
- Verify environment variables are set during build
- Test injection with a simple echo/print first

**Server won't start?**
- Check if port 1234 is already in use: `lsof -i :1234`
- Try a different port: `y-websocket-server --port 8080`

That's it! Your D&D Journal will automatically sync across devices with proper static site configuration.