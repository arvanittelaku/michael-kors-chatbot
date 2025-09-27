import { TrieveService } from './trieveService';
import { GroqService } from './groqService';
import { Product, ChatbotResponse, SessionContext, ChatRequest, ChatResponse } from '../types/shared';

// Session Manager for robust context persistence
class SessionManager {
  private static instance: SessionManager;
  private sessionStore: Map<string, {
    lastQuery?: string;
    lastProducts?: Product[];
    lastCategory?: string;
    lastProductType?: string;
    timestamp: number;
  }> = new Map();

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  setContext(sessionId: string, context: {
    lastQuery?: string;
    lastProducts?: Product[];
    lastCategory?: string;
    lastProductType?: string;
  }): void {
    this.sessionStore.set(sessionId, {
      ...context,
      timestamp: Date.now()
    });
    console.log(`[SessionManager] Stored context for ${sessionId}:`, {
      lastQuery: context.lastQuery,
      lastProductsCount: context.lastProducts?.length || 0,
      lastProductType: context.lastProductType
    });
  }

  getContext(sessionId: string): {
    lastQuery?: string;
    lastProducts?: Product[];
    lastCategory?: string;
    lastProductType?: string;
  } | null {
    const context = this.sessionStore.get(sessionId);
    if (!context) {
      console.log(`[SessionManager] No context found for ${sessionId}`);
      return null;
    }
    
    // Clean up old sessions (older than 1 hour)
    if (Date.now() - context.timestamp > 3600000) {
      this.sessionStore.delete(sessionId);
      console.log(`[SessionManager] Cleaned up old session ${sessionId}`);
      return null;
    }
    
    console.log(`[SessionManager] Retrieved context for ${sessionId}:`, {
      lastQuery: context.lastQuery,
      lastProductsCount: context.lastProducts?.length || 0,
      lastProductType: context.lastProductType
    });
    
    return {
      lastQuery: context.lastQuery,
      lastProducts: context.lastProducts,
      lastCategory: context.lastCategory,
      lastProductType: context.lastProductType
    };
  }

  clearSession(sessionId: string): void {
    this.sessionStore.delete(sessionId);
    console.log(`[SessionManager] Cleared session ${sessionId}`);
  }
}

export class AlbiMallAssistant {
  private trieveService: TrieveService;
  private groqService: GroqService;
  private sessions: Map<string, SessionContext>;
  private sessionManager: SessionManager;

  constructor() {
    this.trieveService = new TrieveService();
    this.groqService = new GroqService();
    this.sessions = new Map();
    this.sessionManager = SessionManager.getInstance();
  }

