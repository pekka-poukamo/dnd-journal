// Generic collapsible component for summary-like blocks
// Expects pre-formatted HTML content string

export const createCollapsible = (showLabelText, hideLabelText, htmlContent) => {
  const wrapper = document.createElement('div');

  const toggleButton = document.createElement('button');
  toggleButton.className = 'entry-summary__toggle';
  toggleButton.type = 'button';

  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'entry-summary__label';
  toggleLabel.textContent = showLabelText;

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'entry-summary__icon';
  toggleIcon.textContent = '▼';

  toggleButton.appendChild(toggleLabel);
  toggleButton.appendChild(toggleIcon);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'entry-summary__content';
  contentDiv.style.display = 'none';
  contentDiv.innerHTML = htmlContent || '';

  toggleButton.addEventListener('click', () => {
    const isExpanded = contentDiv.style.display !== 'none';
    contentDiv.style.display = isExpanded ? 'none' : 'block';
    toggleButton.classList.toggle('entry-summary__toggle--expanded', !isExpanded);
    toggleLabel.textContent = isExpanded ? showLabelText : hideLabelText;
  });

  wrapper.appendChild(toggleButton);
  wrapper.appendChild(contentDiv);
  return wrapper;
};

