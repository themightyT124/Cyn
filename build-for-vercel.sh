#!/bin/bash
# Build script for Vercel deployment

echo "Starting build process for Vercel deployment..."

# 1. Clean previous builds if they exist
if [ -d "dist" ]; then
  echo "Cleaning previous build..."
  rm -rf dist
fi

# 2. Create dist directory structure
echo "Creating directory structure..."
mkdir -p dist/public
mkdir -p dist/api

# 3. Build the client
echo "Building client..."
npm run build

# 4. Move client build to dist/public
echo "Moving client build to dist/public..."
cp -r dist/* dist/public/

# 5. Prepare server files for serverless functions
echo "Preparing server for serverless functions..."
cp -r server dist/
cp -r shared dist/

# 6. Copy API routes to the api directory for Vercel serverless
echo "Copying API handler to api directory..."
cp api/index.js dist/api/

# 7. Create Vercel configuration
echo "Creating Vercel configuration..."
cp vercel.json dist/

echo "Build completed! The dist directory is ready for Vercel deployment."