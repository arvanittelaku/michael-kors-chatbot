import axios from 'axios';
import { Product, ParsedFilters } from './types';
import { normalizeColor } from './ColorNormalizer';

export class TrieveService {
  private static readonly TRIEVE_API_URL = 'https://api.trieve.ai/api/chunk/search';
  private static readonly DATASET_ID = process.env.TRIEVE_DATASET_ID;
  private static readonly ORGANIZATION_ID = process.env.TRIEVE_ORGANIZATION_ID;
  // Use working API key temporarily until .env is updated
  private static readonly API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';

  /**
   * Get products from Trieve API with comprehensive filtering
   */
  static async getProducts(filters: ParsedFilters): Promise<Product[]> {
    console.log('[TrieveService] 🔍 getProducts called with filters:', JSON.stringify(filters));

    try {
      // Build search query based on filters
      const searchQuery = this.buildSearchQuery(filters);
      console.log('[TrieveService] 🔍 Search query:', searchQuery);

      // Call Trieve API
      const response = await axios.post(this.TRIEVE_API_URL, {
        query: searchQuery,
        dataset_id: this.DATASET_ID,
        limit: 50,
        search_type: "hybrid"
      }, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'TR-Organization': this.ORGANIZATION_ID,
          'TR-Dataset': this.DATASET_ID
        }
      });

      console.log('[TrieveService] 📡 Trieve API response received');
      console.log('[TrieveService] 📊 Response structure:', Object.keys(response.data || {}));

      // Map Trieve chunks to Product objects
      const products = response.data.chunks.map((chunk: any) => 
        this.mapChunkToProduct(chunk)
      ).filter((product: Product) => product !== null);

      console.log(`[TrieveService] 🎯 Mapped ${products.length} products from Trieve`);

      // Apply additional filtering (since Trieve search might not be perfect)
      const filteredProducts = products.filter((product: Product) => 
        this.productMatchesFilters(product, filters)
      );

      console.log(`[TrieveService] 🎯 After filtering: ${filteredProducts.length} products match criteria`);
      
      if (filteredProducts.length > 0) {
        console.log("🟢 Real data from Trieve used");
        console.log(`[TrieveService] 📊 Sample product IDs:`, filteredProducts.slice(0, 3).map((p: Product) => p.id));
        console.log(`[TrieveService] 📊 Sample product names:`, filteredProducts.slice(0, 3).map((p: Product) => p.name));
        console.log(`[TrieveService] 📊 Sample product prices:`, filteredProducts.slice(0, 3).map((p: Product) => p.price));
      } else {
        console.log("⚪ No Trieve data found — returning empty array");
      }

