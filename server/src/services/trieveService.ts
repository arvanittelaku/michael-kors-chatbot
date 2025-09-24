import axios from 'axios';

interface TrieveConfig {
  apiKey: string;
  datasetId: string;
  organizationId: string;
  baseUrl: string;
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

interface TrieveSearchResult {
  score_chunks: Array<{
    chunk: {
      chunk_html: string;
      content: string;
      id: string;
      link: string;
      metadata: ProductDocument;
      time_stamp: string;
      tracking_id: string;
    };
    score: number;
  }>;
}

class TrieveService {
  private config: TrieveConfig;
  private baseURL: string;

  constructor(config: TrieveConfig) {
    this.config = config;
    this.baseURL = `${config.baseUrl}/api/chunk`;
  }

  /**
   * Upload products to Trieve dataset
   */
  async uploadProducts(products: ProductDocument[]): Promise<void> {
    try {
      console.log(`Uploading ${products.length} products to Trieve...`);
      
      const chunks = products.map(product => ({
        chunk_html: this.generateProductHTML(product),
        content: this.generateProductContent(product),
        link: `https://michaelkors.com/products/${product.id}`,
        metadata: product,
        time_stamp: new Date().toISOString(),
        tracking_id: product.id
      }));

      const response = await axios.post(
        `${this.baseURL}`,
        {
          chunks,
          dataset_id: this.config.datasetId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'TR-Dataset': this.config.datasetId
          }
        }
      );

      console.log(`Successfully uploaded ${products.length} products to Trieve`);
      return response.data;
    } catch (error) {
      console.error('Error uploading products to Trieve:', error);
      throw error;
    }
  }

  /**
   * Search for products using natural language queries
   */
  async searchProducts(query: string, limit: number = 10): Promise<ProductDocument[]> {
    try {
      const response = await axios.post(
        `${this.baseURL}/search`,
        {
          query,
          dataset_id: this.config.datasetId,
          limit,
          search_type: "hybrid"
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'TR-Dataset': this.config.datasetId
          }
        }
      );

      const results: TrieveSearchResult = response.data;
      
      return results.score_chunks.map(chunk => chunk.chunk.metadata);
    } catch (error) {
      console.error('Error searching products in Trieve:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for product (for better search indexing)
   */
  private generateProductHTML(product: ProductDocument): string {
    return `
      <div class="product-card">
        <h2>${product.name}</h2>
        <p><strong>Brand:</strong> ${product.brand}</p>
        <p><strong>Category:</strong> ${product.category} - ${product.subcategory}</p>
        <p><strong>Price:</strong> $${product.price}</p>
        <p><strong>Color:</strong> ${product.color}</p>
        <p><strong>Available Colors:</strong> ${product.colors.join(', ')}</p>
        <p><strong>Size:</strong> ${product.size}</p>
        <p><strong>Available Sizes:</strong> ${product.sizes.join(', ')}</p>
        <p><strong>Material:</strong> ${product.material}</p>
        <p><strong>Description:</strong> ${product.description}</p>
        <p><strong>Features:</strong> ${product.features.join(', ')}</p>
        <p><strong>Collection:</strong> ${product.collection}</p>
        <p><strong>Season:</strong> ${product.season}</p>
        <p><strong>Rating:</strong> ${product.rating}/5 (${product.reviews_count} reviews)</p>
        <p><strong>Availability:</strong> ${product.availability}</p>
        <p><strong>Dimensions:</strong> ${product.dimensions}</p>
        <p><strong>Weight:</strong> ${product.weight}</p>
        <p><strong>Care Instructions:</strong> ${product.care_instructions}</p>
        <p><strong>Warranty:</strong> ${product.warranty}</p>
        <p><strong>Tags:</strong> ${product.tags.join(', ')}</p>
      </div>
    `;
  }

  /**
   * Generate searchable text content for product
   */
  private generateProductContent(product: ProductDocument): string {
    return `
      ${product.name} ${product.brand} ${product.category} ${product.subcategory} 
      ${product.color} ${product.colors.join(' ')} ${product.size} ${product.sizes.join(' ')} 
      ${product.material} ${product.description} ${product.features.join(' ')} 
      ${product.collection} ${product.season} ${product.tags.join(' ')}
      Price: $${product.price} Rating: ${product.rating} Reviews: ${product.reviews_count}
      ${product.availability} ${product.dimensions} ${product.weight}
      ${product.care_instructions} ${product.warranty}
    `.replace(/\s+/g, ' ').trim();
  }

  /**
   * Delete all products from dataset (for testing)
   */
  async clearDataset(): Promise<void> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/dataset/${this.config.datasetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'TR-Dataset': this.config.datasetId
          }
        }
      );
      console.log('Dataset cleared successfully');
      return response.data;
    } catch (error) {
      console.error('Error clearing dataset:', error);
      throw error;
    }
  }
}

export default TrieveService;
