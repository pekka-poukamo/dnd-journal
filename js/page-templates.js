// Page Templates - Pure Functional HTML Generation (ADR-0002 Compliant)
// Templates create DOM structure for each page type

// Pure function to create journal page template
export const createJournalPageTemplate = () => {
  const template = document.createElement('div');
  template.className = 'journal-page';
  template.innerHTML = `
    <div class="container">
        <!-- AI Prompt Section -->
        <section id="ai-prompt" class="ai-prompt">
            <div class="ai-prompt__header">
                <h2>Writing Prompt</h2>
                <button id="regenerate-prompt-btn" class="ai-prompt__regenerate-btn">
                    Regenerate
                </button>
            </div>
            <div class="ai-prompt__content">
                <p class="ai-prompt__text" id="ai-prompt-text">
                    <!-- Content will be populated by JavaScript -->
                </p>
            </div>
        </section>

        <!-- Character Summary Section -->
        <section id="character-summary" class="character-summary character-summary--minimal">
            <h2>Character</h2>
            <div id="character-info-container" class="character-info-container">
                <!-- Character info will be rendered here by views.js -->
            </div>
        </section>
        
        <!-- New Entry Section -->
        <section class="entry-section">
            <h2>Add Entry</h2>
            <div id="entry-form-container">
                <!-- Entry form will be rendered here by journal.js -->
            </div>
        </section>
        
        <!-- Journal Entries -->
        <section class="entries-section">
            <h2>Journal Entries</h2>
            <div id="entries-container" class="entries-list"></div>
        </section>
    </div>
  `;
  return template;
};

// Pure function to create character page template
export const createCharacterPageTemplate = () => {
  const template = document.createElement('div');
  template.className = 'character-page';
  template.innerHTML = `
    <div class="container">
        <div class="page-header">
            <h1>Character Details</h1>
            <p class="page-description">Create and manage your D&D character</p>
        </div>
        
        <div class="character-content">
            <div class="character-form-section">
                <section>
                    <div id="character-form">
                        <!-- Character form will be rendered here by character.js -->
                    </div>
                </section>
            </div>

            <div class="character-summaries-section">
                <section>
                    <h2>AI Summaries</h2>
                    <div id="summaries-container">
                        <!-- Summaries will be rendered here by character.js -->
                    </div>
                </section>
            </div>
        </div>
    </div>
  `;
  return template;
};

// Pure function to create settings page template
export const createSettingsPageTemplate = () => {
  const template = document.createElement('div');
  template.className = 'settings-page';
  template.innerHTML = `
    <div class="container">
        <div class="page-header">
            <h1>Settings</h1>
            <p class="page-description">Configure your D&D Journal preferences</p>
        </div>
        
        <div class="settings-content">
            <!-- Sync Status Section -->
            <section class="settings-section">
                <h2>Sync Status</h2>
                <div id="sync-status-container" class="sync-status-container">
                    <!-- Sync status will be rendered here by settings.js -->
                </div>
            </section>

            <!-- Settings Form Section -->
            <section class="settings-section">
                <h2>Configuration</h2>
                <div id="settings-form-container">
                    <!-- Settings form will be rendered here by settings.js -->
                </div>
            </section>

            <!-- Data Management Section -->
            <section class="settings-section">
                <h2>Data Management</h2>
                <div id="data-management-container">
                    <!-- Data management controls will be rendered here by settings.js -->
                </div>
            </section>
        </div>
    </div>
  `;
  return template;
};

// Pure function to inject template into page content area
export const injectPageTemplate = (template) => {
  const pageContent = document.getElementById('page-content');
  if (pageContent && template) {
    pageContent.appendChild(template);
  }
};