import { ChatRequest, ChatResponse, Product } from './types';
import { TrieveService } from './TrieveService';
import { SessionManager } from './SessionManager';
import { MessageParser } from './MessageParser';

// Global SessionManager instance
const sessionManager = new SessionManager();

export class ChatbotService {
  static async handleMessage(req: ChatRequest): Promise<ChatResponse> {
    const { userId, message } = req;
    
    try {
      console.log(`[ChatbotService] 🔍 Handling message: "${message}" for user: "${userId}"`);

      // 1. Retrieve or create session for the user
      const session = sessionManager.getSession(userId);
      console.log(`[ChatbotService] 📋 Retrieved session for user ${userId}:`, {
        lastCategory: session.lastCategory,
        appliedFilters: session.appliedFilters,
        messageHistoryLength: session.messageHistory.length
      });

      // 2. Check for session reset commands
      if (this.isResetCommand(message)) {
        console.log(`[ChatbotService] 🔄 Clearing session for user ${userId}`);
        sessionManager.clearSession(userId);
        return {
          message: 'Chati u rifillua! Mund të filloni nga e para.',
          products: []
        };
      }

      // 3. Parse the message using MessageParser
      const messageParser = new MessageParser();
      const parsedFilters = messageParser.parse(message);
      console.log(`[ChatbotService] 🔍 Parsed filters from message:`, parsedFilters);

      // 4. Apply context-aware filtering logic
      const finalFilters = this.applyContextFiltering(parsedFilters, session);
      console.log(`[ChatbotService] 🎯 Final filters after context application:`, finalFilters);

      // 5. Get products from Trieve with final filters - NO FALLBACK PRODUCTS
      let products: Product[] = [];
      try {
        // Check if user is asking for more products (pagination)
        const isAskingForMore = this.isAskingForMore(message);
        if (isAskingForMore && session.lastProducts && session.lastProducts.length > 0) {
          // Get different products by adding a small variation to the query
          const variedFilters = { ...finalFilters, _offset: session.lastProducts.length };
          products = await TrieveService.getProducts(variedFilters);
          console.log(`[ChatbotService] 🔄 Getting more products (offset: ${session.lastProducts.length})`);
        } else {
          products = await TrieveService.getProducts(finalFilters);
        }
        console.log(`[ChatbotService] ✅ Products from Trieve API:`, products.map(p => ({ id: p.id, name: p.name, price: p.price, source: p._source })));
        
        // Verify we have real API data
        if (products.length > 0) {
          const hasRealIds = products.some(p => p.id && !['1', '2', '3', '4', '5'].includes(p.id));
          const hasRealPrices = products.some(p => p.price && ![19, 25, 33, 30, 45].includes(p.price));
          console.log(`[ChatbotService] 🔍 Data validation:`, {
            hasRealIds,
            hasRealPrices,
            productCount: products.length
          });
        }
      } catch (error) {
        console.error('[ChatbotService] ❌ Trieve API failed, returning empty array:', error);
        products = [];
      }

      // 6. Generate response message - Only show products, no text
      let responseMessage = '';
      
      // Handle unknown categories first
      if (finalFilters.category === 'UNKNOWN_CATEGORY') {
        console.log(`[ChatbotService] 🚫 Unknown category detected, returning error message`);
        responseMessage = 'Na vjen keq, por nuk kemi produkte të kësaj kategorie. Mund të provoni me kategori të tjera si kemishe, pantallona, qante, fustan, pantofla, peshqir, ose maice.';
        return {
          message: responseMessage,
          products: [],
          sessionContext: sessionManager.updateSession(userId, {
            lastCategory: session.lastCategory,
            appliedFilters: session.appliedFilters,
            lastProducts: [],
            messageHistory: [...session.messageHistory, message]
          })
        };
      }
      
      if (products.length === 0) {
        // Only show error messages when no products found
        if (finalFilters.category && finalFilters.color) {
          responseMessage = `Nuk gjeta ${finalFilters.category} me ngjyrë ${finalFilters.color}. Mund të provoni me ngjyra të tjera ose kategori të tjera.`;
        } else if (finalFilters.color) {
          responseMessage = `Nuk gjeta produkte me ngjyrë ${finalFilters.color}. Mund të specifikoni një kategori për rezultate më të sakta.`;
        } else if (finalFilters.category) {
          responseMessage = `Nuk gjeta ${finalFilters.category}. Mund të provoni me terma të tjerë.`;
        } else {
          responseMessage = 'Nuk gjeta produkte që përputhen me kërkesën tuaj. Mund të provoni me terma të tjerë.';
        }
      }
      // If products found, return empty message - products will be displayed via cards only

      // 7. Update session with new data
      const updatedSession = sessionManager.updateSession(userId, {
        lastCategory: finalFilters.category || session.lastCategory,
        appliedFilters: finalFilters,
        lastProducts: products,
        messageHistory: [...session.messageHistory, message]
      });
      console.log(`[ChatbotService] 💾 Updated session for user ${userId}:`, {
        lastCategory: updatedSession.lastCategory,
        appliedFilters: updatedSession.appliedFilters,
        messageHistoryLength: updatedSession.messageHistory.length
      });

      return {
        message: responseMessage,
        products: products.slice(0, 10), // Limit to 10 products
        sessionContext: updatedSession
      };
    } catch (error) {
      console.error('[ChatbotService] ❌ Error:', error);
      return {
        message: 'Më vjen keq, por pati një gabim. Ju lutem provoni përsëri.',
        products: []
      };
    }
  }

