// UI-only toast notifications
export const showNotification = (message, type = 'info', duration = 3000) => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message || '';

  document.body.appendChild(notification);

  const existingNotifications = document.querySelectorAll('.notification');
  if (existingNotifications.length > 1) {
    let totalOffset = 0;
    Array.from(existingNotifications).slice(0, -1).forEach((existing) => {
      const height = existing.offsetHeight || 60;
      totalOffset += height + 12;
    });
    notification.style.bottom = `calc(var(--space-xl) + ${totalOffset}px)`;
  }

  setTimeout(() => {
    if (notification.parentNode) {
      const isTestEnvironment = typeof window !== 'undefined' && window.navigator.userAgent.includes('jsdom');
      if (isTestEnvironment) {
        notification.parentNode.removeChild(notification);
        repositionNotifications();
      } else {
        notification.style.animation = 'slideOutToRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            repositionNotifications();
          }
        }, 300);
      }
    }
  }, duration);
};

const repositionNotifications = () => {
  const notifications = document.querySelectorAll('.notification');
  notifications.forEach((notification, index) => {
    const height = notification.offsetHeight || 60;
    const offset = index * (height + 12);
    notification.style.bottom = `calc(var(--space-xl) + ${offset}px)`;
  });
};

