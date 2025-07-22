#!/bin/bash

echo "🧪 Running D&D Journal Tests..."
echo "================================"

# Run tests with coverage
npm test

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "To run tests in watch mode: npm run test:watch"
    echo "To view coverage report: open coverage/lcov-report/index.html"
else
    echo ""
    echo "❌ Some tests failed!"
    exit 1
fi
