# Clean Summarization & Storytelling Architecture

## Core Modules (3 files, 452 lines total)

### 1. OpenAI Wrapper (103 lines)
```javascript
import { createSystemPromptFunction, createUserPromptFunction } from './js/openai-wrapper.js';

// Create reusable functions with curried prompts
const summarizeFn = createUserPromptFunction({ temperature: 0.3 });
const storyFn = createSystemPromptFunction("You are a storytelling assistant...", { temperature: 0.8 });

// Use them
const summary = await summarizeFn("Summarize in 30 words: Long text here...");
const story = await storyFn("Character details here...");
```

### 2. Summarization (178 lines)
```javascript
import { summarize, getAllSummaries, getSummary } from './js/summarization.js';

// Summarize any content with a key
const summary = await summarize('entry:123', 'Long journal entry text...');

// Get all summaries for AI context
const summaries = getAllSummaries();
// Returns: [{ key: 'entry:123', content: 'summary...', type: 'regular' }]

// Get specific summary
const specificSummary = getSummary('entry:123');
```

### 3. Storytelling (171 lines)
```javascript
import { generateQuestions, getCharacterContext } from './js/storytelling.js';

// Generate D&D introspection questions (uses summaries automatically)
const questions = await generateQuestions(character, entries);
console.log(questions); // "1. What moment shaped you? 2. What conflict..."

// Get context info (shows what summaries are being used)
const context = getCharacterContext();
console.log(context.summaryStats); // { totalSummaries: 5, entrySummaries: 3, ... }
```

## Key Features

### OpenAI Wrapper
- **Pure Interface**: Generic curried functions for any use case
- **System/User Prompts**: `createSystemPromptFunction()`, `createUserPromptFunction()`
- **Template Functions**: Dynamic prompts with `createTemplateFunction()`
- **Settings Integration**: Automatically uses API key from settings

### Summarization
- **Content-Agnostic**: `summarize(key, text)` works with any content
- **Auto Meta-Summaries**: After 10 summaries, combines 5 oldest automatically  
- **Constant Length**: Maintains ~400 words total regardless of content volume
- **Pattern Queries**: `getSummariesByPattern('^entry:')` for filtered results

### Storytelling
- **Smart Context**: Uses summaries when relevant, recent entries in full
- **Automatic Integration**: Pulls from summarization module seamlessly
- **Character Awareness**: Replaces long character fields with summaries
- **Context Utilities**: Debug what context is being used for AI

## Usage Examples

### Basic Summarization
```javascript
import { summarize } from './js/summarization.js';

// Summarize journal entries
const summary1 = await summarize('entry:123', longEntryText);
const summary2 = await summarize('entry:124', anotherLongText);

// Summarize character fields  
const backstorySummary = await summarize('character:backstory', longBackstory);
```

### Getting Context for AI
```javascript
import { getAllSummaries } from './js/summarization.js';

// Get all summaries for AI context
const summaries = getAllSummaries();

// Mix with recent content
const context = [
  ...recentEntries.map(e => ({ type: 'recent', content: e.content })),
  ...summaries.map(s => ({ type: s.type, content: s.content }))
];
```

### Storytelling with Auto-Context
```javascript
import { generateQuestions, hasGoodContext } from './js/storytelling.js';

// Check if we have good context
const contextCheck = hasGoodContext();
if (contextCheck.ready) {
  // Generate questions (automatically uses summaries + recent entries)
  const questions = await generateQuestions();
}
```

### Custom OpenAI Functions
```javascript
import { createTemplateFunction, createPromptFunction } from './js/openai-wrapper.js';

// Create custom prompt function
const analyzeCharacter = createPromptFunction(
  "You are a character analyst. Provide insights about this character.",
  { temperature: 0.6 }
);

// Create template function for dynamic prompts
const createCustomPrompt = (type, wordCount) => 
  `Create a ${type} in exactly ${wordCount} words:`;
  
const customGenerator = createTemplateFunction(createCustomPrompt);
const result = await customGenerator('backstory', 50);
```

## Architecture Benefits

✅ **Separation of Concerns**: Each module has one clear purpose  
✅ **Curried AI Functions**: Reusable functions with fixed prompts  
✅ **Smart Integration**: Storytelling automatically uses summaries when relevant  
✅ **Content Agnostic**: Summarization works with any key/text pair  
✅ **Auto Meta-Summaries**: Keeps total length constant through intelligent grouping  
✅ **Clean Dependencies**: Clear import structure, no circular dependencies  

## Module Responsibilities

- **`openai-wrapper.js`**: Pure OpenAI interface with curried function generation
- **`summarization.js`**: Content-agnostic summarization with auto meta-summaries  
- **`storytelling.js`**: D&D narrative questions using summaries when available

## Migration from Old System

```javascript
// Old way
import { runAutoSummarization } from './js/summarization.js'; // ❌ Complex

// New way  
import { summarize } from './js/summarization.js'; // ✅ Simple
import { generateQuestions } from './js/storytelling.js'; // ✅ Clear

// Auto-summarize entries
for (const entry of entries) {
  await summarize(`entry:${entry.id}`, entry.content);
}

// Get AI questions
const questions = await generateQuestions();
```

Total: **452 lines** across 3 focused modules vs **1000+** in previous complex architecture.