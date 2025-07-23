# 🎲 D&D Journal Pi Deployment Guide

## Overview

This guide shows you how to deploy the D&D Journal sync server to your Raspberry Pi for automatic cross-device synchronization.

## Prerequisites

- Raspberry Pi with Raspbian/Ubuntu
- Network connection (WiFi or Ethernet)
- SSH access to your Pi

## Deployment Options

### Option 1: One-Command Deployment ⭐ **Recommended**

From your computer, deploy everything automatically:

```bash
npm run deploy:pi
```

**What this does:**
- Connects to your Pi via SSH
- Installs Node.js if needed
- Uploads server files
- Installs dependencies
- Configures PM2 for auto-start
- Gives you the configuration URL

**Requirements:**
- SSH access to your Pi
- Your Pi's IP address or hostname

### Option 2: Manual Setup on Pi

If you prefer to set up manually on the Pi:

```bash
# Clone the repo on your Pi
git clone <your-repo-url>
cd dnd-journal

# Run the setup script
npm run setup:pi
```

### Option 3: Manual Installation

For full control over the process:

```bash
# On your Pi
git clone <your-repo-url>
cd dnd-journal

# Install dependencies
npm install --production

# Start the server
npm start

# Optional: Auto-start with PM2
sudo npm install -g pm2
npm run pi:start
```

## Server Management

Once your Pi server is running, use these commands:

```bash
# Check server status
npm run pi:status

# View live logs
npm run pi:logs

# Restart server
npm run pi:restart

# Stop server
npm run pi:stop
```

## Network Configuration

### Local Network Access

Your Pi server will be accessible on your local network:

- **WebSocket**: `ws://192.168.1.XXX:1234`
- **Web Interface**: `http://192.168.1.XXX:1234`

### Internet Access (Optional)

To access from outside your network:

1. **Port Forwarding**: Forward port 1234 to your Pi
2. **Dynamic DNS**: Set up a domain name for your Pi
3. **SSL**: Consider adding SSL for secure connections

## App Configuration

### Automatic Configuration

Add your Pi's IP to your app URL:
```
https://your-app.surge.sh?pi=192.168.1.100
```

### Manual Configuration

In your browser console:
```javascript
yjsSync.configurePiServer('ws://192.168.1.100:1234')
```

### Verify Connection

Check the browser console for sync messages:
- `📱 Yjs local persistence ready`
- `🌐 Sync connected`
- `🔄 Remote changes detected`

## Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
sudo netstat -tulpn | grep :1234

# Check logs
npm run pi:logs

# Restart server
npm run pi:restart
```

### Can't Connect from App

1. **Check Pi IP**: Ensure you're using the correct IP
2. **Firewall**: Make sure port 1234 is open
3. **Network**: Ensure Pi and devices are on same network

### Performance Issues

```bash
# Check system resources
htop

# Check server memory usage
npm run pi:status

# Restart if needed
npm run pi:restart
```

## Advanced Configuration

### Custom Port

Set a different port:
```bash
PORT=8080 npm start
```

### Custom Data Directory

```bash
DATA_DIR=/home/pi/my-sync-data npm start
```

### Environment Variables

Create `.env` file on your Pi:
```bash
PORT=1234
HOST=0.0.0.0
DATA_DIR=/home/pi/dnd-journal-data
LOG_LEVEL=info
```

## Performance & Security

### Performance Tips

- Use ethernet connection for better reliability
- Consider using a faster SD card (Class 10+ or USB 3.0 SSD)
- Monitor CPU/memory usage with `htop`

### Security Considerations

- Change default Pi password
- Consider setting up a firewall
- For internet access, use SSL/TLS
- Regular Pi updates: `sudo apt update && sudo apt upgrade`

## Backup & Recovery

### Backup Sync Data

```bash
# Backup data directory
tar -czf dnd-journal-backup.tar.gz /home/pi/dnd-journal-sync/data/
```

### Restore from Backup

```bash
# Extract backup
tar -xzf dnd-journal-backup.tar.gz -C /
```

## Migration

### Moving to New Pi

1. Backup data from old Pi
2. Deploy to new Pi using Option 1
3. Restore data to new Pi
4. Update app configuration with new IP

## Support

### Health Check

Visit `http://your-pi-ip:1234` in browser for server status

### API Endpoints

- `GET /health` - Health check
- `GET /status` - Detailed server statistics
- `GET /api` - API documentation

### Log Files

PM2 logs location: `~/.pm2/logs/dnd-journal-sync-*.log`

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run deploy:pi` | One-command deployment |
| `npm run setup:pi` | Manual setup on Pi |
| `npm run pi:start` | Start with PM2 |
| `npm run pi:stop` | Stop server |
| `npm run pi:restart` | Restart server |
| `npm run pi:status` | Check status |
| `npm run pi:logs` | View logs |

---

**Your D&D Journal data will sync automatically across all devices once the Pi server is running!**