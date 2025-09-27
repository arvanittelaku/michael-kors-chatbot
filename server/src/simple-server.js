import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple chatbot endpoint
app.post('/api/albi-mall/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    // Simple response for testing
    const response = {
      success: true,
      data: {
        assistant_text: `Mirë se vini! Kërkesa juaj: "${message}". Kam marrë mesazhin tuaj dhe po punoj për të gjetur produkte të përshtatshme.`,
        recommended_products: [
          {
            id: 'test_product_1',
            title: 'Produkt Test 1',
            highlight: [
              'Çmimi: $25',
              'Ngjyra: Bardhë',
              'Materiali: Pambuk'
            ]
          },
          {
            id: 'test_product_2', 
            title: 'Produkt Test 2',
            highlight: [
              'Çmimi: $30',
              'Ngjyra: Zi',
              'Materiali: Polyester'
            ]
          }
        ],
        audit_notes: 'Test response - backend working'
      },
      sessionId: sessionId || 'default-session'
    };

    res.json(response);

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});
