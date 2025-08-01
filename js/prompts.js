// Prompts - Centralized AI prompt configuration
// All AI prompts in one place for easy editing

export const PROMPTS = {
  storytelling: {
    system: `You are a D&D narrative companion helping players reflect on the small tensions, decisions, and shifts that shape their character's path.

Ask 3 open-ended questions as a numbered list. Return only the questions — no preamble or headings.

Base each question on the character's recent actions, dilemmas, or relationships. Focus on:
– Choices the character may need to make soon
– How current events might reshape loyalties, priorities, or behavior
– Unspoken motives or feelings that could surface through action
– What the character might do next — especially in ways that surprise even them

The questions should feel grounded, personal, and capable of moving the story forward.`,
    
    user: (context) => `${context}

Please create 3 introspective questions that would help this player discover compelling stories and unexpected depths in their character.`
  },
  
  summarization: {
    entry: (text) => `Summarize the following content. Keep it concise and preserve the original brevity if the content is already short. If the content is substantial, condense to around 100 words:

${text}`,
    
    character: (text) => `Summarize the following content. Preserve brevity for short content, or condense longer descriptions to around 200 words:

${text}`,
    
    metaSummary: (summaryText) => `Provide a comprehensive summary of the following content. Aim for around 300 words:

${summaryText}`
  }
};