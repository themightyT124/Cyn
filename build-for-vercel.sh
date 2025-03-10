#!/bin/bash
# Script to prepare the application for Vercel deployment

# Run the build script from package.json
npm run build

# Create the necessary directory structure in dist
mkdir -p dist/api

# Copy the API adapter
cp api/index.js dist/api/index.js

echo "Build completed successfully. Ready for Vercel deployment."