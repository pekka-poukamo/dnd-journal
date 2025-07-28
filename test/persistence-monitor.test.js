import { expect } from 'chai';
import './setup.js';
import * as PersistenceMonitor from '../js/persistence-monitor.js';
import { createSystem, clearSystem, getSystem } from '../js/yjs.js';

describe('Persistence Monitor', function() {
  beforeEach(async function() {
    clearSystem();
    await createSystem();
    PersistenceMonitor.stopMonitoring();
  });

  afterEach(function() {
    clearSystem();
    PersistenceMonitor.stopMonitoring();
  });

  describe('performHealthCheck', function() {
    it('should return offline status when no system', function() {
      clearSystem();
      const health = PersistenceMonitor.performHealthCheck();
      
      expect(health).to.be.an('object');
      expect(health.status).to.equal('offline');
      expect(health.score).to.equal(0);
      expect(health.details.system).to.equal('not initialized');
    });

    it('should return health status for initialized system', function() {
      const health = PersistenceMonitor.performHealthCheck();
      
      expect(health).to.be.an('object');
      expect(health.status).to.be.a('string');
      expect(health.score).to.be.a('number');
      expect(health.score).to.be.at.least(0);
      expect(health.score).to.be.at.most(100);
      expect(health.timestamp).to.be.a('number');
      expect(health.details).to.be.an('object');
    });

    it('should score system availability', function() {
      const health = PersistenceMonitor.performHealthCheck();
      
      // Mock system should have system maps available
      expect(health.score).to.be.at.least(30); // System availability points
      expect(health.details.system).to.equal('initialized');
    });
  });

  describe('onHealthChange', function() {
    it('should register health change callbacks', function() {
      let callbackCalled = false;
      
      PersistenceMonitor.onHealthChange(() => {
        callbackCalled = true;
      });
      
      // Trigger health check to call callbacks
      PersistenceMonitor.performHealthCheck();
      
      expect(callbackCalled).to.be.true;
    });

    it('should handle multiple callbacks', function() {
      let callback1Called = false;
      let callback2Called = false;
      
      PersistenceMonitor.onHealthChange(() => {
        callback1Called = true;
      });
      
      PersistenceMonitor.onHealthChange(() => {
        callback2Called = true;
      });
      
      PersistenceMonitor.performHealthCheck();
      
      expect(callback1Called).to.be.true;
      expect(callback2Called).to.be.true;
    });

    it('should handle callback errors gracefully', function() {
      PersistenceMonitor.onHealthChange(() => {
        throw new Error('Test error');
      });
      
      // Should not throw when callback errors
      expect(() => {
        PersistenceMonitor.performHealthCheck();
      }).to.not.throw();
    });
  });

  describe('getLastHealthCheck', function() {
    it('should return null when no check performed', function() {
      // Clear any previous health check state
      PersistenceMonitor._internals.clearLastHealthCheck();
      const health = PersistenceMonitor.getLastHealthCheck();
      expect(health).to.be.null;
    });

    it('should return last health check result', function() {
      PersistenceMonitor.performHealthCheck();
      const health = PersistenceMonitor.getLastHealthCheck();
      
      expect(health).to.be.an('object');
      expect(health.status).to.be.a('string');
      expect(health.score).to.be.a('number');
    });
  });

  describe('monitoring lifecycle', function() {
    it('should start and stop monitoring', function() {
      expect(PersistenceMonitor.isMonitoring()).to.be.false;
      
      PersistenceMonitor.startMonitoring(100); // 100ms interval for fast test
      expect(PersistenceMonitor.isMonitoring()).to.be.true;
      
      PersistenceMonitor.stopMonitoring();
      expect(PersistenceMonitor.isMonitoring()).to.be.false;
    });

    it('should perform initial check when starting', function() {
      PersistenceMonitor.startMonitoring(1000);
      
      const health = PersistenceMonitor.getLastHealthCheck();
      expect(health).to.be.an('object');
      
      PersistenceMonitor.stopMonitoring();
    });
  });

  describe('formatHealthStatus', function() {
    it('should format health status with emoji and percentage', function() {
      const health = {
        status: 'healthy',
        score: 85
      };
      
      const formatted = PersistenceMonitor.formatHealthStatus(health);
      expect(formatted).to.include('✅');
      expect(formatted).to.include('HEALTHY');
      expect(formatted).to.include('85%');
    });

    it('should handle different status types', function() {
      const statuses = [
        { status: 'healthy', score: 90 },
        { status: 'degraded', score: 70 },
        { status: 'limited', score: 40 },
        { status: 'offline', score: 0 }
      ];
      
      statuses.forEach(health => {
        const formatted = PersistenceMonitor.formatHealthStatus(health);
        expect(formatted).to.be.a('string');
        expect(formatted).to.include(health.status.toUpperCase());
        expect(formatted).to.include(`${health.score}%`);
      });
    });

    it('should handle null health', function() {
      const formatted = PersistenceMonitor.formatHealthStatus(null);
      expect(formatted).to.equal('Unknown');
    });
  });

  describe('health scoring', function() {
    it('should assign appropriate scores for different conditions', function() {
      const health = PersistenceMonitor.performHealthCheck();
      
      // In test environment with mock system
      // Should get points for system availability
      expect(health.score).to.be.at.least(30);
      
      // Should have system initialized
      expect(health.details.system).to.equal('initialized');
    });
  });
});