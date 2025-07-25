#!/bin/bash

# Pre-commit Coverage Check Script
# 
# Runs coverage analysis and provides warnings for low coverage
# without blocking commits. Aligns with project's no-build-tools philosophy.

set -e

echo "🔍 Running pre-commit coverage check..."
echo ""

# Run tests with coverage and generate warnings
npm run coverage:warn

echo ""
echo "✅ Pre-commit check complete!"
echo "💡 Coverage warnings (if any) are for information only and don't block commits."
echo ""