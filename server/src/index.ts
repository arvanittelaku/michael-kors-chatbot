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
import cors from 'cors';
import helmet from 'helmet';
import chatbotRouter from './routes/chatbot';
import debugRouter from './routes/debug'; // Import debug router

const app = express();
const PORT = process.env.PORT || 5000;

// Export app for testing
export { app };

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://albimalldemo.netlify.app',
    'https://michael-kors-chatbot.vercel.app',
    'https://michael-kors-chatbot-xkof.vercel.app',
    /^https:\/\/.*\.netlify\.app$/, // Allow all Netlify subdomains
    /^https:\/\/.*\.vercel\.app$/, // Allow all Vercel subdomains
    process.env.FRONTEND_URL
  ].filter((url): url is string | RegExp => Boolean(url)),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Image proxy to serve HTTP images over HTTPS
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    const axios = require('axios');
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    // Set CORS headers explicitly for images
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(response.data);
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(404).send('Image not found');
  }
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