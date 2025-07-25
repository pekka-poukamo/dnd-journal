# D&D Journal

A simple D&D journal built with vanilla JavaScript.

## Quick Start

Open `index.html` in a browser.

## Development

```bash
npm install
npm test

# Coverage analysis
npm run test:coverage          # Basic coverage report
npm run coverage:html          # Detailed HTML coverage report
npm run coverage:warn          # Coverage warnings (used in CI)
npm run coverage:check         # Strict coverage check (95% threshold)

# Pre-commit checks
npm run pre-commit            # Run coverage warnings before committing
```

## Architecture

- Vanilla JavaScript only
- Functional programming
- ES6 modules
- localStorage only
- No build tools
- All code tested

## Structure

```
├── index.html          # Main app
├── character.html      # Character page
├── settings.html       # Settings page
├── js/                 # JavaScript modules
├── css/                # Styles
├── test/               # Tests
└── docs/adr/           # Architecture decisions
```
