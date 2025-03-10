#!/bin/bash
# Script to prepare the application for Vercel deployment

echo "=== Starting Vercel build process ==="

# Run the build script from package.json
echo "Running npm build..."
npm run build

# Create the necessary directory structure in dist
echo "Setting up directory structure..."
mkdir -p dist/api
mkdir -p dist/public/assets

# Copy the API adapter with improved error handling
echo "Installing API adapter..."
if [ -f "api/index.js" ]; then
  cp api/index.js dist/api/index.js
  echo "✅ API adapter copied successfully"
else
  echo "❌ Error: api/index.js not found"
  exit 1
fi

# Ensure server.js exists in dist root for API functions
echo "Setting up server access for API functions..."
if [ -f "dist/server/index.js" ]; then
  cp dist/server/index.js dist/server.js
  echo "✅ Server copied to dist root"
elif [ -f "server/index.js" ]; then
  # Try to compile server to dist if vite didn't do it
  echo "Server not found in dist, copying from source..."
  cp -r server dist/
  echo "✅ Server directory copied to dist"
else
  echo "⚠️ Warning: server/index.js not found, API functions may not work correctly"
fi

# Handle client assets
echo "Processing client assets..."
if [ -f "dist/index.html" ]; then
  mv dist/index.html dist/public/
  echo "✅ Moved index.html to public directory"
else
  echo "⚠️ Warning: index.html not found in dist"
fi

# Handle assets directory
if [ -d "dist/assets" ]; then
  # If assets exist at root, move them to public
  mv dist/assets/* dist/public/assets/
  rmdir dist/assets
  echo "✅ Moved assets to public directory"
else
  echo "⚠️ Warning: assets directory not found in dist"
fi

# Copy additional required files
echo "Copying additional files..."
if [ -f "vercel.json" ]; then
  cp vercel.json dist/
  echo "✅ Copied vercel.json to dist"
fi

# Ensure static directories are preserved
for dir in "uploads" "training-data" "voice-training"; do
  if [ -d "$dir" ]; then
    echo "Copying $dir directory..."
    mkdir -p "dist/$dir"
    cp -r "$dir"/* "dist/$dir"/
    echo "✅ Copied $dir directory"
  fi
done

# Ensure there's a .nojekyll file to prevent GitHub Pages issues
touch dist/.nojekyll

# Create a debug info file for Vercel troubleshooting
echo "Creating debug information..."
cat > dist/debug-info.json << EOL
{
  "buildTime": "$(date)",
  "nodeVersion": "$(node -v)",
  "npmVersion": "$(npm -v)",
  "environment": "production"
}
EOL

# Verify the build structure
echo "=== Verifying build directory structure ==="
echo "Files in dist:"
find dist -type f | grep -v "node_modules" | sort

echo "=== Build completed successfully. Ready for Vercel deployment. ==="