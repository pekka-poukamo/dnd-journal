# Parts Refactor: Phased Rollout Plan

## Phase 1: Foundations (no behavior change)
- Add `js/parts.js` with partitioning and key helpers (no side effects).
- Keep existing context behavior (older entries + last 5 recent).
- Unit tests for partitioning and key helpers.

## Phase 2: Summarization building blocks
- Implement stable part closing with stored membership `journal:part:<n>:entries`.
- Summarize closed part from full entry text to `journal:part:<n>` (~1000 words).
- Compute/overwrite `journal:parts:so-far:latest` (~1000 words) when a part closes.
- Build `journal:recent-summary` (~1000 words) for the open part; clear on entry changes.

## Phase 3: Context integration (no flags)
- Update context builder to use: character summaries + so-far summary + recent summary only.
- Remove old “older vs last 5 recent” split and fallback to entries.
- Integration tests for question generation path.

## Phase 4: Backfill and migration
- Lazy backfill on access: generate missing part summaries and latest so‑far as needed.
- Ensure idempotent across devices.
- Handle journals with 0, < partSize, and multiple parts.

## Phase 5: UI implementation (object-based model)
- Data model change: use Yjs objects (Y.Map/Y.Array) under `chronicle`:
  - `chronicle.parts` (Y.Map<number → Y.Map>) with `{ title, summary, entries (Y.Array), createdAt }`
  - `chronicle.latestPartIndex` (number)
  - `chronicle.soFarSummary` (string), `chronicle.recentSummary` (string)
- Chronicle page: Parts list + expandable So Far; "Regenerate Recent" only.
- Part page: Part N + Title, summary, entries (collapsible), Back to Chronicle.
- Journal page: entries only; no summaries.

## Phase 6: Documentation and cleanup
- Developer docs + ADR addendum describing parts model, keys, and invariants.
- UI retains existing “Remove summaries” action; no change needed.

## Key Invariants
- Closed parts are immutable: `journal:part:<n>` and `journal:part:<n>:entries` never change.
- Only `journal:parts:so-far:latest` and `journal:recent-summary` are overwritten.
- Part summaries use full entry text (not per-entry summaries).

## Phase 7: Legacy cleanup
- Remove unused legacy code paths for old “adventure summary” and meta summaries.
- Delete deprecated prompt variants not used by parts/so‑far/recent.
- Prune tests tied to legacy paths; retain high-signal coverage for parts flow.