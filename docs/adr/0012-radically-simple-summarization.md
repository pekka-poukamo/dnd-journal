# ADR-0012: Clean Summarization & Storytelling Architecture

## Status
Accepted

## Context
The summarization module was overly complex with mixed responsibilities, tight coupling, and difficult maintenance. A previous attempt at a "content-agnostic" architecture resulted in 6 modules and 1000+ lines of code, which was still too complex.

## Decision
Implement a **clean, separated architecture** with **3 focused modules**.

### Architecture:
1. **`openai-wrapper.js`** (103 lines) - Pure OpenAI interface with currying
2. **`summarization.js`** (178 lines) - Content-agnostic summarization with caching
3. **`storytelling.js`** (171 lines) - D&D narrative questions using summaries

### Core Functions:
- `summarize(key, text)` - Summarize any content with caching
- `getAllSummaries()` - Get all summaries for AI context
- `generateQuestions(character, entries)` - D&D storytelling with comprehensive context
- `createSystemPromptFunction()` / `createUserPromptFunction()` - Curried AI functions

## Rationale

### Clean Separation of Concerns
- **Pure OpenAI Wrapper**: Generic interface with curried functions, no domain logic
- **Content-Agnostic Summarization**: Works with any key/text pair, includes caching
- **Smart Storytelling**: Uses summaries automatically, provides comprehensive context
- **No Coupling**: Each module handles its own AI function creation

### Intelligent Caching and Context
- **Summary Caching**: Checks cache before generating, prevents duplicate AI calls
- **Auto Meta-Summaries**: After 10 summaries, combines 5 oldest automatically
- **Comprehensive Context**: ~2000 words total context for storytelling
- **Smart Length Management**: Maintains target lengths through intelligent grouping

### Key-Based Architecture
- **Direct Keys**: Each entry uses `entry:${id}` for summarization
- **Character Fields**: Auto-summarizes long backstory/notes with `character:${field}`
- **No Pattern Matching**: Direct key usage instead of regex patterns
- **Predictable Caching**: Each piece of content has dedicated cache key

## Implementation

### Usage Examples:
```javascript
// Pure OpenAI wrapper with currying
const summarizeFn = createUserPromptFunction({ temperature: 0.3 });
const storyFn = createSystemPromptFunction("Storytelling prompt...", { temperature: 0.8 });

// Content-agnostic summarization with caching
const summary = await summarize('entry:123', longText); // Checks cache first
const allSummaries = getAllSummaries(); // For AI context

// D&D storytelling with comprehensive context
const questions = await generateQuestions(); // Uses summaries automatically
const context = await getCharacterContext(); // Debug context
```

### Key Features:
1. **Caching**: Summary checks cache before generating new content
2. **Auto Character Summarization**: Long backstory/notes automatically summarized
3. **Comprehensive Context**: Recent entries + summaries + meta-summaries (~2000 words)
4. **Meta-Summary Logic**: After 10 summaries, combines 5 oldest into meta-summary
5. **Direct Keys**: Each entry/character field has specific summarization key

## Consequences

### Positive
- **Clean Architecture**: Clear separation between wrapper, summarization, and storytelling
- **Efficient Caching**: Prevents duplicate AI calls through intelligent cache checks
- **Comprehensive Context**: Storytelling gets full context through automatic summary usage
- **Functional**: Follows ADR-0002 functional programming principles
- **Maintainable**: Each module has single responsibility
- **Performance**: Curried functions and caching optimize AI usage

### Negative
- **Async Complexity**: Character and entry formatting now requires await
- **Fixed Strategy**: Meta-summary logic is hardcoded
- **Cache Dependencies**: Modules now depend on storage for performance

## Compliance

### Required Usage
- Use `openai-wrapper.js` for all AI function creation with currying
- Use `summarization.js` for any content summarization needs
- Use `storytelling.js` for D&D narrative generation
- All functions remain pure and follow functional programming

### Forbidden
- Adding domain-specific functions to the OpenAI wrapper
- Bypassing cache checks in summarization
- Pattern matching instead of direct key usage
- Creating new AI integration modules outside this architecture

## Migration
1. Replace old AI calls with curried functions from `openai-wrapper.js`
2. Update summarization to use `summarization.js` with caching
3. Update storytelling to use `storytelling.js` with comprehensive context
4. Ensure all entry/character summarization uses direct keys

## Future
This architecture provides clean separation while maintaining efficiency through caching and intelligent context management. Changes should preserve the separation of concerns and caching behavior.