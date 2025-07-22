# D&D Journal App - Style Guide

## Overview
This style guide emphasizes simplicity, pure functions, and vanilla JavaScript/CSS. The goal is clean, maintainable code that's easy to understand and extend.

## JavaScript Style

### Core Principles
1. **Pure Functions**: Functions should not mutate inputs or have side effects
2. **Functional Programming**: Prefer `map`, `filter`, `reduce` over loops
3. **Arrow Functions**: Use arrow functions for concise syntax
4. **Immutability**: Don't mutate objects/arrays, create new ones
5. **Single Responsibility**: Each function should do one thing well

### Function Declarations

```javascript
// ✅ Good - Pure arrow functions
const formatDate = (date) => new Date(date).toLocaleDateString();

const filterEntriesByType = (entries, type) => 
  entries.filter(entry => entry.type === type);

const createCharacterSummary = (character) => ({
  name: character.name,
  level: character.level,
  class: character.class,
  race: character.race
});

// ✅ Good - Higher-order functions
const createValidator = (rules) => (data) => 
  rules.every(rule => rule(data));

const createRenderer = (template) => (data) => 
  template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');

// ❌ Avoid - Mutating functions
const badAddEntry = (entries, newEntry) => {
  entries.push(newEntry); // Mutates input
  return entries;
};

// ✅ Good - Pure function
const addEntry = (entries, newEntry) => [...entries, newEntry];
```

### Data Transformations

```javascript
// ✅ Good - Functional data processing
const processJournalEntries = (entries) => 
  entries
    .filter(entry => entry.title.trim().length > 0)
    .map(entry => ({
      ...entry,
      preview: stripHtml(entry.content).substring(0, 100),
      formattedDate: formatDate(entry.date)
    }))
    .sort((a, b) => b.created - a.created);

// ✅ Good - Composition
const pipe = (...functions) => (value) => 
  functions.reduce((acc, fn) => fn(acc), value);

const processCharacterData = pipe(
  validateCharacter,
  normalizeCharacter,
  addDerivedFields
);

// ✅ Good - Partial application
const createTagFilter = (tag) => (entries) => 
  entries.filter(entry => entry.tags.includes(tag));

const sessionFilter = createTagFilter('session');
const characterFilter = createTagFilter('character');
```

### DOM Manipulation

```javascript
// ✅ Good - Functional DOM helpers
const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') element.className = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else element.setAttribute(key, value);
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
};

// ✅ Good - Template functions
const createEntryCard = (entry) => createElement('div', {
  className: 'entry-card',
  onclick: () => editEntry(entry.id)
}, [
  createElement('h3', {}, [entry.title]),
  createElement('p', { className: 'entry-meta' }, [
    `${entry.type} • ${formatDate(entry.date)}`
  ]),
  createElement('p', { className: 'entry-preview' }, [entry.preview]),
  createElement('div', { className: 'tags' }, 
    entry.tags.map(tag => createElement('span', { className: 'tag' }, [tag]))
  )
]);

// ✅ Good - Functional rendering
const renderEntries = (entries, container) => {
  const entryElements = entries.map(createEntryCard);
  container.replaceChildren(...entryElements);
};
```

### State Management

```javascript
// ✅ Good - Immutable state updates
const updateSettings = (currentSettings, updates) => ({
  ...currentSettings,
  ...updates,
  preferences: {
    ...currentSettings.preferences,
    ...updates.preferences
  }
});

// ✅ Good - State selectors
const getCurrentCharacter = (state) => 
  state.characters[state.settings.currentCharacter];

const getRecentEntries = (state, limit = 10) => 
  Object.values(state.entries)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);

const getEntriesForCharacter = (state, characterId) => 
  Object.values(state.entries)
    .filter(entry => entry.characterId === characterId);

// ✅ Good - State reducers
const charactersReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_CHARACTER':
      return {
        ...state,
        [action.character.id]: action.character
      };
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        [action.id]: { ...state[action.id], ...action.updates }
      };
    case 'DELETE_CHARACTER':
      return Object.fromEntries(
        Object.entries(state).filter(([id]) => id !== action.id)
      );
    default:
      return state;
  }
};
```

### Error Handling

```javascript
// ✅ Good - Functional error handling
const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const validateAndSave = (data) => {
  const validation = validateCharacter(data);
  
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  const saved = saveCharacter(data);
  return { success: true, data: saved };
};

// ✅ Good - Maybe/Option pattern
const Maybe = {
  of: (value) => value != null ? { isSome: true, value } : { isSome: false },
  map: (maybe, fn) => maybe.isSome ? Maybe.of(fn(maybe.value)) : maybe,
  chain: (maybe, fn) => maybe.isSome ? fn(maybe.value) : maybe,
  getOrElse: (maybe, defaultValue) => maybe.isSome ? maybe.value : defaultValue
};

const getCharacterSafely = (id) => Maybe.of(storage.getCharacter(id));
```

### Event Handling

```javascript
// ✅ Good - Functional event handlers
const createEventHandler = (handler) => (event) => {
  event.preventDefault();
  return handler(event);
};

const handleFormSubmit = createEventHandler((event) => {
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  return saveEntry(data);
});

// ✅ Good - Event delegation
const createDelegatedHandler = (selector, handler) => (event) => {
  const target = event.target.closest(selector);
  if (target) handler(event, target);
};

const handleCardClick = createDelegatedHandler('.entry-card', (event, card) => {
  const entryId = card.dataset.entryId;
  navigateToEntry(entryId);
});
```

### Utility Functions

