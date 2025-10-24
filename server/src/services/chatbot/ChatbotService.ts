import { ChatRequest, ChatResponse, Product } from './types';
import { TrieveService } from './TrieveService';
import { SessionManager } from './SessionManager';
import { MessageParser, buildNormalizedFilters } from './MessageParser';
import OpenAIService from '../ai/OpenAIService';

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

      // 3. 🤖 Try OpenAI parsing first (if enabled), then fallback to regex
      let parsedFilters: any = {};
      
      if (OpenAIService.isEnabled()) {
        console.log(`[ChatbotService] 🤖 Attempting OpenAI intent parsing...`);
        const aiParsed = await OpenAIService.parseUserIntent(message, session.messageHistory);
        
        if (aiParsed) {
          console.log(`[ChatbotService] ✅ OpenAI parsed filters:`, aiParsed);
          // 🔥 CRITICAL FIX: Normalize OpenAI results too! (silver→SILVER, xs→XS, etc.)
          parsedFilters = buildNormalizedFilters(aiParsed);
          console.log(`[ChatbotService] ✨ NORMALIZED OpenAI filters:`, parsedFilters);
        } else {
          console.log(`[ChatbotService] ⚠️ OpenAI parsing failed, falling back to regex`);
        }
      }
      
      // Fallback to regex-based MessageParser if OpenAI is disabled or failed
      if (!OpenAIService.isEnabled() || Object.keys(parsedFilters).length === 0) {
        console.log(`[ChatbotService] 🔍 Using regex-based MessageParser...`);
        const messageParser = new MessageParser();
        const rawParsedFilters = messageParser.parse(message);
        console.log(`[ChatbotService] 🔍 RAW parsed filters from message:`, rawParsedFilters);
        
        // 3.5 🔥 Normalize filters (xs→XS, black→BLACK, etc.)
        parsedFilters = buildNormalizedFilters(rawParsedFilters);
        console.log(`[ChatbotService] ✨ NORMALIZED parsed filters:`, parsedFilters);
      }

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
      
      // 🔥 NEW: Handle "what products do you have?" queries
      // Pattern: "qfar produkte keni", "qfar keni", "çfarë produktesh keni", etc.
      const askedForAllProducts = (
        /qfar|çfarë|cfare/i.test(message) && 
        /(produkte|produktesh)/i.test(message) &&
        /keni|ke|ka/i.test(message)
      );
      
      if (askedForAllProducts && !finalFilters.category) {
        console.log(`[ChatbotService] 📋 User asked "what products do you have?" - listing all categories`);
        responseMessage = 'Kemi këto kategori produktesh:\n\n' +
          '👕 **Kemishe** - Shirts\n' +
          '👖 **Pantallona** - Pants\n' +
          '🧺 **Peshqir** - Towels\n' +
          '👜 **Qante** - Bags\n' +
          '👗 **Fustan** - Dresses\n' +
          '🩴 **Pantofla** - Slippers\n' +
          '🧢 **Kapele** - Hats\n' +
          '👕 **Maice** - T-shirts\n\n' +
          'Çfarë dëshironi të shihni?';
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
      
      // 🔥 CRITICAL: Handle gibberish/unrecognized queries (Question 2 Option A - VERY strict)
      if (finalFilters.category === 'GIBBERISH' || (!finalFilters.category && !session.lastCategory)) {
        // 🔥 NEW: Before treating as gibberish, check if MessageParser can detect an unavailable category
        // This catches cases where OpenAI fails to recognize kepuce/atlete
        console.log(`[ChatbotService] 🔍 Potential gibberish, checking MessageParser for unavailable categories...`);
        const messageParser = new MessageParser();
        const regexParsed = messageParser.parse(message);
        
        const unavailableCategories = ['kepuce', 'atlete'];
        if (regexParsed.category && unavailableCategories.includes(regexParsed.category)) {
          console.log(`[ChatbotService] ✅ MessageParser detected unavailable category: ${regexParsed.category}`);
          finalFilters.category = regexParsed.category; // Use the detected category
          // Don't return gibberish - let it continue to the error handling below
        } else {
          console.log(`[ChatbotService] 🚫 Confirmed gibberish or completely unrecognized query, returning error message`);
          responseMessage = 'Nuk e kuptova kërkesën tuaj. Mund ta përsërisni? Provoni të përdorni fjalë si: kemishe, pantallona, peshqir, qante, fustan, pantofla, kapele.';
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
      }
      
      // 🔥 CRITICAL: Check if user asked for brands
      // Pattern 1: "ndonje mark tjeter", "dua nje brend tjeter", "a keni brend tjeter" (another brand)
      // Pattern 2: "qfar brands/brende" (what brands)
      const askedForOtherBrand = (
        // Pattern 1a: "ndonje/nje mark/brend tjeter"
        /(ndon[eë]|nje|një)\s*(mark|marka|brand|brend)/i.test(message) && /(tjeter|tjetër|tjera)/i.test(message)
      ) || (
        // Pattern 1b: "a keni brend tjeter", "keni ndonje brend tjeter"
        /(keni|ke)\s*(ndon[eë]|nje|një)?\s*(mark|marka|brand|brend)/i.test(message) && /(tjeter|tjetër|tjera)/i.test(message)
      ) || (
        // Pattern 1c: "dua brend tjeter" (without nje/ndonje)
        /dua\s*(mark|marka|brand|brend)/i.test(message) && /(tjeter|tjetër|tjera)/i.test(message)
      );
      
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
        
        // 🔥 CRITICAL FIX: If user asked for a specific brand that doesn't exist
        // First check if the BRAND exists at all (without other filters)
        // Then provide appropriate message
        if (finalFilters.brand && finalFilters.category) {
          console.log(`[ChatbotService] 🔍 Brand "${finalFilters.brand}" + filters returned 0 results. Checking if brand exists at all...`);
          
          // STEP 1: Check if brand exists for this category (without color/price/size filters)
          const brandOnlyFilters = { 
            category: finalFilters.category, 
            brand: finalFilters.brand 
          };
          const brandProducts = await TrieveService.getProducts(brandOnlyFilters);
          
          if (brandProducts.length > 0) {
            // ✅ Brand EXISTS but not with the specific filters (color/price/size)
            console.log(`[ChatbotService] ✅ Brand "${finalFilters.brand}" exists but not with the specific filters`);
            
            const filterDescriptions = [];
            if (finalFilters.color) filterDescriptions.push(`ngjyrë ${finalFilters.color.toLowerCase()}`);
            if (finalFilters.price?.max && finalFilters.price.max !== 0) filterDescriptions.push(`nën $${finalFilters.price.max}`);
            if (finalFilters.price?.min && finalFilters.price.min !== 99999) filterDescriptions.push(`mbi $${finalFilters.price.min}`);
            if (finalFilters.size) filterDescriptions.push(`madhësi ${Array.isArray(finalFilters.size) ? finalFilters.size.join(', ') : finalFilters.size}`);
            
            const filterText = filterDescriptions.length > 0 ? ` ${filterDescriptions.join(', ')}` : '';
            responseMessage = `Më vjen keq, nuk kemi ${finalFilters.category} ${finalFilters.brand}${filterText}. Këtu janë disa ${finalFilters.category} ${finalFilters.brand} të disponueshme:`;
            
            // Show brand products (without the failed filters)
            products = brandProducts;
          } else {
            // ❌ Brand does NOT exist for this category at all
            console.log(`[ChatbotService] ❌ Brand "${finalFilters.brand}" does NOT exist for ${finalFilters.category}`);
            
            // STEP 2: Get ALL brands available for this category
            const categoryOnlyFilters = { category: finalFilters.category };
            const categoryProducts = await TrieveService.getProducts(categoryOnlyFilters);
            
            if (categoryProducts.length > 0) {
              const availableBrands = TrieveService.getAvailableBrands(categoryProducts);
              if (availableBrands.length > 0) {
                responseMessage = `Më vjen keq, nuk kemi markën "${finalFilters.brand}" në ${finalFilters.category}. Markat e disponueshme janë: ${availableBrands.join(', ')}. Këtu janë disa ${finalFilters.category}:`;
                // Show products from available brands
                products = categoryProducts;
              } else {
                responseMessage = `Më vjen keq, nuk kemi markën "${finalFilters.brand}" në ${finalFilters.category}.`;
              }
            } else {
              responseMessage = `Më vjen keq, nuk kemi ${finalFilters.category} në dispozicion aktualisht.`;
            }
          }
        }
        // 🔥 CRITICAL FIX: If user asked for a specific size that doesn't exist
        // Similar logic to brand - check if category exists with OTHER sizes
        else if (finalFilters.size && finalFilters.category) {
          console.log(`[ChatbotService] 🔍 Size "${finalFilters.size}" + filters returned 0 results. Checking if category exists with other sizes...`);
          
          // STEP 1: Check if category exists with ANY size (without the size filter)
          const categoryOnlyFilters = { 
            category: finalFilters.category
          };
          const categoryProducts = await TrieveService.getProducts(categoryOnlyFilters);
          
          if (categoryProducts.length > 0) {
            // ✅ Category EXISTS but not with the specific size
            console.log(`[ChatbotService] ✅ Category "${finalFilters.category}" exists but size "${finalFilters.size}" not available`);
            
            // Get available sizes
            const availableSizes = [...new Set(categoryProducts.map(p => p.size).filter(Boolean))].sort();
            
            const requestedSizeStr = Array.isArray(finalFilters.size) ? finalFilters.size.join(', ') : finalFilters.size;
            
            if (availableSizes.length > 0) {
              responseMessage = `Më vjen keq, nuk kemi ${finalFilters.category} madhësi ${requestedSizeStr}. Madhësitë e disponueshme janë: ${availableSizes.join(', ')}. Këtu janë disa ${finalFilters.category}:`;
            } else {
              responseMessage = `Më vjen keq, nuk kemi ${finalFilters.category} madhësi ${requestedSizeStr}.`;
            }
            
            // Show category products (without the failed size filter)
            products = categoryProducts;
          } else {
            // ❌ Category does NOT exist at all
            console.log(`[ChatbotService] ❌ Category "${finalFilters.category}" does NOT exist`);
            responseMessage = `Më vjen keq, nuk kemi ${finalFilters.category} në dispozicion aktualisht.`;
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
          // 🔥 CRITICAL FIX: Special handling for unavailable categories (kepuce, atlete)
          const unavailableCategories = ['kepuce', 'atlete', 'shoes', 'sneakers'];
          if (unavailableCategories.includes(finalFilters.category.toLowerCase())) {
            console.log(`[ChatbotService] 🚫 User asked for unavailable category: ${finalFilters.category}`);
            responseMessage = `Më vjen keq, nuk kemi ${finalFilters.category} në dispozicion aktualisht. Kemi këto kategori:\n\n` +
              '👕 **Kemishe** - Shirts\n' +
              '👖 **Pantallona** - Pants\n' +
              '🧺 **Peshqir** - Towels\n' +
              '👜 **Qante** - Bags\n' +
              '👗 **Fustan** - Dresses\n' +
              '🩴 **Pantofla** - Slippers\n' +
              '🧢 **Kapele** - Hats\n' +
              '👕 **Maice** - T-shirts\n\n' +
              'Çfarë dëshironi të shihni?';
          } else {
            responseMessage = `Nuk gjeta ${finalFilters.category}. Mund të provoni me terma të tjerë.`;
          }
        } else {
          responseMessage = 'Nuk gjeta produkte që përputhen me kërkesën tuaj. Mund të provoni me terma të tjerë.';
        }
      } else {
        // If products found, add helpful suggestions for filtering
        // 🔥 CRITICAL: Only set this message if responseMessage hasn't already been set (e.g., by brand listing)
        if (!responseMessage) {
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
      }

      // 7. 🤖 Try OpenAI response generation (ONLY if we don't have a specific message already)
      // 🔥 CRITICAL: Don't overwrite specific messages (brand availability, error messages, etc.)
      if (OpenAIService.isEnabled() && products.length > 0 && !responseMessage) {
        console.log(`[ChatbotService] 🤖 Attempting OpenAI response generation...`);
        const aiResponse = await OpenAIService.generateResponse({
          userMessage: message,
          extractedFilters: finalFilters,
          products: products,
          conversationHistory: session.messageHistory,
          availableBrands: TrieveService.getAvailableBrands(products),
          availableColors: TrieveService.getAvailableColors(products),
          priceRange: TrieveService.getPriceRange(products)
        });
        
        if (aiResponse) {
          console.log(`[ChatbotService] ✅ Using OpenAI-generated response`);
          responseMessage = aiResponse;
        } else {
          console.log(`[ChatbotService] ⚠️ OpenAI response generation failed, using template`);
        }
      } else if (responseMessage) {
        console.log(`[ChatbotService] 📝 Using specific pre-set message (not calling OpenAI): "${responseMessage.substring(0, 50)}..."`);
      }

      // 8. Update session with new data
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
      // 🔥 CRITICAL: Question 3 Option B implementation
      // Use session category ONLY if BOTH conditions are met:
      // 1. Message has follow-up filter patterns (te zeze, ndonje tjeter, nen 20$)
      // 2. At least ONE valid filter was detected (color, price, size, brand)
      const hasAnyFilter = parsedFilters.color || parsedFilters.price || parsedFilters.size || 
                          parsedFilters.brand || parsedFilters.material;
      
      if (hasFollowUpPattern && hasAnyFilter) {
        // Valid follow-up: has both pattern and detected filter
        finalFilters.category = session.lastCategory;
        console.log(`[ChatbotService] ✅ Valid follow-up detected (pattern + filter) - retained category: ${finalFilters.category}`);
      } else if (!hasFollowUpPattern && !hasAnyFilter) {
        // Pure gibberish: no pattern, no filter
        console.log(`[ChatbotService] 🚫 Gibberish detected (no pattern, no filter) - rejecting query`);
        // Set finalFilters to indicate gibberish/unknown
        finalFilters.category = 'GIBBERISH';
      } else {
        // Ambiguous: has pattern but no filter, or has filter but no pattern
        console.log(`[ChatbotService] ⚠️ Ambiguous query (pattern: ${hasFollowUpPattern}, filter: ${hasAnyFilter}) - treating as new query attempt`);
        // Don't use session category - might be trying to ask for something new
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
      // Step 3: Smart filter merging with intent detection
      if (session.appliedFilters) {
        console.log(`[ChatbotService] 🔄 Session filters available:`, session.appliedFilters);
      }
      
      // 🔥 CRITICAL FIX: Detect if user is refining search with NEW filters
      // If user adds color/price/size WITHOUT mentioning brand again, CLEAR the brand
      const hasNewVisualFilter = parsedFilters.color || parsedFilters.price || parsedFilters.size;
      const hadOldBrand = session.appliedFilters?.brand && !parsedFilters.brand;
      
      if (hasNewVisualFilter && hadOldBrand) {
        console.log(`[ChatbotService] 🔄 User added new filters (color/price/size) without mentioning brand - CLEARING old brand`);
        // User is refining with visual filters, clear the old brand
        finalFilters = {
          category: finalFilters.category,
          brand: null, // CLEAR old brand
          color: parsedFilters.color ?? session.appliedFilters?.color ?? null,
          size: parsedFilters.size ?? session.appliedFilters?.size ?? null,
          price: parsedFilters.price ?? session.appliedFilters?.price ?? null,
          material: parsedFilters.material ?? session.appliedFilters?.material ?? null
        };
      } else {
        // Standard merge: new values override, old values persist if not overridden
        finalFilters = {
          category: finalFilters.category,
          brand: parsedFilters.brand ?? session.appliedFilters?.brand ?? null,
          color: parsedFilters.color ?? session.appliedFilters?.color ?? null,
          size: parsedFilters.size ?? session.appliedFilters?.size ?? null,
          price: parsedFilters.price ?? session.appliedFilters?.price ?? null,
          material: parsedFilters.material ?? session.appliedFilters?.material ?? null
        };
      }
      
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
