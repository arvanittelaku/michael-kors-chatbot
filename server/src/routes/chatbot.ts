import express from 'express';
import { ChatbotService } from '../services/chatbot/ChatbotService';

const router = express.Router();

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    console.log('[ROUTE] 📨 Received chat request:', {
      userId: req.body.userId,
      message: req.body.message,
      timestamp: new Date().toISOString()
    });

    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and message are required' 
      });
    }

    console.log('[ROUTE] 🔍 Calling ChatbotService.handleMessage...');
    const response = await ChatbotService.handleMessage({
      userId,
      message,
      timestamp: new Date()
    });

    console.log('[ROUTE] ✅ ChatbotService returned response:', {
      messageLength: response.message?.length || 0,
      productsCount: response.products?.length || 0,
      firstProductId: response.products?.[0]?.id || 'none',
      firstProductName: response.products?.[0]?.name || 'none',
      hasRealData: response.products?.[0]?._source === 'trieve'
    });

    res.json(response);
  } catch (error) {
    console.error('[ROUTE] ❌ Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

export default router;

