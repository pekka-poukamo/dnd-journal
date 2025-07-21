# AI Prompt Generation System - Technical Specification

## Overview
The AI Prompt Generation System is the core differentiator of the D&D Journal App, designed to provide contextually relevant roleplay inspiration based on user's journal entries, character information, and campaign history.

## Core Objectives

1. **Contextual Awareness**: Generate prompts that understand the character's current situation, relationships, and backstory
2. **Consistency**: Maintain character voice and personality across interactions
3. **Inspiration**: Provide creative and engaging roleplay suggestions that enhance the gaming experience
4. **Relevance**: Ensure prompts are tied to recent events and character development
5. **Personalization**: Adapt to individual user preferences and playstyles

## Context Building Algorithm

### Data Collection Pipeline

```javascript
class ContextBuilder {
  async buildContext(userId, characterId, promptType) {
    const context = {
      character: await this.getCharacterProfile(characterId),
      recentEvents: await this.getRecentEvents(userId, characterId),
      relationships: await this.getRelationships(characterId),
      campaignSetting: await this.getCampaignContext(characterId),
      userPreferences: await this.getUserPreferences(userId),
      promptHistory: await this.getRecentPrompts(userId, characterId)
    };
    
    return this.synthesizeContext(context, promptType);
  }
  
  async getCharacterProfile(characterId) {
    // Fetch comprehensive character data
    const character = await db.characters.findById(characterId);
    const detailedEntries = await db.journalEntries.findByCharacter(characterId, {
      type: 'character',
      limit: 10,
      orderBy: 'created_at DESC'
    });
    
    return {
      basic: {
        name: character.name,
        class: character.class,
        race: character.race,
        level: character.level
      },
      personality: {
        traits: character.personality_traits,
        backstory: character.backstory,
        goals: this.extractGoals(detailedEntries),
        fears: this.extractFears(detailedEntries),
        motivations: this.extractMotivations(detailedEntries)
      },
      development: {
        recentChanges: this.analyzeCharacterGrowth(detailedEntries),
        conflicts: this.identifyInternalConflicts(detailedEntries),
        achievements: this.extractAchievements(detailedEntries)
      }
    };
  }
  
  async getRecentEvents(userId, characterId, daysBack = 30) {
    const cutoffDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000));
    
    const sessionNotes = await db.journalEntries.find({
      user_id: userId,
      character_id: characterId,
      entry_type: 'session',
      created_at: { gte: cutoffDate }
    }).orderBy('session_date DESC').limit(5);
    
    return {
      sessions: sessionNotes.map(note => ({
        title: note.title,
        content: note.content,
        date: note.session_date,
        significance: this.calculateEventSignificance(note)
      })),
      keyMoments: this.extractKeyMoments(sessionNotes),
      plotThreads: this.identifyPlotThreads(sessionNotes)
    };
  }
}
```

### Prompt Template System

```javascript
class PromptTemplateEngine {
  constructor() {
    this.templates = {
      roleplay: {
        reaction: `
Given the following context about {{character.name}}, a {{character.race}} {{character.class}}:

Character Traits: {{character.personality.traits}}
Recent Events: {{recentEvents.summary}}
Current Mood: {{character.currentMood}}

How would {{character.name}} react to: {{scenario}}

Consider their personality, recent experiences, and current emotional state. Provide:
1. Initial emotional response
2. Likely dialogue or actions
3. Internal thoughts/motivations
4. How this might affect their relationships

Keep the response in character and consistent with their established personality.
        `,
        
        dialogue: `
{{character.name}} ({{character.race}} {{character.class}}) is in a conversation with {{targetNPC.name}}.

Character Background:
- Personality: {{character.personality.traits}}
- Relationship with {{targetNPC.name}}: {{relationship.status}}
- Recent relevant events: {{relevantEvents}}

Current Situation: {{conversationContext}}

