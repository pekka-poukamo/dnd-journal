import { expect } from 'chai';
import './setup.js';
import * as Summarization from '../js/summarization.js';
import { createSystem, clearSystem, getSystem } from '../js/yjs.js';

describe('Summarization Module', function() {
  beforeEach(async function() {
    // Clear and reinitialize Yjs mock system
    clearSystem();
    await createSystem();
  });

  afterEach(() => {
    // Clean up after each test
    clearSystem();
  });

  describe('summarize', () => {
    it('should return null for empty text', async () => {
      const result = await Summarization.summarize('test-key', '');
      expect(result).to.be.null;
    });

    it('should return null for short text under 150 words', async () => {
      const shortText = 'This is a short text with only a few words.';
      const result = await Summarization.summarize('test-key', shortText);
      expect(result).to.be.null;
    });

    it('should return null when AI is not available', async () => {
      // Create text over 150 words
      const longText = 'This is a long text that exceeds the minimum word count for summarization. '.repeat(30);
      const result = await Summarization.summarize('test-key', longText);
      expect(result).to.be.null; // Should be null because AI is not available in test environment
    });

    it('should return cached summary if it exists', async () => {
      const testKey = 'test-summary-key';
      const expectedSummary = 'Cached summary content';
      
      // Store summary using the API
      Summarization.storeSummary(testKey, {
        content: expectedSummary,
        words: 50,
        timestamp: Date.now()
      });

      const result = await Summarization.summarize(testKey, 'Some long text to summarize. '.repeat(30));
      expect(result).to.equal(expectedSummary);
    });

    it('should handle text exactly at threshold', async () => {
      // Create text with exactly 150 words
      const words = Array(150).fill('word').join(' ');
      const result = await Summarization.summarize('test-key', words);
      expect(result).to.be.null; // Should be null at threshold
    });

    it('should use unique keys for different content', async () => {
      const content1 = 'Content one ' + 'word '.repeat(150);
      const content2 = 'Content two ' + 'word '.repeat(150);
      
      const key1 = Summarization.createSummaryKey(content1);
      const key2 = Summarization.createSummaryKey(content2);
      
      expect(key1).to.not.equal(key2);
    });
  });

  describe('API Functions', () => {
    it('should store and retrieve summaries', () => {
      const testKey = 'test-key';
      const testSummary = {
        content: 'Test summary content',
        words: 10,
        timestamp: Date.now()
      };
      
      Summarization.storeSummary(testKey, testSummary);
      const retrieved = Summarization.getSummaryByKey(testKey);
      
      expect(retrieved.content).to.equal(testSummary.content);
    });

    it('should check if summary exists', () => {
      const testKey = 'test-key';
      const testSummary = {
        content: 'Test summary content',
        words: 10,
        timestamp: Date.now()
      };
      
      expect(Summarization.hasSummary(testKey)).to.be.false;
      
      Summarization.storeSummary(testKey, testSummary);
      expect(Summarization.hasSummary(testKey)).to.be.true;
    });

    it('should return all summaries as object', () => {
      const summary1 = { content: 'Summary 1', words: 5, timestamp: Date.now() };
      const summary2 = { content: 'Summary 2', words: 5, timestamp: Date.now() };
      
      Summarization.storeSummary('key1', summary1);
      Summarization.storeSummary('key2', summary2);
      
      const allSummaries = Summarization.getAllSummariesAsObject();
      expect(allSummaries).to.have.property('key1');
      expect(allSummaries).to.have.property('key2');
    });

    it('should return null for non-existent summary', () => {
      const result = Summarization.getSummaryByKey('non-existent');
      expect(result).to.be.null;
    });
  });

  describe('clearAll', () => {
    it('should clear all summaries', () => {
      const summary1 = { content: 'Summary 1', words: 5, timestamp: Date.now() };
      const summary2 = { content: 'Summary 2', words: 5, timestamp: Date.now() };
      
      Summarization.storeSummary('key1', summary1);
      Summarization.storeSummary('key2', summary2);
      
      expect(Summarization.hasSummary('key1')).to.be.true;
      expect(Summarization.hasSummary('key2')).to.be.true;
      
      Summarization.clearAll();
      
      expect(Summarization.hasSummary('key1')).to.be.false;
      expect(Summarization.hasSummary('key2')).to.be.false;
    });

    it('should handle empty storage gracefully', () => {
      expect(() => Summarization.clearAll()).to.not.throw();
    });
  });

  describe('error handling', () => {
    it('should handle summarization errors gracefully', async () => {
      const longText = 'This is a long text. '.repeat(100);
      const result = await Summarization.summarize('error-key', longText);
      expect(result).to.be.null; // Should handle errors gracefully
    });
  });
});
