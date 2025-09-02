# UI Plan: Chronicle, Part Pages, and Reusable Entry Component

## Chronicle Page
- Header: "Campaign Chronicle".
- Top expandable panel: "Adventure So Far" (from `journal:parts:so-far:latest`).
- Parts list (read-only): Part N + Title, time span (from first/last entry timestamps via `journal:part:<n>:entries`), and "View Part" link.
- Interactions: So Far expands/collapses; clicking a Part navigates to the Part page.
- States: Empty (no parts), lightweight loading skeletons.

## Part Page (per Part)
- Header: "Part N: Title".
- Summary card: `journal:part:<n>` (~1000 words).
- Entries section: all entries in this part (from `journal:part:<n>:entries`).
  - Each entry collapsible by default; expand per entry.
  - Optional: show timestamp metadata.
- Footer: "Back to Chronicle" navigation.
- Titles: generate once, cache to `journal:part:<n>:title`; fallback "Part N" if missing.

## Journal Page (entries only)
- Entries feed only; no summaries.
- Adding entries still triggers background maintenance (close part, recompute recent), but UI remains focused on entries.

## Reusable Entry Component
- Location: `js/components/entry-item.js`, styles in `css/components/entry-item.css`.
- Props:
  - Data: `{ id, title?, subtitle?, content, timestamp }`.
  - Flags: `{ collapsible = true, collapsedByDefault = true, showActions = false }`.
  - Callbacks: `{ onEdit?, onDelete?, onExpandToggle? }`.
- Behavior:
  - Renders title/subtitle/timestamp.
  - Parses markdown for `content`.
  - Optional expand/collapse; accessible with aria-expanded, keyboard support.
  - Optional actions (Edit/Delete), wired to callbacks.
- Reuse:
  - Journal page: `showActions = true`, collapse optional.
  - Part page: `showActions = false`, collapsible entries.

## Navigation and Routing
- Chronicle view: `/chronicle`.
- Part view: `/chronicle/part/:n`.
- Back link from Part to Chronicle; support deep links.

## Accessibility & Performance
- Proper headings/landmarks; keyboard navigable controls.
- Lazy-load large entry bodies on expand; virtualize long part lists if needed.
- Never block on AI; render cached summaries immediately.

## Testing Strategy
- Unit: Entry component rendering, toggling, actions.
- Integration: Chronicle and Part pages render correct data; adding entries updates boundaries and Part list.
- Contract: Journal has no summaries; Chronicle So Far is expandable; Part page immutably shows closed part content.

---

## Data Model Shift: Objects/Arrays in Yjs (render-friendly)

### New structure
- `chronicle` (Y.Map)
  - `parts` (Y.Map<number → Y.Map>): per part `{ title: string, summary: string, entries: Y.Array<string>, createdAt: number }`
  - `latestPartIndex` (number)
  - `soFarSummary` (string)
  - `recentSummary` (string)

### Why colon keys?
- Pros:
  - Simple addressing: single Y.Map, predictable string keys; easy to fetch/update without nested structures.
  - Incremental reads: access a specific item without materializing a whole object graph.
  - Low coupling: feature additions are just new keys; no schema migrations.
  - Conflict handling: last-writer-wins at key level is clear and sufficient for immutable parts.
  - Serialization: values are plain strings; safe across y-indexeddb/y-leveldb.
- Cons:
  - Discoverability: must know/agree on key naming conventions (document this well).
  - Grouping overhead: listing all parts requires scanning keys or maintaining an index.
  - Type safety: values are strings; JSON encoding/decoding is caller’s responsibility.

### Recommendation
- Adopt the object/array structure above for Chronicle rendering and part management.
- Keep immutable behavior: closed parts never edited; only `recentSummary` and `soFarSummary` overwritten.