  /**
   * Check if the message is a reset command
   */
  private static isResetCommand(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const resetCommands = [
      'restart chat',
      'fillo nga e para',
      'clear session',
      'rifillo',
      'pastro',
      'reset'
    ];
    
    return resetCommands.some(cmd => lowerMessage.includes(cmd));
  }

  /**
   * Check if user is asking for more products
   */
  private static isAskingForMore(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const moreCommands = [
      'ndonje tjeter',
      'ndonje tjetër',
      'tjeter',
      'tjetër',
      'me shume',
      'më shumë',
      'more',
      'others',
      'different',
      'ndryshe'
    ];
    
    return moreCommands.some(cmd => lowerMessage.includes(cmd));
  }

  /**
   * Apply context-aware filtering logic
   * - If no category in current message but session has lastCategory, use it
   * - If no filters in current message but session has appliedFilters, merge them
   * - If new category detected, reset other filters but preserve price/color if specified
   */
  private static applyContextFiltering(
    parsedFilters: any, 
    session: any
  ): any {
    const finalFilters = { ...parsedFilters };

    console.log(`[ChatbotService] 🔍 Input filters:`, parsedFilters);
    console.log(`[ChatbotService] 🔍 Session context:`, {
      lastCategory: session.lastCategory,
      appliedFilters: session.appliedFilters,
      lastProducts: session.lastProducts?.length || 0,
      messageHistory: session.messageHistory?.length || 0
    });

    // CRITICAL FIX: When only price filter is provided, preserve category context
    if (finalFilters.price && !finalFilters.category && session.lastCategory) {
      console.log(`[ChatbotService] 🔄 Preserving category context: ${session.lastCategory} for price filter`);
      finalFilters.category = session.lastCategory;
    }

    // CRITICAL FIX: When only color filter is provided, preserve category context
    if (finalFilters.color && !finalFilters.category && session.lastCategory) {
      console.log(`[ChatbotService] 🔄 Preserving category context: ${session.lastCategory} for color filter`);
      finalFilters.category = session.lastCategory;
    }

    // CRITICAL FIX: When only size filter is provided, preserve category context
    if (finalFilters.size && !finalFilters.category && session.lastCategory) {
      console.log(`[ChatbotService] 🔄 Preserving category context: ${session.lastCategory} for size filter`);
      finalFilters.category = session.lastCategory;
    }

    // CRITICAL FIX: When only material filter is provided, preserve category context
    if (finalFilters.material && !finalFilters.category && session.lastCategory) {
      console.log(`[ChatbotService] 🔄 Preserving category context: ${session.lastCategory} for material filter`);
      finalFilters.category = session.lastCategory;
    }

    // 1. Handle category context - ONLY if no category is detected in current message
    // BUT NOT if we already have a category from current message parsing
    if (!finalFilters.category && session.lastCategory && !parsedFilters.category) {
      console.log(`[ChatbotService] 🔄 Using session category: ${session.lastCategory}`);
      finalFilters.category = session.lastCategory;
    }

    // 2. Handle filter context for attribute-only queries (color, price, size, material)
    if (!finalFilters.category && session.appliedFilters?.category) {
      // If no category in current message but session has a category, use it
      console.log(`[ChatbotService] 🔄 Applying session category: ${session.appliedFilters.category}`);
      finalFilters.category = session.appliedFilters.category;
    }

    // 3. If user specifies a new category, reset previous filters but preserve current message filters
    if (finalFilters.category && session.appliedFilters?.category && 
        finalFilters.category !== session.appliedFilters.category) {
      console.log(`[ChatbotService] 🔄 New category detected: ${finalFilters.category} (was: ${session.appliedFilters.category})`);
    }

    // 4. Merge additional filters from session if not specified in current message
    // BUT ONLY if the category hasn't changed (to avoid carrying over filters from different product types)
    if (session.appliedFilters) {
      const categoryChanged = finalFilters.category && 
                             session.appliedFilters.category && 
                             finalFilters.category !== session.appliedFilters.category;
      
      console.log(`[ChatbotService] 🔍 Category change detection:`, {
        currentCategory: finalFilters.category,
        sessionCategory: session.appliedFilters.category,
        categoryChanged: categoryChanged,
        parsedCategory: parsedFilters.category,
        parsedColor: parsedFilters.color
      });
      
      if (!categoryChanged) {
        // Only preserve filters if user is continuing the same search
        if (!finalFilters.color && session.appliedFilters.color) {
          console.log(`[ChatbotService] 🔄 Preserving color from session: ${session.appliedFilters.color}`);
          finalFilters.color = session.appliedFilters.color;
        }
        if (!finalFilters.price && session.appliedFilters.price) {
          console.log(`[ChatbotService] 🔄 Preserving price from session: ${session.appliedFilters.price}`);
          finalFilters.price = session.appliedFilters.price;
        }
      } else {
        console.log(`[ChatbotService] 🔄 Category changed from ${session.appliedFilters.category} to ${finalFilters.category} - not preserving filters`);
      }
    }

    console.log(`[ChatbotService] 🎯 Final filters:`, finalFilters);
    return finalFilters;
  }
}
