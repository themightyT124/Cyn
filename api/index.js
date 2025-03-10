// Vercel serverless function adapter for Express
// This is needed because Vercel functions expect a handler function
// but we have a full Express app

// Import path and fs modules
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in development or production
const isDev = process.env.NODE_ENV !== 'production';

// In development, use local server
// In production, use the built app that should be in the dist root
// We need to handle different file structures for local development vs Vercel deployment
let appPath;

// First try the most common paths
if (isDev) {
  appPath = '../server/index.js';
} else {
  // For Vercel deployment, we need to check multiple possible locations
  const possiblePaths = [
    '../server.js',     // Pre-bundled server
    '../index.js',      // Root index
    './server.js',      // Relative to api directory
    '../dist/server.js' // In case server is in dist folder
  ];
  
  // Find the first path that exists
  for (const testPath of possiblePaths) {
    if (fs.existsSync(path.join(__dirname, testPath))) {
      appPath = testPath;
      console.log(`Found server at: ${testPath}`);
      break;
    }
  }
  
  // If no path was found, default to the most likely one
  if (!appPath) {
    console.warn('Could not find server file, using default path');
    appPath = '../server.js';
  }
}

// Dynamic import to get the Express app
export default async function handler(req, res) {
  try {
    console.log(`[Vercel] Importing app from: ${appPath}`);
    console.log(`[Vercel] Environment: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`[Vercel] Current directory: ${__dirname}`);
    
    // Get the app dynamically
    const appModule = await import(appPath);
    
    // Check if the module has a default export
    if (!appModule.default) {
      console.error('[Vercel] No default export found in module:', Object.keys(appModule));
      throw new Error('No default export found in server module');
    }
    
    const app = appModule.default;
    
    // Make sure app is a function
    if (typeof app !== 'function') {
      console.error('[Vercel] App is not a function, got:', typeof app);
      throw new Error(`App is not a function, got: ${typeof app}`);
    }
    
    console.log('[Vercel] Successfully imported app, forwarding request');
    
    // Forward request to Express app
    app(req, res);
  } catch (error) {
    console.error('[Vercel] Error in serverless function:', error);
    
    // Enhanced error reporting
    const debugInfo = {
      error: 'Server error',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      appPath: appPath,
      environment: process.env.NODE_ENV || 'undefined',
      vercel: process.env.VERCEL === '1' ? 'Yes' : 'No',
      nodeVersion: process.version,
      currentDir: __dirname,
      availableFiles: []
    };
    
    try {
      // List files in multiple locations for debugging
      const locations = [
        { name: 'root', path: path.join(__dirname, '..') },
        { name: 'api', path: __dirname },
        { name: 'server', path: path.join(__dirname, '../server') },
        { name: 'dist', path: path.join(__dirname, '../dist') }
      ];
      
      locations.forEach(location => {
        try {
          if (fs.existsSync(location.path)) {
            const files = fs.readdirSync(location.path);
            debugInfo.availableFiles.push({
              location: location.name,
              files: files
            });
          } else {
            debugInfo.availableFiles.push({
              location: location.name,
              error: 'Directory does not exist'
            });
          }
        } catch (fsError) {
          debugInfo.availableFiles.push({
            location: location.name,
            error: fsError.message
          });
        }
      });
    } catch (fsError) {
      console.error('[Vercel] Error listing files:', fsError);
      debugInfo.fileListingError = fsError.message;
    }
    
    res.status(500).json(debugInfo);
  }
}