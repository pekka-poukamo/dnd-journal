# D&D Journal - Simple POC

A minimal D&D journal application for documenting adventures. Built with vanilla JavaScript and CSS as a proof of concept.

[![Deploy to Surge.sh](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml)
[![Test Suite](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/test.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/test.yml)

## 🚀 Live App

**🎲 [Open D&D Journal App](https://dnd-journal.surge.sh) 🎲**

## Features ✨

### 📝 **Character Management**
- **Character Summary**: Quick overview on main page with basic info
- **Detailed Character Page**: Comprehensive character creation and editing
  - Basic information (name, race, class, level, alignment, etc.)
  - Background and backstory with goals and motivations
  - Appearance and personality traits
  - Ability scores with automatic modifier calculation
  - Equipment and inventory tracking
  - Additional notes and character details
- Automatically saves as you type

### 📖 **Plain Text Journal Entries**
- Title and content fields
- Optional image URLs
- Automatic saving when you move to the next field
- Chronological list of all entries

### 💾 **Automatic Data Persistence**
- Everything saves automatically to localStorage
- No save buttons or manual actions needed
- Works completely offline

### 🖼️ **Image Support**
- Add images via URL
- Images display with entries
- Graceful fallback if image fails to load

## How to Use 🚀

1. **Open `index.html`** in any modern web browser
2. **Create your character** by clicking "View Details" and filling out the comprehensive character form
3. **View character summary** on the main page for quick reference
4. **Add journal entries** by typing a title and description
5. **Add images** by pasting image URLs (optional)
6. **Your data persists** automatically in your browser

### Navigation
- **Main Page (`index.html`)**: Character summary and journal entries
- **Character Page (`character.html`)**: Detailed character creation and editing

## Code Architecture 🏗️

This project follows a **functional programming approach** with **component-based CSS architecture**:

### JavaScript Style
- **Pure Functions**: All functions avoid side effects where possible
- **Functional Programming**: Uses `map`, `filter`, `reduce` over loops
- **Immutable Patterns**: Creates new objects instead of mutating existing ones
- **Error Handling**: Graceful error handling with `safeParseJSON` pattern
- **Debounced Auto-save**: Efficient data persistence

### CSS Architecture
- **BEM Methodology**: Block__Element--Modifier naming convention
- **Component-Based**: Modular CSS in `/css/components/`
- **CSS Custom Properties**: Consistent theming with CSS variables
- **Mobile-First**: Responsive design from mobile up
- **Shared Components**: Reusable navigation, forms, and UI elements

### File Organization
```
css/
├── components/
│   ├── navigation.css       # Shared navigation component
│   ├── character-summary.css # Character summary component
│   └── character-form.css    # Character form component
└── main.css                 # Base styles and utilities

js/
├── app.js                   # Main application logic
└── character.js             # Character page functionality

test/
├── app.test.js              # Main app tests
├── character.test.js        # Character functionality tests
├── components.test.js       # CSS component tests
└── integration.test.js      # End-to-end tests
```

### Testing 🧪
- **51 passing tests** covering all functionality
- **Unit Tests**: Pure function testing with isolated components
- **Integration Tests**: End-to-end user workflow validation
- **CSS Tests**: Component structure and BEM compliance verification
- **Error Handling**: Comprehensive edge case coverage

Run tests with: `npm test`

## What's NOT Included (Simplified) 🚫

- ❌ Multiple characters (one character only)
- ❌ Rich text editor (plain text only)
- ❌ Tags or categories
- ❌ Links or advanced formatting
- ❌ Reading time or word counts
- ❌ Themes or appearance settings
- ❌ Statistics or analytics
- ❌ Manual save/load buttons
- ❌ Keyboard shortcuts
- ❌ AI assistant
- ❌ Export/import features

## Technical Details 🔧

- **Pure vanilla JavaScript** - No frameworks or build tools
- **CSS custom properties** - Clean, modern styling
- **LocalStorage** - All data stored in browser
- **Single HTML file** - Complete app in one page
- **Mobile responsive** - Works on phones and tablets

## File Structure 📁

```
/
├── index.html      # Complete application
├── css/main.css    # Simple styles
├── js/app.js       # Application logic (~150 lines)
├── test/           # Test suite
│   ├── app.test.js         # Unit tests
│   ├── integration.test.js # Integration tests
│   ├── setup.js           # Test environment
│   └── README.md          # Testing documentation
├── scripts/        # Development scripts
│   ├── setup-dev.sh       # Environment setup
│   └── pre-commit.sh      # Pre-commit hooks
└── README.md       # This file
```

## 🧪 Testing

This project uses **Mocha** + **Chai** with should notation for comprehensive testing.

### **Running Tests**
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Setup development environment
./scripts/setup-dev.sh
```

### **Test Coverage**
- ✅ **17 passing tests** - All core functionality tested
- 🔧 **Unit Tests** - Pure functions, DOM manipulation, state management
- 🎯 **Integration Tests** - Complete user workflows
- 🚀 **Automated Testing** - GitHub Actions CI/CD
- 🔄 **Pre-commit Hooks** - Prevent broken code

### **Test Examples**
```javascript
// Should notation examples
state.entries.should.have.length(3);
character.name.should.equal('Aragorn');
result.should.be.a('string');
```

See `test/README.md` for detailed testing documentation.

## 📦 Automatic Deployment

This app automatically deploys to Surge.sh whenever you push to the `main` branch (if configured):

### 🔧 **Deployment Status**
- **✅ With credentials**: Auto-deploys to `https://dnd-journal.surge.sh`
- **⏭️ Without credentials**: Deployment skipped (no errors), manual deployment available

### ⚡ Quick Setup (5 minutes)
1. **Create Surge.sh account**: Go to [surge.sh](https://surge.sh) and sign up
2. **Get credentials**: Run `surge login` and `surge token` locally
3. **Add GitHub secrets**: 
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Add `SURGE_LOGIN` (your email) and `SURGE_TOKEN`
4. **Push to main**: Your app deploys automatically! ✨

### 🚀 **Alternative: Manual Deployment**
No setup needed - deploy anytime:
```bash
npm install -g surge
npm run deploy
```

📖 **See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.**

## 🛠 Local Development

```bash
# Clone the repository
git clone https://github.com/pekka-poukamo/dnd-journal.git
cd dnd-journal

# Start local server
npm start
# Opens http://localhost:3000
```

## Browser Compatibility 🌐

- Chrome 50+
- Firefox 50+
- Safari 10+
- Edge 79+

## Getting Started 🎯

1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start creating your D&D character and entries!

## Data Storage 💿

All data is stored locally in your browser using localStorage. Your data will persist between sessions but is tied to the specific browser and device. 

**Note**: Clearing browser data will remove your journal entries.

## 📁 Architecture

See [SIMPLE_ARCHITECTURE.md](SIMPLE_ARCHITECTURE.md) for detailed technical documentation.

## 📋 License

MIT License - see the full architecture document for more details.

---

**Perfect for**: Quick D&D session notes, character tracking, and simple adventure logging without any complexity.

Built as a minimal POC following functional programming principles with vanilla web technologies.
