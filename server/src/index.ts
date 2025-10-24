// Load environment variables FIRST, before any imports
import dotenv from 'dotenv';
const path = require('path');
dotenv.config({ path: path.join(process.cwd(), '../.env') });

console.log('[DEBUG] Current working directory:', process.cwd());
console.log('[DEBUG] Loading .env from:', path.join(process.cwd(), '../.env'));
console.log('TRIEVE_API_KEY:', process.env.TRIEVE_API_KEY ? 'Configured' : 'Not configured');
console.log('TRIEVE_DATASET_ID:', process.env.TRIEVE_DATASET_ID ? 'Configured' : 'Not configured');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured');

import express from 'express';
import helmet from 'helmet';
import chatbotRouter from './routes/chatbot';
import debugRouter from './routes/debug'; // Import debug router

const app = express();
const PORT = process.env.PORT || 5000;

// Export app for testing
export { app };

// Image proxy route MUST come BEFORE all other middleware to avoid CORS conflicts
app.get('/api/image-proxy', async (req, res) => {
  // Set CORS headers FIRST, before any other processing
  res.removeHeader('Access-Control-Allow-Credentials'); // Remove if already set
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('URL parameter required');
    }

    const axios = require('axios');
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      validateStatus: (status: number) => status < 500
    });

    if (response.status === 404) {
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.send(transparentPixel);
    }

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.send(response.data);
  } catch (error: any) {
    console.error('Image proxy error:', error.message);
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(transparentPixel);
  }
});

// Middleware (applied AFTER image proxy to avoid conflicts)
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom CORS middleware for all other routes
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  
  // Allow all Vercel and Netlify subdomains + localhost
  const isAllowedOrigin = 
    origin.includes('localhost') ||
    origin.includes('netlify.app') ||
    origin.includes('vercel.app') ||
    origin === 'https://michael-kors-chatbot.vercel.app' ||
    origin === process.env.FRONTEND_URL;

  if (isAllowedOrigin) {
    // 🔥 CRITICAL FIX: Set exact origin, not wildcard, to work with credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin'); // Important for caching
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Michael Kors Chatbot API is running!', 
    endpoints: {
      health: '/api/health',
      chat: '/chat',
      debug: '/debug'
    },
    timestamp: new Date().toISOString() 
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// AI-powered store assistant chatbot routes
app.use("/chat", chatbotRouter);

// Debug routes (temporary)
app.use("/debug", debugRouter); // Add debug router

// Diagnostics routes removed - new AI-powered store assistant will have its own diagnostic capabilities


// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API available at http://localhost:${PORT}/api`);
  });
}