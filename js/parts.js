// Parts - Partitioning logic and key helpers for journal parts
// Focused utilities with no side effects

import { getYjsState, getSummary, setSummary, getEntries } from './yjs.js';
import { 
  ensureChronicleStructure,
  getChroniclePartsMap,
  setChronicleSoFarSummary,
  setChronicleRecentSummary,
  setChronicleLatestPartIndex,
  setChroniclePartTitle,
  setChroniclePartSummary,
  setChroniclePartEntries
} from './chronicle-state.js';
import { summarize } from './summarization.js';
import { PROMPTS } from './prompts.js';

export const PART_SIZE_DEFAULT = 20;

// Partition entries into closed parts of size `partSize` and an open remainder
export const partitionEntries = (entries, partSize = PART_SIZE_DEFAULT) => {
  const total = Array.isArray(entries) ? entries.length : 0;
  const numClosedParts = Math.floor(total / partSize);
  const closedParts = [];
  for (let i = 0; i < numClosedParts; i++) {
    const start = i * partSize;
    const end = start + partSize;
    closedParts.push(entries.slice(start, end));
  }
  const openPart = entries.slice(numClosedParts * partSize);
  return { closedParts, openPart };
};

// Key helpers
export const getPartSummaryKey = (partIndex) => `journal:part:${partIndex}`;
export const getPartEntriesKey = (partIndex) => `journal:part:${partIndex}:entries`;
export const PARTS_LATEST_KEY = 'journal:parts:latest';
export const SO_FAR_LATEST_KEY = 'journal:parts:so-far:latest';
export const RECENT_SUMMARY_KEY = 'journal:recent-summary';

