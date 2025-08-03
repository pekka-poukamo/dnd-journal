// Session Questions Cache Test
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as YjsModule from '../js/yjs.js';

describe('Session Questions Cache', function() {
  let state;
  
  beforeEach(async function() {
    // Reset Y.js state before each test
    YjsModule.resetYjs();
    state = await YjsModule.initYjs();
  });
  
  afterEach(function() {
    // Clean up after each test
    YjsModule.resetYjs();
  });
  
  describe('getSessionQuestions', function() {
    it('should return null when no questions are cached', function() {
      const questions = YjsModule.getSessionQuestions(state);
      expect(questions).to.be.null;
    });
    
    it('should return cached questions when they exist', function() {
      const testQuestions = "1. What drives your character's main goal?\n2. How has your character changed recently?\n3. What difficult choice might your character face next?";
      
      YjsModule.setSessionQuestions(state, testQuestions);
      const retrieved = YjsModule.getSessionQuestions(state);
      
      expect(retrieved).to.equal(testQuestions);
    });
  });
  
  describe('setSessionQuestions', function() {
    it('should store questions in Yjs for syncing', function() {
      const testQuestions = "1. What motivates your character?\n2. What are they afraid of?\n3. What do they value most?";
      
      YjsModule.setSessionQuestions(state, testQuestions);
      
      // Verify the questions are stored in the map
      expect(state.questionsMap.get('current')).to.equal(testQuestions);
    });
    
    it('should overwrite existing questions', function() {
      const firstQuestions = "Original questions";
      const newQuestions = "Updated questions";
      
      YjsModule.setSessionQuestions(state, firstQuestions);
      YjsModule.setSessionQuestions(state, newQuestions);
      
      const retrieved = YjsModule.getSessionQuestions(state);
      expect(retrieved).to.equal(newQuestions);
    });
  });
  
  describe('clearSessionQuestions', function() {
    it('should remove cached questions', function() {
      const testQuestions = "Test questions to be cleared";
      
      YjsModule.setSessionQuestions(state, testQuestions);
      expect(YjsModule.getSessionQuestions(state)).to.equal(testQuestions);
      
      YjsModule.clearSessionQuestions(state);
      expect(YjsModule.getSessionQuestions(state)).to.be.null;
    });
    
    it('should handle clearing when no questions exist', function() {
      // Should not throw an error
      expect(() => YjsModule.clearSessionQuestions(state)).to.not.throw();
      expect(YjsModule.getSessionQuestions(state)).to.be.null;
    });
  });
  
  describe('Integration with data changes', function() {
    it('should persist questions across Yjs state access', function() {
      const testQuestions = "Persistence test questions";
      
      YjsModule.setSessionQuestions(state, testQuestions);
      
      // Get a fresh state reference
      const freshState = YjsModule.getYjsState();
      const retrieved = YjsModule.getSessionQuestions(freshState);
      
      expect(retrieved).to.equal(testQuestions);
    });
  });
});