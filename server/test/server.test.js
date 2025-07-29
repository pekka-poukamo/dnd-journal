import { expect } from 'chai';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import { readFileSync, existsSync, rmSync } from 'fs';

describe('Server', function() {
  let serverProcess;
  const TEST_PORT = 9999;
  const TEST_DATA_DIR = './test-data';
  
  before(function(done) {
    // Clean up any existing test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
    
    // Start server on test port
    serverProcess = spawn('node', ['server.js', TEST_PORT], {
      stdio: 'pipe',
      env: { ...process.env, DATA_DIR: TEST_DATA_DIR }
    });
    
    // Wait for server to start
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('D&D Journal Server')) {
        done();
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });
    
    // Timeout if server doesn't start
    setTimeout(() => done(new Error('Server failed to start')), 5000);
  });

  after(function() {
    if (serverProcess) {
      serverProcess.kill();
    }
    // Clean up test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }
  });

  it('should start and accept WebSocket connections', function(done) {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
    
    ws.on('open', function() {
      expect(ws.readyState).to.equal(WebSocket.OPEN);
      ws.close();
      done();
    });
    
    ws.on('error', function(error) {
      done(error);
    });
  });

  it('should handle multiple simultaneous connections', function(done) {
    const connections = [];
    let openCount = 0;
    const totalConnections = 3;
    
    for (let i = 0; i < totalConnections; i++) {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      connections.push(ws);
      
      ws.on('open', function() {
        openCount++;
        if (openCount === totalConnections) {
          // All connections opened successfully
          connections.forEach(ws => ws.close());
          done();
        }
      });
      
      ws.on('error', done);
    }
  });

  it('should persist data (basic file check)', function(done) {
    // This test just verifies the data directory is created
    // More detailed persistence testing would require Yjs integration
    
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
    
    ws.on('open', function() {
      // Just opening a connection should initialize the data structure
      setTimeout(() => {
        ws.close();
        // Give server time to create any necessary files
        setTimeout(() => {
          // Check if data directory exists (basic persistence test)
          const dataExists = existsSync(TEST_DATA_DIR);
          expect(dataExists).to.be.true;
          done();
        }, 100);
      }, 100);
    });
    
    ws.on('error', done);
  });
});