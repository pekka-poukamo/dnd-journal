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

## Colon-Keyed Storage vs. Objects/Arrays in Yjs

### What we use now
- Flat, colon-keyed entries in a `summariesMap` (Y.Map):
  - `journal:part:<n>` → part summary (string)
  - `journal:part:<n>:entries` → JSON array of entry IDs (stringified)
  - `journal:part:<n>:title` → part title (string)
  - `journal:parts:latest` → latest closed index (stringified number)
  - `journal:parts:so-far:latest` → combined summary (string)
  - `journal:recent-summary` → open-part summary (string)

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

### Alternative: nested objects/arrays in Yjs
- Store a `Y.Map` → `parts` where each `n` maps to a `Y.Map` with `{ title, entries (Y.Array), summary }`.
- Pros:
  - Stronger cohesion: part data co-located; easier to iterate related fields.
  - Clearer typing if you model arrays/maps natively (less stringification).
- Cons:
  - Heavier reads/writes: materializing nested structures to access a single field.
  - Migration friction: restructuring nested CRDTs is more complex than adding keys.
  - Conflict complexity: concurrent edits in nested structures need more careful merge semantics.

### Recommendation
- Keep colon-keyed flat storage for immutable, independently readable items (part summary, title, entries membership, so-far, recent).
- Consider a lightweight index key (e.g., `journal:parts:index` → `[1,2,...]`) if listing/scanning becomes a hotspot.
- If we later need richer mutable part metadata, we can introduce a nested `Y.Map` per part while keeping read-heavy artifacts (summary, so-far) as flat keys.