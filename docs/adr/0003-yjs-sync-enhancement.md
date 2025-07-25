# ADR-0003: Yjs Sync Enhancement for Cross-Device Persistence

## Status
Accepted

## Context
While ADR-0004 establishes localStorage as the primary persistence mechanism, users need a way to synchronize data across multiple devices. The constraint is to maintain local-first principles while enabling automatic cross-device sync without sacrificing the core benefits of localStorage-only persistence.

## Decision
We will enhance our localStorage-only persistence with **Yjs CRDT sync** as an optional, transparent layer that maintains localStorage as the source of truth while enabling automatic cross-device synchronization.

## Rationale
- **Local-First Maintained**: localStorage remains the primary data store
- **Zero Breaking Changes**: Existing app continues to work without any modifications
- **Automatic Sync**: Real-time synchronization across devices when online
- **Offline Resilience**: Works completely offline, syncs when connectivity returns
- **No Server Dependencies**: Can use free public relay servers
- **CRDT Conflict Resolution**: Automatic merging without user intervention
- **Optional Enhancement**: Users can ignore sync entirely and use localStorage-only

## Architecture

### Data Flow
```
localStorage (primary) ←→ Yjs Document ←→ Network Providers
```

### Network Resilience
```
Device A ↔ Personal Pi Server (primary)
    ↓           ↓
    └→ Public Relay Servers (fallback)
```

## Implementation Requirements

### Core Principles
- **localStorage First**: All data operations go through localStorage
- **Sync as Enhancement**: Yjs syncs FROM localStorage, not TO it
- **Graceful Degradation**: App works identically with or without sync
- **No External Dependencies**: Must work with free/self-hosted options

### Allowed Components
```javascript
// ✅ Allowed Yjs Integration (CDN-based)
// Libraries loaded from reliable CDN with fallback
// Primary: jsDelivr, Fallback: unpkg
import * as Y from 'https://cdn.jsdelivr.net/npm/yjs@13.6.27/dist/yjs.js'
import { WebsocketProvider } from 'https://cdn.jsdelivr.net/npm/y-websocket@3.0.0/dist/y-websocket.js'
import { IndexeddbPersistence } from 'https://cdn.jsdelivr.net/npm/y-indexeddb@9.0.12/dist/y-indexeddb.js'

// Yjs as transparent sync layer
const ydoc = new Y.Doc()
const ymap = ydoc.getMap('journal')

// localStorage remains primary
utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state)
ymap.set('data', state) // Sync copy
```

### Forbidden Approaches
- **Yjs as Primary Store**: localStorage must remain the source of truth
- **Required Sync**: App must work without any network connectivity
- **Commercial Sync Services**: Only free/self-hosted solutions allowed
- **Breaking Changes**: Existing localStorage API cannot change

## Network Providers (In Priority Order)

1. **Self-Hosted Pi Server** (Primary)
   - WebSocket server on user's Raspberry Pi
   - Fast local network sync
   - Full user control

2. **Public Relay Servers** (Fallback)
   - Free Yjs demo servers
   - Automatic fallback when Pi offline
   - No registration required

3. **Offline Mode** (Always Available)
   - IndexedDB persistence for Yjs document
   - Works without any network
   - Syncs when connectivity returns

## Benefits

### Technical
- Maintains all ADR-0004 benefits
- Adds seamless cross-device sync
- Zero-configuration fallback servers
- Automatic conflict resolution via CRDT
- Real-time updates when online

### User Experience
- Works identically offline and online
- Changes appear instantly on other devices
- No manual export/import required
- No account creation or sign-up needed

## Compliance

### Required Implementation
```javascript
// Primary data flow (unchanged from ADR-0004)
const saveData = () => {
  utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state) // Primary
  yjsSync.setData(state) // Enhancement
}

// Sync updates localStorage (maintains primacy)
yjsSync.onChange((remoteData) => {
  state = remoteData
  utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state) // Back to primary
})
```

### Forbidden Patterns
```javascript
// ❌ Yjs as primary store
const state = ydoc.getMap('journal').get('data') // Bypasses localStorage

// ❌ Required sync
if (!yjsSync.isConnected()) {
  throw new Error('Cannot save without sync') // Must work offline
}

// ❌ Paid services
new WebsocketProvider('wss://paid-sync-service.com', doc) // Must be free
```

## Migration Strategy

### Phase 1: Non-Breaking Addition
- Add Yjs as optional sync layer
- Existing localStorage code unchanged
- Sync enhances but doesn't replace

### Phase 2: Automatic Migration
- On first Yjs load, populate from localStorage
- Thereafter, localStorage and Yjs stay in sync
- No user action required

### Phase 3: Graceful Fallback
- If Yjs fails, app continues with localStorage
- No functionality loss
- Transparent to user

## Revision History

### 2024-12-19: Initial Decision
- Yjs chosen over Automerge for simplicity
- Public relay servers for zero-cost fallback
- Pi server for optimal local performance
- Maintains all existing localStorage benefits while adding cross-device sync