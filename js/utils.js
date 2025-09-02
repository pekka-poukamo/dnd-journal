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
export const generateId = () => Date.now().toString();

// Pure function to format dates
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
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

// Simple markdown parser for basic formatting
export const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Trim whitespace from start and end
  text = text.trim();
  if (!text) return '';
  
  let result = text;
  
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
  
  // Process simple lists - handle unordered lists first (both - and *)
  result = result.replace(/^[-*] (.+)(\n[-*] .+)*/gm, (match) => {
    const items = match.split('\n').map(line => {
      const content = line.replace(/^[-*] /, '').trim();
      return content ? `<li>${content}</li>` : '<li></li>';
    }).join('');
    return `<ul>${items}</ul>`;
  });
  
  // Handle ordered lists
  result = result.replace(/^\d+\. (.+)(\n\d+\. .+)*/gm, (match) => {
    const items = match.split('\n').map(line => {
      const content = line.replace(/^\d+\. /, '').trim();
      return content ? `<li>${content}</li>` : '<li></li>';
    }).join('');
    return `<ol>${items}</ol>`;
  });
  
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
export const showNotification = (message, type = 'info', duration = 3000) => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message || '';
  
  // Add to body with proper positioning
  document.body.appendChild(notification);
  
  // Stack notifications by adjusting bottom position
  const existingNotifications = document.querySelectorAll('.notification');
  if (existingNotifications.length > 1) {
    let totalOffset = 0;
    // Calculate offset based on existing notifications (excluding the current one)
    Array.from(existingNotifications).slice(0, -1).forEach(existing => {
      // Use offsetHeight if available, otherwise fallback to a reasonable default for tests
      const height = existing.offsetHeight || 60; // Default height for test environments
      totalOffset += height + 12; // 12px gap between notifications
    });
    notification.style.bottom = `calc(var(--space-xl) + ${totalOffset}px)`;
  }
  
  // Auto-remove after specified duration
  setTimeout(() => {
    if (notification.parentNode) {
      // Check if we're in a test environment (JSDOM doesn't support CSS animations well)
      const isTestEnvironment = typeof window !== 'undefined' && window.navigator.userAgent.includes('jsdom');
      
      if (isTestEnvironment) {
        // In test environment, remove immediately without animation
        notification.parentNode.removeChild(notification);
        repositionNotifications();
      } else {
        // In browser environment, use animation
        notification.style.animation = 'slideOutToRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            // Reposition remaining notifications
            repositionNotifications();
          }
        }, 300);
      }
    }
  }, duration);
};

// Helper function to reposition remaining notifications after one is removed
const repositionNotifications = () => {
  const notifications = document.querySelectorAll('.notification');
  notifications.forEach((notification, index) => {
    // Use offsetHeight if available, otherwise fallback to a reasonable default for tests
    const height = notification.offsetHeight || 60; // Default height for test environments
    const offset = index * (height + 12);
    notification.style.bottom = `calc(var(--space-xl) + ${offset}px)`;
  });
};


