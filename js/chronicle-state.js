// Chronicle State Helpers - Yjs object-based structure (extracted from yjs.js)
import * as Y from 'yjs';

export const ensureChronicleStructure = (state) => {
  const chronicle = state.chronicleMap;
  if (!chronicle.get('parts')) {
    chronicle.set('parts', new Y.Map());
  }
  if (typeof chronicle.get('latestPartIndex') !== 'number') {
    chronicle.set('latestPartIndex', 0);
  }
  return chronicle;
};

export const getChroniclePartsMap = (state) => {
  const chronicle = ensureChronicleStructure(state);
  return chronicle.get('parts');
};

export const setChronicleSoFarSummary = (state, text) => {
  const chronicle = ensureChronicleStructure(state);
  chronicle.set('soFarSummary', text || '');
};

export const setChronicleRecentSummary = (state, text) => {
  const chronicle = ensureChronicleStructure(state);
  chronicle.set('recentSummary', text || '');
};

export const setChronicleLatestPartIndex = (state, index) => {
  const chronicle = ensureChronicleStructure(state);
  chronicle.set('latestPartIndex', Math.max(0, Number(index) | 0));
};

export const createOrGetChroniclePart = (state, partIndex) => {
  const parts = getChroniclePartsMap(state);
  const key = String(partIndex);
  let part = parts.get(key);
  if (!part) {
    part = new Y.Map();
    parts.set(key, part);
  }
  return part;
};

export const setChroniclePartTitle = (state, partIndex, title) => {
  const part = createOrGetChroniclePart(state, partIndex);
  part.set('title', title || '');
};

export const setChroniclePartSummary = (state, partIndex, summary) => {
  const part = createOrGetChroniclePart(state, partIndex);
  part.set('summary', summary || '');
};

export const setChroniclePartEntries = (state, partIndex, entryIds) => {
  const part = createOrGetChroniclePart(state, partIndex);
  let arr = part.get('entries');
  if (!arr) {
    arr = new Y.Array();
    part.set('entries', arr);
  }
  const current = arr.toArray();
  if (current.length > 0) arr.delete(0, current.length);
  if (Array.isArray(entryIds) && entryIds.length > 0) {
    arr.insert(0, entryIds);
  }
};

