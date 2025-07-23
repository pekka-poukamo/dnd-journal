# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **2024-12-19**: Updated ADR-0007 (Feature Freeze Boundaries) to allow basic settings/preferences
  - **Rationale**: AI features require essential configuration (API keys, feature toggles)
  - **Scope**: Limited to minimal, essential settings only - no themes or complex customization
  - **Files Modified**: 
    - `docs/adr/0007-feature-freeze-boundaries.md` - Removed settings from forbidden list, added revision history
    - `STYLE_GUIDE.md` - Removed settings from anti-patterns list
  - **Impact**: Legitimizes existing settings functionality while maintaining architectural simplicity

## Architecture Decision Record Changes

### ADR-0007: Feature Freeze Boundaries
- **Date**: 2024-12-19
- **Change**: Allow basic settings/preferences for AI configuration
- **Previous Status**: Settings/preferences panels were permanently forbidden
- **New Status**: Basic settings allowed for essential configuration only
- **Justification**: AI integration requires user-provided API keys and feature toggles that must be configurable