import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { sampleProducts, suggestedQueries, Product, SuggestedQuery } from './data/products';
import RAGService from './services/simpleRagService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize RAG Service
const ragService = new RAGService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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
      product.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
      product.features.some(feature => feature.toLowerCase().includes(keyword))
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

app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  try {
    const ragResponse = await ragService.processQuery(query);
    res.json(ragResponse);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Failed to process search query',
      message: "I'm having trouble processing your request right now. Please try again.",
      products: [],
      query: query,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/suggest', async (req, res) => {
  const { category } = req.body;
  
  try {
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

// New RAG-powered endpoints
app.post('/api/recommendations', async (req, res) => {
  const { preferences } = req.body;
  
  if (!preferences || typeof preferences !== 'string') {
    return res.status(400).json({ error: 'Preferences are required' });
  }
  
  try {
    const recommendations = await ragService.getRecommendations(preferences);
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: "I couldn't generate recommendations right now. Please try again.",
      products: [],
      query: preferences,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/compare', async (req, res) => {
  const { productIds } = req.body;
  
  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ error: 'Product IDs array is required' });
  }
  
  try {
    const comparison = await ragService.compareProducts(productIds);
    res.json(comparison);
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ 
      error: 'Failed to compare products',
      message: "I couldn't compare the products right now. Please try again.",
      products: [],
      query: `Compare products: ${productIds.join(', ')}`,
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
