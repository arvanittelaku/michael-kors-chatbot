import axios from 'axios';

interface GroqConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ProductDocument {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  color: string;
  colors: string[];
  size: string;
  sizes: string[];
  material: string;
  description: string;
  features: string[];
  tags: string[];
  availability: string;
  rating: number;
  reviews_count: number;
  collection: string;
  season: string;
  care_instructions: string;
  dimensions: string;
  weight: string;
  warranty: string;
}

class GroqService {
  private config: GroqConfig;
  private baseURL: string;

  constructor(config: GroqConfig) {
    this.config = config;
    this.baseURL = config.baseUrl || 'https://api.groq.com/openai/v1';
  }

  /**
   * Generate intelligent response using Groq API with RAG
   */
  async generateResponse(
    userQuery: string, 
    relevantProducts: ProductDocument[]
  ): Promise<string> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const context = this.createProductContext(relevantProducts);
      
      const messages: GroqMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Context: ${context}\n\nUser Query: ${userQuery}`
        }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.config.model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
          top_p: 1,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const groqResponse: GroqResponse = response.data;
      return groqResponse.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response with Groq:', error);
      return this.getFallbackResponse(userQuery, relevantProducts);
    }
  }

  /**
   * Create system prompt for Michael Kors chatbot
   */
  private createSystemPrompt(): string {
    return `You are a sophisticated and knowledgeable Michael Kors Style Assistant. Your role is to help customers find the perfect handbags, accessories, and fashion items with personalized recommendations.

CRITICAL RULES - MUST FOLLOW:
- ONLY recommend products from the provided context
- NEVER mention products not in the context
- Be warm, friendly, and professional like a personal stylist
- Focus on how products match the customer's specific needs and style
- Always mention price and availability when relevant
- If no suitable products are found, suggest similar alternatives from the context
- Respect price constraints - if user asks for "under $X", only recommend products under that price

RESPONSE GUIDELINES:
- Be conversational and helpful (3-4 sentences)
- Start with enthusiasm about finding the perfect match
- Highlight key product features that specifically match their needs
- Mention specific colors, sizes, and materials when relevant
- Include price information and any discounts
- Suggest alternatives if the exact request isn't available
- Be encouraging and positive about the products
- Use phrases like "I found the perfect match for you!" or "This would be ideal for your needs"

PRODUCT INFORMATION TO INCLUDE:
- Product name and collection
- Color and available color options
- Size and available sizes
- Material and key features
- Price and any discounts
- Availability status
- Brief description of why it matches their specific needs
- Style advice or usage suggestions

Remember: You are representing Michael Kors, so maintain the brand's sophisticated and stylish image while being approachable and helpful.`;
  }

  /**
   * Create product context for the AI
   */
  private createProductContext(products: ProductDocument[]): string {
    if (products.length === 0) {
      return 'No products found matching the user query.';
    }

    return products.map(product => `
Product: ${product.name}
Brand: ${product.brand}
Collection: ${product.collection}
Category: ${product.category} - ${product.subcategory}
Price: $${product.price}
Color: ${product.color} (Available: ${product.colors.join(', ')})
Size: ${product.size} (Available: ${product.sizes.join(', ')})
Material: ${product.material}
Description: ${product.description}
Key Features: ${product.features.join(', ')}
Rating: ${product.rating}/5 (${product.reviews_count} reviews)
Availability: ${product.availability}
Dimensions: ${product.dimensions}
Weight: ${product.weight}
Care: ${product.care_instructions}
Tags: ${product.tags.join(', ')}
    `).join('\n---\n');
  }

  /**
   * Fallback response when Groq API fails
   */
  private getFallbackResponse(userQuery: string, products: ProductDocument[]): string {
    if (products.length === 0) {
      return "I couldn't find any products matching your request. Could you try describing what you're looking for in different words?";
    }

    const query = userQuery.toLowerCase();
    
    // Check for specific product types
    if (query.includes('red') && query.includes('bag')) {
      const redBags = products.filter(p => 
        p.colors.some(color => color.toLowerCase().includes('red') || color.toLowerCase().includes('burgundy'))
      );
      if (redBags.length > 0) {
        const bag = redBags[0];
        return `I found a beautiful ${bag.color} ${bag.name} for $${bag.price}. This ${bag.material.toLowerCase()} ${bag.subcategory} is perfect for everyday use and features ${bag.features.slice(0, 3).join(', ')}.`;
      }
    }

    if (query.includes('everyday') || query.includes('daily')) {
      const everydayBags = products.filter(p => 
        p.features.some(feature => feature.includes('everyday') || feature.includes('daily'))
      );
      if (everydayBags.length > 0) {
        const bag = everydayBags[0];
        return `Perfect for everyday use! I recommend the ${bag.name} in ${bag.color} for $${bag.price}. This ${bag.material.toLowerCase()} ${bag.subcategory} is designed for daily wear and includes ${bag.features.slice(0, 3).join(', ')}.`;
      }
    }

    if (query.includes('work') || query.includes('professional')) {
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

  /**
   * Generate product recommendations based on user preferences
   */
  async generateRecommendations(
    userPreferences: string,
    products: ProductDocument[]
  ): Promise<string> {
    const query = `Based on these preferences: "${userPreferences}", recommend the best products from the available options.`;
    return this.generateResponse(query, products);
  }

  /**
   * Generate comparison between products
   */
  async generateComparison(
    products: ProductDocument[]
  ): Promise<string> {
    const query = `Compare these products and help the user choose the best option based on their needs.`;
    return this.generateResponse(query, products);
  }
}

export default GroqService;
