# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) that document the key architectural decisions for the D&D Journal project. These decisions are **permanent** and serve as guardrails against feature creep and complexity.

## Purpose
- Document the "why" behind architectural choices
- Prevent AI agents from suggesting forbidden patterns
- Maintain project simplicity over time
- Provide clear compliance rules

## ADR List

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](0001-use-vanilla-javascript-only.md) | Use Vanilla JavaScript Only | Accepted |
| [ADR-0002](0002-functional-programming-only.md) | Functional Programming Only | Accepted |
| [ADR-0004](0004-localStorage-only-persistence.md) | localStorage Only for Persistence | Accepted |
| [ADR-0005](0005-mandatory-testing.md) | Mandatory Testing for All Code | Accepted |
| [ADR-0006](0006-no-build-tools.md) | No Build Tools or Bundlers | Accepted |
| [ADR-0007](0007-feature-freeze-boundaries.md) | Feature Freeze Boundaries | Accepted |
| [ADR-0008](0008-surge-deployment-only.md) | Surge.sh Deployment Only | Accepted |

## For AI Agents

**These decisions are FINAL and NON-NEGOTIABLE.**

Before suggesting any changes or additions:
1. Read ALL ADRs in this directory
2. Ensure your suggestion doesn't violate any decision
3. If it conflicts with an ADR, do not suggest it

**Violation of any ADR is considered a failure.**

## ADR Format
Each ADR follows this structure:
- **Status**: Current state (Accepted/Rejected/Superseded)
- **Context**: The situation that prompted the decision
- **Decision**: What was decided
- **Rationale**: Why this decision was made
- **Consequences**: Positive and negative impacts
- **Compliance**: Specific rules and forbidden patterns
- **Implementation**: How to follow the decision

## Maintenance
These ADRs are reviewed quarterly to ensure continued relevance, but the core decisions remain permanent to protect project integrity.
