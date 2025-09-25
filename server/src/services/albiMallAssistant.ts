import { ProductDocument } from '../types/trieve';
import { GroqService } from './groqService';
import TrieveService from './trieveService';
import { searchCache, generateSearchKey, generateAIResponseKey } from '../utils/cache';

export interface AlbiMallResponse {
  assistant_text: string;
  recommended_products: Array<{
    id: string;
    title: string;
    highlight: string;
  }>;
  audit_notes?: string;
}

export interface SessionContext {
  messages: Array<{
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  appliedFilters: {
    color?: string;
    priceRange?: { min?: number; max?: number };
    category?: string;
    material?: string;
    style?: string;
    occasion?: string;
  };
  previousRecommendations: string[];
}

export class AlbiMallAssistant {
  private groqService: GroqService;
  private trieveService: TrieveService;
  private sessionContexts: Map<string, SessionContext> = new Map();

  constructor() {
    this.groqService = new GroqService();
    this.trieveService = new TrieveService({
      apiKey: process.env.TRIEVE_API_KEY || '',
      datasetId: process.env.TRIEVE_DATASET_ID || '',
      organizationId: process.env.TRIEVE_ORGANIZATION_ID || '',
      baseUrl: process.env.TRIEVE_BASE_URL || 'https://api.trieve.ai'
    });
  }

  /**
   * Process user query and return structured response
   */
  async processQuery(
    userQuery: string,
    sessionId: string,
    retrievedProducts: ProductDocument[] = []
  ): Promise<AlbiMallResponse> {
    try {
      console.log(`🔍 Processing query: "${userQuery}" for session: ${sessionId}`);

      // Get or create session context
      const sessionContext = this.getSessionContext(sessionId);

      // Check cache first
      const cacheKey = generateSearchKey(userQuery);
      const cachedResult = searchCache.get<AlbiMallResponse>(cacheKey);
      
      if (cachedResult) {
        console.log(`🎯 Cache hit for query: "${userQuery}"`);
        this.updateSessionContext(sessionId, 'user', userQuery);
        this.updateSessionContext(sessionId, 'assistant', cachedResult.assistant_text);
        return cachedResult;
      }

      // If no products provided, retrieve from Trieve
      let products = retrievedProducts;
      if (products.length === 0) {
        products = await this.trieveService.searchProducts(userQuery, 10);
      }

      // Apply dynamic filtering based on user query and session context
      const filteredProducts = this.applyDynamicFiltering(userQuery, products, sessionContext);

      // Generate intelligent response using Groq
      const response = await this.generateIntelligentResponse(
        userQuery,
        filteredProducts,
        sessionContext
      );

      // Update session context
      this.updateSessionContext(sessionId, 'user', userQuery);
      this.updateSessionContext(sessionId, 'assistant', response.assistant_text);

      // Cache the result
      searchCache.set(cacheKey, response);

      return response;
    } catch (error) {
      console.error('❌ Error processing query:', error);
      return this.getFallbackResponse(userQuery, retrievedProducts);
    }
  }

  /**
   * Apply dynamic filtering based on user query and session context
   */
  private applyDynamicFiltering(
    userQuery: string,
    products: ProductDocument[],
    sessionContext: SessionContext
  ): ProductDocument[] {
    const queryLower = userQuery.toLowerCase();
    let filteredProducts = [...products];

    // Extract filters from current query
    const currentFilters = this.extractFiltersFromQuery(userQuery);

    // Merge with session context filters
    const combinedFilters = {
      ...sessionContext.appliedFilters,
      ...currentFilters
    };

    // STRICT DATASET INTEGRITY CHECK
    // If user asks for a specific brand that's not in our dataset, return empty
    const brandKeywords = ['gucci', 'louis vuitton', 'chanel', 'prada', 'hermes', 'dior', 'balenciaga', 'versace', 'givenchy'];
    const requestedBrand = brandKeywords.find(brand => queryLower.includes(brand));
    
    if (requestedBrand && !products.some(p => p.brand.toLowerCase().includes(requestedBrand))) {
      console.log(`🚫 Brand integrity check: User asked for ${requestedBrand} but we only have Michael Kors products`);
      return []; // Return empty array to maintain dataset integrity
    }

    // Apply color filtering
    if (combinedFilters.color) {
      filteredProducts = filteredProducts.filter(product =>
        product.color.toLowerCase().includes(combinedFilters.color!) ||
        product.colors.some(color => color.toLowerCase().includes(combinedFilters.color!))
      );
    }

    // Apply price range filtering
    if (combinedFilters.priceRange) {
      if (combinedFilters.priceRange.min !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.price >= combinedFilters.priceRange!.min!);
      }
      if (combinedFilters.priceRange.max !== undefined) {
        filteredProducts = filteredProducts.filter(product => product.price <= combinedFilters.priceRange!.max!);
      }
    }

