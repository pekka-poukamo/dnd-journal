# UI Implementation Plan (Days A–I)

## Day A: Routing and shells
- Add Chronicle route/view shell (`chronicle.html`) mirroring tabs and imports.
- Add Part view shell (`part.html`) with back link placeholder.
- Update tabs on all pages to include Chronicle.

## Day B: Entry component extraction
- Build `js/components/entry-item.js` and `css/components/entry-item.css`.
- Refactor Journal to use the component; maintain placeholders and actions.
- Unit tests for component rendering and actions.

## Day C: Chronicle basics
- `js/chronicle.js`: render expandable `soFarSummary` from `chronicle.soFarSummary`.
- Render Parts list from `chronicle.parts` with number, title, time span, and link to Part.
- Empty/loading states.

## Day D: Part page basics
- `js/part.js`: render header (Part N + title), summary, and entries list using entry component (collapsible entries).
- Back to Chronicle navigation; deep-link support.

## Day E: Recent summary controls
- Chronicle: render `recentSummary` under So Far (expandable).
- Add "Regenerate Recent" button; refresh only `recentSummary`.

## Day F: Part titles generation
- On part close/backfill, generate and set `chronicle.parts[n].title` once.
- Fallback to "Part N" if missing.

## Day G: UX polish
- Copy-to-clipboard for So Far / Recent.
- Expand/collapse accessibility, keyboard navigation.
- Skeleton loaders; mobile/desktop layout refinements.

## Day H: Backfill and edge cases
- On Chronicle/Part load, lazy backfill missing summaries/titles.
- Handle 0 parts, small journals, and very large lists (virtualization if needed).

## Day I: Cleanup and regression pass
- Ensure Journal has no summaries.
- Remove legacy summary UI and dead code.
- Final integration tests across pages and navigation.