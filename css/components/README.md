# CSS Components

This directory contains modular CSS components following the style guide's BEM methodology and component-based architecture.

## Component Structure

### Navigation (`navigation.css`)
Shared navigation component used across multiple pages.

**Classes:**
- `.navigation` - Main navigation container
- `.navigation__title` - Page title in navigation
- `.navigation__link` - Navigation links
- `.navigation__link--primary` - Primary action links

**Usage:**
```html
<nav class="navigation">
  <h1 class="navigation__title">Page Title</h1>
  <a href="..." class="navigation__link">Link</a>
</nav>
```

### Character Summary (`character-summary.css`)
Component for displaying character information on the main journal page.

**Classes:**
- `.character-summary` - Main container
- `.character-summary__header` - Header with title and actions
- `.character-summary__title` - Section title
- `.character-summary__content` - Main content area
- `.character-summary__info` - Character information wrapper
- `.character-summary__name` - Character name display
- `.character-summary__details` - Character details (race, class, level)

**Usage:**
```html
<section class="character-summary">
  <div class="character-summary__header">
    <h2 class="character-summary__title">Your Character</h2>
    <a href="character.html" class="button button--secondary">View Details</a>
  </div>
  <div class="character-summary__content">
    <div class="character-summary__info">
      <div class="character-summary__name">Character Name</div>
      <div class="character-summary__details">Level 5 • Human • Fighter</div>
    </div>
  </div>
</section>
```

### Character Form (`character-form.css`)
Comprehensive character creation and editing form for the character page.

**Classes:**
- `.character-form` - Main form container
- `.character-form__section` - Form section wrapper
- `.character-form__section--basic` - Basic information section
- `.character-form__section--background` - Background/backstory section
- `.character-form__section--appearance` - Appearance section
- `.character-form__section--stats` - Stats/abilities section
- `.character-form__section--equipment` - Equipment section
- `.character-form__title` - Section titles
- `.character-form__grid` - General form grid layout
- `.character-form__stats-grid` - Stats-specific grid layout
- `.character-form__backstory` - Backstory textarea styling
- `.character-form__stat-input` - Ability score input styling
- `.character-form__ability-modifier` - Ability modifier display
- `.character-form__save-indicator` - Auto-save feedback

**Usage:**
```html
<div class="character-form">
  <section class="character-form__section character-form__section--basic">
    <h2 class="character-form__title">Basic Information</h2>
    <div class="character-form__grid">
      <!-- Form fields -->
    </div>
  </section>
</div>
```

## Design Principles

1. **BEM Methodology**: All classes follow Block__Element--Modifier naming
2. **Responsive Design**: Mobile-first approach with proper breakpoints
3. **CSS Custom Properties**: Uses variables from main.css for consistency
4. **Component Isolation**: Each component is self-contained and reusable
5. **Semantic Structure**: Meaningful class names that describe purpose

## Color Coding

Different form sections use color-coded left borders for visual organization:
- Basic Info: Primary blue (`--color-primary`)
- Background: Red (`#e74c3c`)
- Appearance: Green (`#27ae60`)
- Stats: Purple (`#9b59b6`)
- Equipment: Orange (`#f39c12`)

## Responsive Breakpoints

- Mobile: `max-width: 767px`
- Small Mobile: `max-width: 480px` (for stats grid)

All components are designed to work seamlessly across devices with appropriate layout adjustments.
