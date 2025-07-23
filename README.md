# D&D Journal

A minimal D&D journal app. Vanilla JavaScript, zero dependencies.

🎲 **[Live App](https://dnd-journal.surge.sh)** 🎲

## What It Does

- **Character**: Name, race, class (auto-save)
- **Journal Entries**: Title + content (auto-save)
- **Images**: URL support
- **Storage**: Browser localStorage
- **Sync**: Optional cross-device sync via Yjs (ADR-0003)

## What It Doesn't Do

❌ Multiple characters  
❌ Rich text editing  
❌ Themes or customization  
❌ Advanced features

## Sync Setup (Optional)

For cross-device synchronization, see [SYNC_SETUP.md](SYNC_SETUP.md)

- **Free**: Works with public relay servers
- **Pi Server**: Enhanced performance with Raspberry Pi
- **Local-First**: Maintains offline-first principles

## Quick Start

1. Open `index.html` in browser
2. Fill character details
3. Add journal entries
4. Done

## ⚠️ For Developers & AI Agents

**🚨 MANDATORY READING:**
1. **[Architecture Decisions](docs/adr/)** - PERMANENT boundaries (NON-NEGOTIABLE)
2. **[Style Guide](STYLE_GUIDE.md)** - Coding rules and forbidden patterns

**Core Rules (violations = failure):**
- **Tests are mandatory** - All features must have tests
- **Keep it simple** - No feature bloat (see ADR-0007)
- **Pure functions only** - No mutations (see ADR-0002)
- **Vanilla JS/CSS only** - No frameworks (see ADR-0001)
- **localStorage only** - No databases/APIs (see ADR-0004)
- **Surge.sh deployment** - No complex hosting (see ADR-0008)

### Run Tests
```bash
npm install
npm test
```

### Deploy
```bash
npm run deploy
```

## File Structure
```
index.html          # Main app
character.html      # Character page
css/
├── main.css        # Base styles
└── components/     # Modular CSS
js/
├── app.js          # Main logic
└── character.js    # Character logic
test/               # Test suite
docs/adr/          # Architecture decisions
```

## Browser Support
Modern browsers only (Chrome 50+, Firefox 50+, Safari 10+, Edge 79+)

---

**Perfect for**: Quick D&D session notes without complexity.

**Built with**: Functional programming principles, vanilla web technologies.
