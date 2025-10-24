import { ChatRequest, ChatResponse, Product } from './types';
import { TrieveService } from './TrieveService';
import { SessionManager } from './SessionManager';
import { MessageParser, buildNormalizedFilters } from './MessageParser';

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
      const rawParsedFilters = messageParser.parse(message);
      console.log(`[ChatbotService] 🔍 RAW parsed filters from message:`, rawParsedFilters);
      
      // 3.5 🔥 NEW: Normalize filters (xs→XS, black→BLACK, etc.)
      const parsedFilters = buildNormalizedFilters(rawParsedFilters);
      console.log(`[ChatbotService] ✨ NORMALIZED parsed filters:`, parsedFilters);

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
      
      // 🔥 CRITICAL: Check if user asked for brands
      // Pattern 1: "ndonje mark tjeter" (another brand)
      // Pattern 2: "qfar brands/brende" (what brands)
      const askedForOtherBrand = /ndon[eë]\s*(mark|marka|brand|brend)/i.test(message) && 
                                 /(tjeter|tjetër|tjera)/i.test(message);
      const askedForBrands = /qfar|çfarë|cfare/i.test(message) && 
                            /(brand|brend|mark|marka)/i.test(message);
      
      if ((askedForOtherBrand || askedForBrands) && products.length > 0) {
        const availableBrands = TrieveService.getAvailableBrands(products);
        
        if (availableBrands.length === 1) {
          // Only one brand exists
          responseMessage = `Për ${finalFilters.category?.toLowerCase() || 'këtë kategori'}, vetëm marka ${availableBrands[0]} është e disponueshme aktualisht.`;
          console.log(`[ChatbotService] 🏷️ User asked for brands but only ${availableBrands[0]} exists`);
        } else if (availableBrands.length > 1) {
          // Multiple brands exist - show list
          responseMessage = `Markat e disponueshme për ${finalFilters.category?.toLowerCase() || 'këtë kategori'} janë: ${availableBrands.join(', ')}. Për shembull, provoni: "marka ${availableBrands[0]}" ose "${availableBrands[1]}".`;
          console.log(`[ChatbotService] 🏷️ User asked for brands - showing all ${availableBrands.length} available`);
        }
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
    
    // EXCLUDE pagination patterns - these are NOT exploratory
    const paginationPatterns = ['ndonje tjeter', 'ndonje tjetër', 'me shume', 'më shumë'];
    if (paginationPatterns.some(p => lowerMessage.includes(p))) {
      return false; // Pagination, not exploration
    }
    
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
      'what', 'show', 'all', 'everything', 'have'
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
    console.log(`[ChatbotService] 🔍 Input normalized filters:`, parsedFilters);
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
    // CRITICAL FIX: Check if brand mentions "qfar brand/brands", "what brands", etc. (exploratory brand query)
    const isExploratoryBrandQuery = isExploratory && (
      message.toLowerCase().includes('qfar brand') || 
      message.toLowerCase().includes('qfar brend') || // catches both "brend" and "brende"
      message.toLowerCase().includes('what brand') ||
      message.toLowerCase().includes('çfarë brand') ||
      message.toLowerCase().includes('cfare brand') ||
      message.toLowerCase().includes('çfarë brend') ||
      message.toLowerCase().includes('cfare brend')
    );
    
    if (isExploratoryBrandQuery || 
        (isExploratory && !parsedFilters.brand && !parsedFilters.color && !parsedFilters.price && !parsedFilters.size)) {
      console.log(`[ChatbotService] 🌐 EXPLORATORY QUERY detected - clearing ALL filters to show all options`);
      
      const categoryToUse = parsedFilters.category || session.lastCategory;
      
      return {
        category: categoryToUse
      };
    }

    // 🔥 RECOVERY INTENT: Clear failed filters, keep category
    if (isRecovery && session.appliedFilters) {
      console.log(`[ChatbotService] 🔄 RECOVERY INTENT detected - clearing failed filters`);
      
      return {
        category: session.lastCategory
      };
    }

    // 🔥 CORE FIX: Merge session filters with new filters (new filters override)
    // Start with previous filters, then apply current message filters
    let finalFilters: any = {};
    
    // 🔥 CRITICAL FIX: Detect if user is asking for a NEW category vs. follow-up filter
    // Follow-up filter indicators (Albanian + English)
    const followUpFilterPatterns = [
      // Brand/other: "ndonje mark tjeter", "different brand", "another brand"
      'ndonje', 'ndonjë', 'tjeter', 'tjetër', 'tjer', 'tjera', 'another', 'different', 'other',
      // Color: "te zeze", "color", "ngjyr"
      'te', 'të', 'ngjyr', 'ngjyra', 'color', 'colour',
      // Price: "nen", "mbi", "under", "over"
      'nen', 'nën', 'mbi', 'poshte', 'poshtë', 'siper', 'sipër', 'under', 'over',
      // Size: "madhesia", "size"
      'madhesia', 'madhësia', 'madhsi', 'madhsine', 'size',
      // Material/quality
      'material', 'cilesi', 'cilësi', 'quality',
      // Comparative: "me te lira", "cheaper"
      'lira', 'lire', 'cheap', 'expensive', 'shtrenjt'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasFollowUpPattern = followUpFilterPatterns.some(pattern => lowerMessage.includes(pattern));
    
    // Step 1: If user didn't mention category but we have one in session
    if (!parsedFilters.category && session.lastCategory) {
      // Use session category IF:
      // - Message has follow-up filter patterns (te zeze, ndonje tjeter, nen 20$), OR
      // - Message has ANY detected filter (color, price, size, brand)
      const hasAnyFilter = parsedFilters.color || parsedFilters.price || parsedFilters.size || 
                          parsedFilters.brand || parsedFilters.material;
      
      // 🔥 CRITICAL FIX: If message has "dua nje X" pattern where X looks like a category attempt,
      // don't use session context - it's a new category request (possibly gibberish)
      const hasDuaNjePattern = /dua\s+(nje|një|ndonje|ndonjë|ni)\s+\w+/i.test(message);
      const isLikelyNewCategoryAttempt = hasDuaNjePattern && !hasAnyFilter && !hasFollowUpPattern;
      
      if (isLikelyNewCategoryAttempt) {
        console.log(`[ChatbotService] 🚫 "dua nje X" pattern detected without valid filter - treating as failed new category request`);
        // Don't use session category - this is a new category request that failed
      } else if (hasFollowUpPattern || hasAnyFilter) {
        finalFilters.category = session.lastCategory;
        console.log(`[ChatbotService] 🔄 Retained category from session: ${finalFilters.category} (follow-up filter detected)`);
      } else {
        console.log(`[ChatbotService] ❌ No category detected and no follow-up patterns - likely unknown category`);
        // Don't use session category - user is asking for something new that we don't recognize
      }
    } else if (parsedFilters.category) {
      finalFilters.category = parsedFilters.category;
      console.log(`[ChatbotService] ✨ New category from message: ${finalFilters.category}`);
    }
    
    // Step 2: If user mentioned a new category, clear old filters (context switch)
    const isCategorySwitch = parsedFilters.category && session.lastCategory && 
                            parsedFilters.category !== session.lastCategory;
    
    if (isCategorySwitch) {
      console.log(`[ChatbotService] 🔄 CATEGORY SWITCH: ${session.lastCategory} → ${parsedFilters.category}. Clearing old filters.`);
      // Only apply new filters from current message
      finalFilters = { ...parsedFilters };
    } else {
      // Step 3: Merge session filters with current message filters
      // Session filters are base, current message overrides specific keys
      if (session.appliedFilters) {
        console.log(`[ChatbotService] 🔄 Merging session filters:`, session.appliedFilters);
      }
      
      // Merge strategy: session base + current message overrides
      finalFilters = {
        category: finalFilters.category, // Already determined above
        brand: parsedFilters.brand ?? session.appliedFilters?.brand ?? null,
        color: parsedFilters.color ?? session.appliedFilters?.color ?? null,
        size: parsedFilters.size ?? session.appliedFilters?.size ?? null,
        price: parsedFilters.price ?? session.appliedFilters?.price ?? null,
        material: parsedFilters.material ?? session.appliedFilters?.material ?? null
      };
      
      console.log(`[ChatbotService] ✅ Merged filters:`, finalFilters);
    }
    
    // Clean up null values
    Object.keys(finalFilters).forEach(key => {
      if (finalFilters[key] === null || finalFilters[key] === undefined) {
        delete finalFilters[key];
      }
    });
    
    console.log(`[ChatbotService] 🎯 FINAL merged filters (ready for Trieve):`, finalFilters);
    return finalFilters;
  }
}
