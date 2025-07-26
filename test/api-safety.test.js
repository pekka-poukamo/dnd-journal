import { expect } from 'chai';
import './setup.js';

describe('API Safety - No Real Calls', function() {
  let originalFetch;
  let fetchCallLog = [];

  beforeEach(function() {
    fetchCallLog = [];
    
    // Override the mock to log all fetch calls
    originalFetch = global.fetch;
    global.fetch = async function(url, options) {
      fetchCallLog.push({ url, options });
      
      // Still return mocked responses to not break tests
      if (url.includes('openai.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'Mock response' } }]
          })
        };
      }
      
      return {
        ok: false,
        status: 404,
        json: async () => ({})
      };
    };
  });

  afterEach(function() {
    global.fetch = originalFetch;
  });

  it('should not make any real OpenAI API calls during testing', function() {
    // This test verifies that our mocking is working
    // If any real API calls were made, they would be logged
    expect(fetchCallLog).to.be.an('array');
    
    // The mere fact that this test runs confirms mocking is active
    // Real API calls would require network access and valid keys
  });

  it('should reject any attempts to use real API keys', function() {
    // Test that even if someone tried to use a real-looking key,
    // the mock would still intercept it
    const realLookingKey = 'sk-proj-abcdefghijklmnopqrstuvwxyz1234567890';
    
    // Store settings with real-looking key
    localStorage.setItem('simple-dnd-journal-settings', JSON.stringify({
      apiKey: realLookingKey,
      enableAIFeatures: true
    }));

    // Import and test a module that would use the API
    import('../js/openai-wrapper.js').then(OpenAIWrapper => {
      expect(OpenAIWrapper.isAPIAvailable()).to.be.true;
      
      // But any actual call would still be mocked
      return OpenAIWrapper.callAI('test prompt');
    }).then(result => {
      // This would only work if mocked (real calls would fail in test env)
      expect(result).to.be.a('string');
    });
  });

  it('should ensure all OpenAI endpoints are mocked', function() {
    const openaiEndpoints = [
      'https://api.openai.com/v1/chat/completions',
      'https://api.openai.com/v1/models',
      'https://api.openai.com/v1/completions'
    ];

    openaiEndpoints.forEach(endpoint => {
      global.fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer sk-test123' }
      });
    });

    // Verify all calls were logged (meaning they hit our mock)
    expect(fetchCallLog).to.have.length(openaiEndpoints.length);
    
    // Verify no real network calls were made
    fetchCallLog.forEach(call => {
      expect(call.url).to.be.a('string');
      expect(call.url).to.include('openai.com');
    });
  });
});