# ADR-0013: Radical Simplicity Principle

## Status
Accepted

## Context
While existing ADRs address specific aspects of simplicity (vanilla JS, functional programming, no build tools), we need an overarching principle that governs all architectural, functionality, and code decisions. The project has grown to include multiple features and modules, and we need a clear guiding principle to prevent complexity creep and ensure that every decision aligns with our core philosophy.

## Decision
We establish **Radical Simplicity** as the fundamental architectural principle that governs all aspects of the D&D Journal project: architecture, functionality, and code implementation.

## Rationale
- **Cognitive Load**: Simple systems are easier to understand, debug, and maintain
- **Reliability**: Fewer moving parts means fewer failure points
- **Longevity**: Simple code survives technology changes and framework churn
- **AI Agent Guidance**: Provides a clear decision framework for automated development
- **User Experience**: Simple applications are faster, more reliable, and easier to use
- **Development Speed**: Simple solutions can be implemented and tested faster
- **Debugging**: Simple systems are easier to troubleshoot when problems occur

## Definition of Radical Simplicity
**Radical Simplicity** means choosing the simplest possible solution that meets the requirements, even if it requires writing more code or sacrificing some features. It means:

1. **Preferring explicit over implicit** - Clear, verbose code over clever shortcuts
2. **Choosing fewer abstractions** - Direct solutions over generalized frameworks
3. **Minimizing dependencies** - Built-in features over external libraries
4. **Reducing layers** - Flat structures over deep hierarchies
5. **Eliminating indirection** - Direct calls over event systems or observers
6. **Favoring duplication over coupling** - Copy code rather than create shared abstractions

## Consequences
### Positive
- Predictable behavior and performance
- Easy onboarding for new developers
- Minimal maintenance burden
- Fast debugging and issue resolution
- Future-proof codebase
- Clear decision-making framework

### Negative
- May require more verbose code
- Could lead to some code duplication
- Might reject genuinely useful optimizations
- May not scale to very large applications

## Compliance
**Decision Framework**: For every architectural, functional, or code decision, ask:
1. **Is this the simplest solution that works?**
2. **Does this add unnecessary complexity?**
3. **Can this be done with fewer moving parts?**
4. **Is this solution immediately understandable?**

If the answer to questions 2-3 is "yes" or question 1 or 4 is "no", choose a simpler approach.

**Required Patterns:**
- Single responsibility functions and modules
- Direct function calls over event systems
- Plain objects over complex data structures
- Native browser APIs over libraries
- Explicit state management over reactive patterns
- Flat module structure over deep hierarchies

**Forbidden Patterns:**
- Observer patterns or event emitters (unless DOM events)
- Complex inheritance hierarchies
- Metaprogramming or reflection
- Code generation or dynamic evaluation
- Abstract base classes or interfaces
- Dependency injection containers
- Complex configuration systems
- Generic "framework" code within the project

**Architecture Examples:**
```javascript
// ✅ Radically Simple
const saveEntry = (entry) => {
  const entries = JSON.parse(localStorage.getItem('entries')) || [];
  entries.push(entry);
  localStorage.setItem('entries', JSON.stringify(entries));
};

// ❌ Too Complex
class EntryRepository {
  constructor(storage, serializer, validator) {
    this.storage = storage;
    this.serializer = serializer;
    this.validator = validator;
  }
  save(entry) { /* abstraction layers */ }
}
```

**Feature Examples:**
```javascript
// ✅ Radically Simple - One specific function
const summarizeEntry = async (entryText) => {
  const prompt = `Summarize this D&D entry: ${entryText}`;
  return await callOpenAI(prompt);
};

// ❌ Too Complex - Generic system
class SummarizationEngine {
  configure(options) { /* */ }
  addProcessor(type, processor) { /* */ }
  summarize(content, type) { /* routing logic */ }
}
```

## Implementation Guidelines

### Code Level
- Write the most straightforward code that solves the problem
- Prefer explicit repetition over clever abstraction
- Use the smallest possible function signatures
- Minimize conditional logic and branching
- Choose descriptive names over brevity

### Module Level  
- Keep modules under 200 lines when possible
- One clear responsibility per module
- Minimize inter-module dependencies
- Prefer composition over inheritance (functional style)

### Architecture Level
- Flat directory structure over deep nesting
- Direct imports over dynamic loading
- Static over dynamic configuration
- Hard-coded reasonable defaults over complex customization

### Feature Level
- Implement only what is needed now
- Choose the most direct user interaction pattern
- Minimize configuration options
- Prefer immediate feedback over optimized workflows

## Exceptions
The only acceptable exception to radical simplicity is when:
1. Browser compatibility requires polyfills
2. Security requires specific implementation patterns
3. Performance optimization is measurably critical

Even in these cases, choose the simplest solution that meets the constraint.

## Review Process
Before implementing any change, review against this principle:
1. Can this be done more simply?
2. Does this add unnecessary layers or abstractions?
3. Will this be immediately understandable to someone else?
4. Is this the most direct solution to the actual problem?

If any answer is concerning, redesign for greater simplicity.

## Relationship to Other ADRs
This ADR provides the philosophical foundation for all other architectural decisions:
- ADR-0001 (Vanilla JS): Simpler than frameworks
- ADR-0002 (Functional): Simpler than OOP
- ADR-0006 (No Build Tools): Simpler than toolchains
- ADR-0007 (Feature Freeze): Simpler than feature creep
- All future ADRs must align with radical simplicity

**This principle overrides all other considerations except security and core functionality.**