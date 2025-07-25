# ADR-0012: Radically Simple Summarization

## Status
Accepted

## Context
The summarization module was overly complex with mixed responsibilities, tight coupling, and difficult maintenance. A previous attempt at a "content-agnostic" architecture resulted in 6 modules and 1000+ lines of code, which was still too complex.

## Decision
Implement a **radically simple** summarization system with just **3 files and ~400 lines total**.

### Architecture:
1. **`simple-summary.js`** (152 lines) - Core summarization with auto meta-summaries
2. **`simple-ai.js`** (116 lines) - AI calls for storytelling and summaries  
3. **`simple-dnd.js`** (120 lines) - D&D journal integration

### Core Functions:
- `summarize(key, text)` - Summarize any content
- `getAllSummaries()` - Get all summaries for AI
- `generateQuestions(character, entries)` - D&D storytelling questions
- `autoSummarizeAll()` - Process all journal content
- `getStatus()` - Simple health check

## Rationale

### Radical Simplicity
- **Single Purpose**: Each file has one clear job
- **Minimal Interface**: 5 main functions total
- **No Abstraction Layers**: Direct implementation without over-engineering
- **Easy to Understand**: Any developer can read and modify in minutes

### Automatic Intelligence
- **Auto Meta-Summaries**: After 10 summaries, combines 5 oldest automatically
- **Constant Length**: Maintains ~400 words total regardless of content volume
- **Smart Defaults**: 30 words per summary, 60 for meta-summaries
- **No Configuration**: Works out of the box with sensible defaults

### Content Agnostic
- **Key-Value**: Any `(key, text)` pair can be summarized
- **Type Prefixes**: `entry:123`, `character:backstory`, `meta:456`
- **Universal**: Works with journal entries, character fields, any text

## Implementation

### Usage Examples:
```javascript
// Summarize anything
const summary = await summarize('entry:123', longText);

// Auto-process all D&D content  
const results = await autoSummarizeAll();

// Get AI questions
const questions = await getIntrospectionQuestions();

// Check status
const status = getStatus(); // { healthy: true, totalWords: 380 }
```

### Meta-Summary Logic:
1. Keep individual summaries until 10 exist
2. Combine 5 oldest into one meta-summary
3. Delete the original 5 summaries
4. Repeat as needed to maintain constant total length

## Consequences

### Positive
- **Maintainable**: ~400 lines vs 1000+ in complex version
- **Understandable**: Clear, direct implementation
- **Functional**: Follows ADR-0002 functional programming principles
- **Testable**: Simple pure functions
- **Performant**: Minimal overhead, intelligent length management

### Negative
- **Less Flexible**: Fewer configuration options
- **Fixed Logic**: Meta-summary strategy is hardcoded
- **Basic Features**: No advanced querying or analytics

## Compliance

### Required Usage
- Use `simple-dnd.js` functions for D&D journal integration
- Use `simple-summary.js` directly only for non-D&D content
- All functions remain pure and follow functional programming

### Forbidden
- Adding complex configuration systems
- Creating abstraction layers
- Expanding beyond the core use case
- Breaking the 500-line total limit per file

## Migration
1. Replace old summarization imports with `simple-dnd.js` functions
2. Update any direct AI calls to use `simple-ai.js`
3. Remove old complex modules
4. Test that auto-summarization still works

## Future
This architecture should remain stable and simple. Any "improvements" that add significant complexity should be rejected in favor of maintaining radical simplicity.