#!/bin/bash

echo "🧪 Running pre-commit tests..."

# Run tests
echo "Running test suite..."
npm test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Commit aborted."
  exit 1
fi

# Validate static files
echo "Validating static files..."
npm run validate

if [ $? -ne 0 ]; then
  echo "❌ File validation failed! Commit aborted."
  exit 1
fi

echo "✅ All tests passed! Proceeding with commit."
exit 0
