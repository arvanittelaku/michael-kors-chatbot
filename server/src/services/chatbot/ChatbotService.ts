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

      // 4. Apply context-aware filtering logic (with message for intent detection)
      const finalFilters = this.applyContextFiltering(parsedFilters, session, message);
      console.log(`[ChatbotService] 🎯 Final filters after context application:`, finalFilters);

      // 5. Get products from Trieve with final filters - NO FALLBACK PRODUCTS
      let products: Product[] = [];
      let sortPreference: 'cheap' | 'expensive' | null = null;
      
      try {
        // Detect if user wants "cheaper" or "more expensive" (comparative sorting)
        if (finalFilters.price?.max === 0) {
          sortPreference = 'cheap';
          delete finalFilters.price; // Remove the signal, don't use as actual filter
          console.log(`[ChatbotService] 💰 User wants CHEAPER products - will sort by price ASC`);
        } else if (finalFilters.price?.min === 99999) {
          sortPreference = 'expensive';
          delete finalFilters.price; // Remove the signal
          console.log(`[ChatbotService] 💰 User wants MORE EXPENSIVE products - will sort by price DESC`);
        }
        
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
        
        // Apply sorting based on price preference
        if (sortPreference === 'cheap') {
          products = products.sort((a, b) => (a.price || 0) - (b.price || 0));
          console.log(`[ChatbotService] 💰 Sorted by CHEAPEST first`);
        } else if (sortPreference === 'expensive') {
          products = products.sort((a, b) => (b.price || 0) - (a.price || 0));
          console.log(`[ChatbotService] 💰 Sorted by MOST EXPENSIVE first`);
        }
        
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

      // 6. Generate response message with smart suggestions
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
        // Smart error messages based on what filter failed
        
        // If user asked for a specific brand that doesn't exist
        if (finalFilters.brand && session.lastProducts && session.lastProducts.length > 0) {
          const availableBrands = TrieveService.getAvailableBrands(session.lastProducts);
          if (availableBrands.length > 0) {
            responseMessage = `Më vjen keq, nuk kemi markën "${finalFilters.brand}" në ${finalFilters.category || 'këtë kategori'}. Markat e disponueshme janë: ${availableBrands.join(', ')}. Mund të zgjidhni një nga këto.`;
          } else {
            responseMessage = `Më vjen keq, nuk kemi markën "${finalFilters.brand}" në ${finalFilters.category || 'këtë kategori'}.`;
          }
        }
        // If user asked for a color that doesn't exist
        else if (finalFilters.color && session.lastProducts && session.lastProducts.length > 0) {
          const availableColors = TrieveService.getAvailableColors(session.lastProducts);
          if (availableColors.length > 0) {
            responseMessage = `Nuk gjeta ${finalFilters.category || 'produkte'} me ngjyrë ${finalFilters.color}. Ngjyrat e disponueshme janë: ${availableColors.join(', ')}.`;
          } else {
            responseMessage = `Nuk gjeta ${finalFilters.category || 'produkte'} me ngjyrë ${finalFilters.color}.`;
          }
        }
        // Generic no results messages
        else if (finalFilters.category && finalFilters.color) {
          responseMessage = `Nuk gjeta ${finalFilters.category} me ngjyrë ${finalFilters.color}. Mund të provoni me ngjyra të tjera ose kategori të tjera.`;
        } else if (finalFilters.color) {
          responseMessage = `Nuk gjeta produkte me ngjyrë ${finalFilters.color}. Mund të specifikoni një kategori për rezultate më të sakta.`;
        } else if (finalFilters.category) {
          responseMessage = `Nuk gjeta ${finalFilters.category}. Mund të provoni me terma të tjerë.`;
        } else {
          responseMessage = 'Nuk gjeta produkte që përputhen me kërkesën tuaj. Mund të provoni me terma të tjerë.';
        }
      } else {
        // If products found, add helpful suggestions for filtering
        const availableBrands = TrieveService.getAvailableBrands(products);
        const availableColors = TrieveService.getAvailableColors(products);
        const priceRange = TrieveService.getPriceRange(products);
        
        const suggestions = [];
        if (availableBrands.length > 1) {
          suggestions.push(`marka (${availableBrands.slice(0, 3).join(', ')}${availableBrands.length > 3 ? '...' : ''})`);
        }
        if (availableColors.length > 1) {
          suggestions.push(`ngjyrë (${availableColors.slice(0, 3).join(', ')}${availableColors.length > 3 ? '...' : ''})`);
        }
        if (priceRange) {
          suggestions.push(`çmim ($${priceRange.min}-$${priceRange.max})`);
        }
        
        if (suggestions.length > 0) {
          responseMessage = `Mund të filtroni sipas: ${suggestions.join(', ')}. Për shembull: "më të lira", "ngjyrë e kuqe", "marka ${availableBrands[0] || 'BOSS'}".`;
        }
      }

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
   * Check if user is asking for more products (pagination)
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
   * Check if user is making an exploratory query (browsing, not refining)
   * Research-backed patterns for exploratory intent detection
   */
  private static isExploratoryQuery(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Exploratory patterns - user wants to see ALL options
    const exploratoryPatterns = [
      // Albanian "what" questions
      'qfar', 'çfarë', 'cfare', 'cfar',
      // "do you have" / "what do you have"
      'keni', 'ka',
      // "show me" / "display"
      'trego', 'shfaq', 'shiko',
      // "all" / "everything"
      'te gjitha', 'të gjitha', 'gjitha', 'çdo', 'cdo',
      // English equivalents
      'what', 'show', 'all', 'everything', 'have',
      // "other" when standalone (not part of filter)
      'tjeter', 'tjetër'
    ];
    
    // Check for exploratory patterns
    const hasExploratoryPattern = exploratoryPatterns.some(pattern => 
      lowerMessage.includes(pattern)
    );
    
    // Additional check: very short queries like "kemishe?" (just category name)
    const isShortCategoryQuery = lowerMessage.length < 15 && 
      !lowerMessage.includes('nen') && 
      !lowerMessage.includes('nën') &&
      !lowerMessage.includes('mbi') &&
      !lowerMessage.includes('te ') &&
      !lowerMessage.includes('të ');
    
    return hasExploratoryPattern || isShortCategoryQuery;
  }

  /**
   * Check if user wants to recover from failed search
   * When "ndonje tjeter" is used after getting no results, clear failed filters
   */
  private static isRecoveryIntent(message: string, lastProductCount: number): boolean {
    const lowerMessage = message.toLowerCase();
    const recoveryPatterns = [
      'ndonje tjeter',
      'ndonje tjetër',
      'tjeter',
      'tjetër',
      'ndryshe'
    ];
    
    // Recovery = asking for "something else" after getting 0 results
    return lastProductCount === 0 && 
           recoveryPatterns.some(pattern => lowerMessage.includes(pattern));
  }

  /**
   * Apply context-aware filtering logic
   * - If no category in current message but session has lastCategory, use it
   * - If no filters in current message but session has appliedFilters, merge them
   * - If new category detected, reset other filters but preserve price/color if specified
   * - ENHANCED: Handle exploratory queries and recovery from failed searches
   */
  private static applyContextFiltering(
    parsedFilters: any, 
    session: any,
    message: string
  ): any {
    const finalFilters = { ...parsedFilters };

    console.log(`[ChatbotService] 🔍 Input filters:`, parsedFilters);
    console.log(`[ChatbotService] 🔍 Session context:`, {
      lastCategory: session.lastCategory,
      appliedFilters: session.appliedFilters,
      lastProducts: session.lastProducts?.length || 0,
      messageHistory: session.messageHistory?.length || 0
    });

    // 🔥 NEW: Check if this is an exploratory query
    const isExploratory = this.isExploratoryQuery(message);
    const lastProductCount = session.lastProducts?.length || 0;
    const isRecovery = this.isRecoveryIntent(message, lastProductCount);

    console.log(`[ChatbotService] 🔍 Query type:`, { isExploratory, isRecovery, lastProductCount });

    // 🔥 EXPLORATORY QUERY: Clear all filters except category
    if (isExploratory && !parsedFilters.brand && !parsedFilters.color && !parsedFilters.price) {
      console.log(`[ChatbotService] 🌐 EXPLORATORY QUERY detected - clearing filters to show all options`);
      
      // Keep only the category (either from parsed or session)
      const categoryToUse = parsedFilters.category || session.lastCategory;
      
      return {
        category: categoryToUse
      };
    }

    // 🔥 RECOVERY INTENT: Clear failed filters, keep category
    if (isRecovery && session.appliedFilters) {
      console.log(`[ChatbotService] 🔄 RECOVERY INTENT detected - clearing failed filters`);
      
      // Clear the filter that resulted in 0 products
      // Keep only category from session
      return {
        category: session.lastCategory
      };
    }

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

    // CRITICAL FIX: When only brand filter is provided, preserve category context OR search all categories
    if (finalFilters.brand && !finalFilters.category) {
      if (session.lastCategory) {
        console.log(`[ChatbotService] 🔄 Preserving category context: ${session.lastCategory} for brand filter`);
        finalFilters.category = session.lastCategory;
      } else {
        console.log(`[ChatbotService] 🔍 Brand-only search across all categories`);
        // Allow brand-only search without category
      }
    }

    // INTENT SWITCHING: Clear incompatible filters when a new primary intent is detected
    if (finalFilters.brand && session.appliedFilters) {
      // If user specifies a brand, clear old color/size filters unless explicitly mentioned
      if (!parsedFilters.color && session.appliedFilters.color) {
        console.log(`[ChatbotService] 🔄 Clearing old color filter due to brand intent switch`);
        // Don't copy old color filter
      }
      if (!parsedFilters.size && session.appliedFilters.size) {
        console.log(`[ChatbotService] 🔄 Clearing old size filter due to brand intent switch`);
        // Don't copy old size filter
      }
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