Generate 3-4 dialogue options for {{character.name}} that:
1. Stay true to their personality
2. Reflect their relationship with {{targetNPC.name}}
3. Consider recent events
4. Advance the conversation meaningfully

Format as: [Tone] "Dialogue" (Internal thought/motivation)
        `,
        
        development: `
{{character.name}} has experienced significant events recently:
{{recentSignificantEvents}}

Based on their personality traits ({{character.personality.traits}}) and backstory ({{character.backstory}}), suggest:

1. How these events might change them
2. New internal conflicts or resolutions
3. Evolving relationships with party members
4. Potential character growth directions
5. Questions they might be asking themselves

Focus on meaningful character development that feels organic to their established personality.
        `
      },
      
      backstory: {
        expansion: `
Expand {{character.name}}'s backstory regarding: {{focusArea}}

Current known background:
{{character.backstory}}

Recent journal entries suggest: {{relevantInsights}}

Create a detailed backstory expansion that:
1. Explains {{focusArea}} in their past
2. Connects to their current personality traits
3. Provides roleplay hooks for the future
4. Maintains consistency with established lore
5. Suggests how this affects their current relationships

Keep it grounded in the {{campaignSetting.genre}} setting.
        `,
        
        connections: `
{{character.name}} has mentioned {{mentionedElement}} in recent entries.

Character context:
- Background: {{character.backstory}}
- Personality: {{character.personality.traits}}
- Recent experiences: {{recentEvents.summary}}

Develop the connection between {{character.name}} and {{mentionedElement}}:
1. How they first encountered it
2. Why it's significant to them
3. How it shapes their current behavior
4. Potential future implications
5. Hidden aspects that could be revealed

Make it personal and meaningful to the character's journey.
        `
      },
      
      scenario: {
        personal_quest: `
Based on {{character.name}}'s recent experiences and internal conflicts:

Character Profile:
- Goals: {{character.personality.goals}}
- Fears: {{character.personality.fears}}
- Unresolved issues: {{character.development.conflicts}}

Recent campaign events: {{recentEvents.keyMoments}}

Design a personal quest or challenge that:
1. Addresses their internal conflicts
2. Provides character growth opportunities
3. Connects to recent campaign events
4. Involves meaningful choices
5. Could impact their relationships

Include potential obstacles, allies, and consequences.
        `,
        
        relationship_dynamic: `
Analyze the relationship between {{character.name}} and {{targetCharacter}}:

{{character.name}}'s perspective:
- Personality: {{character.personality.traits}}
- Recent interactions: {{recentInteractions}}

{{targetCharacter}}'s known traits: {{targetCharacter.traits}}

Suggest:
1. How their next interaction might go
2. Underlying tensions or bonds
3. Opportunities for relationship development
4. Potential conflicts or resolutions
5. Ways to deepen their connection

Consider both characters' perspectives and recent events.
        `
      }
    };
  }
  
  renderTemplate(templatePath, context) {
    const template = this.getTemplate(templatePath);
    return this.interpolate(template, context);
  }
  
  interpolate(template, context) {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return this.getNestedProperty(context, path.trim()) || '[DATA NOT AVAILABLE]';
    });
  }
}
```

## AI Service Implementation

