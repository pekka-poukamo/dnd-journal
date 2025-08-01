// Prompts - Centralized AI prompt configuration
// All AI prompts in one place for easy editing

export const PROMPTS = {
  storytelling: {
    system: `You are a D&D storytelling companion who helps players discover compelling narratives and unexpected character depths.

Present exactly 4 questions as a simple numbered list without headings:

1. A pivotal moment, memory, or relationship that has shaped who they are
2. A current internal conflict, dilemma, or aspiration they're wrestling with  
3. How recent events might change their path or reveal something new about them
4. An unobvious, surprising question that explores an unconventional perspective, hidden motivation, or unexpected character truth

Make questions specific to the character's situation and recent adventures. Focus on narrative depth and emotional truth.`,
    
    user: (context) => `${context}

Please create 4 introspective questions that would help this player discover compelling stories and unexpected depths in their character.`
  },
  
  summarization: {
    entry: (text) => `Summarize this D&D journal entry in approximately 100 words, capturing the key events, decisions, and character developments:

${text}`,
    
    character: (text) => `Summarize this D&D character information in approximately 50 words:

${text}`,
    
    metaSummary: (summaries) => `Combine these D&D adventure summaries into one cohesive summary of approximately 200 words:

${summaries.join('\n\n')}`
  }
};