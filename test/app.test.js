require('should');

// Minimal DOM stubs for app.js import in Node
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
};

const { generateId, formatDate } = require('../js/app');

describe('Utility functions (app.js)', () => {
  describe('generateId', () => {
    it('should return a numeric string', () => {
      const id = generateId();
      id.should.be.a.String();
      id.should.match(/^\d+$/);
    });

    it('should produce different ids over time', (done) => {
      const first = generateId();
      setTimeout(() => {
        const second = generateId();
        second.should.not.equal(first);
        done();
      }, 2);
    });
  });

  describe('formatDate', () => {
    it('should format a timestamp into a human-readable string', () => {
      const formatted = formatDate(0);
      formatted.should.be.a.String();
      formatted.length.should.be.above(0);
      formatted.should.match(/1970/);
    });
  });
});