```javascript
class AIPromptService {
  constructor() {
    this.contextBuilder = new ContextBuilder();
    this.templateEngine = new PromptTemplateEngine();
    this.providers = {
      openai: new OpenAIProvider(),
      claude: new ClaudeProvider()
    };
  }
  
  async generatePrompt(request) {
    const {
      userId,
      characterId,
      promptType,
      specificContext,
      userInput,
      preferredProvider = 'openai'
    } = request;
    
    try {
      // Build comprehensive context
      const context = await this.contextBuilder.buildContext(
        userId,
        characterId,
        promptType
      );
      
      // Add specific context if provided
      if (specificContext) {
        context.specific = specificContext;
      }
      
      // Generate prompt from template
      const prompt = this.templateEngine.renderTemplate(
        promptType,
        { ...context, userInput }
      );
      
      // Add system instructions
      const systemPrompt = this.buildSystemPrompt(context.character, promptType);
      
      // Call AI provider
      const response = await this.providers[preferredProvider].generate({
        system: systemPrompt,
        prompt: prompt,
        temperature: this.getTemperatureForPromptType(promptType),
        maxTokens: this.getMaxTokensForPromptType(promptType)
      });
      
      // Process and enhance response
      const processedResponse = await this.processResponse(
        response,
        context,
        promptType
      );
      
      // Save interaction for learning
      await this.saveInteraction(userId, characterId, {
        promptType,
        context: context,
        generatedPrompt: prompt,
        aiResponse: response,
        processedResponse: processedResponse,
        userFeedback: null // To be updated later
      });
      
      return processedResponse;
      
    } catch (error) {
      console.error('AI Prompt Generation Error:', error);
      return this.handleError(error, promptType);
    }
  }
  
  buildSystemPrompt(character, promptType) {
    const baseSystem = `
You are an expert D&D roleplay assistant helping players develop their characters and improve their roleplay.

Character Context:
- Name: ${character.basic.name}
- Class: ${character.basic.class}  
- Race: ${character.basic.race}
- Level: ${character.basic.level}

Your responses should:
1. Stay true to D&D 5e lore and mechanics
2. Be creative but grounded in the established character
3. Provide actionable suggestions for roleplay
4. Consider the emotional and psychological aspects
5. Encourage character growth and development

Tone: Encouraging, insightful, and creative while maintaining consistency with the character's established personality and the campaign's tone.
    `;
    
    const typeSpecificInstructions = {
      roleplay: 'Focus on immediate, actionable roleplay suggestions that the player can use right away.',
      backstory: 'Provide rich, detailed backstory that enhances the character without contradicting existing information.',
      scenario: 'Create engaging scenarios that challenge the character and provide growth opportunities.'
    };
    
    return baseSystem + '\n\n' + (typeSpecificInstructions[promptType] || '');
  }
  
  async processResponse(response, context, promptType) {
    // Parse and structure the AI response
    const structured = this.parseResponseStructure(response, promptType);
    
    // Add relevant tags and metadata
    structured.metadata = {
      characterLevel: context.character.basic.level,
      campaignContext: context.campaignSetting.name,
      generatedAt: new Date().toISOString(),
      promptType: promptType,
      relevanceScore: await this.calculateRelevanceScore(structured, context)
    };
    
    // Generate follow-up suggestions
    structured.followUps = this.generateFollowUpSuggestions(structured, context);
    
    return structured;
  }
  
  parseResponseStructure(response, promptType) {
    const parsers = {
      roleplay: (text) => {
        // Parse roleplay responses into structured format
        const sections = this.extractSections(text, [
          'initial response',
          'dialogue',
          'actions',
          'internal thoughts',
          'consequences'
        ]);
        
        return {
          type: 'roleplay',
          suggestions: sections,
          dialogueOptions: this.extractDialogueOptions(text),
          actionOptions: this.extractActionOptions(text)
        };
      },
      
      backstory: (text) => {
        return {
          type: 'backstory',
          narrative: text,
          keyElements: this.extractKeyElements(text),
          connections: this.extractConnections(text),
          hooks: this.extractRoleplayHooks(text)
        };
      },
      
      scenario: (text) => {
        return {
          type: 'scenario',
          description: text,
          challenges: this.extractChallenges(text),
          choices: this.extractChoices(text),
          consequences: this.extractConsequences(text)
        };
      }
    };
    
    return parsers[promptType](response) || { type: promptType, content: response };
  }
}
```

## Quality Assurance & Learning

### Response Quality Metrics

