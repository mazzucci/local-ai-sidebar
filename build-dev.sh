#!/bin/bash

# Development build script for Local AI Sidebar
# Explicitly enables DEBUG_MODE for development

echo "Building development version with logging enabled..."

# Build with DEBUG_MODE=true (explicitly enabled)
esbuild src/LocalAI.ts \
  --bundle \
  --outfile=dist/LocalAI.js \
  --format=iife \
  --global-name=LocalAIApp \
  --define:DEBUG_MODE=true

# Copy assets
rm -rf dist/icons
mkdir -p dist/icons
cp src/*.html dist/ && \
cp src/*.css dist/ && \
cp src/icons/icon16.png src/icons/icon32.png src/icons/icon48.png src/icons/icon128.png dist/icons/ && \
cp src/service-worker.js dist/ && \
cp src/manifest.json dist/ && \
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs dist/pdf.worker.js

echo "Development build complete!"
echo "Bundle size: $(wc -c < dist/LocalAI.js) bytes"
