import axios from 'axios';

interface ParsedIntent {
  category?: string;
  brand?: string;
  color?: string;
  size?: string[];
  price?: { min?: number; max?: number };
  material?: string;
  style?: string;
  occasion?: string;
  sentiment?: string;
  isExploratoryQuery?: boolean;
  isRecoveryIntent?: boolean;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateResponseParams {
  userMessage: string;
  extractedFilters: any;
  products: any[];
  conversationHistory: string[];
  availableBrands?: string[];
  availableColors?: string[];
  priceRange?: { min: number; max: number } | null;
}

export class OpenAIService {
  private apiKey: string;
  private model: string = 'gpt-4o-mini'; // Cost-efficient model

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[OpenAIService] ⚠️ No OpenAI API key found. LLM features disabled.');
    }
  }

  /**
   * Parse user message using GPT-4o-mini to extract intent and filters
   */
  async parseUserIntent(message: string, conversationHistory: string[] = []): Promise<ParsedIntent | null> {
    if (!this.apiKey) {
      console.log('[OpenAIService] ⚠️ OpenAI disabled, skipping intent parsing');
      return null;
    }

    try {
      const systemPrompt = `You are an intelligent assistant for an Albanian e-commerce chatbot (Albi Mall).

Your task: Parse the user's message and extract structured filters for product search.

Available categories: kemishe (shirts), pantallona (pants), peshqir (towels), qante (bags), fustan (dresses), pantofla (slippers), kapele (hats), maice (t-shirts), kepuce (shoes - NOT AVAILABLE), atlete (sneakers - NOT AVAILABLE)

CRITICAL: Recognize Albanian genitive/plural forms for unavailable categories:
- "kepuce", "kepuceve", "kepucet", "shoes" → kepuce (NOT AVAILABLE)
- "atlete", "atleteve", "atletet", "sneakers" → atlete (NOT AVAILABLE)

IMPORTANT: If user asks for kepuce or atlete (in ANY form), ALWAYS extract the category as "kepuce" or "atlete" so the system can inform them these products are not available. DO NOT return null for these categories!

Available colors: BLACK, WHITE, RED, BLUE, GREEN, YELLOW, BROWN, GRAY, PINK, PURPLE, ORANGE, BEIGE, CREAM, NAVY, SILVER (IMPORTANT: silver/argjend is a common color in our products!)

Albanian color mappings (IMPORTANT):
- "ngjyre silver", "silver", "argjend", "argjendtë" → SILVER
- "cream", "krem" → CREAM
- "beige", "bezh" → BEIGE
- "e zeze", "zeze", "zi" → BLACK
- "e bardhe", "bardhe" → WHITE
- "kuq", "kuqe", "e kuqe" → RED
- "blu", "kaltër" → BLUE

Available sizes: XS, S, M, L, XL, XXL, XXXL, or numeric sizes (27, 28, 44, etc.)

Extract the following from the user's message:
- category: Which product category in LOWERCASE (map Albanian to lowercase: kemishe→kemishe, pantallona→pantallona, peshqir→peshqir, etc.)
- brand: Brand name if mentioned (e.g., BOSS, TOM TAILOR, OZDILEK, SHEFAME)
- color: Color if mentioned in UPPERCASE (map Albanian to English: e kuqe→RED, e zeze→BLACK, blu→BLUE, silver→SILVER, argjend→SILVER, cream→CREAM, beige→BEIGE)
- size: Size if mentioned (array of sizes)
- price: Price filter if mentioned (e.g., "nen 20$" → {max: 20}, "mbi 50" → {min: 50}, "me i vogel se 30 euro" → {max: 30})
- material: Material if mentioned (cotton, leather, etc.)
- style: Style preference (elegant, casual, sporty, etc.)
- occasion: Occasion if mentioned (wedding, valentine's day, work, etc.)
- isExploratoryQuery: true if user asks "what do you have", "show me all", "qfar keni", etc.
- isRecoveryIntent: true if user asks for "something else", "ndonje tjeter" after failed search

Respond ONLY with valid JSON. No explanation. Format:
{
  "category": "kemishe" or null,
  "brand": "BOSS" or null,
  "color": "RED" or "SILVER" or "CREAM" or "BLACK" or null,
  "size": ["XS", "S"] or null,
  "price": {"min": 20, "max": 50} or null,
  "material": "cotton" or null,
  "style": "elegant" or null,
  "occasion": "valentine's day" or null,
  "isExploratoryQuery": false,
  "isRecoveryIntent": false
}

CRITICAL: Always extract colors when mentioned! "ngjyre silver" or "silver" → "SILVER", "cream" → "CREAM", "beige" → "BEIGE"`;

      const messages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this Albanian message: "${message}"` }
      ];

      console.log('[OpenAIService] 🤖 Calling GPT-4o-mini for intent parsing...');
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: messages,
          temperature: 0.1, // Low temperature for consistent parsing
          max_tokens: 300,
          response_format: { type: 'json_object' } // Force JSON response
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const parsed = JSON.parse(content);
      console.log('[OpenAIService] ✅ Parsed intent:', parsed);
      
      return parsed;
    } catch (error: any) {
      console.error('[OpenAIService] ❌ Error parsing intent:', error.message);
      return null; // Fallback to regex parsing
    }
  }

  /**
   * Generate natural Albanian response using GPT-4o-mini
   */
  async generateResponse(params: GenerateResponseParams): Promise<string | null> {
    if (!this.apiKey) {
      console.log('[OpenAIService] ⚠️ OpenAI disabled, skipping response generation');
      return null;
    }

    try {
      const {
        userMessage,
        extractedFilters,
        products,
        conversationHistory,
        availableBrands,
        availableColors,
        priceRange
      } = params;

      const systemPrompt = `You are a helpful, friendly Albanian shopping assistant for Albi Mall.

Your tone: Professional, warm, concise. Always respond in Albanian.

Context:
- User asked: "${userMessage}"
- Extracted filters: ${JSON.stringify(extractedFilters)}
- Found ${products.length} products

${availableBrands && availableBrands.length > 0 ? `Available brands: ${availableBrands.join(', ')}` : ''}
${availableColors && availableColors.length > 0 ? `Available colors: ${availableColors.join(', ')}` : ''}
${priceRange ? `Price range: $${priceRange.min}-$${priceRange.max}` : ''}

Guidelines:
1. If products found: Suggest helpful filters (brand, color, price) in Albanian
2. If no products: Politely suggest alternatives or ask to rephrase
3. If user asks for brands: List available brands explicitly
4. If ambiguous query: Ask clarifying question
5. Be natural and conversational, not robotic

Keep response under 2 sentences. Be helpful and encouraging.`;

      const messages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a natural Albanian response for this search result.` }
      ];

      console.log('[OpenAIService] 🤖 Calling GPT-4o-mini for response generation...');

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: messages,
          temperature: 0.7, // More creative for natural responses
          max_tokens: 150
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      console.log('[OpenAIService] ✅ Generated response:', content);
      return content.trim();
    } catch (error: any) {
      console.error('[OpenAIService] ❌ Error generating response:', error.message);
      return null; // Fallback to template responses
    }
  }

  /**
   * Check if OpenAI is enabled
   */
  isEnabled(): boolean {
    return !!this.apiKey;
  }
}

export default new OpenAIService();

