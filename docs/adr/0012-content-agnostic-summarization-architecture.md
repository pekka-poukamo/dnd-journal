# ADR-0012: Content-Agnostic Summarization Architecture

## Status
Accepted

## Context
The original summarization module (`summarization.js`) was overly complex with several issues:
- Mixed responsibilities (AI integration, storage, and D&D-specific logic)
- Tight coupling between modules
- Content-specific logic scattered throughout
- Difficult to test and maintain
- Poor separation of concerns

The AI module also contained duplicated summarization logic, violating DRY principles.

## Decision
Redesign the summarization system with a **content-agnostic architecture** based on clean separation of concerns:

### New Module Structure:
1. **`summary-engine.js`** - Pure content-agnostic summary generation
2. **`summary-store.js`** - Unified storage operations with key-based approach
3. **`summary-manager.js`** - High-level orchestration with intelligent meta-summaries
4. **`ai-storytelling.js`** - Focused only on D&D storytelling and questions
5. **`content-utils.js`** - Shared utilities for content processing
6. **`dnd-summary-integration.js`** - D&D-specific integration layer

### Key Features:
- **Content-Agnostic**: Takes any `(key, text)` pair for summarization
- **Nested Meta-Summaries**: Automatically creates meta-summaries to keep total length constant
- **Intelligent Management**: Maintains roughly constant total summary length
- **Clean Separation**: AI module only handles storytelling, not summarization

## Rationale

### Content-Agnostic Design
- **Reusability**: Can summarize any content type (entries, character fields, notes)
- **Simplicity**: Simple `processContent(type, id, content)` interface
- **Testability**: Pure functions with clear inputs/outputs
- **Flexibility**: Easy to add new content types without changing core logic

### Nested Meta-Summaries
- **Constant Length**: System automatically creates meta-summaries when length exceeds target
- **Intelligent Grouping**: Groups related summaries for better context preservation
- **Storage Efficiency**: Reduces total storage requirements over time
- **Performance**: Maintains AI context window efficiency

### Module Separation
- **Single Responsibility**: Each module has one clear purpose
- **Loose Coupling**: Modules communicate through well-defined interfaces
- **AI Focus**: AI module purely focused on storytelling, not content management

## Consequences

### Positive
- **Maintainability**: Clear module boundaries and responsibilities
- **Testability**: Pure functions are easy to unit test
- **Scalability**: Can handle any content type without modification
- **Performance**: Intelligent length management keeps AI calls efficient
- **Reusability**: Core engine can be used for any summarization needs

### Negative
- **Migration Effort**: Existing code needs to be updated to use new interfaces
- **Complexity**: More modules to understand initially
- **Learning Curve**: Developers need to understand the new architecture

## Implementation

### Core Interface
```javascript
// Simple content processing
const result = await processContent('entry', entryId, content);

// Batch processing
const results = await processBatchContent(contentItems);

// Get formatted content for AI
const formatted = getFormattedContentForAI('entry', allEntries);
```

### Key Benefits
1. **Constant Summary Length**: System maintains ~500 words total across all summaries
2. **Automatic Meta-Summaries**: Creates meta-summaries when individual summaries exceed threshold
3. **Recent Content Preservation**: Always keeps recent content in full, only summarizes older content
4. **Health Monitoring**: Built-in health checks and optimization suggestions

### Storage Schema
- **Summaries**: `{type}:{id}` → `{content, metadata}`
- **Meta-Summaries**: `{type}-meta:{id}` → `{content, metadata, includedSummaryKeys}`

## Compliance

### Required Patterns
- Use `summary-manager.js` for all high-level summarization operations
- Use `ai-storytelling.js` only for D&D narrative questions
- Use `dnd-summary-integration.js` as the interface layer for D&D journal
- All functions must remain pure and follow functional programming principles

### Migration Strategy
1. **Phase 1**: Deploy new modules alongside existing ones
2. **Phase 2**: Update D&D journal to use integration layer
3. **Phase 3**: Remove old summarization modules
4. **Phase 4**: Update tests to use new architecture

### Forbidden
- Adding D&D-specific logic to core engine modules
- Storing summaries in old format
- Bypassing the manager layer for complex operations
- Mixing AI storytelling with summarization logic

## Future Considerations
- The architecture supports adding other content types (documents, notes, etc.)
- Meta-summary strategy can be enhanced with better grouping algorithms
- Health monitoring can be expanded with more sophisticated metrics
- Storage layer can be adapted for different backends (database, API, etc.)