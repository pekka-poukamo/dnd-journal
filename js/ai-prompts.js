// AI Prompts - AI prompt generation and formatting
// Following functional programming principles and style guide

import { getWordCount } from './utils.js';
import { handleError, createSuccess } from './error-handling.js';
import { calculateTotalTokens } from './token-estimation.js';

// ================================
// SYSTEM PROMPTS
// ================================

// Unified narrative-focused system prompt with unobvious question element
export const NARRATIVE_INTROSPECTION_PROMPT = `You are a D&D storytelling companion who helps players discover compelling narratives and unexpected character depths.

Present exactly 4 questions as a simple numbered list without headings:

1. A pivotal moment, memory, or relationship that has shaped who they are
2. A current internal conflict, dilemma, or aspiration they're wrestling with  
3. How recent events might change their path or reveal something new about them
4. An unobvious, surprising question that explores an unconventional perspective, hidden motivation, or unexpected character truth

Make questions specific to the character's situation and recent adventures. Focus on narrative depth and emotional truth.`;

// System prompt for summarization
export const SUMMARIZATION_PROMPT = `You are a precise summarization assistant. Create concise, informative summaries that capture key events, decisions, and character developments.`;

// ================================
// PROMPT FORMATTING FUNCTIONS
// ================================

// Pure function to format character data for AI
export const formatCharacterForAI = (character) => {
  if (!character) {
    return 'No character information available';
  }
  
  const parts = [];
  
  if (character.name && character.name.trim()) {
    const formattedCharacter = {
      name: character.name.trim(),
      race: character.race || '',
      class: character.class || ''
    };
    
    const characterLine = formattedCharacter.race || formattedCharacter.class ? 
      `${formattedCharacter.name}, a ${formattedCharacter.race || 'character'} ${formattedCharacter.class || 'adventurer'}` :
      formattedCharacter.name;
    
    parts.push(`CHARACTER: ${characterLine}`);
    
    if (character.backstory && character.backstory.trim()) {
      parts.push(`BACKSTORY: ${character.backstory.trim()}`);
    }
    
    if (character.notes && character.notes.trim()) {
      parts.push(`NOTES: ${character.notes.trim()}`);
    }
  } else {
    parts.push('CHARACTER: Unnamed character');
  }
  
  return parts.join('\n');
};

// Pure function to format single entry for AI
export const formatEntryForAI = (entry, includeSummary = false) => {
  if (!entry) {
    return '';
  }
  
  const parts = [`ENTRY: ${entry.title || 'Untitled'}`];
  
  if (includeSummary && entry.summary) {
    parts.push(`SUMMARY: ${entry.summary}`);
  } else if (entry.content) {
    parts.push(`CONTENT: ${entry.content}`);
  }
  
  return parts.join('\n');
};

// Pure function to format multiple entries for AI
export const formatEntriesForAI = (entries = [], maxEntries = 10) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 'No journal entries available';
  }
  
  const limitedEntries = entries.slice(0, maxEntries);
  const formattedEntries = limitedEntries.map((entry, index) => {
    // Use summaries for older entries (beyond first 3)
    const includeSummary = index >= 3;
    return formatEntryForAI(entry, includeSummary);
  });
  
  return `RECENT ADVENTURES:\n${formattedEntries.join('\n\n')}`;
};

// ================================
// PROMPT GENERATION FUNCTIONS  
// ================================

// Pure function to create introspection prompt
export const createIntrospectionPrompt = (character, entries = []) => {
  const characterSection = formatCharacterForAI(character);
  const entriesSection = formatEntriesForAI(entries);
  
  return `${characterSection}

${entriesSection}

Based on this character and their recent adventures, generate introspective questions that help explore their story and reveal unexpected depths.`;
};

