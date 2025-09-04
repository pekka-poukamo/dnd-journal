// Generic collapsible component for summary-like blocks
// Expects pre-formatted HTML content string

export const createCollapsible = (showLabelText, hideLabelText, htmlOrElement) => {
  const wrapper = document.createElement('div');

  const toggleButton = document.createElement('button');
  // General class plus legacy entry class for compatibility
  toggleButton.className = 'collapsible__toggle entry-summary__toggle';
  toggleButton.type = 'button';

  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'collapsible__label entry-summary__label';
  toggleLabel.textContent = showLabelText;

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'collapsible__icon entry-summary__icon';
  toggleIcon.textContent = '▼';

  toggleButton.appendChild(toggleLabel);
  toggleButton.appendChild(toggleIcon);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'collapsible__content entry-summary__content';
  contentDiv.style.display = 'none';
  if (typeof htmlOrElement === 'string') {
    contentDiv.innerHTML = htmlOrElement || '';
  } else if (htmlOrElement && htmlOrElement.nodeType === 1) {
    contentDiv.appendChild(htmlOrElement);
  }

  toggleButton.addEventListener('click', () => {
    const isExpanded = contentDiv.style.display !== 'none';
    contentDiv.style.display = isExpanded ? 'none' : 'block';
    toggleButton.classList.toggle('collapsible__toggle--expanded entry-summary__toggle--expanded', !isExpanded);
    toggleLabel.textContent = isExpanded ? showLabelText : hideLabelText;
  });

  wrapper.appendChild(toggleButton);
  wrapper.appendChild(contentDiv);
  return wrapper;
};

