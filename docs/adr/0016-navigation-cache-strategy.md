# ADR-0016: Navigation Cache Strategy - Amendment to Yjs Persistence

## Status
Accepted (2025-01-27)

## Context
The application uses Yjs with IndexedDB persistence (ADR-0004) for all primary data storage. However, there's a performance challenge during navigation:

1. **IndexedDB Loading Delay**: When users navigate between pages, there's a 2-3 second delay while IndexedDB loads and Yjs initializes
2. **Poor User Experience**: Users see blank pages or loading states during navigation
3. **Form Data Loss**: Partially filled forms are lost during navigation between pages
4. **Persistence vs. Performance Trade-off**: Primary persistence must remain robust (IndexedDB), but UI needs immediate responsiveness

This creates a need for a secondary, fast-access cache layer that bridges the gap between navigation and full Yjs initialization, without compromising the primary persistence strategy.

## Decision
We will implement a **Navigation Cache Strategy** using sessionStorage as a temporary UI bridge while maintaining Yjs/IndexedDB as the primary persistence layer.

**Key Principle**: This is **NOT** a persistence layer - it's a navigation performance optimization that preserves UI state between page loads.

## Rationale
- **Immediate UI Response**: sessionStorage provides instant access for immediate page rendering
- **Non-Persistent by Design**: sessionStorage automatically clears on browser close, preventing stale data issues
- **Complements Yjs**: Works alongside (not instead of) the primary Yjs persistence system
- **Form Preservation**: Saves partially completed form data during navigation
- **Zero Configuration**: No setup required, works across all browsers
- **Automatic Cleanup**: 5-minute expiry prevents stale cache issues
- **Fallback Graceful**: Application works identically with or without cache availability

## Architecture

### Cache Layer Hierarchy
```
Fast Access     sessionStorage Cache (5min TTL)    ← Navigation cache
                       ↓
Primary Storage    Yjs Maps ←→ IndexedDB           ← Primary persistence  
                       ↓
Network Sync      WebSocket Providers              ← Real-time sync
```

### Data Flow Pattern
```
Page Load → Check sessionStorage → Render cached UI immediately
    ↓
Initialize Yjs/IndexedDB (2-3s) → Replace cache with live data
    ↓
User Interaction → Update Yjs → Save to sessionStorage cache
```

### Cache Scope
The navigation cache stores **display-optimized snapshots** of:
- **Journal Entries**: Essential fields only (id, title, content, timestamp, formattedDate)
- **Character Data**: Common fields (name, race, class, backstory, notes)
- **Settings**: UI-relevant settings (theme, sync-server-url)
- **Form Data**: Partially completed forms by page type

## Implementation Requirements

### Cache Constraints
- **Storage**: sessionStorage only (ADR-0004 forbids localStorage)
- **TTL**: 5-minute automatic expiry
- **Size**: Essential display data only, not full document state
- **Versioning**: Cache version compatibility checking
- **Graceful Degradation**: Must work when sessionStorage unavailable

### Required Functions
```javascript
// Cache availability and validation
isCacheAvailable() → boolean
isCacheValid(cacheData) → boolean

// Primary cache operations
saveNavigationCache(yjsState, formData) → boolean
loadNavigationCache() → object|null
clearNavigationCache() → boolean

// Specific data access
getCachedJournalEntries() → array
getCachedCharacterData() → object  
getCachedSettings() → object
getCachedFormData() → object

// Form preservation
saveCurrentFormData(pageType, formData) → boolean
getFormDataForPage(pageType) → object
```

### Cache Data Structure
```javascript
{
  version: "1.0",
  timestamp: 1738000000000,
  data: {
    journalEntries: [...],    // Display-ready entries
    characterData: {...},     // Common character fields
    settings: {...},          // UI-relevant settings  
    formData: {               // Form preservation by page
      journal: {...},
      character: {...},
      settings: {...}
    }
  }
}
```

## Integration with Existing ADRs

### Relationship to ADR-0004 (Yjs-Only Persistence)
- **Primary Storage**: Yjs/IndexedDB remains the source of truth
- **Cache Role**: sessionStorage provides navigation performance only
- **No Conflict**: Cache is explicitly temporary and non-persistent
- **Compliance**: Does not violate localStorage prohibition (uses sessionStorage)

### Relationship to ADR-0002 (Functional Programming)
- **Pure Functions**: All cache functions are pure and side-effect free
- **No Shared State**: Cache operations don't modify global state
- **Error Handling**: Graceful fallbacks for all cache failures

### Relationship to ADR-0015 (View-Logic Separation)
- **View Enhancement**: Cache improves view rendering performance
- **Logic Separation**: Cache operations are separate from business logic
- **Data Bridging**: Provides view data while logic layer initializes

## Benefits

### Performance
- **Instant Page Loads**: UI renders immediately from cache
- **Reduced Loading States**: Users see content during Yjs initialization
- **Form Preservation**: No data loss during navigation
- **Improved UX**: Smooth navigation experience

### Reliability
- **Automatic Expiry**: Prevents stale data issues
- **Graceful Degradation**: Works without cache availability
- **Version Checking**: Handles cache compatibility
- **Error Recovery**: Clears corrupted cache automatically

## Compliance

### Required Patterns
```javascript
// ✅ Correct: Cache as UI bridge
const cached = loadNavigationCache();
if (cached) {
  renderImmediate(cached.journalEntries);
}
const yjsState = await initYjs(); // Primary load
renderComplete(yjsState);

// ✅ Correct: Form preservation
saveCurrentFormData('journal', formData);

// ✅ Correct: Cache invalidation
if (cacheAge > CACHE_EXPIRY_MS) {
  clearNavigationCache();
}
```

### Forbidden Patterns
```javascript
// ❌ Cache as primary storage
const data = loadNavigationCache() || defaultData;
// Must always initialize Yjs as primary

// ❌ localStorage usage  
localStorage.setItem('cache', data);
// Violates ADR-0004 localStorage prohibition

// ❌ Long-term cache storage
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
// Maximum 5 minutes to prevent stale data

// ❌ Complete state caching
saveNavigationCache(fullYjsDocument);
// Cache only essential display data
```

## Testing Requirements
- **Cache Availability**: Test graceful degradation when sessionStorage unavailable
- **TTL Validation**: Verify automatic expiry after 5 minutes
- **Version Compatibility**: Test handling of incompatible cache versions
- **Data Integrity**: Verify cached data matches source data structure
- **Form Preservation**: Test form data survival across navigation
- **Error Handling**: Test recovery from corrupted cache data

## Consequences

### Positive
- Eliminates navigation performance bottlenecks
- Preserves user work during navigation
- Maintains data integrity via primary Yjs persistence
- Improves user experience without architectural changes
- Complements existing persistence strategy

### Negative  
- Additional complexity in data flow management
- Potential for cache/source data synchronization issues
- sessionStorage size limitations
- Browser compatibility considerations for sessionStorage

## Extensions
- **Cache Warming**: Pre-populate cache during idle time
- **Selective Caching**: Cache only frequently accessed data
- **Cache Analytics**: Monitor cache hit rates and performance impact
- **Progressive Enhancement**: Enhanced caching for power users

## Revision History
- **2025-01-27**: Initial version documenting navigation cache strategy