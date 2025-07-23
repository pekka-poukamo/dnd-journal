# Style Guide

## 🏛️ Architecture Decisions First

**Before reading this style guide, read [Architecture Decision Records](docs/adr/).**

The ADRs contain **PERMANENT** architectural boundaries that cannot be changed. This style guide implements those decisions with specific coding rules.

## Core Rules

**NO EXCEPTIONS. KEEP IT SIMPLE.**

### JavaScript
1. **Pure functions only** - No mutations, no side effects
2. **Arrow functions** - `const fn = () => {}`
3. **No loops** - Use `map`, `filter`, `reduce`
4. **No classes** - Functions only
5. **No frameworks** - Vanilla JS only

### Testing
1. **Every function must have a test**
2. **Use should notation** - `result.should.equal(expected)`
3. **Test failures AND success cases**
4. **No function without tests gets merged**

### CSS
1. **CSS variables only** - `--color-primary`
2. **Mobile-first** - Start with mobile, enhance for desktop
3. **No !important** - Ever
4. **BEM naming** - `.component__element--modifier`

## Examples

### ✅ Good
```javascript
// Pure functions
const formatDate = (date) => new Date(date).toLocaleDateString();
const addEntry = (entries, entry) => [...entries, entry];

// Functional style
const getRecentEntries = (entries) => 
  entries.filter(e => e.date > yesterday)
         .sort((a, b) => b.date - a.date);
```

### ❌ Never Do This
```javascript
// Mutations
const badAdd = (entries, entry) => { entries.push(entry); return entries; };

// Loops
for (let i = 0; i < entries.length; i++) { /* ... */ }

// Classes
class EntryManager { /* ... */ }
```

## Anti-Patterns for AI Agents

### FORBIDDEN - Do Not Add
- ❌ Authentication systems
- ❌ User management
- ❌ Database integration
- ❌ API endpoints
- ❌ Build tools (webpack, etc)
- ❌ UI frameworks (React, Vue, etc)
- ❌ Styling frameworks (Bootstrap, etc)
- ❌ Multiple themes
- ❌ Complex state management
- ❌ Routing systems
- ❌ Real-time features
- ❌ Search functionality
- ❌ Sorting/filtering beyond basic
- ❌ Import/export features
- ❌ Backup systems
- ❌ Multiple file uploads
- ❌ Advanced form validation
- ❌ Notifications/alerts
- ❌ Plugins or extensions

### Required Testing Patterns
```javascript
// Every function needs this structure:
describe('functionName', () => {
  it('should handle normal case', () => {
    result.should.equal(expected);
  });
  
  it('should handle edge case', () => {
    result.should.not.be.null;
  });
  
  it('should handle error case', () => {
    (() => badFunction()).should.throw();
  });
});
```

## 🤖 For AI Agents

### MANDATORY Pre-Flight Checklist

Before suggesting ANY changes:

1. ✅ **Read ALL ADRs** in `docs/adr/` 
2. ✅ **Check forbidden features** in ADR-0007
3. ✅ **Verify technology stack** matches ADR-0001 (vanilla JS only)
4. ✅ **Confirm functional approach** per ADR-0002 (no classes/mutations)
5. ✅ **Validate data persistence** per ADR-0004 (localStorage only)
6. ✅ **Check sync enhancement** per ADR-0003 (optional Yjs sync)
7. ✅ **Validate testing requirements** per ADR-0005

### Automatic Failure Conditions

**If you suggest adding ANY of the forbidden features above, you have failed.** (See ADR-0007)

**If you write code without tests, you have failed.** (See ADR-0005)

**If you use classes, loops, or mutations, you have failed.** (See ADR-0002)

**If you suggest frameworks or build tools, you have failed.** (See ADR-0001, ADR-0006)

**If you propose complex deployment, you have failed.** (See ADR-0008)

**If you violate ANY ADR, you have failed.**

### Success Pattern
1. Read ADRs → 2. Follow style guide → 3. Write tests → 4. Write minimal code → 5. Deploy with Surge

**Stay minimal. Stay functional. Test everything.**