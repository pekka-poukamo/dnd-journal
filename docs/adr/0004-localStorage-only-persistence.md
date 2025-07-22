# ADR-0004: localStorage Only for Persistence

## Status
Accepted

## Context
Applications need data persistence. Options include databases, APIs, cloud storage, IndexedDB, localStorage, and sessionStorage.

## Decision
We will use **localStorage only** for all data persistence.

## Rationale
- **Zero Setup**: No database or server configuration
- **Offline First**: Works without internet connection
- **Simple API**: Just `getItem()` and `setItem()`
- **AI Agent Prevention**: Stops agents from adding databases
- **Privacy**: All data stays on user's device
- **Performance**: No network requests for data
- **Size Limit**: Forces keeping data minimal

## Consequences
### Positive
- Completely offline application
- No server maintenance or costs
- Simple implementation
- Fast data access
- User controls their data

### Negative
- Data tied to specific browser/device
- Limited storage space (~5-10MB)
- No data sharing between devices
- Data lost if browser storage cleared

## Compliance
**Forbidden additions:**
- Database integrations (Firebase, Supabase, etc.)
- API endpoints for data
- Cloud storage (Google Drive, Dropbox, etc.)
- IndexedDB for complex queries
- sessionStorage (data should persist)
- Cookies for data storage

**Required approach:**
- All data in localStorage
- JSON serialization for complex objects
- Graceful handling of storage quota exceeded
- Simple backup/restore via copy-paste

## Implementation
```javascript
// ✅ Allowed
const saveState = (state) => localStorage.setItem('dnd-journal', JSON.stringify(state));
const loadState = () => JSON.parse(localStorage.getItem('dnd-journal') || '{}');

// ❌ Forbidden
fetch('/api/save', {method: 'POST', body: data}); // No APIs
new Database(); // No databases
```
