// Special server adapter for Vercel deployment
// This serves as an entry point for Vercel serverless functions

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes.js';

// Flag to indicate this is a Vercel environment
process.env.SERVER_ENV = 'vercel';

// Get directory info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();

  console.log('[Vercel] Starting server in Vercel environment');
  console.log('[Vercel] Environment:', process.env.NODE_ENV);
  console.log('[Vercel] Current directory:', __dirname);

  try {
    // Configure Express middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Register API routes
    await registerRoutes(app);

    // In production on Vercel, serve static files from the dist/public directory
    if (process.env.NODE_ENV === 'production') {
      console.log('[Vercel] Setting up production static serving');
      const publicDir = path.resolve(process.cwd(), 'public');
      console.log('[Vercel] Public directory:', publicDir);
      app.use(express.static(publicDir, { index: 'index.html' }));
      
      // Serve all other requests from index.html
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(publicDir, 'index.html'));
      });
    } else {
      // In development, set up Vite middleware
      const root = path.resolve(__dirname, '..');
      const vite = await createViteServer({
        root,
        server: { middlewareMode: true },
        appType: 'spa'
      });
      
      app.use(vite.middlewares);
    }

    console.log('[Vercel] Server setup complete');
  } catch (error) {
    console.error('[Vercel] Error setting up server:', error);
    throw error;
  }

  return app;
}

// Create and export the server
let serverPromise;

export default async function vercelHandler(req, res) {
  console.log('[Vercel] Request received:', req.method, req.url);
  
  try {
    // Create server once and reuse
    if (!serverPromise) {
      console.log('[Vercel] Creating new server instance');
      serverPromise = createServer();
    }
    
    const app = await serverPromise;
    
    // Handle the request using Express
    app(req, res);
  } catch (error) {
    console.error('[Vercel] Error handling request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
}