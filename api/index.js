// api/index.js - Entry point for Vercel serverless functions
import vercelHandler from '../server/server-vercel.js';

export default async function handler(req, res) {
  console.log(`[API] Received ${req.method} request to ${req.url}`);
  
  try {
    // Pass the request to our Vercel server handler
    await vercelHandler(req, res);
  } catch (error) {
    console.error('[API] Unhandled error in serverless function:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      status: 500
    });
  }
}