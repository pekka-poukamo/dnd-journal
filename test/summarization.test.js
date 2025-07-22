const { expect } = require('chai');
require('./setup');

// Load the summarization module
const Summarization = require('../js/summarization');

describe('Summarization Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    global.localStorage.clear();
  });

  describe('getEntriesNeedingSummaries', () => {
    it('should identify recent and older entries correctly', () => {
      const entries = [];
      const summaries = {};
      
      // Create 8 entries with different timestamps
      for (let i = 0; i < 8; i++) {
        entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000) // Each day older
        });
      }
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(5);
      expect(result.olderEntries).to.have.length(3);
      expect(result.needingSummaries).to.have.length(3);
    });

    it('should exclude older entries that already have summaries', () => {
      const entries = [];
      const summaries = {};
      
      // Create 7 entries
      for (let i = 0; i < 7; i++) {
        entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
        });
      }
      
      // Add summaries for the first two older entries
      summaries['5'] = { summary: 'Summary 5' };
      summaries['6'] = { summary: 'Summary 6' };
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(5);
      expect(result.olderEntries).to.have.length(2);
      expect(result.needingSummaries).to.have.length(0);
    });

    it('should handle empty entries array', () => {
      const entries = [];
      const summaries = {};
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(0);
      expect(result.olderEntries).to.have.length(0);
      expect(result.needingSummaries).to.have.length(0);
    });

    it('should handle entries with fewer than 5 items', () => {
      const entries = [
        { id: '1', title: 'Entry 1', content: 'Content 1', timestamp: Date.now() },
        { id: '2', title: 'Entry 2', content: 'Content 2', timestamp: Date.now() - 1000 }
      ];
      const summaries = {};
      
      const result = Summarization.getEntriesNeedingSummaries(entries, summaries);
      
      expect(result.recentEntries).to.have.length(2);
      expect(result.olderEntries).to.have.length(0);
      expect(result.needingSummaries).to.have.length(0);
    });
  });

  describe('getSummaryStats', () => {
    beforeEach(() => {
      // Mock journal data
      const journalData = {
        character: { name: 'Test Character' },
        entries: []
      };
      
      // Create 10 entries
      for (let i = 0; i < 10; i++) {
        journalData.entries.push({
          id: `${i}`,
          title: `Entry ${i}`,
          content: `Content ${i}`,
          timestamp: Date.now() - (i * 24 * 60 * 60 * 1000)
        });
      }
      
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
      
      // Add some summaries
      const summaries = {
        '7': { summary: 'Summary 7', originalWordCount: 20, summaryWordCount: 8 },
        '8': { summary: 'Summary 8', originalWordCount: 25, summaryWordCount: 10 },
        '9': { summary: 'Summary 9', originalWordCount: 30, summaryWordCount: 12 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
    });

    it('should calculate summary statistics correctly', () => {
      const stats = Summarization.getSummaryStats();
      
      expect(stats.totalEntries).to.equal(10);
      expect(stats.recentEntries).to.equal(5);
      expect(stats.olderEntries).to.equal(5);
      expect(stats.summarizedEntries).to.equal(3);
      expect(stats.pendingSummaries).to.equal(2);
      expect(stats.summaryCompletionRate).to.equal(60); // 3/5 * 100
    });

    it('should handle no entries', () => {
      global.localStorage.removeItem('simple-dnd-journal');
      
      const stats = Summarization.getSummaryStats();
      
      expect(stats.totalEntries).to.equal(0);
      expect(stats.recentEntries).to.equal(0);
      expect(stats.olderEntries).to.equal(0);
      expect(stats.summarizedEntries).to.equal(0);
      expect(stats.pendingSummaries).to.equal(0);
      expect(stats.summaryCompletionRate).to.equal(100);
    });
  });

  describe('getFormattedEntriesForAI', () => {
    beforeEach(() => {
      const journalData = {
        character: { name: 'Test Character' },
        entries: [
          { id: '1', title: 'Recent 1', content: 'Recent content 1', timestamp: Date.now() },
          { id: '2', title: 'Recent 2', content: 'Recent content 2', timestamp: Date.now() - 1000 },
          { id: '3', title: 'Recent 3', content: 'Recent content 3', timestamp: Date.now() - 2000 },
          { id: '4', title: 'Recent 4', content: 'Recent content 4', timestamp: Date.now() - 3000 },
          { id: '5', title: 'Recent 5', content: 'Recent content 5', timestamp: Date.now() - 4000 },
          { id: '6', title: 'Old 1', content: 'Old content 1', timestamp: Date.now() - 5000 },
          { id: '7', title: 'Old 2', content: 'Old content 2', timestamp: Date.now() - 6000 }
        ]
      };
      
      global.localStorage.setItem('simple-dnd-journal', JSON.stringify(journalData));
      
      const summaries = {
        '6': { summary: 'Summary of old content 1', originalWordCount: 15, summaryWordCount: 6 },
        '7': { summary: 'Summary of old content 2', originalWordCount: 18, summaryWordCount: 7 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
    });

    it('should format entries with recent full content and older summaries', () => {
      const formatted = Summarization.getFormattedEntriesForAI();
      
      expect(formatted).to.have.length(7);
      
      // Check recent entries (should be full content)
      const recentEntries = formatted.filter(entry => entry.type === 'full');
      expect(recentEntries).to.have.length(5);
      expect(recentEntries[0].content).to.equal('Recent content 1');
      
      // Check older entries (should be summaries)
      const summaryEntries = formatted.filter(entry => entry.type === 'summary');
      expect(summaryEntries).to.have.length(2);
      expect(summaryEntries[0].content).to.equal('Summary of old content 1');
      expect(summaryEntries[0]).to.have.property('originalWordCount');
      expect(summaryEntries[0]).to.have.property('summaryWordCount');
    });

    it('should handle missing summaries gracefully', () => {
      // Remove one summary
      const summaries = {
        '6': { summary: 'Summary of old content 1', originalWordCount: 15, summaryWordCount: 6 }
      };
      global.localStorage.setItem('simple-dnd-journal-summaries', JSON.stringify(summaries));
      
      const formatted = Summarization.getFormattedEntriesForAI();
      
      // Should only include entries with summaries for older entries
      const summaryEntries = formatted.filter(entry => entry.type === 'summary');
      expect(summaryEntries).to.have.length(1);
      expect(summaryEntries[0].title).to.equal('Old 1');
    });
  });
});
