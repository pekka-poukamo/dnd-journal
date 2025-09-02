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
- Update context builder to use: character summaries + `journal:parts:so-far:latest` + `journal:recent-summary`.
- Remove old “older vs last 5 recent” split.
- Integration tests for question generation path.

## Phase 4: Backfill and migration
- Lazy backfill on access: generate missing part summaries and latest so‑far as needed.
- Ensure idempotent across devices (Yjs last-writer-wins for simple keys).
- Handle journals with 0, < partSize, and multiple parts.

## Phase 5: UI implementation
- Add read-only views for Parts list (Part 1, Part 2, …) and “Adventure so far”.
- Show latest so‑far summary and current recent summary in journal UI.
- Do not allow regenerating closed parts; allow regenerating recent only.

## Phase 6: Documentation and cleanup
- Developer docs + ADR addendum describing parts model, keys, and invariants.
- UI retains existing “Remove summaries” action; no change needed.

## Key Invariants
- Closed parts are immutable: `journal:part:<n>` and `journal:part:<n>:entries` never change.
- Only `journal:parts:so-far:latest` and `journal:recent-summary` are overwritten.
- Part summaries use full entry text (not per-entry summaries).