// Vercel serverless function adapter
import app from '../dist/index.js';
import { createServer } from 'http';

const server = createServer(app);

export default function handler(req, res) {
  // This adapter forwards the req, res objects to Express
  return new Promise((resolve, reject) => {
    server.emit('request', req, res);
    res.on('finish', resolve);
    res.on('error', reject);
  });
}