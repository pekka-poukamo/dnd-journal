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
    entry: (text, maxWords = 400) => `Summarize this D&D journal entry. Maximum ${maxWords} words. Do not add any extra content beyond what's provided. Return summary only, no format mentions or self-referencing.

${text}`,
    
    character: (text, maxWords = 500) => `Summarize this character information. Maximum ${maxWords} words. Do not add any extra content beyond what's provided. Return summary only, no format mentions or self-referencing.

${text}`,
    
    metaSummary: (summaryText, maxWords = 750) => `Create a comprehensive adventure chronicle from these summaries. Maximum ${maxWords} words. Do not add any extra content beyond what's provided. Return summary only, no format mentions or self-referencing.

${summaryText}`
  }
};