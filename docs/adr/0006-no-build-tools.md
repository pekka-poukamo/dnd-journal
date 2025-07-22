# ADR-0006: No Build Tools or Bundlers

## Status
Accepted

## Context
Modern web development typically uses build tools like Webpack, Vite, Parcel, or Rollup for bundling, transpilation, and optimization. We need to decide whether to use build tools.

## Decision
We will use **no build tools** - direct development with native browser features only.

## Rationale
- **Simplicity**: No configuration files or complex toolchains
- **Zero Dependencies**: No build tool vulnerabilities or updates
- **Instant Development**: No compilation step between changes and testing
- **AI Agent Prevention**: Stops agents from adding Webpack, Babel, etc.
- **Deployment Simplicity**: Copy files and deploy, no build step
- **Browser Standards**: Use what browsers support natively

## Consequences
### Positive
- Immediate feedback during development
- No build configuration to maintain
- Works in any environment with a browser
- No build step failures
- Simple CI/CD pipelines

### Negative
- No TypeScript compilation
- No SCSS/SASS preprocessing
- No module bundling optimization
- No code minification
- Limited to ES6+ browser support

## Compliance
**Forbidden tools:**
- Webpack, Vite, Parcel, Rollup
- Babel, TypeScript compiler
- SCSS/SASS compilers
- PostCSS processors
- ESLint (beyond basic setup)
- Prettier (beyond basic setup)
- Any `package.json` build scripts

**Required approach:**
- Native ES6 modules: `<script type="module">`
- Native CSS: no preprocessors
- Manual file organization
- Browser-supported features only

## Implementation
- Direct `<script>` and `<link>` tags in HTML
- ES6 import/export if needed
- CSS custom properties instead of SCSS variables
- Native browser APIs only
- Files served directly by web server
