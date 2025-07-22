# ADR-0001: Use Vanilla JavaScript Only

## Status
Accepted

## Context
Modern web development often defaults to using frameworks like React, Vue, or Angular. For this D&D Journal project, we need to decide on the technology stack.

## Decision
We will use **vanilla JavaScript only** with no frameworks, libraries, or build tools.

## Rationale
- **Simplicity**: Framework-free code is easier to understand and debug
- **Zero dependencies**: No package vulnerabilities or breaking changes
- **Performance**: No framework overhead, faster load times
- **Longevity**: Vanilla JS doesn't become obsolete like frameworks do
- **AI Agent Control**: Prevents agents from suggesting framework migrations
- **Educational Value**: Forces understanding of core web APIs
- **Size**: Keeps the entire app under 200 lines of JS

## Consequences
### Positive
- Fast loading and execution
- No build step required
- Easy to deploy anywhere
- Simple debugging
- Future-proof codebase

### Negative  
- More verbose DOM manipulation
- No component abstractions
- Manual state management
- Some repetitive code

## Compliance
Any suggestion to add React, Vue, Angular, Svelte, or any JavaScript framework **must be rejected**.

## Implementation
- Use `document.createElement()` for DOM manipulation
- Use native event listeners
- Use functional programming patterns for organization
- Keep all logic in pure functions
