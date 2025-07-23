# ADR-0007: Feature Freeze Boundaries

## Status
Accepted

## Context
Feature creep is the enemy of simple software. AI agents especially tend to suggest "improvements" that add complexity. We need clear boundaries on what features are allowed.

## Decision
We establish **hard boundaries** on features that can never be added to this project.

## Rationale
- **Scope Control**: Prevents project from becoming bloated
- **AI Agent Guidance**: Clear rules for what not to suggest
- **Maintenance Burden**: Every feature adds maintenance cost
- **Simplicity Goal**: Matches the goal of radical simplicity
- **User Focus**: Keeps focus on core D&D journaling use case

## Consequences
### Positive
- Clear project scope and vision
- Prevents feature creep over time
- Maintains performance and simplicity
- Easy decision framework for new requests

### Negative
- May reject some genuinely useful features
- Could limit user customization options
- May not serve all possible use cases

## Compliance
**PERMANENTLY FORBIDDEN FEATURES:**
- Multiple character support
- Rich text editing (WYSIWYG editors)
- User authentication/accounts
- Real-time collaboration
- Advanced search functionality
- Complex filtering/sorting systems
- Themes beyond basic CSS variables
- Plugin/extension systems
- Import/export in multiple formats
- Backup/sync to cloud services
- Notifications/reminders
- Advanced form validation
- AI assistant integration
- Social features (sharing, comments)
- Analytics/tracking
- Print formatting
- Keyboard shortcuts
- Accessibility beyond semantic HTML
- Internationalization (i18n)
- Complex deployment pipelines (beyond Surge.sh)
- Container-based deployment (Docker, Kubernetes)
- Server-side rendering or hosting

**ALLOWED ADDITIONS (if needed):**
- Basic bug fixes
- Performance optimizations that don't add complexity
- Minor UI polish within existing CSS structure
- Additional test coverage
- Basic settings/preferences for AI configuration (minimal, essential settings only)

## Implementation
- Any suggestion for forbidden features should be immediately rejected
- Reference this ADR when declining feature requests
- Keep a copy of this list in the style guide
- Regular reviews to ensure compliance

**Exception Process:**
None. These boundaries are permanent to maintain project integrity.

## Revision History

### 2024-12-19: Allow Basic Settings
**Rationale:** The AI features require API key storage and basic configuration. A minimal settings interface is essential for:
- OpenAI API key configuration
- Enabling/disabling AI features
- Data export/import for backup

**Constraints:** Settings must remain minimal and focused solely on essential configuration. No themes, customization, or complex preferences beyond AI configuration and data management.
