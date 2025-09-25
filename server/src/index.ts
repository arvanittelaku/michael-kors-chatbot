import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { sampleProducts, suggestedQueries } from './data/products';
import { Product, SuggestedQuery } from './types/shared';
import { SimpleRAGService } from './services/simpleRagService';
import aiRoutes from './routes/ai';
import albiMallRoutes from './routes/albiMall';
import { 
  validateSearchQuery, 
  validateProductArray, 
  validateCategory, 
  validateProductIds,
  errorHandler,
  notFoundHandler
} from './middleware/validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize RAG Service
const ragService = new SimpleRAGService();

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

// AI Routes (secure server-side only)
app.use('/api/ai', aiRoutes);

// Albi Mall AI Shopping Assistant Routes
app.use('/api/albi-mall', albiMallRoutes);

// Simple keyword matching function for product suggestions
function findMatchingProducts(query: string, products: Product[]): Product[] {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(' ').filter(word => word.length > 2);
  
  return products.filter(product => {
    const searchableText = [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.description,
      ...product.tags,
      ...product.features
    ].join(' ').toLowerCase();
    
    // Check if any keyword matches
    return keywords.some(keyword => 
      searchableText.includes(keyword) ||
      product.tags.some((tag: string) => tag.toLowerCase().includes(keyword)) ||
      product.features.some((feature: string) => feature.toLowerCase().includes(keyword))
    );
  });
}

// Generate chatbot response based on query
function generateChatbotResponse(query: string, matchingProducts: Product[]): string {
  const queryLower = query.toLowerCase();
  
  if (matchingProducts.length === 0) {
    return "I couldn't find products matching your request. Could you try describing what you're looking for in different words?";
  }
  
  if (queryLower.includes('large') && queryLower.includes('tote')) {
    return `I found ${matchingProducts.length} large tote bags perfect for everyday use! These spacious bags are ideal for carrying all your essentials.`;
  }
  
  if (queryLower.includes('shoes') && queryLower.includes('trip')) {
    return `Great choice! I found ${matchingProducts.length} comfortable shoes that are perfect for travel. These are lightweight and easy to pack.`;
  }
  
  if (queryLower.includes('wallet') && queryLower.includes('phone')) {
    return `Perfect! I found ${matchingProducts.length} wallets designed to fit your phone. These slim designs keep everything organized.`;
  }
  
  if (queryLower.includes('backpack') && queryLower.includes('everyday')) {
    return `Excellent! I found ${matchingProducts.length} backpacks that are perfect for daily wear. They're comfortable and practical.`;
  }
  
  return `I found ${matchingProducts.length} products that match your request! Here are some great options for you.`;
}

// Routes
app.get('/api/suggested-queries', (req, res) => {
  res.json(suggestedQueries);
});

app.post('/api/search', validateSearchQuery, async (req, res) => {
  try {
    const { query, isGeneralQuestion, conversationHistory } = req.body;
    
    if (isGeneralQuestion) {
      // Handle general questions with intelligent AI response
      const generalResponse = await ragService.handleGeneralQuestion(query, conversationHistory);
      res.json(generalResponse);
    } else {
      // Handle product searches with conversation context
      const ragResponse = await ragService.processQuery(query, conversationHistory);
      res.json(ragResponse);
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to process search query',
      message: "I'm having trouble processing your request right now. Please try again.",
      products: [],
      query: req.body.query,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/suggest', validateCategory, async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      const allProducts = await ragService.getAllProducts();
      return res.json(allProducts.slice(0, 6));
    }
    
    const categoryProducts = await ragService.searchByCategory(category);
    res.json(categoryProducts.slice(0, 6));
  } catch (error) {
    console.error('Suggest error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

app.post('/api/recommendations', validateSearchQuery, validateProductArray, async (req, res) => {
  try {
    const { query, products } = req.body;
    const recommendations = await ragService.getRecommendations(query);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: "I couldn't generate recommendations right now. Please try again.",
      products: [],
      query: req.body.query,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/compare', validateProductIds, async (req, res) => {
  try {
    const { productIds } = req.body;
    const comparison = await ragService.compareProducts(productIds);
    res.json(comparison);
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ 
      error: 'Failed to compare products',
      message: "I couldn't compare the products right now. Please try again.",
      products: [],
      query: `Compare products: ${req.body.productIds.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await ragService.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

app.get('/api/status', (req, res) => {
  const status = ragService.getStatus();
  res.json(status);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API available at http://localhost:${PORT}/api`);
  
  // Initialize RAG system
  try {
    console.log('🔄 Initializing RAG system...');
    await ragService.initialize();
    console.log('✅ RAG system ready!');
  } catch (error) {
    console.error('❌ Failed to initialize RAG system:', error);
    console.log('⚠️  Server running with fallback mode');
  }
});
