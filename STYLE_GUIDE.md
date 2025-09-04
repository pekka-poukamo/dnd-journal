# Style Guide

## JavaScript

### Functions
```javascript
// ✅ Correct
export const createEntry = (title, content) => ({
  id: generateId(),
  title,
  content,
  timestamp: Date.now()
});

// ❌ Wrong
function createEntry(title, content) { ... }
class EntryManager { ... }
```

### Immutable Operations
```javascript
// ✅ Correct
const newEntries = [...entries, newEntry];
const updatedEntry = { ...entry, title: newTitle };

// ❌ Wrong
entries.push(newEntry);
entry.title = newTitle;
```

## CSS

### Naming
```css
/* ✅ Correct */
.entry { }
.entry__title { }
.entry--featured { }

/* ❌ Wrong */
.entryTitle { }
.entry_content { }
```

## HTML

### Semantic
```html
<!-- ✅ Correct -->
<main>
  <section class="entries">
    <article class="entry">
      <h2 class="entry__title">Title</h2>
    </article>
  </section>
</main>
```

## Testing

### Structure
```javascript
describe('Module', () => {
  it('should do something specific', () => {
    const result = functionName(input);
    expect(result).to.equal(expected);
  });
});
```

## Forbidden

- `class` declarations
- `this` keyword
- Direct mutations
- `require()` statements
- Inline styles
- Non-semantic HTML

## View Purity (Architecture)

Rendering modules (`*-views.js` and files under `js/components/`) must stay pure and presentation-focused.

Checklist:
- Accept data and callbacks as parameters; do not access global state.
- Do not import state or service modules (e.g., Yjs integration, AI orchestration).
- Do not perform network calls.
- Return DOM elements or update only the given container.
- Keep DOM creation and class toggling inside views; keep data validation and side effects in logic modules.

Note:
- Views may import and use `js/navigation-cache.js` for UI-only cached rendering during navigation per ADR-0016. This cache is a temporary, UI-focused bridge and not a source of truth.

UI helpers:
- `js/components/notifications.js` provides `showNotification` for views.
- Shared non-DOM helpers live in `js/utils.js`.