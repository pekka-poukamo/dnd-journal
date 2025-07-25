# Summarization System Usage Examples

This document demonstrates how to use the new content-agnostic summarization architecture.

## Basic Usage

### Summarizing Content

```javascript
import { processContent } from './js/summary-manager.js';

// Summarize a journal entry
const result = await processContent('entry', '12345', 'Long journal entry content...');

if (result.success) {
  console.log('Summary created:', result.summary.content);
  console.log('Action taken:', result.action); // 'created', 'updated', or 'unchanged'
} else {
  console.log('Failed:', result.reason);
}
```

### Batch Processing

```javascript
import { processBatchContent } from './js/summary-manager.js';

const contentItems = [
  { type: 'entry', id: '1', content: 'First entry content...' },
  { type: 'entry', id: '2', content: 'Second entry content...' },
  { type: 'character', id: 'backstory', content: 'Character backstory...' }
];

const results = await processBatchContent(contentItems);
```

### Getting Formatted Content for AI

```javascript
import { getFormattedContentForAI } from './js/summary-manager.js';

const entries = [
  { id: '1', content: 'Recent adventure...', timestamp: Date.now() },
  { id: '2', content: 'Older adventure...', timestamp: Date.now() - 86400000 }
];

// Returns mix of full recent content and summaries for older content
const formattedForAI = getFormattedContentForAI('entry', entries, 10);
```

## D&D Journal Integration

### Auto-Summarize Journal Entries

```javascript
import { autoSummarizeJournalEntries } from './js/dnd-summary-integration.js';

// Automatically process all journal entries that need summarization
const results = await autoSummarizeJournalEntries();
console.log(`Processed ${results.length} entries`);
```

### Summarize Character Fields

```javascript
import { summarizeCharacterFields } from './js/dnd-summary-integration.js';

// Process character backstory and notes if they're long enough
const results = await summarizeCharacterFields();
results.forEach(result => {
  console.log(`Summarized ${result.field}:`, result.result.summary.content);
});
```

### Get Summary Status

```javascript
import { getSummaryStatus } from './js/dnd-summary-integration.js';

const status = getSummaryStatus();
console.log(`Total summaries: ${status.totalSummaries}`);
console.log(`Current length: ${status.currentLength}/${status.targetLength} words`);
console.log(`Entries needing summary: ${status.entriesNeedingSummary}`);
console.log(`System healthy: ${status.healthy}`);
```

### Process All D&D Content

```javascript
import { processAllDnDContent } from './js/dnd-summary-integration.js';

// Process all journal entries and character fields that need summarization
const result = await processAllDnDContent();

if (result.success) {
  console.log(`Processed ${result.totalProcessed} items`);
  console.log(`Entries: ${result.results.entries.length}`);
  console.log(`Character fields: ${result.results.character.length}`);
} else {
  console.log('Processing failed:', result.error);
}
```

## AI Storytelling

### Generate Introspection Questions

```javascript
import { generateIntrospectionQuestions } from './js/ai-storytelling.js';

const character = {
  name: 'Aragorn',
  race: 'Human',
  class: 'Ranger',
  backstory: 'A ranger from the north...'
};

const journalEntries = [
  { id: '1', title: 'The Quest Begins', content: 'We set out...', timestamp: Date.now() }
];

const questions = await generateIntrospectionQuestions(character, journalEntries);
console.log('AI-generated questions:', questions);
```

### Check AI Availability

```javascript
import { isAIAvailable } from './js/ai-storytelling.js';

if (isAIAvailable()) {
  console.log('AI features are enabled and configured');
} else {
  console.log('AI features not available - check API key configuration');
}
```

## Health Monitoring

### Check Summary System Health

```javascript
import { checkSummaryHealth } from './js/summary-manager.js';

const health = checkSummaryHealth();

if (health.healthy) {
  console.log('Summary system is healthy');
} else {
  console.log('Issues found:');
  health.issues.forEach(issue => console.log(`- ${issue}`));
}
```

### Optimize Summary System

```javascript
import { optimizeSummarySystem } from './js/summary-manager.js';

const optimization = await optimizeSummarySystem();

if (optimization.success) {
  if (optimization.action === 'optimized') {
    console.log('System optimized - meta-summaries created');
  } else {
    console.log('System already optimized');
  }
} else {
  console.log('Optimization failed:', optimization.error);
}
```

## Storage Operations

### Direct Storage Access

```javascript
import { loadSummary, saveSummary } from './js/summary-store.js';

// Load a specific summary
const summary = loadSummary('entry:12345');
if (summary) {
  console.log('Summary found:', summary.content);
}

// Save a summary
const summaryData = {
  content: 'This is a summary...',
  metadata: {
    key: 'entry:12345',
    originalWordCount: 500,
    summaryWordCount: 50,
    timestamp: Date.now()
  }
};

saveSummary('entry:12345', summaryData);
```

### Query Summaries

```javascript
import { getSummariesByPattern, getStorageStats } from './js/summary-store.js';

// Get all entry summaries
const entrySummaries = getSummariesByPattern('^entry:');

// Get storage statistics
const stats = getStorageStats();
console.log('Storage stats:', stats);
```

## Content Utilities

### Extract and Format Content

```javascript
import { 
  extractJournalEntries, 
  extractCharacterData,
  analyzeContentStats 
} from './js/content-utils.js';

// Extract journal entries
const entries = extractJournalEntries();

// Extract character data
const character = extractCharacterData();

// Analyze content statistics
const stats = analyzeContentStats(entries);
console.log('Content analysis:', stats);
```

### Search and Filter Content

```javascript
import { 
  searchContent, 
  filterContentByDateRange,
  groupContentByTimePeriod 
} from './js/content-utils.js';

const entries = extractJournalEntries();

// Search content
const searchResults = searchContent(entries, 'dragon');

// Filter by date range
const recentEntries = filterContentByDateRange(
  entries, 
  new Date('2024-01-01'), 
  new Date()
);

// Group by time period
const groupedByMonth = groupContentByTimePeriod(entries, 'month');
```

## Error Handling

```javascript
import { processContent } from './js/summary-manager.js';

try {
  const result = await processContent('entry', 'test-id', 'Some content');
  
  if (!result.success) {
    switch (result.reason) {
      case 'Invalid content':
        console.log('Content was empty or invalid');
        break;
      case 'Content too short for summarization':
        console.log('Content is below minimum word threshold');
        break;
      case 'Failed to generate summary':
        console.log('AI summarization failed');
        break;
      case 'Failed to save summary':
        console.log('Storage operation failed');
        break;
      default:
        console.log('Unknown error:', result.reason);
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Migration from Old System

### Legacy Compatibility

```javascript
// Old way (deprecated)
import { runAutoSummarization } from './js/summarization.js';

// New way
import { processAllDnDContent } from './js/dnd-summary-integration.js';

// The integration layer provides compatibility functions
import { 
  runAutoSummarization,  // Maps to processAllDnDContent
  getSummaryStats        // Maps to getDnDSummaryStats
} from './js/dnd-summary-integration.js';
```

## Best Practices

1. **Use the Integration Layer**: For D&D journal, always use `dnd-summary-integration.js`
2. **Check Health Regularly**: Monitor system health with `checkSummaryHealth()`
3. **Handle Errors Gracefully**: Always check `result.success` before using results
4. **Batch When Possible**: Use batch processing for multiple items
5. **Monitor Performance**: Keep an eye on total summary length and word counts
6. **Preserve Recent Content**: System automatically preserves recent entries in full