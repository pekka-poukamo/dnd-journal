#!/bin/bash

echo "🔧 Setting up D&D Journal development environment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run initial tests to verify setup
echo "Running initial test suite..."
npm test

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Development environment setup complete!"
  echo ""
  echo "Available commands:"
  echo "  npm start         - Start development server"
  echo "  npm test          - Run test suite"
  echo "  npm run test:watch - Run tests in watch mode"
  echo "  npm run validate  - Validate static files"
  echo ""
  echo "Pre-commit hook available at: scripts/pre-commit.sh"
  echo "To install git pre-commit hook:"
  echo "  ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit"
else
  echo "❌ Setup failed! Check the errors above."
  exit 1
fi
