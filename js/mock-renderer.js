// Mock Journal Entry Renderer
export const renderMockEntries = async () => {
  try {
    const response = await fetch('mock-journal-entries.json');
    const data = await response.json();
    
    const entriesContainer = document.querySelector('.entries');
    if (!entriesContainer) {
      console.warn('Entries container not found');
      return;
    }
    
    // Clear existing content
    entriesContainer.innerHTML = '';
    
    // Render each entry with running numbers (oldest = 1, newest at top)
    data.entries.forEach((entry, index) => {
      const entryNumber = data.entries.length - index;
      const entryElement = createEntryElement(entry, entryNumber);
      entriesContainer.appendChild(entryElement);
    });
    
  } catch (error) {
    console.error('Error loading mock entries:', error);
  }
};

const createEntryElement = (entry, entryNumber) => {
  const article = document.createElement('article');
  article.className = 'entry';
  article.dataset.entryId = entry.id;

  if (!entry.title) {
    article.classList.add('entry--placeholder');
  }
  entry.title = entry.title || `Lorem Ipsum and Amet Consectur Adipiscing`;
  entry.subtitle = entry.subtitle || `In which Lorem Ipsum, a dolor, sat with Amet Consectur, waiting...`;
  entry.summary = entry.summary || `Mr. Ipsum and Mrs. Consectur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

  article.innerHTML = `
    <div class="entry-header">
      <div class="entry-title"><h3>${entryNumber}. ${entry.title}</h3></div>
      
      <div class="entry-subtitle">
        <p>${entry.subtitle}</p>
      </div>
      <div class="entry-meta">
        <time class="entry-timestamp" datetime="${entry.timestamp}">
          ${formatDate(entry.timestamp)}
        </time>
        <div class="entry-actions">
          <button class="icon-button" title="Edit">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 2.5L13.5 4.5L4.5 13.5H2.5V11.5L11.5 2.5Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="icon-button" title="Delete">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4H14M5.5 4V2.5C5.5 2.22386 5.72386 2 6 2H10C10.2761 2 10.5 2.22386 10.5 2.5V4M12.5 4V13.5C12.5 13.7761 12.2761 14 12 14H4C3.72386 14 3.5 13.7761 3.5 13.5V4H12.5Z" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <div class="entry-summary">
      <p>${entry.summary}</p>
    </div>
    <div class="entry-content entry-content--hidden">
      ${entry.content.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
    </div>
    <div class="entry-content-controls">
      <button class="entry-content-control__toggle">Show chapter</button>
    </div>
  `;
  
  // Add event listener to the toggle button
  const toggleButton = article.querySelector('.entry-content-control__toggle');
  const entryContent = article.querySelector('.entry-content');
  
  toggleButton.addEventListener('click', () => {
    entryContent.classList.toggle('entry-content--hidden');
    
    // Update button text based on current state
    if (entryContent.classList.contains('entry-content--hidden')) {
      toggleButton.textContent = 'Show chapter';
    } else {
      toggleButton.textContent = 'Hide chapter';
    }
  });
  
  return article;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
