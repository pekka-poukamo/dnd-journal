# ADR Alignment Remediation Plan (Temporary)

This document phases the agreed recommendations to align the codebase with ADRs and the style guide. Each phase lists concrete actions and lightweight acceptance criteria.

## Phase 1 — Critical security and ADR compliance

- Fix XSS risk in `parseMarkdown` — Completed
  - Replace current regex-only approach with either input escaping before formatting, or an allowlist sanitizer for output prior to `innerHTML` usage.
  - Acceptance: unit tests prove malicious input (e.g., `<img onerror=...>`, `<script>`) is rendered inert; legitimate markdown still renders.

- Enforce ADR-0015 view-logic separation — Completed
  - Remove state/service imports from view modules (e.g., `journal-views.js` must not import `yjs.js` or call `summarization.js`).
  - Move summarization orchestration into `journal.js`; pass data into views and render pure elements only.
  - Ensure logic modules do not perform DOM creation/append directly; views return elements and/or accept containers plus callbacks.
  - Acceptance: views import only UI/util helpers; grep-based test forbids `yjs`, `summarization`, `ai`, or `fetch` in view files.

- Remove inline styles from HTML — Completed
  - Replace all `style="..."` in `index.html`, `settings.html`, `chronicle.html`, `character.html` with CSS classes.
  - Add minimal utility classes (e.g., `.is-hidden`, `.flex-row`) and toggle via classList in views.
  - Acceptance: grep shows zero `style="` in HTML; UI behavior unchanged.

## Phase 2 — Simplification and deduplication

- Centralize AI request logic — Completed
  - Create a tiny `ai-request.js` helper for OpenAI calls (headers, model, error parsing) used by both `ai.js` and `summarization.js`.
  - Acceptance: no duplicated fetch code; both modules import the helper; tests pass.

- Re-home UI-only helpers — Completed
  - Move `showNotification` out of `utils.js` into a UI module (e.g., `js/components/notifications.js`). Keep `utils.js` purely non-DOM.
  - Acceptance: `utils.js` contains no DOM usage; notifications still work; tests updated.

- Split oversized view module(s) — Completed
  - Break `journal-views.js` into focused modules: `entry-form`, `entry-list/item`, `entry-summary`, `ai-prompt`.
  - Acceptance: clearer imports, unchanged UI, module sizes reasonable.

- Clean up deployment/tooling drift — Completed
  - Remove `surge` from `package.json` if no longer used (ADR-0008 superseded by ADR-0018). Update README accordingly.
  - Acceptance: scripts still run; docs reflect Pi git-push deployment.

- Small correctness/product polish — Completed
  - Improve `generateId()` uniqueness (timestamp + random/counter).
  - Make `formatDate` locale-aware (browser locale or a setting).
  - Acceptance: tests cover ID uniqueness within a tight loop; date formatting follows selected locale.

## Phase 3 — Tests, guardrails, performance polish

- Security tests for markdown
  - Add tests ensuring escaping/sanitization holds for common payloads and nested markdown structures.

- ADR-0015 enforcement tests
  - Add test(s) that fail if view modules import forbidden modules or perform network calls.
  - Add test(s) that fail on inline styles in HTML.

- Preload and SW tuning
  - Review `link rel="modulepreload"` list; keep only critical paths.
  - Validate SW strategies with tests: navigation cache-first fallback, script/style network-first, default cache-first.

- Navigation cache validation
  - Re-check TTL and versioning; ensure cache is not used as persistence and gracefully degrades if unavailable.
  - Add tests for expiry, version mismatch, and disabled cache path.

## Phase 4 — Documentation and maintainability

- Document architectural boundaries — Partially Completed
  - Update `STYLE_GUIDE.md` and/or ADR-0015 with a concise "view purity" checklist and examples.
  - Add a dev note on where UI helpers (notifications) live and how logic interacts with views.

- Configuration quality-of-life
  - Consider exposing `PART_SIZE_DEFAULT` via settings (optional).
  - Audit import map and preloads for unused entries; prune to reduce noise.

- Simple CI guardrails (no bundlers)
  - Add scripted checks (Node/grep) to enforce: no `style=`, no `class` or `this` where forbidden, no `localStorage`, and view-module import boundaries.
  - Wire into `npm test` so pushes to Pi (ADR-0018) run the checks.

---

### Tracking and success
- Each bullet above should have a small accompanying test or grep-based check.
- Ship Phase 1 as a single PR; subsequent phases can be incremental.