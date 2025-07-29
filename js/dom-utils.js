// DOM Utilities - Common DOM manipulation functions
// Following functional programming principles and style guide

import { safeDomOperation, createSuccess, createError } from './error-handling.js';

// Pure function to create DOM elements with optional attributes
export const createElement = (tag, className = '', content = '') => {
  return safeDomOperation(() => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  }, 'createElement');
};

// Pure function to create element with attributes
export const createElementWithAttributes = (tag, attributes = {}) => {
  return safeDomOperation(() => {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'textContent' || key === 'innerHTML') {
        element[key] = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }, 'createElementWithAttributes');
};

// Pure function to safely get element by ID
export const getElementById = (id) => {
  return safeDomOperation(() => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with ID '${id}' not found`);
    }
    return element;
  }, `getElementById(${id})`);
};

// Pure function to safely query selector
export const querySelector = (selector) => {
  return safeDomOperation(() => {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector '${selector}' not found`);
    }
    return element;
  }, `querySelector(${selector})`);
};

// Pure function to safely set element content
export const setElementContent = (elementId, content) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
      return element;
    }
    return null;
  }, `setElementContent(${elementId})`);
};

// Pure function to safely set element HTML
export const setElementHTML = (elementId, html) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = html;
      return element;
    }
    return null;
  }, `setElementHTML(${elementId})`);
};

// Pure function to safely add class to element
export const addClass = (elementId, className) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add(className);
      return element;
    }
    return null;
  }, `addClass(${elementId}, ${className})`);
};

// Pure function to safely remove class from element
export const removeClass = (elementId, className) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove(className);
      return element;
    }
    return null;
  }, `removeClass(${elementId}, ${className})`);
};

// Pure function to safely toggle class on element
export const toggleClass = (elementId, className) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.toggle(className);
      return element;
    }
    return null;
  }, `toggleClass(${elementId}, ${className})`);
};

// Pure function to safely clear element content
export const clearElement = (elementId) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '';
      return element;
    }
    return null;
  }, `clearElement(${elementId})`);
};

// Pure function to safely append child to element
export const appendChild = (parentId, child) => {
  return safeDomOperation(() => {
    const parent = document.getElementById(parentId);
    if (parent && child) {
      parent.appendChild(child);
      return parent;
    }
    return null;
  }, `appendChild(${parentId})`);
};

// Pure function to safely add event listener
export const addEventListener = (elementId, event, handler) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element && typeof handler === 'function') {
      element.addEventListener(event, handler);
      return element;
    }
    return null;
  }, `addEventListener(${elementId}, ${event})`);
};

// Pure function to safely focus element
export const focusElement = (elementId) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      return element;
    }
    return null;
  }, `focusElement(${elementId})`);
};

// Pure function to safely get element value
export const getElementValue = (elementId) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    return element?.value || '';
  }, `getElementValue(${elementId})`);
};

// Pure function to safely set element value
export const setElementValue = (elementId, value) => {
  return safeDomOperation(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = value;
      return element;
    }
    return null;
  }, `setElementValue(${elementId})`);
};