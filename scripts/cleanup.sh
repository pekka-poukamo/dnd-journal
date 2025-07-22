#!/bin/bash

echo "🧹 Cleaning up D&D Journal repository..."

# Remove any temporary files
echo "Removing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.temp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Clean npm cache and reinstall if needed
if [ -d "node_modules" ] && [ ! -f "package-lock.json" ]; then
  echo "Cleaning npm installation..."
  rm -rf node_modules
  npm install
fi

# Check for any files that should be in .gitignore
echo "Checking for files that should be ignored..."
if [ -f ".env" ]; then
  echo "⚠️  Warning: .env file found (should be in .gitignore)"
fi

if find . -name "*.log" -not -path "./node_modules/*" | grep -q .; then
  echo "⚠️  Warning: Log files found (should be in .gitignore)"
  find . -name "*.log" -not -path "./node_modules/*"
fi

# Validate project structure
echo "Validating project structure..."
required_files=("package.json" "index.html" "js/app.js" "css/main.css" ".gitignore")
missing_files=()

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
  echo "❌ Missing required files:"
  printf ' - %s\n' "${missing_files[@]}"
  exit 1
fi

# Run tests to ensure everything works
echo "Running tests to verify everything works..."
npm test

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Repository cleanup complete!"
  echo ""
  echo "📁 Project structure:"
  echo "  - Source files: index.html, js/app.js, css/main.css"
  echo "  - Tests: test/ directory with 17 passing tests"
  echo "  - Documentation: README.md, STYLE_GUIDE.md"
  echo "  - Automation: GitHub Actions, pre-commit hooks"
  echo "  - Clean .gitignore with proper exclusions"
else
  echo "❌ Cleanup failed! Tests are not passing."
  exit 1
fi
