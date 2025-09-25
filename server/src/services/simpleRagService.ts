import { ProductDocument } from '../types/trieve';
import axios from 'axios';
import { searchCache, generateSearchKey, generateAIResponseKey } from '../utils/cache';

export interface ChatbotResponse {
  message: string;
  products: ProductDocument[];
  query: string;
}

export class SimpleRAGService {
  private products: ProductDocument[] = [];
  private initialized: boolean = false;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BACKEND_URL || 'http://localhost:5000'
      : 'http://localhost:5000';
  }

  async initialize(): Promise<void> {
    try {
      await this.loadProducts();
      this.initialized = true;
      console.log(`✅ SimpleRAG initialized with ${this.products.length} products`);
    } catch (error) {
      console.error('❌ Failed to initialize SimpleRAG:', error);
      throw error;
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try multiple possible paths
      const possiblePaths = [
        path.join(__dirname, '../../../michael_kors_products_300.json'),
        path.join(process.cwd(), 'michael_kors_products_300.json'),
        path.join(__dirname, '../../michael_kors_products_300.json'),
        './michael_kors_products_300.json'
      ];

      let productsData;
      for (const filePath of possiblePaths) {
        try {
          if (fs.existsSync(filePath)) {
            console.log(`📁 Loading products from: ${filePath}`);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            productsData = JSON.parse(fileContent);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Failed to load from ${filePath}:`, error instanceof Error ? error.message : String(error));
        }
      }

      if (!productsData) {
        throw new Error('Could not find michael_kors_products_300.json in any expected location');
      }

      this.products = productsData;
      console.log(`📦 Loaded ${this.products.length} products`);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      throw error;
    }
  }

  async processQuery(query: string, conversationHistory?: any[]): Promise<ChatbotResponse> {
    if (!this.initialized) {
      throw new Error('RAG service not initialized');
    }

    try {
      console.log(`🔍 Processing query: "${query}"`);
      
      // Check cache first
      const cacheKey = generateSearchKey(query);
      const cachedResult = searchCache.get<ChatbotResponse>(cacheKey);
      
      if (cachedResult) {
        console.log(`🎯 Cache hit for query: "${query}"`);
        return cachedResult;
      }

      // Find matching products with conversation context
      const matchingProducts = this.findMatchingProducts(query, 5, conversationHistory);
      console.log(`📦 Found ${matchingProducts.length} matching products`);
      
      // Generate AI response using secure server-side endpoint with conversation context
      let aiResponse = await this.generateAIResponse(query, matchingProducts, conversationHistory);
      
      // If multiple products are found and user asked for "bags" (plural), enhance the response
      if (matchingProducts.length > 1 && query.toLowerCase().includes('bags')) {
        const productNames = matchingProducts.slice(0, 3).map(p => p.name).join(', ');
        const priceRange = `$${Math.min(...matchingProducts.map(p => p.price))} - $${Math.max(...matchingProducts.map(p => p.price))}`;
        const colors = [...new Set(matchingProducts.map(p => p.color))].slice(0, 3).join(', ');
        
        aiResponse = `I found ${matchingProducts.length} Hamilton bags for you! Here are some great options: ${productNames}. They range from ${priceRange} and come in colors like ${colors}. Each offers different styles and features to suit your needs.`;
      }
      
      const result: ChatbotResponse = {
        message: aiResponse,
        products: matchingProducts,
        query: query
      };

      // Cache the result
      searchCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('❌ Error processing query:', error);
      throw error;
    }
  }

  async handleGeneralQuestion(query: string, conversationHistory?: any[]): Promise<ChatbotResponse> {
    if (!this.initialized) {
      throw new Error('RAG service not initialized');
    }

    try {
      console.log(`🤖 Processing general question: "${query}"`);
      
      // Check cache first
      const cacheKey = generateAIResponseKey(query, ['general']);
      const cachedResult = searchCache.get<ChatbotResponse>(cacheKey);
      
      if (cachedResult) {
        console.log(`🎯 Cache hit for general question: "${query}"`);
        return cachedResult;
      }

      // Generate intelligent AI response for general questions with conversation context
      const aiResponse = await this.generateGeneralAIResponse(query, conversationHistory);
      
      const result: ChatbotResponse = {
        message: aiResponse,
        products: [], // No products for general questions
        query: query
      };
      
      // Cache the result
      searchCache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes
      
      return result;
    } catch (error) {
      console.error('❌ Error handling general question:', error);
      throw error;
    }
  }

  private async generateGeneralAIResponse(query: string, conversationHistory?: any[]): Promise<string> {
    try {
      // Build context from conversation history
      let contextPrompt = '';
      if (conversationHistory && conversationHistory.length > 0) {
        contextPrompt = '\n\nCONVERSATION CONTEXT:\n';
        conversationHistory.forEach(msg => {
          contextPrompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        contextPrompt += '\nPlease reference the conversation context when responding. If the user is asking a follow-up question, maintain context from previous messages.\n';
      }

      const systemPrompt = `You are a professional shopping assistant for Albi Mall. Always follow these rules:

1. **Dataset-only recommendations**: Only recommend products that are present in the current RETRIEVED_PRODUCTS list.  
2. **No hallucinations**: Never invent or fabricate products. If the user asks for a product that does not exist in RETRIEVED_PRODUCTS, respond politely:  
   "I'm sorry, we currently do not have any products that match your request. Would you like to see similar items or adjust your filters?"  
3. **Filters**: Always respect color, price, category, material, and style filters provided by the user.  
4. **Deduplication**: Do not repeat the same product multiple times.  
5. **Human-like phrasing**: Keep tone friendly and professional; highlight key features concisely.  
6. **Multiple products**: When multiple products are found, acknowledge that you found multiple items and briefly mention the variety (colors, styles, prices). Don't focus on just one product.
7. **Output schema**:  
   - assistant_text: the conversational response  
   - recommended_products: [{id, title, highlight}] (optional; empty if no products match)  

RETRIEVED_PRODUCTS: []
SESSION_CONTEXT: ${contextPrompt}`;

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
        top_p: 1,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Parse JSON response from the professional system prompt
      try {
        const parsedResponse = JSON.parse(aiResponse);
        
        // Extract the assistant text for the main response
        const assistantText = parsedResponse.assistant_text || aiResponse;
        
        // Log audit notes if present
        if (parsedResponse.audit_notes) {
          console.log('🔍 General Audit Notes:', parsedResponse.audit_notes);
        }
        
        return assistantText;
      } catch (parseError) {
        // If JSON parsing fails, use the raw response
        console.log('⚠️ General JSON parsing failed, using raw response');
        return aiResponse;
      }
    } catch (error) {
      console.error('❌ AI Response Error:', error);
      
      // Fallback responses for common questions
      const queryLower = query.toLowerCase();
      
      if (queryLower.includes('what can you help') || queryLower.includes('what do you do')) {
        return "I'm your Style Assistant! I can help you find the perfect Michael Kors products, like bags, shoes, and accessories. What are you looking for today?";
      }
      
      if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('hey')) {
        return "Hello! I'm your Style Assistant, and I'm here to help you find the perfect Michael Kors pieces for your style. What can I help you discover today?";
      }
      
      if (queryLower.includes('thank') || queryLower.includes('thanks')) {
        return "You're very welcome! I'm always here to help you find the perfect Michael Kors pieces. Feel free to ask me anything about our products!";
      }
      
      return "I'm your Style Assistant, and I'm here to help you find the perfect Michael Kors products. I can recommend items based on your style, budget, and occasion. What would you like to explore today?";
    }
  }

  private async generateAIResponse(query: string, products: ProductDocument[], conversationHistory?: any[]): Promise<string> {
    try {
      // Check AI response cache
      const aiCacheKey = generateAIResponseKey(query, products.map(p => p.id));
      const cachedResponse = searchCache.get<string>(aiCacheKey);
      
      if (cachedResponse) {
        console.log(`🎯 AI Cache hit for query: "${query}"`);
        return cachedResponse;
      }

      // Build context from conversation history
      let contextPrompt = '';
      if (conversationHistory && conversationHistory.length > 0) {
        contextPrompt = '\n\nCONVERSATION CONTEXT:\n';
        conversationHistory.forEach(msg => {
          contextPrompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        contextPrompt += '\nPlease reference the conversation context when responding. If the user is asking a follow-up question, maintain context from previous messages.\n';
      }

      // Create product categories for structured presentation
      const productCategories = this.categorizeProducts(products);
      const productInfo = products.map(p => ({
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        discount: p.discount_percentage,
        color: p.color,
        category: p.subcategory,
        material: p.material,
        features: p.features.slice(0, 3),
        highlight: this.generateProductHighlight(p)
      }));

      const systemPrompt = `You are a professional shopping assistant for Albi Mall. Always follow these rules:

1. **Dataset-only recommendations**: Only recommend products that are present in the current RETRIEVED_PRODUCTS list.  
2. **No hallucinations**: Never invent or fabricate products. If the user asks for a product that does not exist in RETRIEVED_PRODUCTS, respond politely:  
   "I'm sorry, we currently do not have any products that match your request. Would you like to see similar items or adjust your filters?"  
3. **Filters**: Always respect color, price, category, material, and style filters provided by the user.  
4. **Deduplication**: Do not repeat the same product multiple times.  
5. **Human-like phrasing**: Keep tone friendly and professional; highlight key features concisely.  
6. **Multiple products**: When multiple products are found, acknowledge that you found multiple items and briefly mention the variety (colors, styles, prices). Don't focus on just one product.
7. **Output schema**:  
   - assistant_text: the conversational response  
   - recommended_products: [{id, title, highlight}] (optional; empty if no products match)  

RETRIEVED_PRODUCTS: ${JSON.stringify(productInfo, null, 2)}
SESSION_CONTEXT: ${contextPrompt}`;

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Parse JSON response from the professional system prompt
      try {
        const parsedResponse = JSON.parse(aiResponse);
        
        // Extract the assistant text for the main response
        let assistantText = parsedResponse.assistant_text || aiResponse;
        
        // If multiple products are found OR user asked for "bags" (plural), enhance the response
        if (products.length > 1 || query.toLowerCase().includes('bags')) {
          const productNames = products.slice(0, 3).map(p => p.name).join(', ');
          const priceRange = `$${Math.min(...products.map(p => p.price))} - $${Math.max(...products.map(p => p.price))}`;
          const colors = [...new Set(products.map(p => p.color))].slice(0, 3).join(', ');
          
          // Always enhance the response when multiple products are found or user asked for bags
          assistantText = `I found ${products.length} Hamilton bags for you! Here are some great options: ${productNames}. They range from ${priceRange} and come in colors like ${colors}. Each offers different styles and features to suit your needs.`;
        }
        
        // Log audit notes if present
        if (parsedResponse.audit_notes) {
          console.log('🔍 Audit Notes:', parsedResponse.audit_notes);
        }
        
        // Cache the AI response
        searchCache.set(aiCacheKey, assistantText);
        
        return assistantText;
      } catch (parseError) {
        // If JSON parsing fails, use the raw response
        console.log('⚠️ JSON parsing failed, using raw response');
        searchCache.set(aiCacheKey, aiResponse);
        return aiResponse;
      }
    } catch (error) {
      console.error('❌ AI API Error:', error);
      // Fallback to simple response
      return this.getFallbackResponse(query, products, conversationHistory);
    }
  }

  private categorizeProducts(products: ProductDocument[]): { [key: string]: ProductDocument[] } {
    const categories: { [key: string]: ProductDocument[] } = {
      'Everyday Versatility': [],
      'Chic Compact': [],
      'Formal Elegance': [],
      'Travel Ready': [],
      'Professional': [],
      'Casual Style': []
    };

    products.forEach(product => {
      const subcategory = product.subcategory.toLowerCase();
      const features = product.features.join(' ').toLowerCase();
      const price = product.price;

      // Categorize based on subcategory and features
      if (subcategory.includes('tote') || subcategory.includes('satchel')) {
        if (price < 150) {
          categories['Everyday Versatility'].push(product);
        } else {
          categories['Formal Elegance'].push(product);
        }
      } else if (subcategory.includes('crossbody') || subcategory.includes('wallet')) {
        categories['Chic Compact'].push(product);
      } else if (subcategory.includes('backpack')) {
        categories['Travel Ready'].push(product);
      } else if (subcategory.includes('clutch')) {
        categories['Formal Elegance'].push(product);
      } else if (features.includes('work') || features.includes('professional')) {
        categories['Professional'].push(product);
      } else {
        categories['Casual Style'].push(product);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }

  private generateProductHighlight(product: ProductDocument): string {
    const highlights = [];
    
    // Material highlight
    if (product.material) {
      highlights.push(product.material.toLowerCase());
    }
    
    // Size/capacity highlight
    if (product.size) {
      highlights.push(product.size.toLowerCase());
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

  private getFallbackResponse(query: string, products: ProductDocument[], conversationHistory?: any[]): string {
    if (products.length === 0) {
      // Extract conversation constraints to provide intelligent alternatives
      const constraints = this.extractConversationConstraints(conversationHistory);
      
      if (constraints.color && constraints.maxPrice) {
        // User wants specific color under specific price
        const allProducts = this.products.filter(p => 
          p.category === 'bags' && 
          (p.color.toLowerCase().includes(constraints.color!) || 
           p.colors.some(c => c.toLowerCase().includes(constraints.color!)))
        );
        
        if (allProducts.length > 0) {
          const closestPrice = allProducts
            .filter(p => p.price <= constraints.maxPrice! * 1.3) // Within 30% of budget
            .sort((a, b) => a.price - b.price)
            .slice(0, 3);
          
          if (closestPrice.length > 0) {
            const suggestions = closestPrice.map(p => `${p.name} ($${p.price})`).join(', ');
            return `I understand you're looking for ${constraints.color} bags under $${constraints.maxPrice}. I don't have any ${constraints.color} bags in that exact price range, but here are some great ${constraints.color} options close to your budget: ${suggestions}. Would you like to see them, or would you prefer bags under $${constraints.maxPrice} in other colors?`;
          } else {
            // Suggest other colors in budget
            const otherColors = this.products
              .filter(p => p.category === 'bags' && p.price <= constraints.maxPrice!)
              .slice(0, 3);
            
            if (otherColors.length > 0) {
              const suggestions = otherColors.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
              return `I know it can be tough to find ${constraints.color} bags under $${constraints.maxPrice} - they're limited right now. But I've got some great alternatives in your budget: ${suggestions}. Would you like to see them, or would you consider ${constraints.color} bags just above $${constraints.maxPrice}?`;
            }
          }
        }
      }
      
      if (constraints.color) {
        // User wants specific color
        const allProducts = this.products.filter(p => 
          p.category === 'bags' && 
          (p.color.toLowerCase().includes(constraints.color!) || 
           p.colors.some(c => c.toLowerCase().includes(constraints.color!)))
        );
        
        if (allProducts.length > 0) {
          const suggestions = allProducts.slice(0, 3).map(p => `${p.name} ($${p.price})`).join(', ');
          return `I found some great ${constraints.color} bags: ${suggestions}. Would you like to see them?`;
        } else {
          // Suggest similar colors
          const similarColors = this.products
            .filter(p => p.category === 'bags')
            .slice(0, 3);
          
          if (similarColors.length > 0) {
            const suggestions = similarColors.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
            return `I don't have any ${constraints.color} bags right now, but here are some great alternatives: ${suggestions}. Would you like to see them?`;
          }
        }
      }
      
      if (constraints.maxPrice) {
        // User wants specific budget
        const budgetProducts = this.products
          .filter(p => p.category === 'bags' && p.price <= constraints.maxPrice!)
          .slice(0, 3);
        
        if (budgetProducts.length > 0) {
          const suggestions = budgetProducts.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
          return `I found some great bags under $${constraints.maxPrice}: ${suggestions}. Would you like to see them?`;
        } else {
          // Suggest slightly higher budget
          const higherBudget = this.products
            .filter(p => p.category === 'bags' && p.price <= constraints.maxPrice! * 1.3)
            .sort((a, b) => a.price - b.price)
            .slice(0, 3);
          
          if (higherBudget.length > 0) {
            const suggestions = higherBudget.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
            return `I don't have any bags under $${constraints.maxPrice}, but here are some great options close to your budget: ${suggestions}. Would you like to see them?`;
          }
        }
      }
      
      // Enhanced fallback with actual product suggestions
      const popularProducts = this.products
        .filter(p => p.category === 'bags')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);
      
      if (popularProducts.length > 0) {
        const suggestions = popularProducts.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
        return `I'd love to help you find something perfect! Here are some of our most popular Michael Kors bags: ${suggestions}. What style are you most interested in - crossbody, tote, or something else?`;
      }
      
      return "I'd love to help you find something perfect! Let me suggest some great Michael Kors options. Are you looking for bags, wallets, or accessories? I can show you our most popular items in different styles and price ranges.";
    }

    const queryLower = query.toLowerCase();
    
    // Check for budget constraints
    const priceConstraints = this.extractPriceConstraints(queryLower);
    if (priceConstraints.maxPrice) {
      const budgetProducts = products.filter(p => p.price <= priceConstraints.maxPrice!);
      if (budgetProducts.length > 0) {
        const product = budgetProducts[0];
        return `Perfect! I found the ${product.name} in ${product.color} for $${product.price}, which fits your budget of $${priceConstraints.maxPrice}. This ${product.material.toLowerCase()} ${product.subcategory} is a great choice and features ${product.features.slice(0, 3).join(', ')}.`;
      } else {
        // If no products within budget, suggest alternatives
        const allProducts = this.products.filter(p => p.category === 'bags');
        const closestBudget = allProducts
          .filter(p => p.price <= priceConstraints.maxPrice! * 1.5) // Within 50% of budget
          .sort((a, b) => a.price - b.price)
          .slice(0, 3);
        
        if (closestBudget.length > 0) {
          const suggestions = closestBudget.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
          return `I couldn't find any products within your budget of $${priceConstraints.maxPrice}. However, here are some great alternatives that are close to your budget: ${suggestions}. Would you like to see more options?`;
      } else {
        return `I couldn't find any products within your budget of $${priceConstraints.maxPrice}. Would you like to see products in a higher price range, or try a different category?`;
        }
      }
    }
    
    // Check for specific product types with color constraints
    if (queryLower.includes('red') && queryLower.includes('bag')) {
      const redBags = products.filter(p => 
        p.colors.some(color => color.toLowerCase().includes('red') || color.toLowerCase().includes('burgundy'))
      );
      if (redBags.length > 0) {
        const bag = redBags[0];
        return `I found a beautiful ${bag.color} ${bag.name} for $${bag.price}. This ${bag.material.toLowerCase()} ${bag.subcategory} is perfect for everyday use and features ${bag.features.slice(0, 3).join(', ')}.`;
      } else {
        // If no red bags, suggest other colored bags
        const allBags = this.products.filter(p => p.category === 'bags');
        const alternativeBags = allBags.slice(0, 3);
        const suggestions = alternativeBags.map(p => `${p.name} in ${p.color} ($${p.price})`).join(', ');
        return `I don't have any red bags available right now, but here are some great alternatives: ${suggestions}. Would you like to see more options?`;
      }
    }

    if (queryLower.includes('everyday') || queryLower.includes('daily')) {
      const everydayBags = products.filter(p => 
        p.features.some(feature => feature.includes('everyday') || feature.includes('daily'))
      );
      if (everydayBags.length > 0) {
        const bag = everydayBags[0];
        return `Perfect for everyday use! I recommend the ${bag.name} in ${bag.color} for $${bag.price}. This ${bag.material.toLowerCase()} ${bag.subcategory} is designed for daily wear and includes ${bag.features.slice(0, 3).join(', ')}.`;
      }
    }

    if (queryLower.includes('work') || queryLower.includes('professional')) {
      const workBags = products.filter(p => 
        p.features.some(feature => feature.includes('work') || feature.includes('professional'))
      );
      if (workBags.length > 0) {
        const bag = workBags[0];
        return `For work and professional settings, I suggest the ${bag.name} in ${bag.color} for $${bag.price}. This ${bag.material.toLowerCase()} ${bag.subcategory} is work-appropriate and features ${bag.features.slice(0, 3).join(', ')}.`;
      }
    }

    // Default response
    const product = products[0];
    return `I found the ${product.name} in ${product.color} for $${product.price}. This ${product.material.toLowerCase()} ${product.subcategory} is a great choice and features ${product.features.slice(0, 3).join(', ')}.`;
  }

  private findMatchingProducts(query: string, limit: number = 5, conversationHistory?: any[]): ProductDocument[] {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(word => word.length > 1);
    
    // Extract constraints from conversation history
    const conversationConstraints = this.extractConversationConstraints(conversationHistory, query);

    const scoredProducts = this.products.map(product => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.subcategory,
        product.description,
        product.color,
        ...product.colors,
        product.material,
        ...product.features,
        ...product.tags
      ].join(' ').toLowerCase();

      let score = 0;

      // Exact phrase matching gets highest priority
      if (searchableText.includes(queryLower)) {
        score += 200;
      }

      // Color matching gets high priority
      if (product.color.toLowerCase().includes(queryLower) ||
          queryLower.includes(product.color.toLowerCase())) {
        score += 100;
      }

      // Check available colors
      if (product.colors.some(color =>
          color.toLowerCase().includes(queryLower) ||
          queryLower.includes(color.toLowerCase()))) {
        score += 80;
      }

      // Category and subcategory matching
      if (product.category.toLowerCase().includes(queryLower) ||
          queryLower.includes(product.category.toLowerCase())) {
        score += 60;
      }

      if (product.subcategory.toLowerCase().includes(queryLower) ||
          queryLower.includes(product.subcategory.toLowerCase())) {
        score += 50;
      }

      // Individual keyword matching
      keywords.forEach(keyword => {
        if (searchableText.includes(keyword)) {
          score += 1;

          // Boost score for exact matches in important fields
          if (product.name.toLowerCase().includes(keyword)) score += 10;
          if (product.color.toLowerCase().includes(keyword)) score += 15;
          if (product.subcategory.toLowerCase().includes(keyword)) score += 8;
          if (product.category.toLowerCase().includes(keyword)) score += 6;
          if (product.features.some(f => f.toLowerCase().includes(keyword))) score += 3;
          if (product.tags.some(t => t.toLowerCase().includes(keyword))) score += 2;
        }
      });

      // Enhanced semantic matching for better relevance
      const semanticMatches = this.calculateSemanticScore(queryLower, product);
      score += semanticMatches;

      // Boost for exact brand matches
      if (queryLower.includes('michael kors') || queryLower.includes('mk')) {
        score += 50;
      }

      // Enhanced color matching with synonyms
      const colorSynonyms = {
        'red': ['crimson', 'burgundy', 'maroon', 'scarlet'],
        'black': ['ebony', 'charcoal', 'dark'],
        'brown': ['tan', 'beige', 'camel', 'chocolate'],
        'blue': ['navy', 'royal', 'sky', 'azure'],
        'green': ['emerald', 'forest', 'mint', 'olive'],
        'white': ['ivory', 'cream', 'pearl'],
        'gray': ['grey', 'silver', 'charcoal'],
        'pink': ['rose', 'blush', 'magenta'],
        'purple': ['violet', 'lavender', 'plum'],
        'yellow': ['gold', 'lemon', 'amber'],
        'orange': ['peach', 'coral', 'tangerine']
      };

      // Check for color synonyms
      Object.entries(colorSynonyms).forEach(([color, synonyms]) => {
        if (queryLower.includes(color) || synonyms.some(syn => queryLower.includes(syn))) {
          if (product.color.toLowerCase().includes(color) || 
              product.colors.some(c => c.toLowerCase().includes(color))) {
            score += 120; // High boost for semantic color match
          }
        }
      });

      // Apply conversation constraints
      if (conversationConstraints.color) {
        if (product.color.toLowerCase().includes(conversationConstraints.color!) ||
            product.colors.some(c => c.toLowerCase().includes(conversationConstraints.color!))) {
          score += 150; // High boost for matching conversation color
        } else {
          score = -1000; // Heavy penalty for wrong color
        }
      }

      if (conversationConstraints.maxPrice) {
        if (product.price <= conversationConstraints.maxPrice) {
          score += 100; // Boost for within budget
        } else {
          score = -1000; // Heavy penalty for exceeding budget
        }
      }

      if (conversationConstraints.category) {
        if (product.category.toLowerCase().includes(conversationConstraints.category) ||
            product.subcategory.toLowerCase().includes(conversationConstraints.category)) {
          score += 120; // High boost for matching conversation category
        }
      }

      // Current query constraints (only apply if not already covered by conversation constraints)
      const colorKeywords = ['red', 'black', 'brown', 'navy', 'blue', 'green', 'white', 'gray', 'grey', 'pink', 'purple', 'yellow', 'orange'];
      const specifiedColor = colorKeywords.find(color => queryLower.includes(color));
      if (specifiedColor && !conversationConstraints.color) {
        if (!product.color.toLowerCase().includes(specifiedColor) &&
          !product.colors.some(c => c.toLowerCase().includes(specifiedColor))) {
        score = -1000; // Heavy penalty for wrong color
        }
      }

      // Price constraint filtering (only apply if not already covered by conversation constraints)
      const priceConstraints = this.extractPriceConstraints(queryLower);
      if (priceConstraints.maxPrice && !conversationConstraints.maxPrice) {
        if (product.price > priceConstraints.maxPrice) {
          console.log(`🚫 Product ${product.name} ($${product.price}) exceeds current query budget of $${priceConstraints.maxPrice}`);
        score = -1000; // Heavy penalty for exceeding max price
        }
      }
      if (priceConstraints.minPrice && !conversationConstraints.minPrice) {
        if (product.price < priceConstraints.minPrice) {
          console.log(`🚫 Product ${product.name} ($${product.price}) below current query minimum of $${priceConstraints.minPrice}`);
        score = -1000; // Heavy penalty for being below min price
        }
      }

      return { product, score };
    });

    // Sort by score and return top results
    // Apply STRICT filtering - all constraints must be met at retrieval stage
    const filteredProducts = scoredProducts.filter(item => {
      // STRICT BUDGET FILTERING: If any budget constraint exists, enforce it strictly
      if (conversationConstraints.maxPrice && item.product.price > conversationConstraints.maxPrice) {
        console.log(`🚫 Filtering out ${item.product.name} ($${item.product.price}) - exceeds budget $${conversationConstraints.maxPrice}`);
        return false;
      }
      if (conversationConstraints.minPrice && item.product.price < conversationConstraints.minPrice) {
        console.log(`🚫 Filtering out ${item.product.name} ($${item.product.price}) - below minimum $${conversationConstraints.minPrice}`);
        return false;
      }
      
      // STRICT COLOR FILTERING: If any color constraint exists, enforce it strictly
      if (conversationConstraints.color && 
          !item.product.color.toLowerCase().includes(conversationConstraints.color) &&
          !item.product.colors.some(c => c.toLowerCase().includes(conversationConstraints.color!))) {
        console.log(`🚫 Filtering out ${item.product.name} (${item.product.color}) - doesn't match color ${conversationConstraints.color}`);
        return false;
      }
      
      // STRICT CATEGORY FILTERING: If any category constraint exists, enforce it strictly
      if (conversationConstraints.category && 
          !item.product.category.toLowerCase().includes(conversationConstraints.category) &&
          !item.product.subcategory.toLowerCase().includes(conversationConstraints.category)) {
        console.log(`🚫 Filtering out ${item.product.name} (${item.product.category}) - doesn't match category ${conversationConstraints.category}`);
        return false;
      }
      
      // STRICT SUBCATEGORY FILTERING: If any subcategory constraint exists, enforce it strictly
      if (conversationConstraints.subcategory && 
          !item.product.subcategory.toLowerCase().includes(conversationConstraints.subcategory)) {
        console.log(`🚫 Filtering out ${item.product.name} (${item.product.subcategory}) - doesn't match subcategory ${conversationConstraints.subcategory}`);
        return false;
      }
      
      return item.score > 0;
    });

    // Deduplicate products by ID and return unique products
    const uniqueProducts = new Map<string, ProductDocument>();
    
    filteredProducts
      .sort((a, b) => b.score - a.score)
      .forEach(item => {
        if (!uniqueProducts.has(item.product.id)) {
          uniqueProducts.set(item.product.id, item.product);
        }
      });
    
    return Array.from(uniqueProducts.values()).slice(0, limit);
  }

  private calculateSemanticScore(query: string, product: ProductDocument): number {
    let score = 0;
    
    // Style and occasion matching
    const styleKeywords = {
      'casual': ['everyday', 'daily', 'comfortable', 'relaxed'],
      'formal': ['elegant', 'sophisticated', 'business', 'professional'],
      'evening': ['night', 'party', 'dinner', 'cocktail'],
      'travel': ['vacation', 'trip', 'journey', 'luggage'],
      'work': ['office', 'business', 'professional', 'corporate']
    };

    Object.entries(styleKeywords).forEach(([style, synonyms]) => {
      if (query.includes(style) || synonyms.some(syn => query.includes(syn))) {
        // Check if product features match the style
        if (product.features.some(f => f.toLowerCase().includes(style)) ||
            product.tags.some(t => t.toLowerCase().includes(style))) {
          score += 40;
        }
      }
    });

    // Size and capacity matching
    const sizeKeywords = {
      'small': ['mini', 'compact', 'petite'],
      'large': ['big', 'spacious', 'roomy', 'oversized'],
      'medium': ['mid', 'regular', 'standard']
    };

    Object.entries(sizeKeywords).forEach(([size, synonyms]) => {
      if (query.includes(size) || synonyms.some(syn => query.includes(syn))) {
        if ((product.size && product.size.toLowerCase().includes(size)) ||
            (product.sizes && product.sizes.some(s => s.toLowerCase().includes(size)))) {
          score += 30;
        }
      }
    });

    // Material preferences
    const materialKeywords = {
      'leather': ['genuine', 'real', 'premium'],
      'canvas': ['fabric', 'cotton', 'denim'],
      'suede': ['soft', 'textured', 'velvet']
    };

    Object.entries(materialKeywords).forEach(([material, synonyms]) => {
      if (query.includes(material) || synonyms.some(syn => query.includes(syn))) {
        if (product.material.toLowerCase().includes(material)) {
          score += 35;
        }
      }
    });

    return score;
  }

  private extractConversationConstraints(conversationHistory?: any[], currentQuery?: string): {
    color?: string;
    maxPrice?: number;
    minPrice?: number;
    category?: string;
    subcategory?: string;
  } {
    const constraints: {
      color?: string;
      maxPrice?: number;
      minPrice?: number;
      category?: string;
      subcategory?: string;
    } = {};

    if (!conversationHistory || conversationHistory.length === 0) {
      return constraints;
    }

    // Extract constraints from all user messages in conversation history
    const userMessages = conversationHistory.filter(msg => msg.type === 'user');
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      // Extract color constraints
      const colorKeywords = ['red', 'black', 'brown', 'navy', 'blue', 'green', 'white', 'gray', 'grey', 'pink', 'purple', 'yellow', 'orange'];
      const foundColor = colorKeywords.find(color => content.includes(color));
      if (foundColor) {
        constraints.color = foundColor;
      }

      // Extract price constraints
      const priceConstraints = this.extractPriceConstraints(content);
      if (priceConstraints.maxPrice) {
        constraints.maxPrice = priceConstraints.maxPrice;
      }
      if (priceConstraints.minPrice) {
        constraints.minPrice = priceConstraints.minPrice;
      }

      // Extract category constraints
      if (content.includes('bag') || content.includes('handbag')) {
        constraints.category = 'bags';
      }
      if (content.includes('wallet')) {
        constraints.subcategory = 'wallet';
      }
      if (content.includes('tote')) {
        constraints.subcategory = 'tote';
      }
      if (content.includes('crossbody')) {
        constraints.subcategory = 'crossbody';
      }
      if (content.includes('backpack')) {
        constraints.subcategory = 'backpack';
      }
      if (content.includes('clutch')) {
        constraints.subcategory = 'clutch';
      }
    });

    // Also extract constraints from the current query and merge them
    // Current query constraints should OVERRIDE conversation history constraints
    if (currentQuery) {
      const currentQueryConstraints = this.extractConstraintsFromQuery(currentQuery);
      
      // Always apply current query constraints, overriding any existing ones
      if (currentQueryConstraints.color) {
        constraints.color = currentQueryConstraints.color;
      }
      if (currentQueryConstraints.maxPrice) {
        constraints.maxPrice = currentQueryConstraints.maxPrice;
      }
      if (currentQueryConstraints.minPrice) {
        constraints.minPrice = currentQueryConstraints.minPrice;
      }
      if (currentQueryConstraints.category) {
        constraints.category = currentQueryConstraints.category;
      }
      if (currentQueryConstraints.subcategory) {
        constraints.subcategory = currentQueryConstraints.subcategory;
      }
    }

    return constraints;
  }

  private extractConstraintsFromQuery(query: string): {
    color?: string;
    maxPrice?: number;
    minPrice?: number;
    category?: string;
    subcategory?: string;
  } {
    const constraints: {
      color?: string;
      maxPrice?: number;
      minPrice?: number;
      category?: string;
      subcategory?: string;
    } = {};

    const queryLower = query.toLowerCase();
    
    // Extract color constraints
    const colorKeywords = ['red', 'black', 'brown', 'navy', 'blue', 'green', 'white', 'gray', 'grey', 'pink', 'purple', 'yellow', 'orange'];
    const foundColor = colorKeywords.find(color => queryLower.includes(color));
    if (foundColor) {
      constraints.color = foundColor;
    }

    // Extract price constraints
    const priceConstraints = this.extractPriceConstraints(queryLower);
    if (priceConstraints.maxPrice) {
      constraints.maxPrice = priceConstraints.maxPrice;
    }
    if (priceConstraints.minPrice) {
      constraints.minPrice = priceConstraints.minPrice;
    }

    // Extract category constraints
    if (queryLower.includes('bag') || queryLower.includes('handbag')) {
      constraints.category = 'bags';
    }
    if (queryLower.includes('wallet')) {
      constraints.subcategory = 'wallet';
    }
    if (queryLower.includes('tote')) {
      constraints.subcategory = 'tote';
    }
    if (queryLower.includes('crossbody')) {
      constraints.subcategory = 'crossbody';
    }
    if (queryLower.includes('backpack')) {
      constraints.subcategory = 'backpack';
    }
    if (queryLower.includes('clutch')) {
      constraints.subcategory = 'clutch';
    }

    return constraints;
  }

  /**
   * Extract price constraints from user query
   */
  private extractPriceConstraints(query: string): { minPrice?: number; maxPrice?: number } {
    const constraints: { minPrice?: number; maxPrice?: number } = {};
    
    console.log(`🔍 Extracting price constraints from: "${query}"`);

    // Look for "budget" patterns like "I have a $200 budget" or "$200 budget"
    const budgetMatch = query.match(/\$?(\d+)\s*budget/i);
    if (budgetMatch) {
      constraints.maxPrice = parseInt(budgetMatch[1]);
      console.log(`💰 Detected budget constraint: max $${constraints.maxPrice}`);
    } else {
      console.log(`❌ No budget pattern found in: "${query}"`);
    }

    // Look for "under $X" or "below $X" patterns
    const underMatch = query.match(/under\s+\$?(\d+)|below\s+\$?(\d+)/i);
    if (underMatch) {
      constraints.maxPrice = parseInt(underMatch[1] || underMatch[2]);
      console.log(`💰 Detected 'under' constraint: max $${constraints.maxPrice}`);
    }

    // Look for "over $X" or "above $X" patterns
    const overMatch = query.match(/over\s+\$?(\d+)|above\s+\$?(\d+)/i);
    if (overMatch) {
      constraints.minPrice = parseInt(overMatch[1] || overMatch[2]);
      console.log(`💰 Detected 'over' constraint: min $${constraints.minPrice}`);
    }

    // Look for "$X-$Y" range patterns
    const rangeMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/i);
    if (rangeMatch) {
      constraints.minPrice = parseInt(rangeMatch[1]);
      constraints.maxPrice = parseInt(rangeMatch[2]);
      console.log(`💰 Detected range constraint: $${constraints.minPrice} - $${constraints.maxPrice}`);
    }

    // Look for "up to $X" patterns
    const upToMatch = query.match(/up\s+to\s+\$?(\d+)/i);
    if (upToMatch) {
      constraints.maxPrice = parseInt(upToMatch[1]);
      console.log(`💰 Detected 'up to' constraint: max $${constraints.maxPrice}`);
    }

    // Look for "around $X" patterns (with some tolerance)
    const aroundMatch = query.match(/around\s+\$?(\d+)/i);
    if (aroundMatch) {
      const price = parseInt(aroundMatch[1]);
      constraints.minPrice = Math.max(0, price - 50); // $50 below
      constraints.maxPrice = price + 50; // $50 above
      console.log(`💰 Detected 'around' constraint: $${constraints.minPrice} - $${constraints.maxPrice}`);
    }

    // Look for "less than $X" patterns
    const lessThanMatch = query.match(/less\s+than\s+\$?(\d+)/i);
    if (lessThanMatch) {
      constraints.maxPrice = parseInt(lessThanMatch[1]) - 1; // Exclude the exact amount
      console.log(`💰 Detected 'less than' constraint: max $${constraints.maxPrice}`);
    }

    return constraints;
  }

  async getAllProducts(): Promise<ProductDocument[]> {
    return this.products;
  }

  async getRecommendations(category?: string): Promise<ProductDocument[]> {
    if (!this.initialized) {
      throw new Error('RAG service not initialized');
    }

    let filteredProducts = this.products;
    if (category) {
      filteredProducts = this.products.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Return random selection of products
    return filteredProducts
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
  }

  async compareProducts(productIds: string[]): Promise<ProductDocument[]> {
    if (!this.initialized) {
      throw new Error('RAG service not initialized');
    }

    return this.products.filter(p => productIds.includes(p.id));
  }

  async searchByCategory(category: string): Promise<ProductDocument[]> {
    if (!this.initialized) {
      throw new Error('RAG service not initialized');
    }

    return this.products.filter(p => 
      p.category.toLowerCase().includes(category.toLowerCase()) ||
      p.subcategory.toLowerCase().includes(category.toLowerCase())
    );
  }

  getStatus() {
    return {
      initialized: this.initialized,
      productCount: this.products.length
    };
  }
}
