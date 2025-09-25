import express from 'express';
import { AlbiMallAssistant, AlbiMallResponse } from '../services/albiMallAssistant';
import { ProductDocument } from '../types/trieve';
import { validateRequest } from '../middleware/validation';

const router = express.Router();
const albiMallAssistant = new AlbiMallAssistant();

/**
 * POST /api/albi-mall/chat
 * Main endpoint for Albi Mall AI Shopping Assistant
 */
router.post('/chat', validateRequest, async (req, res) => {
  try {
    const { query, sessionId, retrievedProducts } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'SessionId is required and must be a string'
      });
    }

    console.log(`🤖 Processing Albi Mall query: "${query}" for session: ${sessionId}`);

    // Process the query
    const response: AlbiMallResponse = await albiMallAssistant.processQuery(
      query,
      sessionId,
      retrievedProducts || []
    );

    res.json({
      success: true,
      data: response,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Albi Mall chat endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/albi-mall/search
 * Search products using Trieve
 */
router.post('/search', validateRequest, async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    console.log(`🔍 Searching products for query: "${query}"`);

    // Import TrieveService dynamically to avoid circular dependencies
    const TrieveService = (await import('../services/trieveService')).default;
    const trieveService = new TrieveService({
      apiKey: process.env.TRIEVE_API_KEY || '',
      datasetId: process.env.TRIEVE_DATASET_ID || '',
      organizationId: process.env.TRIEVE_ORGANIZATION_ID || '',
      baseUrl: process.env.TRIEVE_BASE_URL || 'https://api.trieve.ai'
    });

    const products: ProductDocument[] = await trieveService.searchProducts(query, limit);

    res.json({
      success: true,
      data: {
        products,
        query,
        count: products.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Albi Mall search endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/albi-mall/recommendations
 * Get personalized recommendations
 */
router.post('/recommendations', validateRequest, async (req, res) => {
  try {
    const { preferences, sessionId, limit = 5 } = req.body;

    if (!preferences || typeof preferences !== 'string') {
      return res.status(400).json({
        error: 'Preferences are required and must be a string'
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'SessionId is required and must be a string'
      });
    }

    console.log(`💡 Getting recommendations for preferences: "${preferences}"`);

    // Process as a query to get recommendations
    const response: AlbiMallResponse = await albiMallAssistant.processQuery(
      preferences,
      sessionId
    );

    res.json({
      success: true,
      data: response,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Albi Mall recommendations endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/albi-mall/filter
 * Apply filters to products
 */
router.post('/filter', validateRequest, async (req, res) => {
  try {
    const { 
      products, 
      filters, 
      sessionId 
    } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        error: 'Products array is required'
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'SessionId is required and must be a string'
      });
    }

    console.log(`🔍 Applying filters to ${products.length} products`);

    // Create a mock query with filters
    const filterQuery = buildFilterQuery(filters);
    
    // Process the filtered query
    const response: AlbiMallResponse = await albiMallAssistant.processQuery(
      filterQuery,
      sessionId,
      products
    );

    res.json({
      success: true,
      data: response,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Albi Mall filter endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Build filter query from filter object
 */
function buildFilterQuery(filters: any): string {
  const parts = [];
  
  if (filters.color) {
    parts.push(`${filters.color} color`);
  }
  
  if (filters.priceRange) {
    if (filters.priceRange.min && filters.priceRange.max) {
      parts.push(`$${filters.priceRange.min} - $${filters.priceRange.max}`);
    } else if (filters.priceRange.max) {
      parts.push(`under $${filters.priceRange.max}`);
    } else if (filters.priceRange.min) {
      parts.push(`over $${filters.priceRange.min}`);
    }
  }
  
  if (filters.category) {
    parts.push(filters.category);
  }
  
  if (filters.material) {
    parts.push(`${filters.material} material`);
  }
  
  if (filters.style) {
    parts.push(`${filters.style} style`);
  }
  
  if (filters.occasion) {
    parts.push(`for ${filters.occasion}`);
  }
  
  return parts.join(' ');
}

/**
 * DELETE /api/albi-mall/session/:sessionId
 * Clear session context
 */
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: 'SessionId is required'
      });
    }

    albiMallAssistant.clearSessionContext(sessionId);

    res.json({
      success: true,
      message: 'Session context cleared',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error clearing session context:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/albi-mall/stats
 * Get session statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = albiMallAssistant.getSessionStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/albi-mall/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      service: 'Albi Mall AI Shopping Assistant',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
