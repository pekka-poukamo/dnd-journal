# ADR-0009: Minimal PWA for iOS Installation

## Status
Accepted

## Context
Users want to install the D&D Journal app on their iOS devices for quick access from the home screen. Progressive Web App (PWA) technology enables web apps to be installed like native apps, but PWA implementations often add significant complexity with service workers, offline caching, push notifications, and complex icon systems.

The challenge is enabling iOS home screen installation while maintaining radical simplicity and compliance with existing ADRs.

## Decision
We will implement **minimal PWA capability** using only the essential files and meta tags required for iOS Safari installation. Originally this excluded service workers. This ADR is amended by ADR-0017 to include a minimal service worker solely for first-party app-shell offline availability, without additional PWA features.

## Rationale
### Benefits
- **User Experience**: Native app-like experience on iOS devices
- **Quick Access**: Home screen icon for instant app launch
- **Standalone Mode**: Removes Safari browser UI for cleaner interface
- **Professional Appearance**: Custom app icon instead of website screenshot

### Constraints Honored
- **ADR-0001 Compliance**: No frameworks, pure static files only
- **ADR-0002 Compliance**: No classes, no JavaScript logic, no mutations
- **ADR-0006 Compliance**: No build tools, direct file editing
- **ADR-0007 Compliance**: Minimal feature addition within boundaries
- **Radical Simplicity**: Under 25 lines of code total

## Implementation
### Files Added
```
manifest.json       # 15 lines - minimal web app manifest
favicon.svg         # 11 lines - single scalable icon
```

### HTML Changes (per page)
```html
<!-- PWA -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="D&D Journal">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="favicon.svg">
<link rel="apple-touch-icon" href="favicon.svg">
```

### Manifest Content (minimal)
```json
{
  "name": "D&D Journal",
  "short_name": "D&D Journal", 
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2c3e50",
  "icons": [{"src": "favicon.svg", "sizes": "any", "type": "image/svg+xml"}]
}
```

## Consequences
### Positive
- iOS users can install app to home screen
- App launches in standalone mode (no browser UI)
- Custom D&D-themed icon appears on home screen
- Zero impact on app performance or complexity
- No maintenance burden (static configuration only)
- Complies with all existing architectural constraints

### Negative
- No install prompts or advanced PWA features
- Android users must manually use browser "Install" option
- No push notifications or background sync

## Rejected Alternatives
### Full PWA Implementation
**Rejected**: Would violate ADR-0007 by adding:
- Service workers (complex caching logic)
- Install prompt JavaScript (classes and mutations) 
- Multiple icon files (build complexity)
- Offline functionality (feature creep)

### No PWA at All
**Rejected**: Users specifically requested iOS home screen installation capability, and the minimal implementation adds negligible complexity.

### iOS-Only Meta Tags
**Rejected**: Web app manifest is required for modern PWA compliance and adds only 15 lines.

## Compliance Verification
- ✅ **ADR-0001**: Uses only vanilla HTML/CSS/JSON
- ✅ **ADR-0002**: No JavaScript classes or mutations
- ✅ **ADR-0005**: No testable JavaScript code added
- ✅ **ADR-0006**: No build tools, static files only
- ✅ **ADR-0007**: Minimal feature within boundaries
- ✅ **ADR-0008**: Compatible with Surge.sh deployment

## Testing
Manual testing required:
1. Open website in iOS Safari
2. Tap Share → "Add to Home Screen"  
3. Verify custom icon appears
4. Launch from home screen
5. Confirm standalone mode (no Safari UI)

## Future Considerations
This implementation is intentionally minimal and complete. No additional PWA features should be added to maintain compliance with project constraints. Users seeking advanced PWA features should use a different application.

## Related ADRs
- ADR-0001: Vanilla JavaScript only
- ADR-0002: Functional programming only  
- ADR-0006: No build tools
- ADR-0007: Feature freeze boundaries