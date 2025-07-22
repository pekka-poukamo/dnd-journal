# ADR-0003: Single HTML File Architecture

## Status
Accepted

## Context
Web applications can be structured as multi-page applications, single-page applications with routing, or simple single-file applications. We need to choose the appropriate architecture.

## Decision
We will use a **single HTML file** that contains the complete application.

## Rationale
- **Simplicity**: One file to rule them all
- **Deployment**: No server configuration needed
- **Offline**: Works completely offline by default
- **No Routing**: Eliminates complex state management
- **AI Agent Prevention**: Stops agents from adding routing libraries
- **Performance**: No additional HTTP requests
- **Portability**: Can be saved and shared as one file

## Consequences
### Positive
- Extremely simple deployment (just copy one file)
- Works on any web server or local filesystem
- No JavaScript routing complexity
- Perfect for the simple use case

### Negative
- Limited scalability for complex applications
- All features must fit in one view
- No deep linking to specific states

## Compliance
**Forbidden additions:**
- Multiple HTML pages
- Client-side routing (React Router, Vue Router, etc.)
- Hash-based routing
- History API routing
- Modal systems that simulate pages

**Required approach:**
- All functionality in `index.html`
- Use CSS `display: none/block` for showing/hiding sections
- Simple state-based UI updates

## Implementation
- Single `index.html` with embedded CSS and JS references
- All UI states handled by showing/hiding elements
- No navigation beyond scrolling
- Keep everything visible and accessible