// Latest closed part helpers (stored as strings for Yjs summariesMap compatibility)
export const getLatestClosedPartIndex = (state) => {
  const raw = getSummary(state, PARTS_LATEST_KEY);
  const parsed = parseInt(raw ?? '0', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const setLatestClosedPartIndex = (state, index) => {
  const normalized = Number.isFinite(index) && index > 0 ? String(Math.floor(index)) : '0';
  setSummary(state, PARTS_LATEST_KEY, normalized);
};

// Persist a closed part's membership list (entry IDs) once, if not already set
export const persistPartMembership = (state, partIndex, entryIds) => {
  const parts = getChroniclePartsMap(state);
  const existing = parts.get(String(partIndex));
  if (!existing || !existing.get('entries')) {
    setChroniclePartEntries(state, partIndex, entryIds);
  }
};

// Build full text for a set of entries by IDs (uses raw content only)
export const buildFullTextForEntryIds = (state, entryIds) => {
  const entries = getEntries(state);
  const idToEntry = new Map(entries.map(e => [e.id, e]));
  const parts = [];
  for (const id of entryIds) {
    const entry = idToEntry.get(id);
    if (entry && entry.content) {
      parts.push(entry.content);
    }
  }
  return parts.join('\n\n');
};

// Close current open part if it has reached partSize; generate part summary and update indexes
export const maybeCloseOpenPart = async (state, partSize = PART_SIZE_DEFAULT) => {
  const entries = getEntries(state);
  const total = entries.length;
  if (total === 0) return false;

  const expectedClosedParts = Math.floor(total / partSize);
  const latestClosed = ensureChronicleStructure(state).get('latestPartIndex') || 0;
  if (expectedClosedParts <= latestClosed) return false; // nothing new to close

  // Close all missing parts up to expectedClosedParts (handles bulk imports)
  for (let partIndex = latestClosed + 1; partIndex <= expectedClosedParts; partIndex++) {
    const start = (partIndex - 1) * partSize;
    const end = start + partSize;
    const partEntries = entries.slice(start, end);
    const ids = partEntries.map(e => e.id);

    // Persist membership (idempotent)
    persistPartMembership(state, partIndex, ids);

    // Generate part summary (~1000 words) from full raw text
    const fullText = partEntries.map(e => e.content).join('\n\n');
    const partSummaryKey = getPartSummaryKey(partIndex);
    const partSummary = await summarize(partSummaryKey, fullText, 1000).catch(() => '');
    if (partSummary) setChroniclePartSummary(state, partIndex, partSummary);

    // Generate part title once if missing (short, evocative)
    const titlePrompt = PROMPTS.partTitle(fullText);
    const titleKey = `journal:part:${partIndex}:title-gen`;
    const title = await summarize(titleKey, titlePrompt, 50).catch(() => null);
    if (title && typeof title === 'string') setChroniclePartTitle(state, partIndex, title);

    // Update latest index
    setChronicleLatestPartIndex(state, partIndex);
  }

  // Recompute so-far latest by concatenating all closed part summaries
  const parts = getChroniclePartsMap(state);
  const allSummaries = [];
  for (let i = 1; i <= expectedClosedParts; i++) {
    const p = parts.get(String(i));
    const s = p && p.get('summary');
    if (s) allSummaries.push(s);
  }
  const combined = allSummaries.join('\n\n');
  const soFar = await summarize(SO_FAR_LATEST_KEY, combined, 1000).catch(() => '');
  if (soFar) setChronicleSoFarSummary(state, soFar);

  return true;
};

// Recompute recent summary for the current open part
const defaultRecomputeRecentSummaryImpl = async (state, partSize = PART_SIZE_DEFAULT) => {
  const entries = getEntries(state);
  const total = entries.length;
  const numClosedParts = Math.floor(total / partSize);
  const openPart = entries.slice(numClosedParts * partSize);
  const fullText = openPart.map(e => e.content).join('\n\n');
  const recent = await summarize(RECENT_SUMMARY_KEY, fullText, 1000).catch(() => '');
  if (recent) setChronicleRecentSummary(state, recent);
};

export const setRecomputeRecentSummaryImpl = (fn) => {
  if (typeof fn === 'function') {
    recomputeRecentSummaryImpl = fn;
  } else {
    recomputeRecentSummaryImpl = defaultRecomputeRecentSummaryImpl;
  }
};

export const recomputeRecentSummary = async (state, partSize = PART_SIZE_DEFAULT) => {
  return recomputeRecentSummaryImpl(state, partSize);
};

let recomputeRecentSummaryImpl = defaultRecomputeRecentSummaryImpl;

// Backfill: ensure part summaries and so-far exist for current entries
export const backfillPartsIfMissing = async (state, partSize = PART_SIZE_DEFAULT) => {
  const entries = getEntries(state);
  const total = entries.length;
  if (total === 0) return;

  // Determine how many parts should exist
  const expectedClosedParts = Math.floor(total / partSize);
  const latestClosed = ensureChronicleStructure(state).get('latestPartIndex') || 0;

  // Create any missing closed parts first
  let createdAny = false;
  for (let partIndex = latestClosed + 1; partIndex <= expectedClosedParts; partIndex++) {
    const start = (partIndex - 1) * partSize;
    const end = start + partSize;
    const partEntries = entries.slice(start, end);
    const ids = partEntries.map(e => e.id);
    persistPartMembership(state, partIndex, ids);
    const fullText = partEntries.map(e => e.content).join('\n\n');
    const summary = await summarize(getPartSummaryKey(partIndex), fullText, 1000).catch(() => '');
    if (summary) setChroniclePartSummary(state, partIndex, summary);
    setChronicleLatestPartIndex(state, partIndex);
    createdAny = true;
  }

  // Ensure so-far latest exists if there are closed parts
  if (expectedClosedParts > 0) {
    const parts = getChroniclePartsMap(state);
    const allSummaries = [];
    for (let i = 1; i <= expectedClosedParts; i++) {
      const p = parts.get(String(i));
      const s = p && p.get('summary');
      if (s) allSummaries.push(s);
    }
    const combined = allSummaries.join('\n\n');
    const soFar = await summarize(SO_FAR_LATEST_KEY, combined, 1000).catch(() => '');
    if (soFar) setChronicleSoFarSummary(state, soFar);
  }

  // Ensure recent summary exists for open part
  await recomputeRecentSummary(state, partSize);
};

