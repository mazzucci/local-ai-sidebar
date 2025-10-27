#!/bin/bash

# Production build script for Local AI Sidebar
# Uses build-time environment variable for DEBUG_MODE
# DEBUG_MODE defaults to false (production) - no explicit setting needed

echo "Building production version..."

# Build with DEBUG_MODE=false (default)
esbuild src/LocalAI.ts \
  --bundle \
  --outfile=dist/LocalAI.js \
  --format=iife \
  --global-name=LocalAIApp \
  --minify \
  --define:DEBUG_MODE=false

# Copy assets
rm -rf dist/icons
mkdir -p dist/icons
cp src/*.html dist/ && \
cp src/*.css dist/ && \
cp src/icons/icon16.png src/icons/icon32.png src/icons/icon48.png src/icons/icon128.png dist/icons/ && \
cp src/service-worker.js dist/ && \
cp src/manifest.json dist/ && \
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs dist/pdf.worker.js

echo "Production build complete!"
echo "Bundle size: $(wc -c < dist/LocalAI.js) bytes"