# Simple Summarization Usage

## Core Functions (3 files, 300 lines total)

### 1. Summarize Content

```javascript
import { summarize } from './js/simple-summary.js';

// Summarize any content with a key
const summary = await summarize('entry:123', 'Long journal entry text...');
console.log(summary); // "Short 30-word summary"
```

### 2. Get All Summaries  

```javascript
import { getAllSummaries } from './js/simple-summary.js';

const summaries = getAllSummaries();
// Returns: [{ key: 'entry:123', content: 'summary...', type: 'regular' }]
```

### 3. Generate AI Questions

```javascript
import { generateQuestions } from './js/simple-ai.js';

const questions = await generateQuestions(character, entries);
console.log(questions); // "1. What moment shaped you? 2. What conflict..."
```

## D&D Integration (One Function Each)

### Auto-Summarize Everything

```javascript
import { autoSummarizeAll } from './js/simple-dnd.js';

const results = await autoSummarizeAll();
// Processes all journal entries and character fields that need it
```

### Get Status

```javascript
import { getStatus } from './js/simple-dnd.js';

const status = getStatus();
console.log(status);
// { totalEntries: 10, totalSummaries: 5, healthy: true, needsWork: false }
```

### Get Introspection Questions

```javascript
import { getIntrospectionQuestions } from './js/simple-dnd.js';

const questions = await getIntrospectionQuestions();
// Uses current character and journal data automatically
```

## How It Works

1. **Summarize**: `summarize(key, text)` → 30-word summary
2. **Meta-Summaries**: After 10 summaries, combines 5 oldest into meta-summary
3. **Constant Length**: Keeps total around 400 words regardless of content volume
4. **AI Questions**: Takes character + recent entries → generates 4 questions

## That's It!

- **3 files**: `simple-summary.js`, `simple-ai.js`, `simple-dnd.js`
- **~300 lines total** (vs 1000+ in complex version)
- **5 main functions**: `summarize()`, `getAllSummaries()`, `generateQuestions()`, `autoSummarizeAll()`, `getStatus()`
- **Automatic meta-summaries** to keep length constant
- **Content-agnostic** - works with any key/text pair