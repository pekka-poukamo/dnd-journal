// js/utils/notifications.js - Notification system

import { createElement } from './dom.js';

// Pure function for creating notification element
const createNotificationElement = (message, type = 'success', duration = 3000) => {
  const notification = createElement('div', {
    className: `notification notification--${type}`,
    role: 'alert',
    'aria-live': 'polite'
  }, [message]);

  // Auto-remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);

  return notification;
};

// Pure function for showing notifications
export const showNotification = (message, type = 'success', duration = 3000) => {
  // Remove any existing notifications of the same type
  const existingNotifications = document.querySelectorAll(`.notification--${type}`);
  existingNotifications.forEach(notification => notification.remove());

  const notification = createNotificationElement(message, type, duration);
  document.body.appendChild(notification);

  return notification;
};

// Convenience functions for different notification types
export const showSuccess = (message, duration = 3000) => 
  showNotification(message, 'success', duration);

export const showError = (message, duration = 5000) => 
  showNotification(message, 'error', duration);

export const showWarning = (message, duration = 4000) => 
  showNotification(message, 'warning', duration);

export const showInfo = (message, duration = 3000) => 
  showNotification(message, 'info', duration);

// Function to clear all notifications
export const clearNotifications = () => {
  const notifications = document.querySelectorAll('.notification');
  notifications.forEach(notification => notification.remove());
};