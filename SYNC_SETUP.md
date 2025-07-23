# D&D Journal - Yjs Sync Setup Guide

This guide explains how to enable automatic cross-device synchronization for your D&D Journal using Yjs (ADR-0003).

## What You Get

- ✅ **Automatic sync** across all your devices
- ✅ **Works offline** - syncs when connectivity returns  
- ✅ **Free public relays** as backup
- ✅ **Real-time updates** when online
- ✅ **No breaking changes** - app works exactly the same without sync

## Quick Setup (Public Relays Only)

The app works out-of-the-box with free public relay servers:

1. **Open the app** on multiple devices
2. **That's it!** Changes automatically sync via public relays

## Raspberry Pi Server Setup (Recommended)

For faster local sync and full control:

### 1. Install on Pi
```bash
# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yjs WebSocket server globally
sudo npm install -g y-websocket

# Start the server (runs on port 1234)
y-websocket-server --port 1234

# Optional: Make it run on boot
sudo npm install -g pm2
pm2 start y-websocket-server -- --port 1234
pm2 startup
pm2 save
```

### 2. Configure Your App

**Option A: URL Parameter (Easy)**
Visit your app with: `https://your-app-url.surge.sh?pi=192.168.1.100`
(Replace with your Pi's IP address)

**Option B: Browser Console**
```javascript
// Configure Pi server in browser console
yjsSync.configurePiServer('ws://192.168.1.100:1234')
```

**Option C: Direct localStorage**
```javascript
localStorage.setItem('dnd-journal-pi-server', 'ws://192.168.1.100:1234')
```

## How It Works

### Network Priority
1. **Your Pi Server** (fastest, local network)
2. **Public Relays** (free backup servers)
3. **Offline Mode** (IndexedDB persistence)

### Data Flow
```
localStorage (primary) ←→ Yjs Document ←→ Network Sync
```

### Sync Behavior
- **Local storage remains primary** (ADR-0004)
- **Yjs enhances with sync** (ADR-0003)
- **App works identically** with or without sync
- **Automatic conflict resolution** via CRDT

## Troubleshooting

### Check Sync Status
```javascript
// In browser console
console.log(yjsSync.getStatus())
```

### Reset Configuration
```javascript
// Clear Pi server config
localStorage.removeItem('dnd-journal-pi-server')
location.reload()
```

### View Sync Logs
Open browser Developer Tools → Console to see sync activity:
- `📱 Yjs local persistence ready`
- `🌐 Sync connected` 
- `🔄 Remote changes detected`
- `💾 Data saved and syncing...`

## Network Requirements

### For Pi Server
- **Port forwarding**: Forward port 1234 to your Pi for internet access
- **Local network**: Works immediately on same WiFi
- **Dynamic DNS**: Consider for consistent external access

### For Public Relays
- **No setup required** - works out of the box
- **Free forever** - provided by Yjs community
- **Good reliability** - used by production apps

## Advanced Configuration

### Custom Relay Servers
Edit `js/sync.js` to add your own relay servers:
```javascript
const publicRelays = [
  'wss://your-relay-server.com',
  'wss://demos.yjs.dev'  // Keep as fallback
]
```

### Persistence Options
- **IndexedDB**: Automatic Yjs document persistence
- **localStorage**: Primary app data storage (unchanged)
- **Both work together** seamlessly

## Architecture Compliance

This implementation follows all ADRs:
- **ADR-0001**: Pure vanilla JavaScript
- **ADR-0002**: Functional programming only
- **ADR-0003**: Yjs sync enhancement (this feature)
- **ADR-0004**: localStorage remains primary
- **ADR-0005**: All functions tested
- **ADR-0006**: No build tools
- **ADR-0007**: Minimal feature set
- **ADR-0008**: Surge.sh deployment

## Support

- **Local-first**: App works completely offline
- **Graceful degradation**: Sync enhances but never breaks core functionality
- **Zero dependencies**: Can remove Yjs scripts and app works normally
- **Free operation**: No ongoing costs with public relays

---

**The app maintains full ADR compliance while adding enterprise-grade sync capabilities.**