# ADR-0016: Navigation Cache Strategy - Amendment to Yjs Persistence

## Status
Accepted (2025-01-27)

## Context
The application uses Yjs with IndexedDB persistence (ADR-0004) for all primary data storage. However, IndexedDB initialization creates a 2-3 second delay during page navigation, resulting in poor user experience with blank pages and lost form data.

The challenge is providing immediate UI responsiveness while maintaining the robust Yjs/IndexedDB persistence strategy established in ADR-0004.

## Decision
We will implement a **dual-layer strategy** with sessionStorage as a temporary navigation cache that bridges UI performance gaps while preserving Yjs/IndexedDB as the single source of truth.

**Key Principle**: The cache is a UI performance optimization, not a persistence mechanism.

## Rationale
- **Preserves ADR-0004**: Yjs/IndexedDB remains the single source of truth for all data
- **Solves UX Problem**: Eliminates blank page states during navigation
- **Maintains Simplicity**: Uses browser-native sessionStorage without external dependencies
- **Self-Cleaning**: sessionStorage auto-expires on browser close, preventing stale data
- **Form Preservation**: Prevents user work loss during navigation
- **Graceful Degradation**: Application functions identically with or without cache

## Architecture
Two-layer approach where cache serves UI performance while persistence handles data integrity:

```
Navigation Layer:  sessionStorage (immediate UI rendering)
                          ↓
Persistence Layer: Yjs Maps ←→ IndexedDB (source of truth)
                          ↓  
Sync Layer:        WebSocket Providers (real-time sync)
```

**Flow**: Page loads render cached UI instantly → Yjs initializes → Live data replaces cache → User changes update both layers

## Constraints
- **Storage Medium**: sessionStorage only (complies with ADR-0004 localStorage prohibition)
- **Data Scope**: UI display data only, not complete application state
- **Cache Lifetime**: Short-term expiry to prevent stale data issues
- **Fallback**: Must work when cache unavailable or browser doesn't support sessionStorage

## Relationship to Other ADRs
- **ADR-0004 (Yjs Persistence)**: Cache complements, never replaces, the primary Yjs/IndexedDB persistence
- **ADR-0002 (Functional Programming)**: Cache operations use pure functions with graceful error handling  
- **ADR-0015 (View-Logic Separation)**: Cache enhances view performance without affecting business logic

## Benefits
- **Immediate UI Response**: Eliminates navigation delays and blank page states
- **Form Data Preservation**: Users don't lose work when navigating between pages
- **Maintains Architecture**: No changes to core persistence or sync mechanisms
- **Self-Managing**: Automatic cleanup prevents stale data without manual intervention

## Compliance
**Required**: Cache must be temporary, UI-focused, and never replace Yjs as source of truth

**Forbidden**: Using cache as persistence, localStorage usage, or long-term data storage

## Consequences

### Positive
- Solves navigation performance problem without compromising data architecture
- Preserves user work and improves experience 
- Maintains existing persistence and sync mechanisms
- Uses browser-native technology with zero dependencies

### Negative  
- Introduces additional layer requiring coordination between cache and persistence
- sessionStorage has browser storage limitations
- Potential for temporary inconsistency between cache and source data

## Revision History
- **2025-01-27**: Initial version documenting navigation cache strategy