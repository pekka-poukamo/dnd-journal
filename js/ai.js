// AI Module - Simple OpenAI Integration
// Direct YJS data binding

import { getWordCount } from './utils.js';
import { getSummary, saveSummary } from './yjs-direct.js';
import { getSettings } from './yjs-direct.js';
import { getEntries } from './yjs-direct.js';
import { getEncoding } from 'js-tiktoken';

// Simple tiktoken usage - one liner when needed
const getTokenCount = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  try {
    return getEncoding('cl100k_base').encode(text).length;
  } catch {
    return Math.ceil(text.length / 4); // fallback
  }
};

// Export for compatibility with tests
export const estimateTokenCount = getTokenCount;

// Simple function to calculate total tokens for messages
export const calculateTotalTokens = (messages) => {
  if (!Array.isArray(messages)) return 0;
  
  return messages.reduce((total, message) => {
    const contentTokens = getTokenCount(message.content || '');
    const overhead = 4; // Simple overhead estimate
    return total + contentTokens + overhead;
  }, 0);
};

// Simple system prompt
export const NARRATIVE_INTROSPECTION_PROMPT = `You are a D&D storytelling companion who helps players discover compelling narratives and unexpected character depths.

Present exactly 4 questions as a simple numbered list without headings:

1. A pivotal moment, memory, or relationship that has shaped who they are
2. A current internal conflict, dilemma, or aspiration they're wrestling with  
3. How recent events might change their path or reveal something new about them
4. An unobvious, surprising question that explores an unconventional perspective, hidden motivation, or unexpected character truth

Make questions specific to the character's situation and recent adventures. Focus on narrative depth and emotional truth.`;

// Check if AI is available
export const isAIEnabled = () => {
  try {
    const settings = getSettings();
    return settings.enableAIFeatures && settings.apiKey?.startsWith('sk-');
  } catch {
    return false;
  }
};

// Check if API key is valid format
export const hasValidApiKey = () => {
  try {
    const settings = getSettings();
    return Boolean(settings.apiKey?.startsWith('sk-'));
  } catch {
    return false;
  }
};

// Simple OpenAI API call
export const callOpenAI = async (prompt, maxTokens = 1000) => {
  const settings = getSettings();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Format character for AI
const formatCharacter = (character) => {
  if (!character?.name?.trim()) return 'CHARACTER: Unnamed character';
  
  const parts = [`CHARACTER: ${character.name.trim()}`];
  if (character.race) parts.push(`Race: ${character.race}`);
  if (character.class) parts.push(`Class: ${character.class}`);
  if (character.backstory?.trim()) parts.push(`BACKSTORY: ${character.backstory.trim()}`);
  if (character.notes?.trim()) parts.push(`NOTES: ${character.notes.trim()}`);
  
  return parts.join('\n');
};

// Format entries for AI
const formatEntries = (entries = []) => {
  if (!entries.length) return 'No journal entries available';
  
  const formatted = entries.slice(0, 10).map(entry => 
    `ENTRY: ${entry.title || 'Untitled'}\nCONTENT: ${entry.content || ''}`
  );
  
  return `RECENT ADVENTURES:\n${formatted.join('\n\n')}`;
};

// Create introspection prompt
export const createIntrospectionPrompt = (character, entries) => {
  const characterSection = formatCharacter(character);
  const entriesSection = formatEntries(entries);
  
  return `${characterSection}\n\n${entriesSection}\n\nBased on this character and their recent adventures, generate introspective questions that help explore their story and reveal unexpected depths.`;
};

// Generate introspection prompt
export const generateIntrospectionPrompt = async (character, entries) => {
  if (!isAIEnabled()) return null;
  
  try {
    const prompt = createIntrospectionPrompt(character, entries);
    return await callOpenAI(prompt);
  } catch (error) {
    console.error('Failed to generate introspection prompt:', error);
    return null;
  }
};

// Generate entry summary
export const generateEntrySummary = async (entry) => {
  if (!isAIEnabled() || !entry.content || entry.content.length < 50) return null;
  
  try {
    const wordCount = getWordCount(entry.content);
    const targetLength = Math.max(50, Math.min(200, Math.floor(wordCount * 0.3)));
    
    const prompt = `Summarize this in ${targetLength} words: ${entry.title}\n${entry.content}`;
    const summary = await callOpenAI(prompt, targetLength * 4);
    
    return {
      id: entry.id,
      summary,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
};

// Get or generate summary
export const getEntrySummary = async (entry) => {
  const existing = getSummary(entry.id);
  if (existing) return existing;
  
  const summary = await generateEntrySummary(entry);
  if (summary) saveSummary(entry.id, summary);
  
  return summary;
};

// Get preview of what would be sent to AI
export const getIntrospectionPromptForPreview = async (character, entries) => {
  // For test compatibility, always return the structure (without AI enabled check)
  const userPrompt = createIntrospectionPrompt(character, entries);
  
  return {
    systemPrompt: NARRATIVE_INTROSPECTION_PROMPT,
    user: userPrompt,
    userPrompt: userPrompt, // Alias for test compatibility
    totalTokens: getTokenCount(NARRATIVE_INTROSPECTION_PROMPT + userPrompt)
  };
};

// Simple helper to get formatted entries with summaries
export const getFormattedEntriesForAI = () => {
  try {
    const entries = getEntries();
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
};

export const getPromptDescription = () => 'Narrative-focused introspection with 3 core questions + 1 unobvious question';