      return filteredProducts;
    } catch (error: any) {
      console.error('[TrieveService] ❌ Error fetching products:', error.message);
      if (error.response) {
        console.error('[TrieveService] ❌ Response status:', error.response.status);
        console.error('[TrieveService] ❌ Response data:', error.response.data);
      }
      console.log("⚪ Trieve API error — returning empty array");
      return [];
    }
  }

  /**
   * Extract categories from metadata
   */
  private static extractCategories(metadata: any): string[] {
    const categories: string[] = [];
    
    // Add category
    if (metadata.category) {
      categories.push(metadata.category.toLowerCase());
    }
    
    // Add subcategory
    if (metadata.subcategory) {
      categories.push(metadata.subcategory.toLowerCase());
    }
    
    // Add tags
    if (metadata.tags && Array.isArray(metadata.tags)) {
      metadata.tags.forEach((tag: string) => {
        categories.push(tag.toLowerCase());
      });
    }
    
    // Add product name as category (for Albanian names like MAICË, KËMISHË)
    if (metadata.name) {
      categories.push(metadata.name.toLowerCase());
    }
    
    // Remove duplicates
    return [...new Set(categories)];
  }

  /**
   * Build search query from filters
   */
  private static buildSearchQuery(filters: ParsedFilters): string {
    const queryParts: string[] = [];

    if (filters.category) {
      queryParts.push(filters.category);
    }

    if (filters.color) {
      queryParts.push(filters.color);
    }

    if (filters.material) {
      queryParts.push(filters.material);
    }

    if (filters.size && filters.size.length > 0) {
      queryParts.push(...filters.size);
    }

    if (filters.price) {
      if (filters.price.min) {
        queryParts.push(`over ${filters.price.min}`);
      }
      if (filters.price.max) {
        queryParts.push(`under ${filters.price.max}`);
      }
    }

    return queryParts.join(' ') || 'products';
  }

  /**
   * Map Trieve chunk to Product object
   */
  private static mapChunkToProduct(chunk: any): Product | null {
    try {
      const metadata = chunk.chunk?.metadata || chunk.metadata;
      
      if (!metadata) {
        console.log('[TrieveService] ⚠️ No metadata found in chunk');
        return null;
      }

      const product: Product = {
        id: metadata.product_no || metadata.id || metadata.tracking_id || chunk.chunk_id,
        name: metadata.name || metadata.title || 'Unknown Product',
        price: parseFloat(metadata.price) || 0,
        color: metadata.color || 'Unknown',
        size: metadata.size || 'Unknown',
        material: metadata.material || 'Unknown',
        _source: 'trieve',
        tracking_id: metadata.tracking_id || metadata.product_no,
        categories: this.extractCategories(metadata),
        images: metadata.images ? 
          (Array.isArray(metadata.images) ? metadata.images : [metadata.images]) : 
          []
      };

      return product;
    } catch (error) {
      console.error('[TrieveService] ❌ Error mapping chunk to product:', error);
      return null;
    }
  }

  /**
   * Comprehensive filtering logic for all filter types
   */
  private static productMatchesFilters(product: Product, filters: ParsedFilters): boolean {
    console.log(`[FILTER] 🚀 Checking product "${product.name}" against filters:`, JSON.stringify(filters));

    if (!product) {
      console.log(`[FILTER] ❌ Product is null/undefined`);
      return false;
    }

    // 1️⃣ Category filtering
    if (filters.category) {
      const categoryMatch = this.matchesCategory(product, filters.category);
      console.log(`[FILTER] 📂 Category "${filters.category}" match: ${categoryMatch}`);
      if (!categoryMatch) return false;
    }

    // 2️⃣ Color filtering
    if (filters.color) {
      const colorMatch = this.matchesColor(product, filters.color);
      console.log(`[FILTER] 🎨 Color "${filters.color}" match: ${colorMatch}`);
      if (!colorMatch) return false;
    }

    // 3️⃣ Price filtering
    if (filters.price) {
      const priceMatch = this.matchesPrice(product, filters.price);
      console.log(`[FILTER] 💰 Price filter match: ${priceMatch}`);
      if (!priceMatch) return false;
    }

    // 4️⃣ Size filtering
    if (filters.size && filters.size.length > 0) {
      const sizeMatch = this.matchesSize(product, filters.size);
      console.log(`[FILTER] 📏 Size "${filters.size.join(', ')}" match: ${sizeMatch}`);
      if (!sizeMatch) return false;
    }

    // 5️⃣ Material filtering
    if (filters.material) {
      const materialMatch = this.matchesMaterial(product, filters.material);
      console.log(`[FILTER] 🧵 Material "${filters.material}" match: ${materialMatch}`);
      if (!materialMatch) return false;
    }

    console.log(`[FILTER] ✅ Product "${product.name}" passes all filters`);
    return true;
  }

  /**
   * Category matching with case-insensitive search and Albanian character normalization
   */
  private static matchesCategory(product: Product, category: string): boolean {
    // Normalize Albanian characters
    const normalizeAlbanian = (text: string) => {
      return text.toLowerCase()
        .replace(/ë/g, 'e')
        .replace(/ç/g, 'c')
        .replace(/ç/g, 'c')
        .replace(/ë/g, 'e')
        .replace(/ë/g, 'e');
    };

    const productName = normalizeAlbanian(product.name || '');
    const productCategories = (product.categories || []).map(c => normalizeAlbanian(c));
    const categoryNormalized = normalizeAlbanian(category);

    // Check if product name contains category keyword
    const nameMatch = productName.includes(categoryNormalized);

    // Check if product categories include the category
    const categoryMatch = productCategories.includes(categoryNormalized);

    console.log(`[FILTER] 📂 Category matching: "${product.name}" -> "${productName}" vs "${category}" -> "${categoryNormalized}" = ${nameMatch || categoryMatch}`);

    return nameMatch || categoryMatch;
  }

  /**
   * Color matching with strict normalization - only matches actual colors, not manufacturer codes
   */
  private static matchesColor(product: Product, color: string): boolean {
    if (!product.color) return false;

    // Check if product color is a manufacturer code (like B75, BV9, BZ2)
    const isManufacturerCode = (colorStr: string) => {
      return /^[A-Z]\d+$/.test(colorStr) || /^[A-Z]{2}\d+$/.test(colorStr);
    };

    // If product color is a manufacturer code, it should not match any color filter
    if (isManufacturerCode(product.color)) {
      console.log(`[FILTER] 🎨 Product color "${product.color}" is manufacturer code - excluding from color match`);
      return false;
    }

    const productColor = normalizeColor(product.color);
    const filterColor = normalizeColor(color);

    // If either color cannot be normalized, use strict string matching
    if (!productColor || !filterColor) {
      console.log(`[FILTER] 🎨 Using strict string matching: "${product.color}" vs "${color}"`);
      return product.color.toLowerCase().trim() === color.toLowerCase().trim();
    }

    const match = productColor === filterColor;
    console.log(`[FILTER] 🎨 Color matching: "${product.color}" -> "${productColor}" vs "${color}" -> "${filterColor}" = ${match}`);
    return match;
  }

  /**
   * Price matching with min/max logic
   */
  private static matchesPrice(product: Product, priceFilter: { min?: number; max?: number }): boolean {
    const productPrice = product.price || 0;

    if (priceFilter.min !== undefined && productPrice < priceFilter.min) {
      console.log(`[FILTER] 💰 Price ${productPrice} < min ${priceFilter.min}`);
      return false;
    }

    if (priceFilter.max !== undefined && productPrice > priceFilter.max) {
      console.log(`[FILTER] 💰 Price ${productPrice} > max ${priceFilter.max}`);
      return false;
    }

    return true;
  }

  /**
   * Size matching with array inclusion
   */
  private static matchesSize(product: Product, sizes: string[]): boolean {
    if (!product.size) return false;

    const productSize = product.size.toUpperCase();
    const filterSizes = sizes.map(s => s.toUpperCase());

    return filterSizes.includes(productSize);
  }

  /**
   * Material matching with case-insensitive search
   */
  private static matchesMaterial(product: Product, material: string): boolean {
    if (!product.material) return false;

    const productMaterial = product.material.toLowerCase();
    const filterMaterial = material.toLowerCase();

    return productMaterial.includes(filterMaterial);
  }
}

