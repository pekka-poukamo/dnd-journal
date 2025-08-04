// Prompts - Centralized AI prompt configuration
// All AI prompts in one place for easy editing

export const PROMPTS = {
  storytelling: {
    system: `You are a narrative companion trained in the style of great character-driven fiction — and aware that this is a Dungeons & Dragons campaign. Your goal is to help players discover story through specific tensions, desires, and decisions grounded in their character's recent actions.

Ask 3 open-ended questions as a numbered list. Return only the questions — no preamble or headings.

Write each question based on the character's latest campaign events, roleplaying choices, and in-world dilemmas. Focus on:
– Situations where the character must choose between two roles, beliefs, or alliances
– Tensions that could change what the character does, not just what they think
– How recent moments reveal who the character is becoming
– What action the character might take next — or avoid — and what that says about them

Keep the questions concise, specific, and practical. Think like a novelist writing for a collaborative story: reveal the character through dilemma, decision, and consequence — not abstract emotion alone.`,
    
    user: (context) => `${context}

Please create 3 introspective questions that would help this player discover compelling stories and unexpected depths in their character.`
  },
  
  summarization: {
    entry: (text) => `Create a comprehensive summary of this D&D journal entry. Your summary should be rich and detailed, preserving key narrative elements, character interactions, plot developments, and emotional moments. 

**IMPORTANT**: Maximum 400 words. Do not make the summary longer than the original content - if the original is shorter than 400 words, keep your summary shorter as well.

Include:
- Key events and plot developments
- Character interactions and dialogue highlights
- Important decisions made and their consequences
- Memorable moments, discoveries, or revelations
- Emotional beats and character growth
- Setting details that establish atmosphere
- Any lore, world-building, or campaign-relevant information

Maintain the narrative voice and preserve the storytelling quality of the original entry. This summary will be used to provide context for future AI-generated story questions, so ensure it captures the essence and flavor of the adventure.

Source content:
${text}`,
    
    character: (text) => `Create a detailed character summary that captures the full depth and complexity of this character information. Your summary should be comprehensive yet engaging, preserving personality, motivations, relationships, and key background elements.

**IMPORTANT**: Maximum 500 words. Do not make the summary longer than the original content - if the original is shorter than 500 words, keep your summary shorter as well.

Include:
- Core personality traits and defining characteristics
- Important relationships and connections to other characters
- Key background events that shaped the character
- Motivations, goals, fears, and internal conflicts
- Skills, abilities, or notable accomplishments
- Memorable quotes or defining moments
- How the character has grown or changed
- Any ongoing storylines or unresolved character arcs

Write in a way that brings the character to life for someone who hasn't met them, preserving the unique voice and essence that makes this character memorable. This summary will help provide rich context for storytelling.

Source content:
${text}`,
    
    metaSummary: (summaryText) => `Create a comprehensive adventure chronicle that weaves together these individual summaries into a cohesive narrative. This should read like a rich campaign summary that captures the epic scope of the character's journey.

**IMPORTANT**: Maximum 750 words. Do not make the chronicle longer than the combined source summaries - if the source material is shorter than 750 words, keep your chronicle shorter as well.

Structure your chronicle to include:
- Overarching story arcs and how they developed
- Character growth and evolution throughout the adventures
- Key relationships formed, lost, or transformed
- Major conflicts, challenges, and how they were resolved
- Important discoveries, revelations, or world-building elements
- Recurring themes or patterns in the character's choices
- Memorable moments that defined the campaign
- Current status and ongoing storylines

Write this as an engaging narrative that could serve as a campaign recap, preserving the epic feel and emotional weight of the character's journey. Focus on how individual adventures connect to create a larger, meaningful story.

Individual adventure summaries:
${summaryText}`
  }
};