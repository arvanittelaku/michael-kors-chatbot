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
      console.log('[TrieveService] 📡 Calling Trieve API with:', {
        query: searchQuery,
        dataset_id: this.DATASET_ID,
        limit: 50,
        offset: filters._offset || 0,
        search_type: "hybrid"
      });
      
      const response = await axios.post(this.TRIEVE_API_URL, {
        query: searchQuery,
        dataset_id: this.DATASET_ID,
        limit: 50,
        offset: filters._offset || 0, // Add offset support for pagination
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
      console.log('[TrieveService] 📊 Number of chunks:', response.data.chunks?.length || 0);

      // Map Trieve chunks to Product objects
      const products = response.data.chunks.map((chunk: any) => 
        this.mapChunkToProduct(chunk)
      ).filter((product: Product) => product !== null);

      console.log(`[TrieveService] 🎯 Mapped ${products.length} products from Trieve`);
      console.log('[TrieveService] 🎯 First few products:', products.slice(0, 3).map((p: Product) => ({ id: p.id, name: p.name, category: p.categories })));

      // Apply additional filtering (since Trieve search might not be perfect)
      // Remove _offset from filters before applying product matching
      const { _offset, ...filtersForMatching } = filters;
      const filteredProducts = products.filter((product: Product) => 
        this.productMatchesFilters(product, filtersForMatching)
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
   * Normalize color display - convert manufacturer codes to user-friendly text
   */
  private static normalizeColorDisplay(color: string): string {
    if (!color) return 'Unknown';
    
    // Check if it's a manufacturer code
    const isManufacturerCode = (colorStr: string) => {
      return /^[A-Z]\d+$/.test(colorStr) || 
             /^[A-Z]{2}\d+$/.test(colorStr) || 
             /^\d{3,4}$/.test(colorStr) ||
             colorStr === 'OPEN MISCELLANEOUS';
    };
    
    if (isManufacturerCode(color)) {
      return 'Mixed Colors'; // More user-friendly than showing codes
    }
    
    return color;
  }

  /**
   * Normalize size display for consistency
   */
  private static normalizeSizeDisplay(size: string): string {
    if (!size) return 'Unknown';
    
    const normalized = size.toLowerCase().trim();
    
    // Handle common size variations
    const sizeMap: { [key: string]: string } = {
      'standard': 'One Size',
      'onesize': 'One Size',
      'one size': 'One Size',
      'onesi': 'One Size', // Add Albanian variation
      'universal': 'One Size',
      'free size': 'One Size',
      'xs': 'XS',
      's': 'S', 
      'm': 'M',
      'l': 'L',
      'xl': 'XL',
      'xxl': 'XXL',
      'xxxl': 'XXXL'
    };
    
    return sizeMap[normalized] || size; // Return original if no mapping found
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

    // NOTE: Price is NOT included in semantic search query
    // Price filtering is applied post-search in productMatchesFilters()
    // This prevents confusing Trieve's semantic engine with numeric ranges

    if (filters.brand) {
      queryParts.push(filters.brand);
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

      // Keep HTTP URLs as-is since the image server doesn't support HTTPS
      const rawImages = metadata.images ? 
        (Array.isArray(metadata.images) ? metadata.images : [metadata.images]) : 
        [];

      const product: Product = {
        id: metadata.product_no || metadata.id || metadata.tracking_id || chunk.chunk_id,
        name: metadata.name || metadata.title || 'Unknown Product',
        price: parseFloat(metadata.price) || 0,
        color: this.normalizeColorDisplay(metadata.color || 'Unknown'),
        size: this.normalizeSizeDisplay(metadata.size || 'Unknown'),
        material: metadata.material || 'Unknown',
        brand: metadata.brandname || metadata.brand || undefined,
        _source: 'trieve',
        tracking_id: metadata.tracking_id || metadata.product_no,
        categories: this.extractCategories(metadata),
        images: rawImages // Keep original HTTP URLs
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

    // 6️⃣ Brand filtering
    if (filters.brand) {
      const brandMatch = this.matchesBrand(product, filters.brand);
      console.log(`[FILTER] 🏷️ Brand "${filters.brand}" match: ${brandMatch}`);
      if (!brandMatch) return false;
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
    const categoryMatch = productCategories.some(cat => cat.includes(categoryNormalized));

    // Special handling for specific categories
    if (categoryNormalized === 'maica_te_mbrendshme' || categoryNormalized === 'maice') {
      // Look for "MAICË" in product name (common in dataset)
      const maiceMatch = productName.includes('maic') || productName.includes('maice');
      console.log(`[FILTER] 📂 Special maice matching: "${product.name}" -> "${productName}" contains "maic": ${maiceMatch}`);
      return maiceMatch || nameMatch || categoryMatch;
    }

    if (categoryNormalized === 'pantallona' || categoryNormalized === 'pantolla') {
      // Look for pants-related terms
      const pantsMatch = productName.includes('pant') || productName.includes('trousers') || productName.includes('jeans');
      console.log(`[FILTER] 📂 Special pants matching: "${product.name}" -> "${productName}" contains pants terms: ${pantsMatch}`);
      return pantsMatch || nameMatch || categoryMatch;
    }

    if (categoryNormalized === 'qante' || categoryNormalized === 'qant' || categoryNormalized === 'qanta') {
      // Look for bag-related terms
      const bagMatch = productName.includes('qant') || productName.includes('bag') || productName.includes('handbag');
      console.log(`[FILTER] 📂 Special bag matching: "${product.name}" -> "${productName}" contains bag terms: ${bagMatch}`);
      return bagMatch || nameMatch || categoryMatch;
    }

    console.log(`[FILTER] 📂 Category matching: "${product.name}" -> "${productName}" vs "${category}" -> "${categoryNormalized}" = ${nameMatch || categoryMatch}`);

    return nameMatch || categoryMatch;
  }

  /**
   * Color matching with strict normalization - only matches actual colors, not manufacturer codes
   */
  private static matchesColor(product: Product, color: string): boolean {
    if (!product.color) return false;

    // 🔥 NORMALIZE: Ensure both product and filter colors are uppercase and normalized
    const normalizedProductColor = (product.color || '').toUpperCase().replace(/[\s\/-]+/g, '_').trim();
    const normalizedFilterColor = color.toUpperCase().replace(/[\s\/-]+/g, '_').trim();

    // Check if product color is a manufacturer code (like B75, BV9, BZ2, 131, 265, 999)
    const isManufacturerCode = (colorStr: string) => {
      // Match patterns like: B75, BV9, BZ2, 131, 265, 999, etc.
      return /^[A-Z]\d+$/.test(colorStr) || 
             /^[A-Z]{2}\d+$/.test(colorStr) || 
             /^\d{3,4}$/.test(colorStr) ||
             colorStr === 'OPEN_MISCELLANEOUS';
    };

    // If product color is a manufacturer code, it should not match any color filter
    if (isManufacturerCode(normalizedProductColor)) {
      console.log(`[FILTER] 🎨 Product color "${normalizedProductColor}" is manufacturer code - excluding from color match`);
      return false;
    }

    // 🔥 DIRECT COMPARISON: After normalization, do strict equals
    const matches = normalizedProductColor === normalizedFilterColor;
    console.log(`[FILTER] 🎨 Color match: "${product.color}" (normalized: "${normalizedProductColor}") vs "${color}" (normalized: "${normalizedFilterColor}") = ${matches}`);
    return matches;
  }

  /**
   * Price matching with min/max logic
   */
  private static matchesPrice(product: Product, priceFilter: { min?: number; max?: number }): boolean {
    const productPrice = product.price || 0;

    // "mbi X" (over X) means price must be strictly greater than X
    if (priceFilter.min !== undefined && productPrice <= priceFilter.min) {
      console.log(`[FILTER] 💰 Price ${productPrice} <= min ${priceFilter.min} (excluded)`);
      return false;
    }

    // "nën X" (under X) means price must be strictly less than X
    if (priceFilter.max !== undefined && productPrice >= priceFilter.max) {
      console.log(`[FILTER] 💰 Price ${productPrice} >= max ${priceFilter.max} (excluded)`);
      return false;
    }

    return true;
  }

  /**
   * Size matching with array inclusion and normalization
   */
  private static matchesSize(product: Product, sizes: string[]): boolean {
    if (!product.size) return false;

    // 🔥 NORMALIZE: Ensure consistent uppercase + trimming + handle numeric vs alpha sizes
    const normalizeSize = (size: string | number): string => {
      const sizeStr = String(size).toUpperCase().trim();
      // Numeric sizes: just return as-is
      if (/^\d+$/.test(sizeStr)) return sizeStr;
      // Alpha sizes: remove spaces (X S → XS)
      return sizeStr.replace(/\s+/g, '');
    };

    const normalizedProductSize = normalizeSize(product.size);
    const normalizedFilterSizes = sizes.map(normalizeSize);

    const matches = normalizedFilterSizes.includes(normalizedProductSize);
    console.log(`[FILTER] 📏 Size match: "${product.size}" (normalized: "${normalizedProductSize}") in [${normalizedFilterSizes.join(', ')}] = ${matches}`);
    return matches;
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

  /**
   * Brand matching with case-insensitive exact match
   */
  private static matchesBrand(product: Product, brand: string): boolean {
    if (!product.brand) return false;

    // 🔥 NORMALIZE: Uppercase + trim for both sides
    const normalizedProductBrand = (product.brand || '').toUpperCase().trim();
    const normalizedFilterBrand = brand.toUpperCase().trim();

    const matches = normalizedProductBrand === normalizedFilterBrand;
    console.log(`[FILTER] 🏷️ Brand match: "${product.brand}" (normalized: "${normalizedProductBrand}") vs "${brand}" (normalized: "${normalizedFilterBrand}") = ${matches}`);
    return matches;
  }

  /**
   * Get available brands from a list of products
   */
  static getAvailableBrands(products: Product[]): string[] {
    const brands = new Set<string>();
    products.forEach(product => {
      if (product.brand) {
        brands.add(product.brand.toUpperCase());
      }
    });
    return Array.from(brands).sort();
  }

  /**
   * Get available colors from a list of products
   */
  static getAvailableColors(products: Product[]): string[] {
    const colors = new Set<string>();
    products.forEach(product => {
      if (product.color && product.color.toLowerCase() !== 'unknown') {
        colors.add(product.color);
      }
    });
    return Array.from(colors).sort();
  }

  /**
   * Get price range from a list of products
   */
  static getPriceRange(products: Product[]): { min: number; max: number } | null {
    if (products.length === 0) return null;
    
    const prices = products.map(p => p.price).filter(p => p > 0);
    if (prices.length === 0) return null;
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
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