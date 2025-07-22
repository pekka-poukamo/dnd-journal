# D&D Journal - Simple POC

A minimal D&D journal application for documenting adventures. Built with vanilla JavaScript and CSS as a proof of concept.

[![Deploy to Surge.sh](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml)
[![Test Suite](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/test.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/test.yml)

## 🚀 Live App

**🎲 [Open D&D Journal App](https://dnd-journal.surge.sh) 🎲**

## Features ✨

### 📝 **Single Character**
- Simple character form (name, race, class)
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

### 🤖 **AI-Powered Roleplay Prompts**
- **OpenAI Integration** - Generate creative prompts using GPT models
- **Three Prompt Types**:
  - **Introspective** - Character reflection and personal growth
  - **Action** - Challenging decisions and critical moments
  - **Surprise** - Unexpected, left-field encounters that challenge assumptions
- **Smart Context Awareness** - Uses your character info and journal history
- **AI-Powered Compression** - Uses cached nested AI summaries to compress long journal histories
- **Configurable Models** - Choose between GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo
- **Local Storage** - API keys stored securely in your browser

## How to Use 🚀

1. **Open `index.html`** in any modern web browser
2. **Fill in your character** details (saves automatically)
3. **Configure AI** (optional):
   - Click **Settings** button in the header
   - Enter your OpenAI API key
   - Choose your preferred AI model
4. **Generate AI prompts** for deeper roleplay:
   - Click any of the three prompt generation buttons
   - Use the generated prompt directly or regenerate for variety
   - Click "Use This Prompt" to auto-fill a journal entry
5. **Add journal entries** by typing a title and description
6. **Add images** by pasting image URLs (optional)
7. **Your data persists** automatically in your browser

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
- ❌ Export/import features

## Technical Details 🔧

- **Pure vanilla JavaScript** - No frameworks or build tools
- **OpenAI API Integration** - Secure client-side API calls
- **CSS custom properties** - Clean, modern styling
- **LocalStorage** - All data stored in browser (including API keys)
- **Single HTML file** - Complete app in one page
- **Mobile responsive** - Works on phones and tablets
- **AI-Powered Data Compression** - Nested AI summarization for large journal histories

## File Structure 📁

```
/
├── index.html              # Complete application
├── css/main.css            # Simple styles
├── js/
│   ├── app.js              # Application logic (~500 lines)
│   └── openai-service.js   # AI integration service
├── test/                   # Test suite
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

## 🤖 Setting Up AI Features

### **Getting an OpenAI API Key**

1. **Sign up** at [OpenAI](https://platform.openai.com)
2. **Navigate** to API section and create a new API key
3. **Copy** your API key (starts with `sk-`)
4. **In the app**, click **Settings** and paste your API key
5. **Choose** your preferred model:
   - **GPT-3.5 Turbo** - Fastest and most cost-effective
   - **GPT-4** - More creative and nuanced responses
   - **GPT-4 Turbo** - Best balance of speed and quality

### **AI Prompt Types Explained**

- **🧠 Introspective Prompts**: Help your character reflect on recent events, moral dilemmas, or personal growth. Perfect for character development entries.

- **⚔️ Action Prompts**: Present challenging situations that require immediate decisions or actions. Great for adding tension and drama to your campaign.

- **🌀 Surprise Prompts**: Completely unexpected scenarios that can include time travel, alternate dimensions, shocking revelations, or reality-bending encounters. These are designed to shake up your campaign in interesting ways!

### **How AI Compression Works**

The AI system uses intelligent nested summarization with smart caching to compress your journal history while preserving context:

- **Recent entries** (last 3) are included in full detail
- **Older entries** are compressed using AI-generated summaries
- **Smart caching** - Summaries are stored locally and only regenerated when entries change
- **Summary length scales** logarithmically with entry word count (10-100 words)
- **Large datasets** are grouped and meta-summarized to reduce API costs
- **Automatic cleanup** - Old cached summaries are periodically removed
- **Cache management** - View statistics and manually clear cache in Settings
- **Character information** is always included for personalized prompts
- **Graceful fallback** when AI summarization fails

This approach maintains rich context while minimizing API costs and staying within token limits, even for extensive journal histories.

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

## Data Storage & Privacy 💿

All data is stored locally in your browser using localStorage. Your data will persist between sessions but is tied to the specific browser and device.

### **What's Stored Locally:**
- Character information and journal entries
- OpenAI API key (encrypted in browser storage)
- AI model preferences

### **Privacy & Security:**
- **Your API key never leaves your device** except to communicate directly with OpenAI
- **No server involvement** - all AI requests go directly from your browser to OpenAI
- **No tracking or analytics** - your data stays private
- **Open source code** - you can verify exactly what the app does

**Note**: Clearing browser data will remove your journal entries and stored API key.

## 📁 Architecture

See [SIMPLE_ARCHITECTURE.md](SIMPLE_ARCHITECTURE.md) for detailed technical documentation.

## 📋 License

MIT License - see the full architecture document for more details.

---

**Perfect for**: Quick D&D session notes, character tracking, and simple adventure logging without any complexity.

Built as a minimal POC following functional programming principles with vanilla web technologies.
