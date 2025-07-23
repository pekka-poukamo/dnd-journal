// D&D Journal Sync Configuration Template
// Copy this file to sync-config.js and edit as needed

window.SYNC_CONFIG = {
  // Your sync server URL (leave empty for auto-detection)
  server: '',
  
  // Examples:
  // server: 'ws://192.168.1.100:1234',
  // server: 'ws://raspberrypi.local:1234',
  // server: 'ws://my-server.com:1234',
  
  // Public relay servers (always available as fallback)
  relays: [
    'wss://demos.yjs.dev',
    'wss://y-websocket.herokuapp.com'
  ]
};