// 🧪 Test function demonstrating multiple filter combinations
export async function testTrieveService() {
  console.log('🧪 TrieveService Test Results:');
  console.log('================================');

  const testCases: { filters: ParsedFilters; description: string }[] = [
    { 
      filters: { category: 'kemishe' }, 
      description: 'Only category: kemishe' 
    },
    { 
      filters: { category: 'kemishe', price: { max: 20 } }, 
      description: 'Kemishe under $20' 
    },
    { 
      filters: { category: 'kemishe', color: 'black' }, 
      description: 'Black kemishe' 
    },
    { 
      filters: { category: 'pantofla', price: { max: 20 }, color: 'black' }, 
      description: 'Black pantofla under $20' 
    },
    { 
      filters: { material: 'cotton', size: ['M', 'L'] }, 
      description: 'Cotton size M or L' 
    },
    { 
      filters: { category: 'maice', color: 'green', price: { min: 10, max: 15 } }, 
      description: 'Green maice between $10-$15' 
    },
    { 
      filters: { price: { min: 30 } }, 
      description: 'Products over $30' 
    },
    { 
      filters: { color: 'blue' }, 
      description: 'All blue products' 
    }
  ];

  for (const { filters, description } of testCases) {
    console.log(`\n🔍 Test: ${description}`);
    console.log(`   Filters: ${JSON.stringify(filters)}`);
    
    const results = await TrieveService.getProducts(filters);
    
    if (results.length > 0) {
      console.log(`   ✅ Found ${results.length} products:`);
      results.forEach(p => 
        console.log(`      - ${p.name}, $${p.price}, ${p.color}, ${p.size}, ${p.material}`)
      );
    } else {
      console.log(`   ❌ No products found`);
    }
  }
}