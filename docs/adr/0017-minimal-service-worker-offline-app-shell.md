# ADR-0017: Minimal Service Worker for Offline App-Shell

## Status
Accepted (2025-08-30)

## Context
Users installing the app to the home screen on iOS experienced occasional inability to open the app offline. We previously adopted a minimal PWA approach (ADR-0009) with no service worker, which meant offline availability depended on transient browser caches that iOS can purge unpredictably for standalone apps.

## Decision
Introduce a minimal service worker that precaches only first-party app-shell assets and uses a versioned cache name derived from deployment version info. Third-party assets (e.g., Google Fonts) are not precached to maintain simplicity and avoid cross-origin caching complexity.

## Rationale
- Ensures predictable offline startup for installed users
- Keeps implementation small and understandable
- Avoids complex runtime caching policies and cross-origin nuances
- Versioned cache provides deterministic updates on new deployments

## Consequences
### Positive
- App opens reliably offline (app shell available)
- Clear and deterministic cache invalidation via version bump
- Minimal code and operational overhead

### Negative
- Third-party assets may require network or fall back behavior
- Slight increase in project scope compared to ADR-0009

## Compliance
Required:
- Precache only first-party assets under the app origin
- Versioned cache name tied to deployment (run number + short commit)
- Clean up old caches on activate
- Cache-first strategy for app shell with safe network fallback

Forbidden:
- Precache or aggressively cache cross-origin assets
- Complex runtime routing or dependency-heavy tooling

## Implementation
- File: `sw.js` at site root, registered from `js/sw-register.js`
- Cache name: `app-cache-${runNumber}-${shortCommit}` (falls back to `dev` locally)
- Precached assets: HTML, CSS, first-party JS modules, manifest, icon
- Navigation requests: serve cached page or `/index.html` fallback
- Same-origin static requests: cache-first with runtime fill

## Revision History
- 2025-08-30: Initial adoption

