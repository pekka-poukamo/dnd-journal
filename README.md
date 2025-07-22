# D&D Journal

A lightweight, static D&D journal app focused on core functionality: note-taking, character tracking, and AI-powered roleplay prompts. Built with vanilla JavaScript and CSS for maximum simplicity and minimal cost.

[![Deploy to Surge.sh](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml)

## 🚀 Live App

**🎲 [Open D&D Journal App](https://dnd-journal.surge.sh) 🎲**

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

## 🎯 Features

- **Journal Entries**: Simple text-based entries with categories and tagging
- **Character Management**: Basic character profiles and backstory tracking  
- **AI Roleplay Assistant**: Context-aware prompts using OpenAI API
- **Local Storage**: All data stored locally with export/import backup
- **Mobile-Friendly**: Responsive design for all devices

## 🛠 Local Development

```bash
# Clone the repository
git clone https://github.com/pekka-poukamo/dnd-journal.git
cd dnd-journal

# Start local server
npm start
# Opens http://localhost:3000
```

## 📁 Architecture

See [SIMPLE_ARCHITECTURE.md](SIMPLE_ARCHITECTURE.md) for detailed technical documentation.

## 📋 License

MIT License - see the full architecture document for more details.