```javascript
// ✅ Good - Pure utility functions
const escapeHtml = (text) => 
  text.replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[match]);

const stripHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ✅ Good - Array utilities
const groupBy = (array, keyFn) =>
  array.reduce((groups, item) => {
    const key = keyFn(item);
    return {
      ...groups,
      [key]: [...(groups[key] || []), item]
    };
  }, {});

const unique = (array) => [...new Set(array)];

const chunk = (array, size) =>
  Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
```

## CSS Style

### Core Principles
1. **CSS Custom Properties**: Use CSS variables for theming
2. **Mobile-First**: Design for mobile, enhance for desktop
3. **Semantic Classes**: Use meaningful class names
4. **Minimal Frameworks**: Pure CSS, no external dependencies
5. **Progressive Enhancement**: Basic functionality works everywhere

### CSS Structure

```css
/* ✅ Good - CSS Custom Properties */
:root {
  /* Colors */
  --color-primary: #4a90e2;
  --color-secondary: #7b68ee;
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-text: #333333;
  --color-text-light: #666666;
  --color-border: #e1e5e9;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  
  /* Layout */
  --border-radius: 8px;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --max-width: 1200px;
}

/* ✅ Good - Utility Classes */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-sm { gap: var(--space-sm); }
.gap-md { gap: var(--space-md); }
.gap-lg { gap: var(--space-lg); }
```

### Component Styles

```css
/* ✅ Good - BEM-like naming for components */
.entry-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--color-primary);
}

.entry-card__title {
  color: var(--color-primary);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.entry-card__meta {
  color: var(--color-text-light);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-sm);
}

.entry-card__preview {
  margin-bottom: var(--space-sm);
  line-height: 1.5;
}

.entry-card__tags {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

/* ✅ Good - Responsive design */
.grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid--two-col {
    grid-template-columns: 2fr 1fr;
  }
  
  .grid--three-col {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ✅ Good - Form styles */
.form-group {
  margin-bottom: var(--space-md);
}

.form-label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.form-input--error {
  border-color: var(--color-error);
}

.form-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--space-xs);
}
```

### Animation & Interactions

```css
/* ✅ Good - Smooth transitions */
.button {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.button:hover:not(:disabled) {
  background: #357abd;
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.button:active {
  transform: translateY(0);
}

.button:disabled {
  background: var(--color-text-light);
  cursor: not-allowed;
  transform: none;
}

.button--secondary {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border);
}

.button--secondary:hover {
  background: var(--color-background);
}

/* ✅ Good - Loading states */
.loading {
  position: relative;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid transparent;
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ✅ Good - Notifications */
.notification {
  position: fixed;
  top: var(--space-md);
  right: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  background: var(--color-success);
  color: white;
  z-index: 1000;
  animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
  animation-fill-mode: both;
}

.notification--error {
  background: var(--color-error);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
```

## File Organization

### Recommended Structure
```
js/
├── utils/
│   ├── dom.js          # DOM manipulation utilities
│   ├── storage.js      # Local storage utilities
│   ├── validation.js   # Form validation
│   └── formatters.js   # Text formatting utilities
├── components/
│   ├── EntryCard.js    # Entry card component
│   ├── CharacterCard.js # Character card component
│   └── Modal.js        # Modal component
├── pages/
│   ├── Dashboard.js    # Dashboard functionality
│   ├── Journal.js      # Journal editor
│   ├── Character.js    # Character management
│   └── AIAssistant.js  # AI assistant
└── app.js              # Main application entry point

css/
├── base/
│   ├── reset.css       # CSS reset
│   ├── variables.css   # CSS custom properties
│   └── typography.css  # Typography styles
├── components/
│   ├── buttons.css     # Button styles
│   ├── forms.css       # Form styles
│   ├── cards.css       # Card styles
│   └── modals.css      # Modal styles
├── layout/
│   ├── grid.css        # Grid system
│   ├── header.css      # Header styles
│   └── navigation.css  # Navigation styles
└── main.css            # Main stylesheet (imports all others)
```

## Naming Conventions

### JavaScript
- **Functions**: `camelCase` - `getUserById`, `formatDate`
- **Constants**: `UPPER_SNAKE_CASE` - `API_ENDPOINT`, `MAX_ENTRIES`
- **Classes**: `PascalCase` - `StorageManager`, `AIAssistant`
- **Files**: `PascalCase` - `Dashboard.js`, `EntryCard.js`

### CSS
- **Classes**: `kebab-case` - `.entry-card`, `.form-input`
- **BEM modifiers**: `--modifier` - `.button--primary`, `.card--highlighted`
- **CSS Variables**: `--kebab-case` - `--color-primary`, `--space-md`
- **Files**: `kebab-case` - `entry-cards.css`, `form-styles.css`

## Best Practices Summary

### JavaScript
1. ✅ Use arrow functions for concise syntax
2. ✅ Prefer `const` over `let`, avoid `var`
3. ✅ Use template literals for string interpolation
4. ✅ Destructure objects and arrays when helpful
5. ✅ Use array methods (`map`, `filter`, `reduce`) over loops
6. ✅ Write pure functions without side effects
7. ✅ Handle errors gracefully with proper validation
8. ✅ Use meaningful variable and function names

### CSS
1. ✅ Use CSS custom properties for consistency
2. ✅ Follow mobile-first responsive design
3. ✅ Use semantic class names
4. ✅ Avoid !important declarations
5. ✅ Group related styles together
6. ✅ Use consistent spacing and sizing
7. ✅ Optimize for accessibility
8. ✅ Keep specificity low and manageable

This style guide ensures your D&D journal app remains simple, maintainable, and follows modern best practices while avoiding unnecessary complexity.