    // Apply category filtering
    if (combinedFilters.category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase().includes(combinedFilters.category!) ||
        product.subcategory.toLowerCase().includes(combinedFilters.category!)
      );
    }

    // Apply material filtering
    if (combinedFilters.material) {
      filteredProducts = filteredProducts.filter(product =>
        product.material.toLowerCase().includes(combinedFilters.material!)
      );
    }

    // Apply style filtering
    if (combinedFilters.style) {
      filteredProducts = filteredProducts.filter(product =>
        product.features.some(feature => feature.toLowerCase().includes(combinedFilters.style!)) ||
        product.tags.some(tag => tag.toLowerCase().includes(combinedFilters.style!))
      );
    }

    // Apply occasion filtering
    if (combinedFilters.occasion) {
      filteredProducts = filteredProducts.filter(product =>
        product.features.some(feature => feature.toLowerCase().includes(combinedFilters.occasion!)) ||
        product.tags.some(tag => tag.toLowerCase().includes(combinedFilters.occasion!))
      );
    }

    // Update session context with applied filters
    sessionContext.appliedFilters = combinedFilters;

    console.log(`🔍 Filtered ${products.length} products to ${filteredProducts.length} based on filters`);
    return filteredProducts.slice(0, 5); // Limit to 5 products as per spec
  }

  /**
   * Extract filters from user query
   */
  private extractFiltersFromQuery(query: string): SessionContext['appliedFilters'] {
    const queryLower = query.toLowerCase();
    const filters: SessionContext['appliedFilters'] = {};

    // Extract color filters
    const colorKeywords = [
      'red', 'black', 'brown', 'navy', 'blue', 'green', 'white', 'gray', 'grey',
      'pink', 'purple', 'yellow', 'orange', 'beige', 'tan', 'camel', 'burgundy'
    ];
    const foundColor = colorKeywords.find(color => queryLower.includes(color));
    if (foundColor) {
      filters.color = foundColor;
    }

    // Extract price range filters
    const priceRange = this.extractPriceRange(queryLower);
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      filters.priceRange = priceRange;
    }

    // Extract category filters
    if (queryLower.includes('bag') || queryLower.includes('handbag')) {
      filters.category = 'bags';
    } else if (queryLower.includes('wallet')) {
      filters.category = 'wallet';
    } else if (queryLower.includes('accessory')) {
      filters.category = 'accessories';
    }

    // Extract material filters
    const materialKeywords = ['leather', 'canvas', 'suede', 'fabric', 'denim'];
    const foundMaterial = materialKeywords.find(material => queryLower.includes(material));
    if (foundMaterial) {
      filters.material = foundMaterial;
    }

    // Extract style filters
    const styleKeywords = ['casual', 'formal', 'elegant', 'sporty', 'vintage', 'modern'];
    const foundStyle = styleKeywords.find(style => queryLower.includes(style));
    if (foundStyle) {
      filters.style = foundStyle;
    }

    // Extract occasion filters with enhanced detection
    const occasionKeywords = {
      'work': ['work', 'office', 'business', 'professional', 'corporate'],
      'everyday': ['everyday', 'daily', 'casual', 'regular'],
      'evening': ['evening', 'night', 'party', 'dinner', 'cocktail', 'chic', 'elegant'],
      'travel': ['travel', 'vacation', 'trip', 'journey'],
      'formal': ['formal', 'sophisticated', 'elegant', 'chic'],
      'casual': ['casual', 'relaxed', 'comfortable']
    };
    
    for (const [occasion, keywords] of Object.entries(occasionKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        filters.occasion = occasion;
        break;
      }
    }

    return filters;
  }

  /**
   * Extract price range from query
   */
  private extractPriceRange(query: string): { min?: number; max?: number } {
    const priceRange: { min?: number; max?: number } = {};

    // Look for "under $X" or "below $X"
    const underMatch = query.match(/under\s+\$?(\d+)|below\s+\$?(\d+)/i);
    if (underMatch) {
      priceRange.max = parseInt(underMatch[1] || underMatch[2]);
    }

    // Look for "over $X" or "above $X"
    const overMatch = query.match(/over\s+\$?(\d+)|above\s+\$?(\d+)/i);
    if (overMatch) {
      priceRange.min = parseInt(overMatch[1] || overMatch[2]);
    }

    // Look for "$X-$Y" range
    const rangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/i);
    if (rangeMatch) {
      priceRange.min = parseInt(rangeMatch[1]);
      priceRange.max = parseInt(rangeMatch[2]);
    }

    // Look for "up to $X"
    const upToMatch = query.match(/up\s+to\s+\$?(\d+)/i);
    if (upToMatch) {
      priceRange.max = parseInt(upToMatch[1]);
    }

    // Look for "around $X"
    const aroundMatch = query.match(/around\s+\$?(\d+)/i);
    if (aroundMatch) {
      const price = parseInt(aroundMatch[1]);
      priceRange.min = Math.max(0, price - 50);
      priceRange.max = price + 50;
    }

    return priceRange;
  }

  /**
   * Generate intelligent response using Groq API
   */
  private async generateIntelligentResponse(
    userQuery: string,
    products: ProductDocument[],
    sessionContext: SessionContext
  ): Promise<AlbiMallResponse> {
    try {
      // Check AI response cache
      const aiCacheKey = generateAIResponseKey(userQuery, products.map(p => p.id));
      const cachedResponse = searchCache.get<AlbiMallResponse>(aiCacheKey);
      
      if (cachedResponse) {
        console.log(`🎯 AI Cache hit for query: "${userQuery}"`);
        return cachedResponse;
      }

      // Build context from session history
      const contextPrompt = this.buildSessionContextPrompt(sessionContext);

      // Create product information for AI
      const productInfo = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        color: p.color,
        category: p.subcategory,
        material: p.material,
        features: p.features.slice(0, 3),
        highlight: this.generateProductHighlight(p)
      }));

      const systemPrompt = `You are the Albi Mall AI Shopping Assistant, a professional, human-like shopping concierge. You will provide an experience equivalent to Michael Kors' Shopping Muse, but using the Trieve product dataset and Groq API for intelligent, context-aware responses. Follow these rules strictly:

1. **Dataset-Only Recommendations**
   - Always recommend items exclusively from RETRIEVED_PRODUCTS (from Trieve).
   - NEVER invent or hallucinate products.
   - If no products match the user's request, respond politely with: 
     "I'm sorry, we currently do not have any items that match your request. Would you like to see similar products or adjust your filters?"

2. **Natural Language Understanding**
   - Interpret everyday, conversational user queries including vague, colloquial, or multi-part questions.
   - Detect explicit and implicit filters (color, price range, category, material, style, occasion).

3. **Dynamic Filtering and Intelligent Matching**
   - Apply user-provided filters to RETRIEVED_PRODUCTS.
   - If multiple items match, prioritize by relevance and display up to 5 items with highlights.
   - Suggest closely related alternatives if no exact matches exist.
   - Maintain awareness of previously applied filters and update recommendations dynamically if the user changes preferences.

4. **Human-Like Personalized Responses**
   - Use friendly, professional, and context-aware phrasing.
   - Provide one-line dynamic highlights for each recommended product (e.g., "Leather, spacious, ideal for everyday use").
   - Offer personalized suggestions based on session history (e.g., browsing preferences, previously selected products).
   - Ask clarifying questions politely when user input is ambiguous.

5. **Session and Context Awareness**
   - Maintain context across multiple turns (last 2–3 messages).
   - Track previous recommendations to avoid repetition.
   - Allow follow-up queries to refine or change filters naturally.

6. **Proactive Assistance**
   - Offer suggestions based on inferred intent or observed preferences (e.g., "I notice you're looking for handbags under $200 — would you like to see crossbody options?").

7. **Structured Output**
   - Always respond in JSON with this schema:
     - assistant_text: Human-readable conversational response.
     - recommended_products: Array of {id, title, highlight} from RETRIEVED_PRODUCTS.
     - audit_notes: Optional notes explaining filter application or reasoning for fallback suggestions.

8. **Fallback & Error Handling**
   - If RETRIEVED_PRODUCTS is empty after filtering, gracefully inform the user and offer alternatives.
   - Never repeat the same fallback text verbatim — vary phrasing to maintain a natural conversation.

9. **Integration with Groq API**
   - Use Groq to generate intelligent, contextual explanations, suggestions, and product highlights.
   - Do not allow Groq to introduce products outside the Trieve dataset.

10. **Brand Voice Alignment**
    - Maintain Albi Mall's friendly, helpful, and professional tone throughout all interactions.
    - Responses should be concise but informative, avoiding overly generic or repetitive phrasing.

RETRIEVED_PRODUCTS: ${JSON.stringify(productInfo, null, 2)}
SESSION_CONTEXT: ${contextPrompt}`;

      const response = await this.groqService.generateResponse(userQuery, products);
      
      // Parse JSON response
      try {
        const parsedResponse = JSON.parse(response);
        
        // Validate response structure
        if (!parsedResponse.assistant_text) {
          throw new Error('Invalid response structure');
        }

        // Cache the response
        searchCache.set(aiCacheKey, parsedResponse);
        
        return parsedResponse;
      } catch (parseError) {
        console.log('⚠️ JSON parsing failed, creating structured response');
        
        // Create structured response from raw text
        const structuredResponse: AlbiMallResponse = {
          assistant_text: response,
          recommended_products: products.slice(0, 5).map(p => ({
            id: p.id,
            title: p.name,
            highlight: this.generateProductHighlight(p)
          })),
          audit_notes: 'Response generated from raw text due to JSON parsing failure'
        };

        // Cache the structured response
        searchCache.set(aiCacheKey, structuredResponse);
        
        return structuredResponse;
      }
    } catch (error) {
      console.error('❌ AI Response Error:', error);
      return this.getFallbackResponse(userQuery, products);
    }
  }

  /**
   * Build session context prompt
   */
  private buildSessionContextPrompt(sessionContext: SessionContext): string {
    if (sessionContext.messages.length === 0) {
      return 'No previous conversation context.';
    }

    const recentMessages = sessionContext.messages.slice(-6); // Last 3 exchanges
    let contextPrompt = 'RECENT CONVERSATION CONTEXT:\n';
    
    recentMessages.forEach(msg => {
      contextPrompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });

    if (Object.keys(sessionContext.appliedFilters).length > 0) {
      contextPrompt += '\nAPPLIED FILTERS:\n';
      Object.entries(sessionContext.appliedFilters).forEach(([key, value]) => {
        if (value) {
          contextPrompt += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      });
    }

    if (sessionContext.previousRecommendations.length > 0) {
      contextPrompt += '\nPREVIOUS RECOMMENDATIONS:\n';
      contextPrompt += sessionContext.previousRecommendations.join(', ');
    }

    return contextPrompt;
  }

  /**
   * Generate product highlight
   */
  private generateProductHighlight(product: ProductDocument): string {
    const highlights = [];
    
    // Material highlight
    if (product.material) {
      highlights.push(product.material.toLowerCase());
    }
    
    // Key features (pick most relevant ones)
    const keyFeatures = product.features.filter(f => 
      f.toLowerCase().includes('leather') ||
      f.toLowerCase().includes('adjustable') ||
      f.toLowerCase().includes('spacious') ||
      f.toLowerCase().includes('compact') ||
      f.toLowerCase().includes('multiple') ||
      f.toLowerCase().includes('structured') ||
      f.toLowerCase().includes('versatile')
    );
    
    if (keyFeatures.length > 0) {
      highlights.push(keyFeatures[0].toLowerCase());
    }
    
    // Style highlight based on subcategory
    if (product.subcategory) {
      const styleMap: { [key: string]: string } = {
        'tote': 'spacious and versatile',
        'crossbody': 'hands-free convenience',
        'satchel': 'structured elegance',
        'clutch': 'evening sophistication',
        'backpack': 'practical functionality',
        'wallet': 'compact organization'
      };
      
      const style = styleMap[product.subcategory.toLowerCase()];
      if (style) {
        highlights.push(style);
      }
    }
    
    // Take first 2-3 highlights and join them
    return highlights.slice(0, 3).join(', ');
  }

  /**
   * Get session context
   */
  private getSessionContext(sessionId: string): SessionContext {
    if (!this.sessionContexts.has(sessionId)) {
      this.sessionContexts.set(sessionId, {
        messages: [],
        appliedFilters: {},
        previousRecommendations: []
      });
    }
    return this.sessionContexts.get(sessionId)!;
  }

  /**
   * Update session context
   */
  private updateSessionContext(sessionId: string, type: 'user' | 'assistant', content: string): void {
    const context = this.getSessionContext(sessionId);
    context.messages.push({
      type,
      content,
      timestamp: new Date()
    });

    // Keep only last 10 messages
    if (context.messages.length > 10) {
      context.messages = context.messages.slice(-10);
    }

    // Update previous recommendations if assistant message
    if (type === 'assistant') {
      // Extract product names from response (simplified)
      const productMatches = content.match(/[A-Z][a-z\s]+(?:Bag|Wallet|Tote|Crossbody|Satchel|Clutch|Backpack)/g);
      if (productMatches) {
        context.previousRecommendations.push(...productMatches);
        // Keep only last 10 recommendations
        if (context.previousRecommendations.length > 10) {
          context.previousRecommendations = context.previousRecommendations.slice(-10);
        }
      }
    }
  }

  /**
   * Get fallback response
   */
  private getFallbackResponse(userQuery: string, products: ProductDocument[]): AlbiMallResponse {
    if (products.length === 0) {
      const queryLower = userQuery.toLowerCase();
      
      // Check if user asked for a specific brand not in our dataset
      const brandKeywords = ['gucci', 'louis vuitton', 'chanel', 'prada', 'hermes', 'dior', 'balenciaga', 'versace', 'givenchy'];
      const requestedBrand = brandKeywords.find(brand => queryLower.includes(brand));
      
      if (requestedBrand) {
        return {
          assistant_text: `I'm sorry, we don't carry ${requestedBrand} products. We specialize in Michael Kors handbags and accessories. Would you like to see our Michael Kors collection instead?`,
          recommended_products: [],
          audit_notes: `Brand integrity maintained: User asked for ${requestedBrand} but we only carry Michael Kors`
        };
      }
      
      return {
        assistant_text: "I'm sorry, we currently do not have any items that match your request. Would you like to see similar products or adjust your filters?",
        recommended_products: [],
        audit_notes: 'No products found matching the query'
      };
    }

    // Simple fallback with available products
    const product = products[0];
    return {
      assistant_text: `I found the ${product.name} in ${product.color} for $${product.price}. This ${product.material.toLowerCase()} ${product.subcategory} is a great choice and features ${product.features.slice(0, 3).join(', ')}.`,
      recommended_products: products.slice(0, 5).map(p => ({
        id: p.id,
        title: p.name,
        highlight: this.generateProductHighlight(p)
      })),
      audit_notes: 'Fallback response generated due to AI service error'
    };
  }

  /**
   * Clear session context
   */
  clearSessionContext(sessionId: string): void {
    this.sessionContexts.delete(sessionId);
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { totalSessions: number; activeSessions: number } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const activeSessions = Array.from(this.sessionContexts.values()).filter(
      context => context.messages.length > 0 && 
      context.messages[context.messages.length - 1].timestamp > oneHourAgo
    ).length;

    return {
      totalSessions: this.sessionContexts.size,
      activeSessions
    };
  }
}

export default AlbiMallAssistant;
