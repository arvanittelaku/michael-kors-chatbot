import { TrieveService } from '../services/chatbot/TrieveService';

interface CategoryDiscovery {
  productName: string;
  normalizedCategory: string;
  frequency: number;
}

export class CategoryDiscoverer {
  private static readonly COMMON_WORDS = [
    'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now'
  ];

  /**
   * Discover all categories from Trieve dataset
   */
  static async discoverAllCategories(): Promise<CategoryDiscovery[]> {
    console.log('🔍 Starting category discovery from Trieve dataset...');
    
    try {
      // Get a large sample of products from Trieve
      const products = await TrieveService.getProducts({});
      console.log(`📊 Retrieved ${products.length} products for analysis`);
      
      // Extract unique product names
      const productNames = products.map(p => p.name).filter(name => name && name.trim());
      console.log(`📝 Found ${productNames.length} unique product names`);
      
      // Analyze product names to identify categories
      const categoryMap = new Map<string, CategoryDiscovery>();
      
      for (const productName of productNames) {
        const normalizedName = this.normalizeProductName(productName);
        const category = this.extractCategory(normalizedName);
        
        if (category && !this.isCommonWord(category)) {
          const existing = categoryMap.get(category);
          if (existing) {
            existing.frequency++;
          } else {
            categoryMap.set(category, {
              productName: productName,
              normalizedCategory: category,
              frequency: 1
            });
          }
        }
      }
      
      // Convert to array and sort by frequency
      const categories = Array.from(categoryMap.values())
        .sort((a, b) => b.frequency - a.frequency);
      
      console.log(`🎯 Discovered ${categories.length} potential categories`);
      return categories;
      
    } catch (error) {
      console.error('❌ Error discovering categories:', error);
      return [];
    }
  }

  /**
   * Generate category mappings for MessageParser
   */
  static generateCategoryMappings(categories: CategoryDiscovery[]): Record<string, string[]> {
    const mappings: Record<string, string[]> = {};
    
    for (const category of categories) {
      const normalizedCategory = category.normalizedCategory;
      const variants = this.generateVariants(normalizedCategory);
      
      if (variants.length > 0) {
        mappings[normalizedCategory] = variants;
      }
    }
    
    return mappings;
  }

  /**
   * Normalize product name for analysis
   */
  private static normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract category from product name
   */
  private static extractCategory(normalizedName: string): string | null {
    // Split by spaces and get the first meaningful word
    const words = normalizedName.split(' ').filter(word => word.length > 2);
    
    if (words.length === 0) return null;
    
    // Get the first word as potential category
    const firstWord = words[0];
    
    // Skip if it's a common word or too short
    if (this.isCommonWord(firstWord) || firstWord.length < 3) {
      return null;
    }
    
    return firstWord;
  }

  /**
   * Check if word is common/stop word
   */
  private static isCommonWord(word: string): boolean {
    return this.COMMON_WORDS.includes(word.toLowerCase());
  }

  /**
   * Generate variants for a category (Albanian, English, etc.)
   */
  private static generateVariants(category: string): string[] {
    const variants = [category];
    
    // Add Albanian variants based on common patterns
    const albanianVariants: Record<string, string[]> = {
      'kemishe': ['kemishe', 'këmishë', 'kemish', 'shirt'],
      'pantallona': ['pantallona', 'pantallonat', 'pants', 'trousers'],
      'fustan': ['fustan', 'fustani', 'dress'],
      'atlete': ['atlete', 'sneakers', 'shoes'],
      'kepuce': ['kepuce', 'kepucet', 'shoes'],
      'pullover': ['pullover', 'sweater'],
      'pantofla': ['pantofla', 'pantofla dushi', 'slippers'],
      'bluze': ['bluze', 'bluzë', 'blouse'],
      'xhakete': ['xhakete', 'xhaketë', 'jacket'],
      'kostum': ['kostum', 'suit'],
      'fund': ['fund', 'skirt'],
      'triko': ['triko', 'knitwear'],
      'peshqir': ['peshqir', 'peshqiri', 'face towel', 'towel'],
      'mantel': ['mantel', 'manteli', 'bath towel', 'bathroom towel'],
      'xhinse': ['xhinse', 'xhinse', 'jeans', 'denim'],
      'maice': ['maice', 'maicë', 't-shirt', 'tshirt'],
      'trenerka': ['trenerka', 'tracksuit', 'sportswear'],
      'brendshme': ['brendshme', 'të brendshme', 'underwear', 'lingerie']
    };
    
    // Check if we have predefined variants
    const lowerCategory = category.toLowerCase();
    if (albanianVariants[lowerCategory]) {
      variants.push(...albanianVariants[lowerCategory]);
    }
    
    // Add common variations
    variants.push(category.toUpperCase());
    variants.push(category.charAt(0).toUpperCase() + category.slice(1));
    
    // Remove duplicates
    return [...new Set(variants)];
  }

  /**
   * Print discovered categories in a formatted way
   */
  static printCategories(categories: CategoryDiscovery[]): void {
    console.log('\n🎯 DISCOVERED CATEGORIES:');
    console.log('========================');
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.normalizedCategory.toUpperCase()}`);
      console.log(`   Frequency: ${category.frequency}`);
      console.log(`   Example: ${category.productName}`);
      console.log('');
    });
  }

  /**
   * Generate TypeScript code for MessageParser
   */
  static generateTypeScriptCode(categories: CategoryDiscovery[]): string {
    const mappings = this.generateCategoryMappings(categories);
    
    let code = '// Auto-generated category mappings from Trieve dataset\n';
    code += 'private static readonly CATEGORY_KEYWORDS = {\n';
    
    for (const [category, variants] of Object.entries(mappings)) {
      code += `  ${category}: [${variants.map(v => `'${v}'`).join(', ')}],\n`;
    }
    
    code += '};\n';
    
    return code;
  }
}

// Main execution function
export async function discoverAndGenerateCategories(): Promise<void> {
  console.log('🚀 Starting category discovery and generation...');
  
  try {
    // Discover categories
    const categories = await CategoryDiscoverer.discoverAllCategories();
    
    // Print results
    CategoryDiscoverer.printCategories(categories);
    
    // Generate TypeScript code
    const tsCode = CategoryDiscoverer.generateTypeScriptCode(categories);
    console.log('\n📝 Generated TypeScript code:');
    console.log('==============================');
    console.log(tsCode);
    
    // Save to file
    const fs = require('fs');
    const path = require('path');
    
    const outputPath = path.join(__dirname, 'generated-categories.ts');
    fs.writeFileSync(outputPath, tsCode);
    console.log(`\n💾 Saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  discoverAndGenerateCategories();
}
