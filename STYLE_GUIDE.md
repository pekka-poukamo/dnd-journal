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