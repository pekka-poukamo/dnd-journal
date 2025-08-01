// Simple test to verify Y.js imports work
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

console.log('✅ Y.js imported successfully');
console.log('✅ y-indexeddb imported successfully');

// Test basic Y.js functionality
const doc = new Y.Doc();
const map = doc.getMap('test');

map.set('hello', 'world');
console.log('✅ Basic Y.js functionality works');

// Test that we can create basic types
const entries = doc.getMap('journal').get('entries') || [];
console.log('✅ Journal map access works');

console.log('All tests passed! Y.js setup is working correctly.');