  private getOrCreateSession(sessionId: string): SessionContext {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        conversationHistory: []
      });
    }
    return this.sessions.get(sessionId)!;
  }

  private updateSessionContext(sessionId: string, userMessage: string, assistantResponse: string, products: Product[], searchQuery?: string, filters?: any) {
    const context = this.getOrCreateSession(sessionId);
    
    // Add to conversation history
    context.conversationHistory.push({
      user: userMessage,
      assistant: assistantResponse,
      timestamp: new Date()
    });

    // Keep only last 10 conversations to prevent memory bloat
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }

    // Update context with latest products and processed query
    context.lastQuery = searchQuery || userMessage;
    
    // Only update lastProducts if this is a new product search, not a follow-up question
    const isFollowUp = this.isFollowUpQuery(userMessage, context);
    if (!isFollowUp) {
      context.lastProducts = products;
    }
    
    if (filters) {
      context.lastFilters = filters;
    }
    
    // Extract category from products if available
    if (products.length > 0) {
      context.lastCategory = products[0].category;
    }

    this.sessions.set(sessionId, context);
    
    // Update SessionManager with robust context storage
    this.sessionManager.setContext(sessionId, {
      lastQuery: context.lastQuery,
      lastProducts: context.lastProducts,
      lastCategory: context.lastCategory,
      lastProductType: context.lastQuery ? this.extractProductType(context.lastQuery) : undefined
    });
  }

  private extractProductType(query: string): string | undefined {
    const queryLower = query.toLowerCase();
    
    // Define product type mappings
    const productTypes: { [key: string]: string } = {
      'këmishë': 'këmisha',
      'kemishe': 'këmisha', 
      'shirt': 'këmisha',
      'pantofla': 'pantofla',
      'slipper': 'pantofla',
      'peshqir': 'peshqir',
      'towel': 'peshqir',
      'pantallona': 'pantallona',
      'pants': 'pantallona',
      'xhinse': 'xhinse',
      'jeans': 'xhinse',
      'bluzë': 'bluzë',
      'blouse': 'bluzë',
      'fustan': 'fustan',
      'dress': 'fustan',
      'xhaketë': 'xhaketë',
      'jacket': 'xhaketë',
      'qantë': 'qantë',
      'bag': 'qantë',
      'këpucë': 'këpucë',
      'shoes': 'këpucë',
      'çorape': 'çorape',
      'socks': 'çorape',
      'maicë': 'maicë',
      't-shirt': 'maicë',
      'të brendshme': 'të brendshme',
      'underwear': 'të brendshme',
      'jastek': 'jastek',
      'pillow': 'jastek',
      'jorgan': 'jorgan',
      'duvet': 'jorgan'
    };
    
    // Find the first matching product type
    for (const [keyword, productType] of Object.entries(productTypes)) {
      if (queryLower.includes(keyword)) {
        return productType;
      }
    }
    
    return undefined;
  }

  private extractFiltersFromQuery(query: string, context: SessionContext): {
    price?: { min?: number; max?: number };
    color?: string;
    size?: string;
    material?: string;
    brand?: string;
    productType?: string;
  } {
    const filters: any = {};
    const queryLower = query.toLowerCase();

    // Price filters
    const priceMatch = queryLower.match(/(\d+)\s*\$?/g);
    if (priceMatch) {
      const prices = priceMatch.map(p => parseInt(p.replace(/\D/g, '')));
      if (queryLower.includes('më pak') || queryLower.includes('nën') || queryLower.includes('under')) {
        filters.price = { max: Math.max(...prices) };
      } else if (queryLower.includes('më shumë') || queryLower.includes('mbi') || queryLower.includes('over')) {
        filters.price = { min: Math.min(...prices) };
      } else if (prices.length === 2) {
        filters.price = { min: Math.min(...prices), max: Math.max(...prices) };
      } else {
        filters.price = { max: prices[0] };
      }
    }

    // Color filters
    const colors = ['kuqe', 'bardhë', 'zeze', 'blu', 'gjelbër', 'verdhë', 'portokalli', 'roze', 'vjollcë', 'kafe'];
    for (const color of colors) {
      if (queryLower.includes(color)) {
        filters.color = color;
        break;
      }
    }

    // Size filters
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    for (const size of sizes) {
      if (queryLower.includes(size)) {
        filters.size = size;
        break;
      }
    }

    // Material filters
    const materials = ['pambuk', 'cotton', 'polyester', 'viscose', 'elastane'];
    for (const material of materials) {
      if (queryLower.includes(material)) {
        filters.material = material;
        break;
      }
    }

    // Brand filters
    const brands = ['boss', 'ozdilek', 'albi'];
    for (const brand of brands) {
      if (queryLower.includes(brand)) {
        filters.brand = brand;
        break;
      }
    }

    // Product type filter - CRITICAL FIX
    const productType = this.extractProductType(query);
    if (productType) {
      filters.productType = productType;
    }

    return filters;
  }

  private cleanColorValue(color: string): string {
    // Clean up invalid color values
    const invalidColors = ['sweaters', '900', 'bv9', 'dk chmb hthr', 'bedroom', 'apparel'];
    const colorLower = color.toLowerCase();
    
    if (invalidColors.includes(colorLower)) {
      return 'E bardhë'; // Default to white for invalid colors
    }
    
    // Convert common English colors to Albanian
    const colorMap: { [key: string]: string } = {
      'white': 'E bardhë',
      'black': 'E zezë',
      'blue': 'Blu',
      'red': 'E kuqe',
      'green': 'E gjelbër',
      'yellow': 'E verdhë',
      'orange': 'Portokalli',
      'pink': 'Roze',
      'purple': 'Vjollcë',
      'brown': 'Kafe',
      'grey': 'Gri',
      'gray': 'Gri'
    };
    
    return colorMap[colorLower] || color;
  }

  private filterProductsByCriteria(products: Product[], filters: {
    price?: { min?: number; max?: number };
    color?: string;
    size?: string;
    material?: string;
    brand?: string;
    productType?: string; // Add product type filter
  }): Product[] {
    return products.filter(product => {
      // Product type filter - CRITICAL for context retention
      if (filters.productType) {
        const productNameLower = product.name.toLowerCase();
        const productTypeLower = filters.productType.toLowerCase();
        
        // Strict matching for product types
        if (productTypeLower === 'këmisha') {
          // Only allow shirts, not t-shirts or other items
          if (!productNameLower.includes('këmish') && !productNameLower.includes('shirt')) {
            return false;
          }
          // Exclude t-shirts, jeans, underwear, towels, etc.
          if (productNameLower.includes('maicë') || 
              productNameLower.includes('xhinse') || 
              productNameLower.includes('të brendshme') || 
              productNameLower.includes('peshqir') ||
              productNameLower.includes('set')) {
            return false;
          }
        } else if (productTypeLower === 'maicë') {
          // Only allow t-shirts
          if (!productNameLower.includes('maicë') && !productNameLower.includes('t-shirt')) {
            return false;
          }
        } else if (productTypeLower === 'xhinse') {
          // Only allow jeans
          if (!productNameLower.includes('xhinse') && !productNameLower.includes('jeans')) {
            return false;
          }
        } else if (productTypeLower === 'peshqir') {
          // Only allow towels
          if (!productNameLower.includes('peshqir') && !productNameLower.includes('towel')) {
            return false;
          }
        } else if (productTypeLower === 'pantofla') {
          // Only allow slippers - STRICT MATCHING
          if (!productNameLower.includes('pantofla') && !productNameLower.includes('slipper')) {
            return false;
          }
          // Exclude towels, sets, and other unrelated products
          if (productNameLower.includes('peshqir') || 
              productNameLower.includes('towel') ||
              productNameLower.includes('set') ||
              productNameLower.includes('çarçaf')) {
            return false;
          }
        } else if (productTypeLower === 'jastek') {
          // Only allow pillows - STRICT MATCHING
          if (!productNameLower.includes('jastek') && !productNameLower.includes('pillow')) {
            return false;
          }
          // Exclude sweaters, bags, and other unrelated products
          if (productNameLower.includes('pulover') || 
              productNameLower.includes('sweater') ||
              productNameLower.includes('cante') ||
              productNameLower.includes('bag') ||
              productNameLower.includes('qantë')) {
            return false;
          }
        } else if (productTypeLower === 'jorgan') {
          // Only allow duvets/comforters - STRICT MATCHING
          if (!productNameLower.includes('jorgan') && !productNameLower.includes('duvet') && !productNameLower.includes('comforter')) {
            return false;
          }
          // Exclude pillows, sweaters, and other unrelated products
          if (productNameLower.includes('jastek') || 
              productNameLower.includes('pillow') ||
              productNameLower.includes('pulover') ||
              productNameLower.includes('sweater')) {
            return false;
          }
        }
      }
      if (filters.price) {
        if (filters.price.max && product.price > filters.price.max) {
          return false;
        }
        if (filters.price.min && product.price < filters.price.min) {
          return false;
        }
      }

      // Color filter
      if (filters.color && !product.color.toLowerCase().includes(filters.color.toLowerCase())) {
        return false;
      }

      // Size filter
      if (filters.size && !product.sizes.includes(filters.size.toLowerCase())) {
        return false;
      }

      // Material filter
      if (filters.material && !product.material.toLowerCase().includes(filters.material.toLowerCase())) {
        return false;
      }

      // Brand filter
      if (filters.brand && !product.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  private isFollowUpQuery(query: string, context: SessionContext): boolean {
    const followUpKeywords = [
      'më lirë', 'më shtrenjtë', 'më pak', 'më shumë', 'nën', 'mbi',
      'kuqe', 'bardhë', 'zeze', 'blu', 'gjelbër', 'verdhë',
      'më të vogël', 'më të madhe', 's', 'm', 'l', 'xl',
      'pambuk', 'cotton', 'polyester', 'viscose',
      'cilën më sugjeron', 'më mirë', 'më të mirë'
    ];

    const queryLower = query.toLowerCase();
    const hasFollowUpKeyword = followUpKeywords.some(keyword => queryLower.includes(keyword));
    const hasLastProducts = Boolean(context.lastProducts && context.lastProducts.length > 0);
    
    return hasFollowUpKeyword && hasLastProducts;
  }

  private buildSearchQuery(userMessage: string, context: SessionContext): string {
    // If it's a follow-up query, combine the last query with the new filter
    if (this.isFollowUpQuery(userMessage, context) && context.lastQuery) {
      // Extract filters from the current message
      const filters = this.extractFiltersFromQuery(userMessage, context);
      
      // Build a combined query that includes both the original product type and new filters
      let combinedQuery = context.lastQuery;
      
      console.log('Follow-up query detected. Original query:', context.lastQuery);
      console.log('New filters:', filters);
      
      // Add price filters
      if (filters.price) {
        if (filters.price.max) {
          combinedQuery += ` under ${filters.price.max} dollars`;
        }
        if (filters.price.min) {
          combinedQuery += ` above ${filters.price.min} dollars`;
        }
      }
      
      // Add color filters
      if (filters.color) {
        combinedQuery += ` ${filters.color}`;
      }
      
      // Add size filters
      if (filters.size) {
        combinedQuery += ` size ${filters.size}`;
      }
      
      // Add material filters
      if (filters.material) {
        combinedQuery += ` ${filters.material}`;
      }
      
      console.log('Combined query:', combinedQuery);
      return combinedQuery;
    }

    // Clean and normalize the query
    let query = userMessage.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Handle common Albanian product synonyms
    const synonyms: { [key: string]: string } = {
      'peshqir': 'towel',
      'pantofla': 'slipper',
      'këmishë': 'shirt',
      'pantallona': 'pants',
      'bluzë': 'blouse',
      'fustan': 'dress',
      'xhaketë': 'jacket',
      'qantë': 'bag',
      'këpucë': 'shoes',
      'çorape': 'socks'
    };

    for (const [albanian, english] of Object.entries(synonyms)) {
      if (query.includes(albanian)) {
        query = query.replace(albanian, english);
      }
    }

    // Special handling for specific queries
    if (query.includes('shirt') && query.includes('meshkuj')) {
      query = 'shirt men male dress shirt';
    } else if (query.includes('shirt') && query.includes('femra')) {
      query = 'shirt women female blouse';
    } else if (query.includes('shirt')) {
      query = 'shirt dress shirt';
    }

    return query;
  }

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const sessionId = request.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context = this.getOrCreateSession(sessionId);
    
    console.log('Processing message for session:', sessionId);
    console.log('Current context:', {
      lastQuery: context.lastQuery,
      lastProductsCount: context.lastProducts?.length || 0,
      lastCategory: context.lastCategory
    });
    
    try {
      // Enhanced follow-up detection using ChatGPT's recommended approach
      const priceRegex = /\d+\$|\d+ lekë/i;
      const lacksProduct = !/(kemishe|pantallona|xhinse|fustan|pantofla|peshqir|maicë|të brendshme)/i.test(request.message);
      const isFollowUp = priceRegex.test(request.message) && lacksProduct;
      
      console.log('=== ENHANCED FOLLOW-UP DETECTION ===');
      console.log('Message:', request.message);
      console.log('Price regex match:', priceRegex.test(request.message));
      console.log('Lacks product type:', lacksProduct);
      console.log('Is follow-up:', isFollowUp);
      console.log('=====================================');
      
      if (isFollowUp) {
        console.log('Follow-up query detected. Applying direct context filtering.');
        console.log('Session ID:', sessionId);
        
        // Check SessionManager for robust context retrieval
        const sessionContext = this.sessionManager.getContext(sessionId);
        console.log('SessionManager context:', sessionContext);
        
        // CRITICAL FIX: Inject missing product type into follow-up query
        let finalQuery = request.message;
        if (sessionContext?.lastProductType) {
          finalQuery = `${sessionContext.lastProductType} ${request.message}`;
          console.log('Context injection applied:', {
            originalQuery: request.message,
            lastProductType: sessionContext.lastProductType,
            finalQuery: finalQuery
          });
        } else {
          console.log('No product type context available for injection');
        }
        
        // Use SessionManager context if available, otherwise use session context
        const productsToFilter = sessionContext?.lastProducts || context.lastProducts;
        console.log('Products to filter count:', productsToFilter?.length || 0);
        
        if (!productsToFilter || productsToFilter.length === 0) {
          console.log('No products to filter, proceeding with normal search');
        } else {
        
        // Extract price from the message
        const priceMatch = request.message.match(/(\d+)\s*\$?/);
        if (priceMatch) {
          const targetPrice = parseInt(priceMatch[1]);
          console.log('Target price:', targetPrice);
          
          // Get locked product type from SessionManager - ensure it's properly extracted
          let lockedProductType = sessionContext?.lastProductType;
          if (!lockedProductType && context.lastQuery) {
            lockedProductType = this.extractProductType(context.lastQuery);
          }
          
          // CRITICAL FIX: Use the injected finalQuery for product type extraction
          if (!lockedProductType) {
            lockedProductType = this.extractProductType(finalQuery);
          }
          
          console.log('Locked product type:', lockedProductType);
          console.log('Context lastQuery:', context.lastQuery);
          console.log('Final query used for extraction:', finalQuery);
          
          // CRITICAL DEBUG: Log when context is actually used
          console.log('=== CONTEXT USAGE DEBUG ===');
          console.log('Is follow-up:', isFollowUp);
          console.log('Last product type from context:', sessionContext?.lastProductType);
          console.log('Final query after injection:', finalQuery);
          console.log('Locked product type for filtering:', lockedProductType);
          console.log('============================');
          
          // Use the enhanced filterProductsByCriteria with product type locking
          const filters = {
            price: { max: targetPrice },
            productType: lockedProductType
          };
          
          const filteredProducts = this.filterProductsByCriteria(productsToFilter, filters);
          
          // CRITICAL DEBUG: Log filtering details
          console.log('=== PRODUCT FILTERING DEBUG ===');
          console.log('Query:', request.message);
          console.log('Resolved product type:', lockedProductType);
          console.log('Price max:', targetPrice);
          console.log('Products to filter count:', productsToFilter.length);
          console.log('Filtered products count:', filteredProducts.length);
          console.log('Products returned:', filteredProducts.map(p => ({ name: p.name, price: p.price })));
          console.log('Mismatched products:', productsToFilter.filter(p => !filteredProducts.includes(p)).map(p => ({ name: p.name, price: p.price })));
          console.log('================================');
          
          if (filteredProducts.length > 0) {
            // Create response with filtered products - use dynamic product type
            const productTypeText = lockedProductType || 'produkte';
            const response: ChatbotResponse = {
              assistant_text: `Gjeta ${filteredProducts.length} ${productTypeText} që përputhen me kërkesën tuaj nën $${targetPrice}.`,
              recommended_products: filteredProducts.slice(0, 3).map(product => ({
                id: product.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: product.name || 'Produkt i panjohur',
                highlight: [
                  `Çmimi: $${product.price || 'N/A'}`,
                  `Ngjyra: ${product.color || 'N/A'}`,
                  `Materiali: ${product.material || 'N/A'}`
                ],
                image: product.image || undefined
              })),
              audit_notes: 'Direct context filtering applied - follow-up query'
            };
            
            // Update session context with filtered products
            this.updateSessionContext(sessionId, request.message, response.assistant_text, filteredProducts, context.lastQuery, {});
            
            return {
              success: true,
              data: response,
              sessionId: sessionId
            };
          } else {
            // No products match the filter, return ONLY products of the correct type with explanation
            const productTypeText = lockedProductType || 'produkte';
            
            // CRITICAL FIX: Filter original products by product type only (no price filter)
            const typeOnlyFilter = { productType: lockedProductType };
            const productsOfCorrectType = this.filterProductsByCriteria(productsToFilter, typeOnlyFilter);
            
            const response: ChatbotResponse = {
              assistant_text: `Nuk gjeta ${productTypeText} nën $${targetPrice}. Këto janë ${productTypeText} që kemi në dispozicion:`,
              recommended_products: productsOfCorrectType.slice(0, 3).map(product => ({
                id: product.id || `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: product.name || 'Produkt i panjohur',
                highlight: [
                  `Çmimi: $${product.price || 'N/A'}`,
                  `Ngjyra: ${product.color || 'N/A'}`,
                  `Materiali: ${product.material || 'N/A'}`
                ],
                image: product.image || undefined
              })),
              audit_notes: 'No products match filter - showing original products'
            };
            
            return {
              success: true,
              data: response,
              sessionId: sessionId
            };
          }
        }
        }
      }
      
      // Build search query
      const searchQuery = this.buildSearchQuery(request.message, context);
      
      // Extract filters
      const filters = this.extractFiltersFromQuery(request.message, context);
      
      // Search products
      let products: Product[];
      if (Object.keys(filters).length > 0) {
        products = await this.trieveService.searchWithFilters(searchQuery, filters);
      } else {
        products = await this.trieveService.searchProducts(searchQuery);
      }

      // CRITICAL FIX: Apply product type filter after Trieve search to ensure strict filtering
      if (filters.productType) {
        console.log('Applying product type filter after Trieve search:', filters.productType);
        const beforeCount = products.length;
        products = this.filterProductsByCriteria(products, { productType: filters.productType });
        console.log(`Product type filter: ${beforeCount} -> ${products.length} products`);
      }

      // If this is a follow-up query with filters, prioritize filtering the last products
      if (this.isFollowUpQuery(request.message, context) && context.lastProducts && context.lastProducts.length > 0) {
        console.log('Follow-up query detected. Filtering last products.');
        console.log('Last products count:', context.lastProducts.length);
        console.log('Filters:', filters);
        
        const filteredProducts = this.filterProductsByCriteria(context.lastProducts, filters);
        console.log('Filtered products count:', filteredProducts.length);
        
        if (filteredProducts.length > 0) {
          console.log('Using filtered products from context');
          products = filteredProducts;
        } else {
          console.log('No products match filters, using original products');
          products = context.lastProducts;
        }
      }

      // Generate AI response
      let response: ChatbotResponse;
      try {
        // Force fallback for follow-up queries to test context retention
        if (this.isFollowUpQuery(request.message, context) && context.lastProducts && context.lastProducts.length > 0) {
          console.log('Using fallback response for follow-up query');
          response = await this.groqService.generateFallbackResponse(request.message, products, context);
        } else {
          response = await this.groqService.generateResponse(request.message, products, context);
        }
      } catch (error) {
        console.error('Groq service error:', error);
        response = await this.groqService.generateFallbackResponse(request.message, products, context);
      }

      // Update session context
      this.updateSessionContext(sessionId, request.message, response.assistant_text, products, searchQuery, filters);

      return {
        success: true,
        data: response,
        sessionId: sessionId
      };

    } catch (error) {
      console.error('AlbiMallAssistant error:', error);
      
      const errorResponse: ChatbotResponse = {
        assistant_text: 'Më falni, por kam një problem teknik. Mund të provoni përsëri?',
        recommended_products: [],
        audit_notes: `Error: ${error}`
      };

      return {
        success: false,
        data: errorResponse,
        sessionId: sessionId
      };
    }
  }

  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    return this.sessions.get(sessionId) || null;
  }

  async clearSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async getActiveSessions(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }
}
