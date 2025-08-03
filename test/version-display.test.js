// Version Display Test - Pure Functional Testing (ADR-0002 Compliant)
import { expect } from 'chai';
import { JSDOM } from 'jsdom';

// Set up DOM environment for testing
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = window.document;
global.window = window;

import { formatVersionDisplay, createVersionElement, appendVersionToElement } from '../js/version-display.js';

describe('Version Display', () => {
  describe('formatVersionDisplay', () => {
    it('should return "Development" for dev commit', () => {
      const versionInfo = { commit: 'dev', runNumber: 'local', shortCommit: 'dev' };
      const result = formatVersionDisplay(versionInfo);
      expect(result).to.equal('Development');
    });

    it('should format production version correctly', () => {
      const versionInfo = { commit: 'abc123', runNumber: '42', shortCommit: 'abc123f' };
      const result = formatVersionDisplay(versionInfo);
      expect(result).to.equal('v42 (abc123f)');
    });
  });

  describe('createVersionElement', () => {
    it('should create a version element with correct class', () => {
      const element = createVersionElement();
      expect(element.className).to.equal('version-info');
      expect(element.tagName).to.equal('DIV');
    });

    it('should have a title attribute with version details', () => {
      const element = createVersionElement();
      expect(element.title).to.include('Deployed:');
      expect(element.title).to.include('Commit:');
      expect(element.title).to.include('Branch:');
    });
  });

  describe('appendVersionToElement', () => {
    it('should return false for null target', () => {
      const result = appendVersionToElement(null);
      expect(result).to.equal(false);
    });

    it('should append version element to target', () => {
      const targetElement = document.createElement('div');
      const result = appendVersionToElement(targetElement);
      expect(result).to.equal(true);
      expect(targetElement.children.length).to.equal(1);
      expect(targetElement.children[0].className).to.equal('version-info');
    });
  });
});