const path = require('path');
const fs = require('fs');
require('./setup');
const { should } = require('chai');

describe('CSS Components', function() {
  describe('Navigation Component', function() {
    it('should contain proper BEM class structure', function() {
      const navCss = fs.readFileSync(path.join(__dirname, '../css/components/navigation.css'), 'utf8');
      
      // Check for BEM naming convention
      navCss.should.include('.navigation');
      navCss.should.include('.navigation__title');
      navCss.should.include('.navigation__link');
      navCss.should.include('.navigation__link--primary');
    });

    it('should include responsive design', function() {
      const navCss = fs.readFileSync(path.join(__dirname, '../css/components/navigation.css'), 'utf8');
      
      navCss.should.include('@media (max-width: 767px)');
    });
  });

  describe('Character Summary Component', function() {
    it('should contain proper BEM class structure', function() {
      const summaryCss = fs.readFileSync(path.join(__dirname, '../css/components/character-summary.css'), 'utf8');
      
      summaryCss.should.include('.character-summary');
      summaryCss.should.include('.character-summary__header');
      summaryCss.should.include('.character-summary__title');
      summaryCss.should.include('.character-summary__content');
      summaryCss.should.include('.character-summary__info');
      summaryCss.should.include('.character-summary__name');
      summaryCss.should.include('.character-summary__details');
    });

    it('should include responsive design', function() {
      const summaryCss = fs.readFileSync(path.join(__dirname, '../css/components/character-summary.css'), 'utf8');
      
      summaryCss.should.include('@media (max-width: 767px)');
    });
  });

  describe('Character Form Component', function() {
    it('should contain proper BEM class structure', function() {
      const formCss = fs.readFileSync(path.join(__dirname, '../css/components/character-form.css'), 'utf8');
      
      formCss.should.include('.character-form');
      formCss.should.include('.character-form__section');
      formCss.should.include('.character-form__section--basic');
      formCss.should.include('.character-form__section--background');
      formCss.should.include('.character-form__section--appearance');
      formCss.should.include('.character-form__section--stats');
      formCss.should.include('.character-form__section--equipment');
      formCss.should.include('.character-form__title');
      formCss.should.include('.character-form__grid');
      formCss.should.include('.character-form__stats-grid');
    });

    it('should include responsive design', function() {
      const formCss = fs.readFileSync(path.join(__dirname, '../css/components/character-form.css'), 'utf8');
      
      formCss.should.include('@media (max-width: 767px)');
      formCss.should.include('@media (max-width: 480px)');
    });

    it('should use CSS custom properties', function() {
      const formCss = fs.readFileSync(path.join(__dirname, '../css/components/character-form.css'), 'utf8');
      
      formCss.should.include('var(--color-surface)');
      formCss.should.include('var(--color-border)');
      formCss.should.include('var(--space-lg)');
      formCss.should.include('var(--border-radius)');
    });
  });

  describe('Component File Organization', function() {
    it('should have proper component directory structure', function() {
      const componentsDir = path.join(__dirname, '../css/components');
      fs.existsSync(componentsDir).should.be.true;
      
      const files = fs.readdirSync(componentsDir);
      files.should.include('navigation.css');
      files.should.include('character-summary.css');
      files.should.include('character-form.css');
    });

    it('should follow kebab-case naming convention', function() {
      const componentsDir = path.join(__dirname, '../css/components');
      const files = fs.readdirSync(componentsDir);
      
      // Filter to only CSS files, excluding documentation
      const cssFiles = files.filter(file => file.endsWith('.css'));
      
      cssFiles.forEach(file => {
        // Check that filename follows kebab-case (no underscores, camelCase, etc.)
        file.should.match(/^[a-z]+(-[a-z]+)*\.css$/);
      });
      
      // Ensure we have some CSS files to test
      cssFiles.length.should.be.greaterThan(0);
    });
  });
});

describe('BEM Class Usage in HTML', function() {
  it('should use BEM classes in character.html', function() {
    const characterHtml = fs.readFileSync(path.join(__dirname, '../character.html'), 'utf8');
    
    // Navigation BEM classes
    characterHtml.should.include('class="navigation"');
    characterHtml.should.include('class="navigation__title"');
    characterHtml.should.include('class="navigation__link"');
    
    // Character form BEM classes
    characterHtml.should.include('class="character-form"');
    characterHtml.should.include('class="character-form__section character-form__section--basic"');
    characterHtml.should.include('class="character-form__title"');
    characterHtml.should.include('class="character-form__grid"');
  });

  it('should use BEM classes in index.html', function() {
    const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    
    // Character summary BEM classes
    indexHtml.should.include('class="character-summary"');
    indexHtml.should.include('class="character-summary__header"');
    indexHtml.should.include('class="character-summary__title"');
    indexHtml.should.include('class="character-summary__content"');
    indexHtml.should.include('class="character-summary__info"');
  });
});
