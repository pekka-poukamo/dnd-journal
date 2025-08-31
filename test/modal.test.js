import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import { showChoiceModal } from '../js/components/modal.js';

describe('Modal Component', function() {
  beforeEach(function() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(function() {
    // Clean DOM
    document.body.innerHTML = '';
  });

  it('should render and resolve with selected option', async function() {
    const promise = showChoiceModal({
      title: 'Test',
      message: 'Pick one',
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'cancel', label: 'Cancel' }
      ]
    });

    const buttons = document.querySelectorAll('.modal-footer .btn');
    expect(buttons.length).to.equal(3);
    // Click second button
    buttons[1].click();
    const result = await promise;
    expect(result).to.equal('b');
  });

  it('should resolve cancel on Escape key', async function() {
    const promise = showChoiceModal({ title: 'Test', message: 'Esc to cancel' });
    const evt = new window.KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(evt);
    const result = await promise;
    expect(result).to.equal('cancel');
  });
});

