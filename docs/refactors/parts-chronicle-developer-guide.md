# Parts & Chronicle Developer Guide

## Overview
This guide explains the Parts Chronicle model, data structures, invariants, and integration points.

## Data Model (Yjs)
- chronicle (Y.Map)
  - parts (Y.Map<number → Y.Map>)
    - title: string
    - summary: string (~1000 words)
    - entries: Y.Array<string> (entry IDs)
    - createdAt?: number
  - latestPartIndex: number
  - soFarSummary: string (~1000 words)
  - recentSummary: string (~1000 words)

## Lifecycle
- maybeCloseOpenPart: closes parts when entry count crosses threshold; persists entries, summary, title, and updates latestPartIndex.
- recomputeRecentSummary: updates recentSummary for the open part.
- backfillPartsIfMissing: lazy generation on page load for missing parts/so-far/recent.

## UI Integration
- Journal: entries only (via components/entry-item.js)
- Chronicle (js/chronicle.js): shows soFarSummary, recentSummary, and parts list; regenerate recent.
- Part (js/part.js): shows part title, summary, and associated entries.

## Invariants
- Closed parts are immutable.
- Only soFarSummary and recentSummary are overwritten.
- Part summaries use full raw entry text.

## Prompts
- Part summary/title use summarize() with PROMPTS.partTitle and PROMPTS.adventureSummary (budget ~1000 words for summaries).

## Persistence
- Yjs local: IndexedDB (client) via y-indexeddb; optional sync: y-websocket; server: y-leveldb compatible.

## Testing
- Unit tests cover partitioning, part closure, backfill, and Chronicle/Part rendering.

## References
- js/parts.js, js/chronicle.js, js/part.js
- docs/refactors/parts-phases.md