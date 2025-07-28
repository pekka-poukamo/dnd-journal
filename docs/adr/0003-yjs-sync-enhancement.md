# ADR-0003: Yjs Sync Enhancement for Cross-Device Persistence

## Status
Superseded (2024-12-19) - Integrated into ADR-0004 as primary persistence

## Context
While ADR-0004 originally established localStorage as the primary persistence mechanism, users needed a way to synchronize data across multiple devices. The constraint was to maintain local-first principles while enabling automatic cross-device sync.

## Decision
~~We will enhance our localStorage-only persistence with **Yjs CRDT sync** as an optional, transparent layer that maintains localStorage as the source of truth while enabling automatic cross-device synchronization.~~

**SUPERSEDED**: This ADR has been integrated into the updated ADR-0004. Yjs is now the primary persistence mechanism (not an enhancement), providing both local IndexedDB persistence and cross-device synchronization in a unified solution.

## Rationale
- ~~**Local-First Maintained**: localStorage remains the primary data store~~
- **Local-First Achieved**: IndexedDB provides robust local persistence
- ~~**Zero Breaking Changes**: Existing app continues to work without any modifications~~
- **Automatic Sync**: Real-time synchronization across devices when online
- **Offline Resilience**: Works completely offline via IndexedDB, syncs when connectivity returns
- **No Server Dependencies**: Can use free public relay servers
- **CRDT Conflict Resolution**: Automatic merging without user intervention
- ~~**Optional Enhancement**: Users can ignore sync entirely and use localStorage-only~~
- **Unified Solution**: Single system handles both local persistence and sync

## Architecture

### Updated Data Flow (Current Implementation)
```
Yjs Maps (primary) ←→ IndexedDB (local persistence) ←→ WebSocket Providers (sync)
```

### ~~Original Data Flow (Superseded)~~
```
localStorage (primary) ←→ Yjs Document ←→ Network Providers
```

### Network Resilience (Still Valid)
```
Device A ↔ Personal Pi Server (primary)
    ↓           ↓
    └→ Public Relay Servers (fallback)
```

## Implementation Requirements

### ~~Core Principles (Original - Superseded)~~
- ~~**localStorage First**: All data operations go through localStorage~~
- ~~**Sync as Enhancement**: Yjs syncs FROM localStorage, not TO it~~
- ~~**Graceful Degradation**: App works identically with or without sync~~
- ~~**No External Dependencies**: Must work with free/self-hosted options~~

### Current Core Principles (Integrated into ADR-0004)
- **Yjs Primary**: All data operations go through Yjs Maps
- **IndexedDB Persistence**: Local persistence via y-indexeddb
- **Sync Built-in**: WebSocket providers enable cross-device sync
- **Graceful Degradation**: App works offline via IndexedDB
- **No External Dependencies**: Uses free/self-hosted sync servers

### Current Implementation (See ADR-0004)
```javascript
// ✅ Current Yjs-Primary Implementation
import { createSystem, getSystem, Y } from './yjs.js';

// Initialize Yjs system with IndexedDB persistence and sync
const yjsSystem = await createSystem();

// Direct Yjs operations (primary)
yjsSystem.characterMap.set('name', 'Aragorn');
const name = yjsSystem.characterMap.get('name');
```

### ~~Allowed Components (Original - Superseded)~~
```javascript
// ✅ Allowed Yjs Integration
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

// Yjs as transparent sync layer
const ydoc = new Y.Doc()
const ymap = ydoc.getMap('journal')

// localStorage remains primary
utils.safeSetToStorage(utils.STORAGE_KEYS.JOURNAL, state)
ymap.set('data', state) // Sync copy
```

## Migration History

### Phase 1: localStorage Primary + Yjs Sync (Original ADR-0003)
- localStorage as source of truth
- Yjs as optional sync enhancement
- Dual persistence (localStorage + Yjs)

### Phase 2: Yjs Primary (Current - ADR-0004)
- Yjs Maps as source of truth
- IndexedDB via y-indexeddb for local persistence
- WebSocket providers for sync
- Unified persistence and sync solution

## Benefits Achieved

### Technical
- ~~Maintains all ADR-0004 benefits~~ → **Exceeds original ADR-0004 benefits**
- Seamless cross-device sync
- Zero-configuration fallback servers
- Automatic conflict resolution via CRDT
- Real-time updates when online
- **Structured data model** (vs JSON strings)
- **Better performance** (vs localStorage serialization)

### User Experience
- Works identically offline and online
- Changes appear instantly on other devices
- No manual export/import required
- No account creation or sign-up needed
- **Better collaboration** via CRDT conflict resolution

## Compliance

### ~~Required Implementation (Original - Superseded)~~
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

### Current Implementation (See ADR-0004)
All persistence patterns are now defined in ADR-0004 as Yjs is the primary persistence mechanism.

## Revision History
- **2024-12-19**: Marked as superseded - integrated into updated ADR-0004 as primary persistence
- **Original**: Yjs as enhancement to localStorage (superseded)