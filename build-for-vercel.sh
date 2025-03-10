#!/bin/bash
# Script to prepare the application for Vercel deployment

# Run the build script from package.json
npm run build

# Create the necessary directory structure in dist
mkdir -p dist/api

# Copy the API adapter
cp api/index.js dist/api/index.js

# Ensure public directory exists in dist
if [ ! -d "dist/public" ]; then
  mkdir -p dist/public
  # Move client assets to public directory if they were built at the root
  if [ -f "dist/index.html" ]; then
    mv dist/index.html dist/public/
  fi
  if [ -d "dist/assets" ]; then
    mv dist/assets dist/public/
  fi
fi

# Ensure there's a .nojekyll file to prevent GitHub Pages issues
touch dist/.nojekyll

# Verify the build structure
echo "Verifying build directory structure..."
find dist -type f | sort

echo "Build completed successfully. Ready for Vercel deployment."