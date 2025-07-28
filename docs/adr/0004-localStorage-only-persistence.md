# ADR-0004: Yjs-Only Persistence

## Status
Accepted (Updated 2024-12-19)

## Context
Applications need data persistence that supports both local-first principles and real-time collaboration. Options include databases, APIs, cloud storage, IndexedDB, localStorage, and CRDT-based solutions like Yjs.

## Decision
We will use **Yjs with IndexedDB persistence only** for all data persistence.

## Rationale
- **Zero Setup**: No database or server configuration required
- **Offline First**: Works without internet connection via IndexedDB
- **Real-time Collaboration**: Built-in CRDT conflict resolution
- **Cross-device Sync**: Automatic synchronization when online
- **AI Agent Prevention**: Stops agents from adding complex databases
- **Privacy**: All data stays on user's device (with optional sync)
- **Performance**: Fast local IndexedDB access with network sync
- **Structured Data**: Yjs Maps provide better data organization than JSON strings

## Architecture

### Data Flow
```
Yjs Maps (primary) ←→ IndexedDB (local persistence) ←→ WebSocket Providers (sync)
```

### Yjs Document Structure
```javascript
const ydoc = new Y.Doc();
const characterMap = ydoc.getMap('character');    // Character data
const journalMap = ydoc.getMap('journal');        // Journal entries  
const settingsMap = ydoc.getMap('settings');      // User settings
const summariesMap = ydoc.getMap('summaries');    // AI summaries
```

## Consequences
### Positive
- Completely offline application with IndexedDB
- Real-time collaboration via CRDTs
- Automatic conflict resolution
- Cross-device synchronization
- No server maintenance or costs
- Fast data access via Yjs Maps
- User controls their data
- Structured data model

### Negative
- Slightly larger bundle size than localStorage
- More complex than simple JSON storage
- IndexedDB has browser compatibility considerations
- Data format tied to Yjs (but has export capabilities)

## Compliance
**Required approach:**
- All data in Yjs Maps with IndexedDB persistence
- WebSocket providers for optional sync
- Graceful handling of storage quota exceeded
- Simple backup/restore via Yjs document export

**Forbidden additions:**
- External database integrations (Firebase, Supabase, etc.)
- API endpoints for data persistence
- Cloud storage as primary store (Google Drive, Dropbox, etc.)
- localStorage for structured data (only allowed for simple config)
- sessionStorage (data should persist)
- Cookies for data storage

## Implementation
```javascript
// ✅ Allowed - Yjs-based persistence
import { createSystem, getSystem, Y } from './yjs.js';

// Initialize Yjs system
const yjsSystem = await createSystem();

// Save character data
yjsSystem.characterMap.set('name', 'Aragorn');
yjsSystem.characterMap.set('class', 'Ranger');

// Load character data  
const name = yjsSystem.characterMap.get('name');
const characterClass = yjsSystem.characterMap.get('class');

// ❌ Forbidden
fetch('/api/save', {method: 'POST', body: data}); // No APIs
new Database(); // No external databases
localStorage.setItem('character', JSON.stringify(data)); // No localStorage for data
```

## Migration from ADR-0004 v1 (localStorage-only)
The original version of this ADR specified localStorage-only persistence. The current implementation has evolved to use Yjs with IndexedDB for the following benefits:

1. **Better Collaboration**: CRDT-based conflict resolution
2. **Cross-device Sync**: Real-time synchronization via WebSocket providers  
3. **Structured Data**: Yjs Maps instead of JSON string serialization
4. **Offline Resilience**: IndexedDB provides robust local persistence
5. **Future-proof**: Easier to extend with additional sync providers

## Extensions
- **Cross-device Sync**: WebSocket providers enable real-time synchronization
- **Backup/Export**: Yjs document can be exported for backup purposes
- **Collaboration**: Multiple users can edit simultaneously with automatic conflict resolution

## Revision History
- **2024-12-19**: Updated from localStorage-only to Yjs-only persistence to match current implementation
- **Original**: localStorage-only persistence (superseded)
