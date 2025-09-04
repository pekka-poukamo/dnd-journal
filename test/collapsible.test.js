import { expect } from 'chai';
import './setup.js';
import { createCollapsible } from '../js/components/collapsible.js';

describe('Collapsible Component', function() {
  beforeEach(function() {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('should render with generic classes and toggle content visibility', function() {
    const root = document.getElementById('root');
    const content = document.createElement('div');
    content.textContent = 'Hello';
    const el = createCollapsible('Show', 'Hide', content);
    root.appendChild(el);

    const btn = el.querySelector('.collapsible__toggle');
    const area = el.querySelector('.collapsible__content');
    expect(btn).to.exist;
    expect(area).to.exist;
    expect(area.style.display).to.equal('none');
    btn.click();
    expect(area.style.display).to.equal('block');
    btn.click();
    expect(area.style.display).to.equal('none');
  });
});

