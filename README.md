# D&D Journal

![Test Suite](https://github.com/pekka-poukamo/dnd-journal/workflows/Test%20Suite/badge.svg)

A simple D&D journal built with vanilla JavaScript.

## Quick Start

Open `index.html` in a browser.

## Development

```bash
npm install
npm test
```

## CI/CD

Automated testing and deployment via GitHub Actions:

- **Pull Requests**: Tests run automatically on all PRs
- **Main Branch**: Tests + automatic deployment to [dnd-journal.surge.sh](https://dnd-journal.surge.sh)
- **Test Matrix**: Node.js 16.x, 18.x, and 20.x
- **Zero Build**: Static files deployed directly (ADR-0006)

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
