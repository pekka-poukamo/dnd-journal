# D&D Journal

A lightweight, static D&D journal app focused on core functionality: note-taking, character tracking, and AI-powered roleplay prompts. Built with vanilla JavaScript and CSS for maximum simplicity and minimal cost.

[![Deploy to Surge.sh](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml/badge.svg)](https://github.com/pekka-poukamo/dnd-journal/actions/workflows/deploy-surge.yml)

## 🚀 Live App

**🎲 [Open D&D Journal App](https://dnd-journal.surge.sh) 🎲**

## 📦 Automatic Deployment

This app automatically deploys to Surge.sh whenever you push to the `main` branch:

### ⚡ Quick Setup (5 minutes)
1. Create a **Surge.sh account** and get your credentials
2. Add **GitHub secrets** (`SURGE_LOGIN`, `SURGE_TOKEN`, `SURGE_DOMAIN`)
3. Push changes to `main` branch
4. Your app deploys automatically! ✨

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