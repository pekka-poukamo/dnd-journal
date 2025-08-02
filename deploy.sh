#!/bin/bash
# Deploy script - Copy only client-side production files
# Reduces deployment from 85MB to ~8MB

set -e

echo "🚀 Building production deployment..."

# Clean and create dist directory
rm -rf dist
mkdir -p dist/node_modules

echo "📦 Copying essential client-side modules..."

# Copy only modules actually needed by the browser
cp -r node_modules/yjs dist/node_modules/
cp -r node_modules/lib0 dist/node_modules/
cp -r node_modules/y-protocols dist/node_modules/
cp -r node_modules/y-indexeddb dist/node_modules/

# Copy y-websocket but exclude server-only dependencies
mkdir -p dist/node_modules/y-websocket
cp -r node_modules/y-websocket/src dist/node_modules/y-websocket/
cp node_modules/y-websocket/package.json dist/node_modules/y-websocket/

echo "📄 Copying application files..."

# Copy all application files
cp -r js dist/
cp -r css dist/
cp *.html dist/
cp manifest.json dist/
cp favicon.svg dist/

# Copy any other root assets
if [ -d "images" ]; then
    cp -r images dist/
fi

if [ -d "fonts" ]; then
    cp -r fonts dist/
fi

echo "🧹 Cleaning up unnecessary files..."

# Remove documentation and test files from modules
find dist/node_modules -name "*.md" -delete
find dist/node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find dist/node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find dist/node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true
find dist/node_modules -name "*.test.js" -delete
find dist/node_modules -name "*.spec.js" -delete
find dist/node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true
find dist/node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true

# Remove source maps (optional - comment out if you need them for debugging)
find dist/node_modules -name "*.map" -delete

echo "📊 Deployment size comparison:"
echo "Original node_modules: $(du -sh node_modules | cut -f1)"
echo "Production dist: $(du -sh dist | cut -f1)"

echo "✅ Production build complete in ./dist/"
echo ""
echo "🌐 To deploy:"
echo "  - Upload ./dist/ contents to your web server"
echo "  - Ensure gzip/brotli compression is enabled"
echo "  - Set cache headers for /node_modules/* files"