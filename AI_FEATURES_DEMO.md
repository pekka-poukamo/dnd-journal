# AI Features Demo Guide

This document demonstrates the new AI-powered roleplay prompt features in the D&D Journal app.

## 🤖 AI Features Overview

The D&D Journal now includes AI-generated prompts to enhance your roleplay experience. The system uses OpenAI's GPT models to generate contextually relevant prompts based on your character and journal history.

## 🔧 Setup

1. **Get an OpenAI API Key**:
   - Visit [OpenAI Platform](https://platform.openai.com)
   - Create an account and generate an API key
   - Note: You'll need to add billing information to use the API

2. **Configure the App**:
   - Click the "Settings" button in the app header
   - Paste your API key (it's stored securely in your browser)
   - Choose your preferred AI model

## 📝 How It Works

### Data Compression System

The app intelligently compresses your journal data to provide context to the AI:

- **Recent entries** (last 5): Full detail included
- **Older entries**: Summarized by extracting key themes
- **Character info**: Always included for personalization

### Example Compression:

**Input**: 20 journal entries about various adventures
**Compressed Output**:
```
Character: Elara, a Elf Wizard

Recent Adventures:
1. The Ancient Library (Dec 15): We discovered a hidden chamber beneath the library containing scrolls of forbidden magic...
2. Confronting the Shadow (Dec 14): The shadow creature that had been stalking us finally revealed itself...
[etc.]

Earlier Adventures (15 entries): battle, dungeon, dragon, treasure, magic, tavern, npc, quest.
```

## 🎯 Three Prompt Types

### 1. 🧠 Introspective Prompts
**Purpose**: Character reflection and growth
**Example Output**:
```
As Elara sits by the campfire, the weight of the forbidden scrolls in her pack feels heavier than their physical form. The knowledge contained within them could revolutionize magic as she knows it, but at what cost? 

Reflect on: What moral boundaries is your character willing to cross for knowledge? How has discovering these scrolls changed her perspective on the responsibility that comes with magical power? What would her mentor think of the path she's considering?
```

### 2. ⚔️ Action Prompts
**Purpose**: Challenging decisions and dramatic moments
**Example Output**:
```
The shadow creature materializes before Elara just as she reaches for the artifact. Behind her, she hears her companions' footsteps echoing in the chamber - they're still minutes away. The creature speaks in a voice like grinding stone: "The artifact chooses its wielder, young mage. Take it, and doom your friends. Leave it, and watch your world burn."

What does Elara do? Does she trust the creature's words? How does she balance her immediate desire to save her companions with the potential long-term consequences? What spell or action does she take in this critical moment?
```

### 3. 🌀 Surprise Prompts
**Purpose**: Unexpected, reality-bending scenarios
**Example Output**:
```
As Elara examines the magical scrolls, one of them suddenly glows and creates a temporal rift. Through it, she sees herself - but older, scarred, and wearing the robes of a court wizard. The older Elara looks directly at her and says, "I remember this moment. I'm here to warn you about the choice you're about to make. In my timeline, I chose power over friendship. Don't make my mistake."

How does your character react to meeting her future self? What questions does she ask? Does she believe this vision, or does she suspect illusion or deception? How might this encounter change her current plans regarding the forbidden knowledge?
```

## 🎮 Usage Examples

### Scenario 1: New Character
- **Character**: Thorin, Dwarf Fighter (just created)
- **Journal**: Empty
- **Introspective Prompt**: Focuses on backstory, motivations, and fears

### Scenario 2: Experienced Character
- **Character**: Luna, Human Rogue
- **Journal**: 10 entries about heists and moral dilemmas
- **Action Prompt**: Builds on past experiences, creates new challenges related to trust and loyalty

### Scenario 3: Long Campaign
- **Character**: Gandor, Dragonborn Paladin
- **Journal**: 25 entries spanning political intrigue and religious conflicts
- **Surprise Prompt**: Introduces time travel element that challenges character's faith and previous decisions

## 🔄 Regeneration & Customization

- **Regenerate**: Click "Regenerate" for different prompts of the same type
- **Use Prompt**: Click "Use This Prompt" to auto-fill a journal entry
- **Edit Freedom**: Modify the generated prompt before saving to your journal

## 💡 Tips for Best Results

1. **Fill out character details** - Name, race, and class help AI generate more relevant prompts
2. **Keep regular journal entries** - More context leads to better prompts
3. **Use descriptive entries** - Include emotions, decisions, and relationships
4. **Vary prompt types** - Mix introspective, action, and surprise prompts for balanced character development
5. **Experiment with models**:
   - **GPT-3.5 Turbo**: Fast, economical, good for straightforward prompts
   - **GPT-4**: More creative and nuanced, better for complex scenarios
   - **GPT-4 Turbo**: Best balance of creativity and speed

## 🔒 Privacy & Security

- **Local Storage**: API keys stored securely in your browser
- **Direct Communication**: App communicates directly with OpenAI (no intermediary servers)
- **No Data Collection**: Your character and journal data never leaves your device
- **Open Source**: All code is transparent and auditable

## 🚨 Cost Considerations

- OpenAI charges per API call
- Approximate costs (as of 2024):
  - GPT-3.5 Turbo: ~$0.001-0.002 per prompt
  - GPT-4: ~$0.03-0.06 per prompt
  - GPT-4 Turbo: ~$0.01-0.03 per prompt
- Data compression helps minimize token usage and costs

## 🎲 Creative Use Cases

1. **Writer's Block**: Generate prompts when stuck on character development
2. **Solo Play**: Create scenarios for solo D&D sessions
3. **Campaign Prep**: Generate side quests and character moments for DMs
4. **Character Journals**: Create in-character diary entries using AI prompts
5. **Backstory Development**: Explore character history through generated scenarios

---

**Happy Adventuring!** 🗡️✨

*The AI features are designed to enhance, not replace, your creativity. Use them as inspiration and starting points for your own unique roleplay experiences.*