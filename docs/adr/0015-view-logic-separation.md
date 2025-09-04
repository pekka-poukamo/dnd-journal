# ADR-0015: View-Logic Separation Architecture

## Status
Accepted

## Context
The D&D Journal application has evolved to include multiple pages (journal, character, settings) with complex interactions between data management and user interface rendering. We need to establish clear architectural boundaries between business logic and presentation layer to maintain code clarity, testability, and adherence to our functional programming principles.

The codebase has naturally developed a pattern where each functional area has two modules:
- Logic modules (e.g., `journal.js`, `character.js`, `settings.js`) handling state management, data operations, and event coordination
- View modules (e.g., `journal-views.js`, `character-views.js`, `settings-views.js`) containing pure rendering functions

## Decision
We will formalize the **View-Logic Separation Architecture** as a mandatory pattern for all functional modules in the application.

## Rationale
- **Functional Programming Compliance**: Aligns with ADR-0002 by promoting pure functions and clear data flow
- **Testability**: Logic and rendering can be tested independently with different strategies
- **Maintainability**: Clear separation makes code easier to understand and modify
- **Radical Simplicity**: Each module has a single, clear responsibility (ADR-0013)
- **Reusability**: Pure rendering functions can be reused across different contexts
- **Debugging**: Issues can be isolated to either data/logic or presentation concerns
- **AI Agent Guidance**: Provides clear structure for automated code generation and modification

## Architecture Pattern

### Module Pairs Structure
Each functional area must be implemented as two separate ES6 modules:

1. **Logic Module** (`{feature}.js`):
   - Page initialization and state management
   - Event handling and user interaction coordination
   - Data validation and business rules
   - Integration with Y.js state and external services
   - Error handling and notification triggering

2. **View Module** (`{feature}-views.js`):
   - Pure rendering functions that accept data and return DOM elements
   - Form creation and UI component generation
   - Utility functions for DOM manipulation
   - Visual state transformations (showing/hiding elements)

### Data Flow Pattern
```
User Interaction → Logic Module → Y.js State → Logic Module → View Module → DOM
```

### Import Direction
- Logic modules import from view modules (never the reverse)
- View modules should not import logic modules or state management
- Both can import shared utilities

## Consequences

### Positive
- Clear separation of concerns between data and presentation
- Each module type can be tested with appropriate strategies
- Rendering functions are easily unit testable with mock data
- Logic functions focus purely on state management and coordination
- Compliance with functional programming principles
- Easier to reason about application flow

### Negative
- Requires more files (2 per functional area)
- May require passing more parameters between functions
- Developers must understand and maintain the separation discipline

## Compliance

### Logic Module Requirements
**Filename**: `{feature}.js`

**Responsibilities** (Required):
- Page initialization functions (`init{Feature}Page`)
- State management and Y.js integration
- Event handler setup and coordination
- Data validation and business rule enforcement
- Error handling and user notification
- Integration with external services (AI, storage)

**Exports** (Required patterns):
```javascript
export const init{Feature}Page = async (stateParam = null) => { /* */ };
export const render{Feature}Page = (stateParam = null) => { /* */ };
export const handle{Action} = (data, stateParam = null) => { /* */ };
```

**Forbidden**:
- Direct DOM element creation or manipulation
- HTML string generation
- CSS class assignment or styling
- Any rendering logic

### View Module Requirements
**Filename**: `{feature}-views.js`

**Responsibilities** (Required):
- Pure rendering functions that accept data and return DOM elements
- Form and component creation functions
- UI utility functions (notifications, form data extraction)
- Visual transformations and display logic

**Exports** (Required patterns):
```javascript
export const render{Component} = (container, data, options = {}) => { /* */ };
export const create{Element} = (data, callbacks = {}) => { /* */ };
export const show{Notification} = (message, type = 'info') => { /* */ };
```

**Function Characteristics** (Required):
- All rendering functions must be pure (no side effects)
- Accept all required data as parameters
- Return DOM elements or modify provided containers only
- Use callbacks for user interactions (passed from logic modules)

**Forbidden**:
- Direct state management or Y.js calls
- Business logic or data validation
- Direct API calls or external service integration
- Event handler implementation (callbacks only)

### Shared Patterns
Both modules must:
- Use ES6 module exports exclusively (ADR-0010)
- Follow functional programming patterns (ADR-0002)
- Maintain radical simplicity (ADR-0013)
- Include comprehensive test coverage (ADR-0005)

## Implementation Examples

### Logic Module Pattern
```javascript
// js/example.js
import { getYjsState, updateData } from './yjs.js';
import { renderExampleForm, showNotification } from './example-views.js';

export const initExamplePage = async (stateParam = null) => {
  const state = stateParam || getYjsState();
  setupFormHandlers();
  renderExamplePage(state);
};

export const handleSaveData = (formData, stateParam = null) => {
  try {
    const state = stateParam || getYjsState();
    updateData(state, formData);
    showNotification('Data saved!', 'success');
  } catch (error) {
    showNotification('Failed to save', 'error');
  }
};
```

### View Module Pattern
```javascript
// js/example-views.js
export const renderExampleForm = (container, data, callbacks = {}) => {
  const form = document.createElement('form');
  // ... form creation logic
  form.onsubmit = (e) => {
    e.preventDefault();
    if (callbacks.onSubmit) {
      callbacks.onSubmit(getFormData(form));
    }
  };
  container.appendChild(form);
};

export const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
};
```

## Migration Guidelines
For existing modules that don't follow this pattern:
1. Identify rendering code in logic modules
2. Extract to new `{feature}-views.js` module
3. Convert to pure functions accepting data parameters
4. Update logic module to import and call view functions
5. Ensure all tests still pass

## Exceptions
The only acceptable exceptions are:
1. Pure utility modules (`utils.js`) that contain no domain logic
2. Integration modules (`yjs.js`) that handle cross-cutting concerns
3. Single-purpose modules under 50 lines that have no logical division

## Relationship to Other ADRs
This ADR builds upon and enforces:
- **ADR-0002**: Functional programming with pure functions
- **ADR-0010**: ES6 modules for clear import boundaries
- **ADR-0013**: Radical simplicity through single responsibility
- **ADR-0005**: Comprehensive testing enabled by separation

**This pattern is mandatory for all new functional modules and should be applied during any significant refactoring of existing modules.**

## Quick Checklist for View Purity

- Inputs only: receive all data via parameters; no global state access
- Outputs only: return elements or update provided containers
- No imports from state/service modules (Yjs, AI orchestration)
- No network calls in views
- Logic modules own data flow, validation, and side effects