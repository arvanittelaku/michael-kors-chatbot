const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple chatbot endpoint
app.post('/api/albi-mall/chat', (req, res) => {
  try {
    const { message, sessionId } = req.body;

    console.log('Received message:', message, 'from session:', sessionId);

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
            ],
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop'
          },
          {
            id: 'test_product_2', 
            title: 'Produkt Test 2',
            highlight: [
              'Çmimi: $30',
              'Ngjyra: Zi',
              'Materiali: Polyester'
            ],
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop'
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
});
