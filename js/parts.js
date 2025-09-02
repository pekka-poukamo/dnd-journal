// Parts - Partitioning logic and key helpers for journal parts
// Focused utilities with no side effects

import { getSummary, setSummary } from './yjs.js';

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

