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
// In production, use the built app
// Adjust path to specifically look for index.js in the root of dist
const appPath = isDev 
  ? '../server/index.js' 
  : '../index.js';

// Dynamic import to get the Express app
export default async function handler(req, res) {
  try {
    // Get the app dynamically
    const appModule = await import(appPath);
    const app = appModule.default;
    
    // Forward request to Express app
    app(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    res.status(500).send('Server error');
  }
}