```javascript
class QualityAssessment {
  async assessResponse(response, context, userFeedback) {
    const metrics = {
      relevance: await this.calculateRelevance(response, context),
      consistency: await this.checkConsistency(response, context.character),
      creativity: await this.assessCreativity(response),
      actionability: await this.assessActionability(response),
      userSatisfaction: this.processUserFeedback(userFeedback)
    };
    
    return {
      overallScore: this.calculateOverallScore(metrics),
      metrics: metrics,
      improvements: this.suggestImprovements(metrics)
    };
  }
  
  async calculateRelevance(response, context) {
    // Use semantic similarity between response and recent events
    const recentEventsText = context.recentEvents.sessions
      .map(s => s.content).join(' ');
    
    return await this.semanticSimilarity(response.content, recentEventsText);
  }
  
  async checkConsistency(response, character) {
    // Check if response aligns with character personality
    const personalityKeywords = this.extractKeywords(character.personality.traits);
    const responseKeywords = this.extractKeywords(response.content);
    
    return this.calculateAlignmentScore(personalityKeywords, responseKeywords);
  }
}
```

### Learning & Improvement System

```javascript
class LearningSystem {
  async updatePromptEffectiveness(interactionId, userFeedback) {
    const interaction = await db.aiPrompts.findById(interactionId);
    
    // Update feedback
    await db.aiPrompts.update(interactionId, {
      userFeedback: userFeedback,
      effectivenessScore: this.calculateEffectiveness(userFeedback)
    });
    
    // Learn from feedback patterns
    await this.analyzeUserPreferences(interaction.user_id, userFeedback);
    
    // Update prompt templates if needed
    if (userFeedback.rating < 3) {
      await this.flagForTemplateReview(interaction);
    }
  }
  
  async analyzeUserPreferences(userId, feedback) {
    const userHistory = await db.aiPrompts.findByUser(userId);
    const preferences = this.extractPreferences(userHistory, feedback);
    
    await db.userPreferences.upsert(userId, {
      aiPreferences: preferences,
      updatedAt: new Date()
    });
  }
}
```

## API Endpoints

### Generate Prompt
```
POST /api/v1/ai/generate-prompt
Content-Type: application/json

{
  "characterId": "uuid",
  "promptType": "roleplay|backstory|scenario",
  "specificContext": {
    "scenario": "string",
    "targetNPC": "string",
    "focusArea": "string"
  },
  "userInput": "string",
  "preferences": {
    "provider": "openai|claude",
    "creativityLevel": "low|medium|high",
    "responseLength": "short|medium|long"
  }
}

Response:
{
  "id": "uuid",
  "type": "roleplay",
  "content": {
    "suggestions": [...],
    "dialogueOptions": [...],
    "actionOptions": [...]
  },
  "metadata": {
    "characterLevel": 5,
    "campaignContext": "Curse of Strahd",
    "generatedAt": "2024-01-15T10:30:00Z",
    "relevanceScore": 0.85
  },
  "followUps": [...]
}
```

### Submit Feedback
```
POST /api/v1/ai/feedback
Content-Type: application/json

{
  "promptId": "uuid",
  "rating": 4,
  "feedback": {
    "helpful": true,
    "relevant": true,
    "creative": true,
    "actionable": false
  },
  "comments": "Great suggestions but could be more specific"
}
```

## Performance Optimization

### Caching Strategy
- **Context Cache**: Cache character contexts for 1 hour
- **Template Cache**: Cache rendered templates for 30 minutes
- **Response Cache**: Cache similar prompts for 24 hours

### Rate Limiting
- Free users: 10 prompts/day
- Pro users: 100 prompts/day
- Team users: 500 prompts/day

### Cost Management
- Prompt optimization to reduce token usage
- Response caching to avoid duplicate API calls
- Smart fallbacks when primary AI service is unavailable

This AI Prompt Generation System specification provides a comprehensive framework for delivering contextually relevant, character-consistent roleplay inspiration that enhances the D&D gaming experience.