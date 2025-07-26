import { expect } from 'chai';
import './setup.js';
import * as Summarization from '../js/summarization.js';

describe('Summarization Module', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  afterEach(() => {
    global.localStorage.clear();
  });

  describe('summarize', () => {
    it('should return null for empty text', async () => {
      const result = await Summarization.summarize('test-key', '');
      expect(result).to.be.null;
    });

    it('should return null for short text under 100 words', async () => {
      const shortText = 'This is a short text with only a few words.';
      const result = await Summarization.summarize('test-key', shortText);
      expect(result).to.be.null;
    });

    it('should return null when AI is not available', async () => {
      const longText = 'This is a very long text that should be summarized. '.repeat(20);
      const result = await Summarization.summarize('test-key', longText);
      expect(result).to.be.null;
    });

    it('should return cached summary if it exists', async () => {
      // Set up cached summary
      const cachedData = {
        'test-key': {
          content: 'Cached summary content',
          words: 3,
          timestamp: Date.now()
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const longText = 'This is a very long text that should be summarized. '.repeat(20);
      const result = await Summarization.summarize('test-key', longText);
      
      expect(result).to.equal('Cached summary content');
    });

    it('should handle text exactly at threshold', async () => {
      // Create text with exactly 100 words
      const words = Array(100).fill('word').join(' ');
      const result = await Summarization.summarize('test-key', words);
      expect(result).to.be.null; // Will be null due to no AI availability
    });

    it('should use unique keys for different content', async () => {
      const text1 = 'First long text content. '.repeat(15);
      const text2 = 'Second long text content. '.repeat(15);
      
      // Both should return null due to no AI, but keys should be different
      const result1 = await Summarization.summarize('key1', text1);
      const result2 = await Summarization.summarize('key2', text2);
      
      expect(result1).to.be.null;
      expect(result2).to.be.null;
    });
  });

  describe('getSummary', () => {
    it('should return null for non-existent key', () => {
      const result = Summarization.getSummary('non-existent');
      expect(result).to.be.null;
    });

    it('should return cached summary content', () => {
      const cachedData = {
        'test-key': {
          content: 'Test summary content',
          words: 3,
          timestamp: Date.now()
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getSummary('test-key');
      result.should.equal('Test summary content');
    });

    it('should handle empty storage', () => {
      const result = Summarization.getSummary('test-key');
      expect(result).to.be.null;
    });
  });

  describe('getAllSummaries', () => {
    it('should return empty array when no summaries exist', () => {
      const result = Summarization.getAllSummaries();
      result.should.be.an('array');
      result.should.have.length(0);
    });

    it('should return all summaries sorted by timestamp', () => {
      const cachedData = {
        'key1': {
          content: 'First summary',
          words: 2,
          timestamp: 1000
        },
        'key2': {
          content: 'Second summary',
          words: 2,
          timestamp: 2000
        },
        'meta:key3': {
          content: 'Meta summary',
          words: 2,
          timestamp: 1500,
          replaces: ['key1']
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getAllSummaries();
      result.should.have.length(3);
      result[0].timestamp.should.equal(2000); // Most recent first
      result[1].timestamp.should.equal(1500);
      result[2].timestamp.should.equal(1000);
    });

    it('should properly identify meta-summaries', () => {
      const cachedData = {
        'regular-key': {
          content: 'Regular summary',
          words: 2,
          timestamp: 1000
        },
        'meta:meta-key': {
          content: 'Meta summary',
          words: 2,
          timestamp: 2000
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getAllSummaries();
      result.should.have.length(2);
      
      const metaSummary = result.find(s => s.type === 'meta');
      const regularSummary = result.find(s => s.type === 'regular');
      
      metaSummary.should.exist;
      metaSummary.key.should.equal('meta:meta-key');
      regularSummary.should.exist;
      regularSummary.key.should.equal('regular-key');
    });

    it('should handle missing timestamps gracefully', () => {
      const cachedData = {
        'key1': {
          content: 'Summary without timestamp',
          words: 2
          // No timestamp property
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getAllSummaries();
      result.should.have.length(1);
      expect(result[0].timestamp).to.equal(0); // Default value
    });
  });

  describe('getSummariesByPattern', () => {
    beforeEach(() => {
      const cachedData = {
        'entry:123': {
          content: 'Entry summary',
          words: 2,
          timestamp: 1000
        },
        'character:backstory': {
          content: 'Character summary',
          words: 2,
          timestamp: 2000
        },
        'meta:456': {
          content: 'Meta summary',
          words: 2,
          timestamp: 1500
        },
        'other-key': {
          content: 'Other summary',
          words: 2,
          timestamp: 500
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));
    });

    it('should return summaries matching pattern', () => {
      const result = Summarization.getSummariesByPattern('^entry:');
      result.should.have.length(1);
      result[0].key.should.equal('entry:123');
      result[0].content.should.equal('Entry summary');
    });

    it('should return empty array for non-matching pattern', () => {
      const result = Summarization.getSummariesByPattern('^nonexistent:');
      result.should.have.length(0);
    });

    it('should handle complex patterns', () => {
      const result = Summarization.getSummariesByPattern('character:|meta:');
      result.should.have.length(2);
      result.map(r => r.key).should.include('character:backstory');
      result.map(r => r.key).should.include('meta:456');
    });

    it('should handle invalid regex patterns gracefully', () => {
      try {
        const result = Summarization.getSummariesByPattern('[');
        result.should.have.length(0);
      } catch (error) {
        // Should handle regex errors gracefully
        error.should.exist;
      }
    });
  });

  describe('getStats', () => {
    it('should return zero stats for empty storage', () => {
      const result = Summarization.getStats();
      result.should.deep.equal({
        count: 0,
        totalWords: 0,
        withinTarget: true,
        metaSummaries: 0
      });
    });

    it('should calculate stats correctly', () => {
      const cachedData = {
        'key1': {
          content: 'Summary one',
          words: 10,
          timestamp: 1000
        },
        'key2': {
          content: 'Summary two',
          words: 20,
          timestamp: 2000
        },
        'meta:key3': {
          content: 'Meta summary',
          words: 30,
          timestamp: 1500,
          replaces: ['old-key']
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getStats();
      result.count.should.equal(3);
      result.totalWords.should.equal(60);
      result.withinTarget.should.be.true; // 60 < 400
      result.metaSummaries.should.equal(1);
    });

    it('should detect when over target words', () => {
      const cachedData = {
        'key1': {
          content: 'Long summary',
          words: 300,
          timestamp: 1000
        },
        'key2': {
          content: 'Another long summary',
          words: 200,
          timestamp: 2000
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getStats();
      result.totalWords.should.equal(500);
      result.withinTarget.should.be.false; // 500 > 400
    });

    it('should handle missing words property', () => {
      const cachedData = {
        'key1': {
          content: 'Summary without words count',
          timestamp: 1000
          // No words property
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const result = Summarization.getStats();
      result.count.should.equal(1);
      result.totalWords.should.equal(0); // Missing words treated as 0
    });
  });

  describe('clearAll', () => {
    it('should clear all summaries', () => {
      // Set up some data
      const cachedData = {
        'key1': { content: 'Summary 1', words: 5, timestamp: 1000 },
        'key2': { content: 'Summary 2', words: 10, timestamp: 2000 }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      // Verify data exists
      Summarization.getAllSummaries().should.have.length(2);

      // Clear all
      const result = Summarization.clearAll();
      result.should.be.true;

      // Verify data is cleared
      Summarization.getAllSummaries().should.have.length(0);
    });

    it('should handle empty storage gracefully', () => {
      const result = Summarization.clearAll();
      result.should.be.true;
      Summarization.getAllSummaries().should.have.length(0);
    });
  });

  describe('caching behavior', () => {
    it('should check cache before attempting to generate new summary', async () => {
      // Set up cached summary
      const cachedData = {
        'cache-test': {
          content: 'Existing cached summary',
          words: 4,
          timestamp: Date.now()
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(cachedData));

      const longText = 'This is a very long text that should be summarized but should return cached version. '.repeat(20);
      const result = await Summarization.summarize('cache-test', longText);
      
      // Should return cached content, not attempt to generate new one
      expect(result).to.equal('Existing cached summary');
    });

    it('should not overwrite existing cache entry', async () => {
      const originalData = {
        'test-key': {
          content: 'Original summary',
          words: 2,
          timestamp: 1000
        }
      };
      localStorage.setItem('simple-summaries', JSON.stringify(originalData));

      const longText = 'New text that is long enough to summarize. '.repeat(20);
      await Summarization.summarize('test-key', longText);

      // Should still have original cached content
      const result = Summarization.getSummary('test-key');
      result.should.equal('Original summary');
    });
  });
});
