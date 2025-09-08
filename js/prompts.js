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
    entry: (text) => `Generate structured content for this D&D journal entry.

Return your response as a valid JSON object with this exact structure:
{
  "title": "A title",
  "subtitle": "A subtitle"
}

Strict rules:
- Use only information explicitly present in the entry text. Do not invent people, places, events, or outcomes not stated.
- If the entry is very short or generic, produce a minimal, literal title and a brief subtitle that paraphrases the entry without adding details.
- Title: A title of the journal entry in the style of A Tale of Two Cities by Dickens
- Subtitle: A subheading of the journal entry, a 40 word or less in the style of Dickens, starting with "In which".
- Return only the JSON object, no additional text or formatting.

Entry content:
${text}`,
    
    character: (text, maxWords = 500) => `Summarize this character information. Maximum ${maxWords} words. Do not add any extra content beyond what's provided. Return summary only, no format mentions or self-referencing.

${text}`,
    
    adventureSummary: (summaryText, maxWords = 750) => `Create a comprehensive adventure summary from these entry summaries. Maximum ${maxWords} words. Do not add any extra content beyond what's provided. Return summary only, no format mentions or self-referencing.

${summaryText}`
  },

  partTitle: (text, maxWords = 12) => `Generate a concise, evocative title for this D&D campaign part.

Constraints:
- Maximum ${maxWords} words
- No quotation marks or punctuation at the end
- Capture the core themes and arc suggested by the text
- Return only the title text

Source text:
${text}`
};