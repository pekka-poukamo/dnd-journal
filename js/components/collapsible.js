// Generic collapsible component for summary-like blocks
// Expects pre-formatted HTML content string
import { parseMarkdown } from '../utils.js';

export const createCollapsible = (showLabelText, hideLabelText, htmlOrElement) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'collapsible';

  const toggleButton = document.createElement('button');
  toggleButton.className = 'collapsible__toggle';
  toggleButton.type = 'button';

  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'collapsible__label';
  toggleLabel.textContent = showLabelText;

  toggleButton.appendChild(toggleLabel);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'collapsible__content';
  if (typeof htmlOrElement === 'string') {
    contentDiv.innerHTML = htmlOrElement ? parseMarkdown(htmlOrElement) : '';
  } else if (htmlOrElement && htmlOrElement.nodeType === 1) {
    contentDiv.appendChild(htmlOrElement);
  }

  toggleButton.addEventListener('click', () => {
    const isExpanded = contentDiv.classList.contains('collapsible__content--expanded');
    contentDiv.classList.toggle('collapsible__content--expanded', !isExpanded);
    toggleButton.classList.toggle('collapsible__toggle--expanded', !isExpanded);
    toggleLabel.textContent = isExpanded ? showLabelText : hideLabelText;
  });

  wrapper.appendChild(contentDiv);
  wrapper.appendChild(toggleButton);
  return wrapper;
};

