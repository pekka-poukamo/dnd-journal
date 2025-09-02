# ADR-0019: Parts Chronicle Addendum

## Status
Accepted

## Context
We refactored the journal to follow a book metaphor:
- Entries are chapters.
- Closed collections of chapters are Parts (immutable after closure).
- The Chronicle view presents: Adventure So Far (combined closed parts), Recent Adventures (open part), and a Parts list.

We also moved from flat colon-keyed summaries to an object-based Yjs structure under `chronicle` to enable iteration and cohesive rendering.

## Decision
- Adopt `chronicle` Y.Map with:
  - `parts` (Y.Map<number → Y.Map>) per part: `{ title: string, summary: string, entries: Y.Array<string>, createdAt?: number }`
  - `latestPartIndex` (number)
  - `soFarSummary` (string)
  - `recentSummary` (string)
- Close parts deterministically based on `PART_SIZE_DEFAULT` and persist membership (`entries`) once.
- Generate per-part summary (~1000 words) from full entry text, generate a concise title once.
- Compute `soFarSummary` from concatenated closed part summaries (~1000 words).
- Compute `recentSummary` from current open part (~1000 words) and overwrite on entry changes.
- UI: Journal shows entries only; Chronicle shows So Far, Recent, and Parts; Part page shows title, summary, and entries.

## Consequences
- Stable closed parts: never edited after creation.
- Predictable iteration and rendering via object/array structure.
- Reduced prompt cost via cached summaries; only `recentSummary` recomputes on changes.
- Legacy meta/“adventure summary” on Journal removed.

## Invariants
- Closed parts immutable after closure.
- Only `soFarSummary` and `recentSummary` are overwritten.
- Part summaries use full raw entry text, not per-entry summaries.

## Rationale
- Yjs objects improve renderability and cohesion while preserving local-first guarantees.
- Clear separation of stable (parts) and dynamic (recent) reduces churn and simplifies prompts.

## References
- js/parts.js, js/chronicle.js, js/part.js, js/components/entry-item.js
- docs/refactors/parts-phases.md
- docs/refactors/ui-chronicle-and-entry-component.md