// Pure function to create summarization prompt
export const createSummarizationPrompt = (entry, targetLength = 100) => {
  if (!entry || !entry.content) {
    return null;
  }
  
  const wordCount = getWordCount(entry.content);
  const adjustedTargetLength = Math.max(50, Math.min(300, Math.floor(wordCount * 0.25)));
  
  return `Summarize this text in approximately ${adjustedTargetLength} words, capturing the key events, decisions, and character developments.

Title: ${entry.title || 'Untitled'}
Content: ${entry.content}`;
};

// Pure function to create prompt for meta-summarization
export const createMetaSummarizationPrompt = (summaries, targetLength = 200) => {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return null;
  }
  
  const summaryTexts = summaries.map(s => s.summary || s).join('\n\n');
  
  return `Create a comprehensive summary that combines these individual summaries in approximately ${targetLength} words:

${summaryTexts}`;
};

// ================================
// PROMPT VALIDATION AND OPTIMIZATION
// ================================

// Pure function to validate prompt structure
export const validatePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return {
      valid: false,
      issues: ['Prompt must be a non-empty string']
    };
  }
  
  const trimmed = prompt.trim();
  const issues = [];
  
  if (trimmed.length < 10) {
    issues.push('Prompt is too short');
  }
  
  if (trimmed.length > 10000) {
    issues.push('Prompt may be too long for optimal processing');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    length: trimmed.length
  };
};

// Function to create optimized prompt with token considerations
export const createOptimizedPrompt = async (character, entries, maxTokens = 3000) => {
  try {
    let basePrompt = createIntrospectionPrompt(character, entries);
    
    // Check if we need to truncate
    const tokenCount = await calculateTotalTokens([{ content: basePrompt }]);
    
    if (tokenCount <= maxTokens) {
      return createSuccess({
        prompt: basePrompt,
        tokenCount,
        truncated: false
      });
    }
    
    // Try with fewer entries
    const reducedEntries = entries.slice(0, Math.max(1, Math.floor(entries.length * 0.7)));
    const reducedPrompt = createIntrospectionPrompt(character, reducedEntries);
    const reducedTokenCount = await calculateTotalTokens([{ content: reducedPrompt }]);
    
    return createSuccess({
      prompt: reducedPrompt,
      tokenCount: reducedTokenCount,
      truncated: true,
      originalEntries: entries.length,
      usedEntries: reducedEntries.length
    });
  } catch (error) {
    return handleError('createOptimizedPrompt', error);
  }
};

// ================================
// PROMPT TEMPLATES
// ================================

// Pure function to create message array for API
export const createMessageArray = (systemPrompt, userPrompt) => [
  {
    role: 'system',
    content: systemPrompt
  },
  {
    role: 'user',
    content: userPrompt
  }
];

// Pure function to create introspection message array
export const createIntrospectionMessages = (character, entries) => {
  const userPrompt = createIntrospectionPrompt(character, entries);
  return createMessageArray(NARRATIVE_INTROSPECTION_PROMPT, userPrompt);
};

// Pure function to create summarization message array
export const createSummarizationMessages = (entry, targetLength = 100) => {
  const userPrompt = createSummarizationPrompt(entry, targetLength);
  if (!userPrompt) {
    return null;
  }
  return createMessageArray(SUMMARIZATION_PROMPT, userPrompt);
};

// ================================
// PROMPT INFORMATION FUNCTIONS
// ================================

// Pure function to get prompt description
export const getPromptDescription = (promptType = 'introspection') => {
  const descriptions = {
    introspection: 'Narrative-focused introspection with 3 core questions + 1 unobvious question',
    summarization: 'Concise summary capturing key events and character development',
    meta: 'Comprehensive summary combining multiple individual summaries'
  };
  
  return descriptions[promptType] || descriptions.introspection;
};

// Pure function to get prompt metadata
export const getPromptMetadata = () => ({
  version: '2.0',
  format: '3+1 Questions',
  focus: 'Narrative depth and emotional truth',
  features: ['Pivotal moments', 'Internal conflicts', 'Future paths', 'Unobvious insights']
});