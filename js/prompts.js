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

Make questions specific to the character's situation and complete adventure history. Focus on narrative depth and emotional truth.`,
    
    user: (context) => `${context}

Please create 4 introspective questions that would help this player discover compelling stories and unexpected depths in their character.`
  },
  
  summarization: {
    entry: (text) => `Summarize the following content. Keep it concise and preserve the original brevity if the content is already short. If the content is substantial, condense to around 100 words:

${text}`,
    
    character: (text) => `Summarize the following content. Preserve brevity for short content, or condense longer descriptions to around 50 words:

${text}`,
    
    metaSummary: (summaryText) => `Provide a comprehensive summary of the following content. Aim for around 300 words:

${summaryText}`
  }
};