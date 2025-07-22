# D&D Journal - Simple POC

A minimal D&D journal application for documenting adventures. Built with vanilla JavaScript and CSS as a proof of concept.

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

## How to Use 🚀

1. **Open `index.html`** in any modern web browser
2. **Fill in your character** details (saves automatically)
3. **Add journal entries** by typing a title and description
4. **Add images** by pasting image URLs (optional)
5. **Your data persists** automatically in your browser

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
└── README.md       # This file
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

---

**Perfect for**: Quick D&D session notes, character tracking, and simple adventure logging without any complexity.

Built as a minimal POC following functional programming principles with vanilla web technologies.