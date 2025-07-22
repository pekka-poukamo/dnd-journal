// js/utils/dom.js - DOM manipulation utilities

// Pure function for creating DOM elements
export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
};

// Pure function for creating text nodes
export const createTextNode = (text) => document.createTextNode(text);

// Higher-order function for event delegation
export const createDelegatedHandler = (selector, handler) => (event) => {
  const target = event.target.closest(selector);
  if (target) handler(event, target);
};

// Higher-order function for event handlers
export const createEventHandler = (handler) => (event) => {
  event.preventDefault();
  return handler(event);
};

// Pure function for clearing element content
export const clearElement = (element) => {
  element.replaceChildren();
  return element;
};

// Pure function for replacing element content
export const replaceContent = (element, ...newChildren) => {
  element.replaceChildren(...newChildren);
  return element;
};

// Pure function for adding classes
export const addClass = (element, ...classNames) => {
  element.classList.add(...classNames);
  return element;
};

// Pure function for removing classes
export const removeClass = (element, ...classNames) => {
  element.classList.remove(...classNames);
  return element;
};

// Pure function for toggling classes
export const toggleClass = (element, className, force = undefined) => {
  element.classList.toggle(className, force);
  return element;
};

// Pure function for checking if element has class
export const hasClass = (element, className) => element.classList.contains(className);

// Pure function for showing elements
export const show = (element) => removeClass(element, 'hidden');

// Pure function for hiding elements
export const hide = (element) => addClass(element, 'hidden');

// Pure function for toggling visibility
export const toggle = (element, force = undefined) => toggleClass(element, 'hidden', !force);

// Pure function for querying single element
export const query = (selector, context = document) => context.querySelector(selector);

// Pure function for querying multiple elements
export const queryAll = (selector, context = document) => 
  Array.from(context.querySelectorAll(selector));

// Pure function for getting element data
export const getData = (element, key) => element.dataset[key];

// Pure function for setting element data
export const setData = (element, key, value) => {
  element.dataset[key] = value;
  return element;
};

// Pure function for getting form data as object
export const getFormData = (form) => {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
};

// Pure function for setting form data from object
export const setFormData = (form, data) => {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) {
      if (field.type === 'checkbox') {
        field.checked = Boolean(value);
      } else if (field.type === 'radio') {
        const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        field.value = value;
      }
    }
  });
  return form;
};

// Utility functions for common DOM operations
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Pure function for smooth scrolling
export const smoothScrollTo = (element, options = {}) => {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  });
};

// Pure function for focus management
export const focusElement = (element, options = {}) => {
  element.focus(options);
  return element;
};

// Pure function for loading state management
export const setLoading = (element, isLoading = true) => {
  return isLoading 
    ? addClass(element, 'loading')
    : removeClass(element, 'loading');
};

// Pure function for error state management
export const setError = (element, hasError = true) => {
  return hasError 
    ? addClass(element, 'error')
    : removeClass(element, 'error');
};