// DOM Utilities - Simple DOM manipulation functions
// Following radical simplicity principles

// Simple element creation
export const createElement = (tag, className = '', content = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
};

// Simple element creation with attributes
export const createElementWithAttributes = (tag, attributes = {}) => {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent' || key === 'innerHTML') {
      element[key] = value;
    } else {
      element.setAttribute(key, value);
    }
  });
  return element;
};

// Simple element selection
export const getElementById = (id) => document.getElementById(id);
export const querySelector = (selector) => document.querySelector(selector);

// Simple content setting
export const setElementContent = (elementId, content) => {
  const element = document.getElementById(elementId);
  if (element) element.textContent = content;
};

export const setElementHTML = (elementId, html) => {
  const element = document.getElementById(elementId);
  if (element) element.innerHTML = html;
};

// Simple class manipulation
export const addClass = (elementId, className) => {
  const element = document.getElementById(elementId);
  if (element) element.classList.add(className);
};

export const removeClass = (elementId, className) => {
  const element = document.getElementById(elementId);
  if (element) element.classList.remove(className);
};

export const toggleClass = (elementId, className) => {
  const element = document.getElementById(elementId);
  if (element) element.classList.toggle(className);
};

// Simple element clearing
export const clearElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) element.innerHTML = '';
};

// Simple child appending
export const appendChild = (parentId, child) => {
  const parent = document.getElementById(parentId);
  if (parent && child) parent.appendChild(child);
};

// Simple event listening
export const addEventListener = (elementId, event, handler) => {
  const element = document.getElementById(elementId);
  if (element && typeof handler === 'function') {
    element.addEventListener(event, handler);
  }
};

// Simple focus
export const focusElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) element.focus();
};

// Simple value getting/setting
export const getElementValue = (elementId) => {
  const element = document.getElementById(elementId);
  return element?.value || '';
};

export const setElementValue = (elementId, value) => {
  const element = document.getElementById(elementId);
  if (element) element.value = value;
};