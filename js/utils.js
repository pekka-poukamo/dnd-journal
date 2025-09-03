// Shared Utilities - Common functions used across modules
// Following functional programming principles and style guide

// Note: STORAGE_KEYS removed per ADR-0004 - use Yjs Maps instead
// All data is now stored in Yjs Maps accessed via functional getters: getCharacterMap(), getJournalMap(), getSettingsMap(), getSummariesMap()

// Pure function for safe JSON parsing
export const safeParseJSON = (jsonString) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Note: localStorage functions have been removed per ADR-0004
// All data persistence must use Yjs Maps - see js/yjs.js

// Pure function to generate unique IDs
export const generateId = (() => {
  let counter = 0;
  return () => {
    counter = (counter + 1) % 1000;
    const time = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    return `${time}-${counter}-${rand}`;
  };
})();

// Pure function to format dates
export const formatDate = (timestamp) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Pure function to count words
export const getWordCount = (text) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// Pure function to create debounced function
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Pure function to validate entry data
export const isValidEntry = (entryData) => 
  !!(entryData && entryData.content != null && entryData.content.trim().length > 0);

// Pure function to sort entries by date (newest first)
export const sortEntriesByDate = (entries) => 
  [...entries].sort((a, b) => b.timestamp - a.timestamp);

// Escape HTML special characters to prevent injection
const escapeHtml = (input) => {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Simple markdown parser for basic formatting (safe against HTML injection)
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Trim whitespace from start and end
  text = text.trim();
  if (!text) return '';
  
  // Escape any raw HTML first
  let result = escapeHtml(text);
  
  // Process headers first (before other replacements)
  result = result
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Process inline formatting before list processing
  result = result
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>'); // Code
  
  // Process lists with nesting support based on indentation
  // Build lists by scanning lines and managing a stack of list contexts
  {
    const lines = result.split('\n');
    const listStack = [];
    const outputParts = [];
    let openLi = false;
    let openLiIndent = -1;

    const countIndent = (prefix) => {
      if (!prefix) return 0;
      // Treat a tab as two spaces to keep behavior simple and predictable
      const normalized = prefix.replace(/\t/g, '  ');
      return normalized.length;
    };

    const closeLiIfOpen = () => {
      if (openLi) {
        outputParts.push('</li>');
        openLi = false;
        openLiIndent = -1;
      }
    };

    const closeListsUntil = (targetIndent) => {
      while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
        closeLiIfOpen();
        const ctx = listStack.pop();
        outputParts.push(`</${ctx.type}>`);
      }
    };

    const openListIfNeeded = (type, indent) => {
      const top = listStack[listStack.length - 1];
      if (!top || top.indent < indent) {
        outputParts.push(`<${type}>`);
        listStack.push({ type, indent });
        return;
      }
      if (top.indent === indent && top.type !== type) {
        // Switch list type at the same indentation level
        closeLiIfOpen();
        listStack.pop();
        outputParts.push(`</${top.type}>`);
        outputParts.push(`<${type}>`);
        listStack.push({ type, indent });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([ \t]*)([-*]|\d+\.)\s+(.*)$/);
      if (match) {
        const indent = countIndent(match[1] || '');
        const marker = match[2];
        const itemType = /\.$/.test(marker) ? 'ol' : 'ul';
        const content = (match[3] || '').trim();

        // If a new item does not increase indent relative to the open <li>, close it first
        if (openLi && indent <= openLiIndent) {
          closeLiIfOpen();
        }

        // Adjust list stack based on indentation
        closeListsUntil(indent);
        openListIfNeeded(itemType, indent);

        // Start a new list item (keep it open to allow nested lists inside)
        outputParts.push(`<li>${content}`);
        openLi = true;
        openLiIndent = indent;
        continue;
      }

      // Non-list line: close any open list structures and output the line as-is
      if (listStack.length > 0) {
        closeLiIfOpen();
        closeListsUntil(-1);
      }
      outputParts.push(line + '\n');
    }

    // Close any remaining open items/lists
    if (listStack.length > 0) {
      closeLiIfOpen();
      closeListsUntil(-1);
    }

    result = outputParts.join('');
  }
  
  // Handle paragraphs and line breaks
  // Split by double line breaks to identify paragraphs
  const paragraphs = result.split(/\n\n+/);
  
  // Process each paragraph
  result = paragraphs.map(paragraph => {
    if (!paragraph.trim()) return '';
    
    // If it's already a header or list, don't wrap in paragraph
    if (paragraph.match(/^<(h[1-6]|ul|ol)/)) {
      return paragraph;
    }
    
    // Replace single line breaks with <br> tags
    const withLineBreaks = paragraph.replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags
    return `<p>${withLineBreaks}</p>`;
  }).join('');
  
  // Clean up any empty paragraph tags
  result = result.replace(/<p><\/p>/g, '');
  
  return result;
};

// Simple text formatter for AI prompts - supports newlines and basic formatting
export const formatAIPromptText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/^\d+\.\s/gm, '<strong>$&</strong>') // Numbered list items (bold the number) - do this first
    .replace(/\n\n/g, '__PARAGRAPH__') // Paragraph breaks
    .replace(/\n/g, '<br>') // Line breaks
    .replace(/__PARAGRAPH__/g, '<br><br>') // Convert paragraph breaks
    .trim();
};

// Validate room/journal names. Allowed:
// - lowercase Unicode letters (including accents), numbers
// - hyphen '-'
// Disallow spaces and other punctuation for URL/path safety
export const isValidRoomName = (input) => {
  const value = (input || '').toString();
  const pattern = /^[\p{Ll}\p{Nd}-]+$/u;
  return pattern.test(value);
};

// Pure function to get form data from any form
export const getFormData = (form) => {
  // Try FormData first, fallback to manual extraction for test environments
  try {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    // If FormData worked but no entries were found, fall back to manual method
    if (Object.keys(data).length === 0) {
      throw new Error('FormData returned no entries');
    }
    return data;
  } catch (error) {
    // Manual extraction for test environments or edge cases
    const data = {};
    if (form && form.elements) {
      Array.from(form.elements).forEach(element => {
        if (element.name) {
          if (element.type === 'checkbox') {
            data[element.name] = element.checked;
          } else {
            data[element.name] = element.value || '';
          }
        }
      });
    }
    return data;
  }
};

// Pure function to show toast notifications
export { showNotification } from './components/notifications.js';


