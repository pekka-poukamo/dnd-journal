# D&D Journal App

A lightweight, static D&D journal application for documenting adventures, managing characters, and getting AI-powered roleplay suggestions. Built with vanilla JavaScript and CSS following functional programming principles.

## Features

### 📝 Journal Entries
- Rich text editor with formatting tools
- Entry types: Session Notes, Character Development, Quick Notes, NPC Profiles, Locations, Items, Campaign Lore
- Tagging system for organization
- Auto-save functionality
- Link and image support

### 👥 Character Management
- Complete character profiles (name, race, class, level, traits, backstory)
- Character filtering and sorting
- Set current active character
- Character-specific journal entries

### 🤖 AI Roleplay Assistant
- Context-aware roleplay suggestions using OpenAI GPT
- Character development ideas
- Story scenario generation
- Uses character details and recent journal entries for context
- Save AI suggestions as journal entries

### 💾 Data Management
- Local storage (works offline)
- Export/import functionality for backup
- No backend required
- Settings for themes and preferences

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- (Optional) OpenAI API key for AI assistant features

### Installation
1. Download or clone the repository
2. Open `index.html` in your web browser
3. Start creating characters and journal entries!

### Setting up AI Assistant
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "AI Assistant" in the navigation
3. Click "API Settings" and enter your API key
4. Start getting AI-powered roleplay suggestions!

## Usage

### Creating Your First Character
1. Navigate to "Characters" from the dashboard
2. Click "New Character"
3. Fill in character details (name, race, class, level, traits, backstory)
4. Click "Set as Current" to make it your active character

### Writing Journal Entries
1. Click "New Entry" from the dashboard or navigation
2. Choose entry type and associate with a character (optional)
3. Add tags for organization
4. Use the rich text editor for formatting
5. Save as draft or publish the entry

### Using the AI Assistant
1. Ensure you have characters created and an API key set
2. Select a character and suggestion type
3. Describe your situation or question
4. Generate AI suggestions based on your character's context

## Technical Details

### Architecture
- **Frontend**: Vanilla HTML, CSS, JavaScript (ES6 modules)
- **Storage**: Browser localStorage with JSON export/import
- **AI Integration**: Direct OpenAI API calls (user's API key)
- **Styling**: CSS custom properties, mobile-first responsive design

### Browser Compatibility
- Chrome 61+
- Firefox 55+
- Safari 11+
- Edge 79+

### File Structure
```
/
├── index.html              # Dashboard
├── journal.html            # Journal editor
├── character.html          # Character management
├── ai-assistant.html       # AI roleplay assistant
├── css/
│   └── main.css           # Styles
├── js/
│   ├── app.js             # Main dashboard logic
│   ├── utils/             # Utility functions
│   ├── components/        # Reusable components
│   └── pages/             # Page-specific logic
└── README.md
```

### Code Style
- Functional programming principles
- Pure functions where possible
- ES6 modules for organization
- Immutable data patterns
- Component-based architecture

## Data Privacy

- **Local First**: All data stored in your browser's localStorage
- **No Tracking**: No analytics, cookies, or external tracking
- **API Keys**: OpenAI API key stored locally only
- **Export Control**: You control your data with export/import features

## Deployment

### Static Hosting (Recommended)
This app can be deployed to any static hosting service:

- **Surge.sh**: `surge` (free)
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Enable in repository settings

### Local Development
Simply open `index.html` in your browser. No build process required.

## Contributing

This project follows the style guide and architecture documented in:
- `STYLE_GUIDE.md` - JavaScript and CSS coding standards
- `SIMPLE_ARCHITECTURE.md` - Application architecture and design decisions

## License

This project is open source and available under the MIT License.

## Cost Considerations

- **Hosting**: Free (static hosting)
- **AI Features**: OpenAI API usage (typically $1-3/month for personal use)
- **Total**: Essentially free for personal use

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Verify localStorage is enabled
3. For AI features, verify your OpenAI API key is valid
4. Export your data regularly as backup

---

Built with ❤️ for D&D players who want to chronicle their adventures and enhance their roleplay experience.