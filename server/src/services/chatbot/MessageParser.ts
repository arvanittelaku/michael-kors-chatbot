export interface ParsedFilters {
  category?: string;
  color?: string;
  price?: { min?: number; max?: number };
  size?: string[];
  material?: string;
  brand?: string;
}

// =====================================================
// 🔧 Normalization Helpers (AI engineer approved)
// =====================================================

const SIZE_ALIASES: Record<string, string> = {
  'xs': 'XS', 'x s': 'XS', 's': 'S', 'm': 'M', 'l': 'L', 'xl': 'XL', 'xxl': 'XXL',
  '40': '40', '41': '41', '42': '42', '43': '43', '44': '44', '45': '45', '46': '46',
  '48': '48', '50': '50', '52': '52', '54': '54', '56': '56'
};

const COLOR_ALIASES: Record<string, string> = {
  'black': 'BLACK', 'zi': 'BLACK', 'e zeze': 'BLACK', 'zeze': 'BLACK', 'te zeze': 'BLACK',
  'dark blue': 'DARK_BLUE', 'darkblue': 'DARK_BLUE', 'blu': 'DARK_BLUE', 'blue': 'DARK_BLUE',
  'light/pastel blue': 'LIGHT_PASTEL_BLUE', 'light blue': 'LIGHT_PASTEL_BLUE',
  'mixed colors': 'MIXED_COLORS', 'white': 'WHITE', 'bardhe': 'WHITE',
  'red': 'RED', 'kuq': 'RED', 'kuqe': 'RED',
  'green': 'GREEN', 'gjelbër': 'GREEN', 'gjelber': 'GREEN',
  'beige': 'BEIGE', 'brown': 'BROWN', 'kafe': 'BROWN',
  'pink': 'PINK', 'roze': 'PINK', 'rozë': 'PINK',
  'yellow': 'YELLOW', 'verdhë': 'YELLOW', 'verdhe': 'YELLOW',
  'cream': 'CREAM', 'silver': 'SILVER', 'grey': 'GREY', 'gray': 'GREY', 'gri': 'GREY'
};

export function normalizeSize(raw?: string | null): string | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase();
  if (/^\d+$/.test(r)) return r;
  if (SIZE_ALIASES[r]) return SIZE_ALIASES[r];
  const cleaned = r.replace(/[^a-z0-9]/gi, '');
  return SIZE_ALIASES[cleaned] ?? null;
}

export function normalizeColor(raw?: string | null): string | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase();
  if (COLOR_ALIASES[r]) return COLOR_ALIASES[r];
  const cleaned = r.replace(/[^\p{L}\s]/gu, '').trim();
  return COLOR_ALIASES[cleaned] ?? cleaned.toUpperCase();
}

export function buildNormalizedFilters(parsed: any) {
  return {
    // 🔥 CRITICAL FIX: Categories must be lowercase for Trieve semantic search
    category: parsed.category?.toLowerCase() ?? null,
    brand: parsed.brand?.toUpperCase() ?? null,
    color: normalizeColor(parsed.color),
    size: parsed.size ? (Array.isArray(parsed.size) ? parsed.size.map(normalizeSize).filter(Boolean) : [normalizeSize(parsed.size)].filter(Boolean)) : null,
    // 🔥 CRITICAL FIX: Price must be { min, max } object, not flat properties
    price: (parsed.price?.min !== undefined || parsed.price?.max !== undefined) ? {
      min: parsed.price?.min,
      max: parsed.price?.max
    } : null,
    material: parsed.material ?? null
  };
}

export class MessageParser {
  private static readonly CATEGORY_KEYWORDS = {
    kemishe: ['kemishe', 'këmishë', 'kemish', 'kemishave', 'kemishave', 'shirt', 'shirts'],
    pantallona: ['pantallona', 'pantallonat', 'pantollave', 'pantallonave', 'pants', 'trousers', 'pantolla'],
    fustan: ['fustan', 'fustani', 'fustaneve', 'fustanit', 'dress', 'dresses'],
    atlete: ['atlete', 'atleteve', 'sneakers', 'shoes', 'athletic shoes'],
    kepuce: ['kepuce', 'kepucet', 'kepuceve', 'shoes', 'footwear'],
    pullover: ['pullover', 'pullovereve', 'sweater', 'sweaters'],
    pantofla: ['pantofla', 'pantoflave', 'pantofleve', 'pantofla dushi', 'slippers'],
    bluze: ['bluze', 'bluzë', 'bluzave', 'blouse', 'blouses'],
    xhakete: ['xhakete', 'xhaketë', 'xhaketave', 'jacket', 'jackets'],
    kostum: ['kostum', 'kostumeve', 'suit', 'suits'],
    fund: ['fund', 'fundeve', 'skirt', 'skirts'],
    triko: ['triko', 'trikove', 'knitwear'],
    peshqir: ['peshqir', 'peshqiri', 'peshqireve', 'peshqirit', 'face towel', 'towel', 'towels'],
    mantel: ['mantel', 'manteli', 'manteleve', 'bath towel', 'bathroom towel'],
    xhinse: ['xhinse', 'xhinseve', 'jeans', 'denim'],
    // Additional categories found in Trieve dataset
    kapel: ['kapel', 'kapelë', 'hat', 'hats'],
    bkostum: ['b.kostum', 'bkostum', 'baby suit', 'baby suits'],
    te_brendshme: ['te brendshme', 'të brendshme', 'underwear', 'lingerie'],
    qante: ['qante', 'qantë', 'qant', 'qanta', 'qantave', 'bag', 'bags', 'handbag'],
    sako: ['sako', 'coat', 'coats', 'overcoat'],
    maica_te_mbrendshme: ['maica te mbrendshme', 'maicë të mbrendshme', 'maicave', 'underwear shirt', 'undershirt', 'maice', 'maicë']
  };

  private static readonly COLOR_MAPPINGS = {
    // Black variations
    'te zeze': 'black',
    'te zez': 'black',
    'te zeza': 'black',
    'te zi': 'black',
    'e zezë': 'black',
    'zeze': 'black',
    'e zeza': 'black',
    'i zi': 'black',
    'i zezë': 'black',
    'black': 'black',
    'zi': 'black',
    'zez': 'black',
    
    // White variations
    'te bardhe': 'white',
    'te bardha': 'white',
    'e bardhë': 'white',
    'bardha': 'white',
    'barde': 'white',
    'i bardhë': 'white',
    'white': 'white',
    'bardhe': 'white',
    
    // Red variations
    'kuqe': 'red',
    'kuq': 'red',
    'te kuq': 'red',
    'te kuqe': 'red',
    'të kuq': 'red',
    'të kuqe': 'red',
    'i kuq': 'red',
    'e kuqe': 'red',
    'red': 'red',
    
    // Blue variations
    'blu': 'blue',
    'te blu': 'blue',
    'blue': 'blue',
    'i blu': 'blue',
    'e blu': 'blue',
    'kaltër': 'blue',
    'e kaltër': 'blue',
    'te kaltër': 'blue',
    'te kalterta': 'blue',
    'kalterta': 'blue',
    'dark blue': 'blue',
    'light blue': 'blue',
    'pastel blue': 'blue',
    
    // Green variations
    'gjelbër': 'green',
    'e gjelbër': 'green',
    'green': 'green',
    'te gjelbër': 'green',
    'i gjelbër': 'green',
    
    // Yellow variations
    'verdhë': 'yellow',
    'e verdhë': 'yellow',
    'verdha': 'yellow',
    'te verdha': 'yellow',
    'yellow': 'yellow',
    'te verdhë': 'yellow',
    'i verdhë': 'yellow',
    
    // Brown variations
    'kafe': 'brown',
    'e kafe': 'brown',
    'brown': 'brown',
    'te kafe': 'brown',
    'i kafe': 'brown',
    'ngjyr kafe': 'brown',
    'ngjyre kafe': 'brown',
    
    // Gray variations
    'gri': 'gray',
    'e gri': 'gray',
    'gray': 'gray',
    'grey': 'gray',
    'te gri': 'gray',
    'i gri': 'gray',
    
    // Pink variations
    'rozë': 'pink',
    'e rozë': 'pink',
    'pink': 'pink',
    'te rozë': 'pink',
    'i rozë': 'pink',
    
    // Purple variations
    'vjollcë': 'purple',
    'e vjollcë': 'purple',
    'purple': 'purple',
    'te vjollcë': 'purple',
    'i vjollcë': 'purple',
    
    // Orange variations
    'portokalli': 'orange',
    'e portokalli': 'orange',
    'orange': 'orange',
    'te portokalli': 'orange',
    'i portokalli': 'orange',
    
    // 🔥 CRITICAL FIX: Add missing colors that exist in products (silver, cream, beige, navy)
    // Silver variations
    'silver': 'silver',
    'argjend': 'silver',
    'e argjendtë': 'silver',
    'argjendtë': 'silver',
    
    // Cream variations
    'cream': 'cream',
    'krem': 'cream',
    'e kremte': 'cream',
    
    // Beige variations
    'beige': 'beige',
    'bezh': 'beige',
    'e bezhë': 'beige',
    
    // Navy variations
    'navy': 'navy',
    'blu e errët': 'navy',
    'dark navy': 'navy',

    // Mixed colors variations
    'ngjyra te perziera': 'mixed colors',
    'ngjyra të përziera': 'mixed colors',
    'te perziera': 'mixed colors',
    'të përziera': 'mixed colors',
    'perziera': 'mixed colors',
    'përziera': 'mixed colors',
    'mixed colors': 'mixed colors',
    'mixed': 'mixed colors'
  };

  private static readonly MATERIAL_KEYWORDS = [
    'cotton', 'leather', 'denim', 'silk', 'wool', 'polyester',
    'pambuk', 'lëkurë', 'jeans', 'mëndafsh', 'lesh', 'poliester'
  ];

  parse(message: string): ParsedFilters {
    const lowerMessage = message.toLowerCase();
    const filters: ParsedFilters = {};

    console.log(`[MessageParser] 🔍 Parsing message: "${message}"`);

    // 1️⃣ Extract Category
    filters.category = this.extractCategory(lowerMessage);
    console.log(`[MessageParser] 📂 Extracted category: "${filters.category}"`);

    // 2️⃣ Extract Color
    filters.color = this.extractColor(lowerMessage);
    console.log(`[MessageParser] 🎨 Extracted color: "${filters.color}"`);

    // 3️⃣ Extract Price
    filters.price = this.extractPrice(lowerMessage);
    console.log(`[MessageParser] 💰 Extracted price:`, filters.price);

    // 4️⃣ Extract Size
    filters.size = this.extractSize(lowerMessage);
    console.log(`[MessageParser] 📏 Extracted size:`, filters.size);

    // 5️⃣ Extract Material
    filters.material = this.extractMaterial(lowerMessage);
    console.log(`[MessageParser] 🧵 Extracted material: "${filters.material}"`);

    // 6️⃣ Extract Brand (pass detected color to avoid conflicts)
    filters.brand = this.extractBrand(message, filters.color);
    console.log(`[MessageParser] 🏷️ Extracted brand: "${filters.brand}"`);

    console.log(`[MessageParser] 🎯 Final parsed filters:`, filters);
    return filters;
  }

  private extractCategory(message: string): string | undefined {
    // Check for unknown categories first
    const unknownCategories = ['sony', 'kompjuter', 'computer', 'laptop', 'phone', 'telefon', 'tv', 'television', 'car', 'makinë', 'house', 'shtëpi'];
    
    for (const unknown of unknownCategories) {
      if (message.includes(unknown)) {
        return 'UNKNOWN_CATEGORY';
      }
    }
    
    // Check for gibberish/nonsense queries - but be more intelligent about it
    // Only flag as gibberish if it contains multiple consecutive non-Albanian characters
    // BUT exclude common price patterns and legitimate Albanian text with numbers
    const gibberishPattern = /[^a-zëç\s]{2,}/i; // 2+ consecutive non-Albanian characters
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{2,}/; // 2+ consecutive special chars
    
    // Allow single numbers and single special chars (like $30, 25€)
    const hasMultipleNumbers = /\d{3,}/; // 3+ consecutive numbers
    const hasMultipleSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{2,}/;
    
    // Check for legitimate price patterns first - if found, don't flag as gibberish
    // CRITICAL FIX: Include Albanian diacritics (nën, sipër, etj.)
    const pricePattern = /(?:nen|nën|poshte|poshtë|ner|nër|under|mbi|siper|sipër|over)\s*[\d\$€]+/i;
    const hasPricePattern = pricePattern.test(message);
    
    // Check for size patterns - don't flag as gibberish
    // CRITICAL FIX: Include typo variations like "madhsine"
    const sizePattern = /(?:madhesia|madhësia|madhsine|madhësine|size|numri)\s*[a-z0-9]+/i;
    const hasSizePattern = sizePattern.test(message);
    
    // Check for standalone size codes (xs, s, m, l, xl, etc.)
    const standaloneSizePattern = /\b(xxs|xs|s|m|l|xl|xxl|xxxl)\b/i;
    const hasStandaloneSize = standaloneSizePattern.test(message);
    
    if (!hasPricePattern && !hasSizePattern && !hasStandaloneSize && (gibberishPattern.test(message) || hasMultipleNumbers.test(message) || hasMultipleSpecialChars.test(message))) {
      return 'UNKNOWN_CATEGORY';
    }
    
    // Add typo tolerance for common misspellings
    const typoMappings: { [key: string]: string } = {
      'oantolla': 'pantallona',
      'oantallona': 'pantallona',
      'pantolla': 'pantallona',
      'qant': 'qante',
      'qanta': 'qante',
      'kemishe': 'kemishe',
      'kemish': 'kemishe',
      'fustan': 'fustan',
      'fustani': 'fustan',
      'peshqir': 'peshqir',
      'peshqiri': 'peshqir',
      'maice': 'maica_te_mbrendshme',
      'maic': 'maica_te_mbrendshme'
    };
    
    // Check for typos first
    for (const [typo, correct] of Object.entries(typoMappings)) {
      if (message.includes(typo)) {
        return correct;
      }
    }
    
    for (const [category, keywords] of Object.entries(MessageParser.CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          return category;
        }
      }
    }
    return undefined;
  }

  private extractColor(message: string): string | undefined {
    for (const [albanianPhrase, englishColor] of Object.entries(MessageParser.COLOR_MAPPINGS)) {
      if (message.includes(albanianPhrase)) {
        return englishColor;
      }
    }
    return undefined;
  }

  private extractPrice(message: string): { min?: number; max?: number } | undefined {
    // Pattern for comparative terms: "më të lira", "me te lire", etc.
    // Handle multiple spelling variations (with/without diacritics, -a/-e endings)
    const cheaperPattern = /(?:më\s*të\s*lira|me\s*te\s*lira|me\s*te\s*lire|më\s*lira|me\s*lira|me\s*lire|cheaper|less\s*expensive)/i;
    if (cheaperPattern.test(message)) {
      console.log(`[MessageParser] 💰 Detected "cheaper" comparative - will sort by low price`);
      return { max: 0 }; // Special signal for "cheaper preference"
    }

    const expensivePattern = /(?:më\s*shtrenjte|me\s*shtrenjte|më\s*te\s*shtrenjte|me\s*te\s*shtrenjte|më\s*shtrenjtë|me\s*shtrenjtë|expensive|costly)/i;
    if (expensivePattern.test(message)) {
      console.log(`[MessageParser] 💰 Detected "expensive" comparative - will sort by high price`);
      return { min: 99999 }; // Special signal for "expensive preference"
    }

    // 🔥 CRITICAL FIX: Pattern for "me i vogel se X" (smaller than X) - natural language
    // Handles: "me i vogel se X", "me i vogël se X", "më i vogël se X euro/dollarë"
    const smallerPattern = /(?:me\s*i\s*vogel|më\s*i\s*vogël)\s*se\s*(\d+)\s*(?:euro|eur|dollarë|dollar|\$|€)?/i;
    const smallerMatch = message.match(smallerPattern);
    if (smallerMatch) {
      console.log(`[MessageParser] 💰 Detected "me i vogel se" (smaller than) pattern`);
      return { max: parseInt(smallerMatch[1]) };
    }

    // 🔥 CRITICAL FIX: Pattern for "me i larte se X" (higher than X) - natural language
    // Handles: "me i larte se X", "më i lartë se X euro/dollarë"
    const higherPattern = /(?:me\s*i\s*larte|më\s*i\s*lartë)\s*se\s*(\d+)\s*(?:euro|eur|dollarë|dollar|\$|€)?/i;
    const higherMatch = message.match(higherPattern);
    if (higherMatch) {
      console.log(`[MessageParser] 💰 Detected "me i larte se" (higher than) pattern`);
      return { min: parseInt(higherMatch[1]) };
    }

    // Pattern for "nen X", "nën X", "poshte X", "poshtë X", "ner X", "under X" → max: X
    // 🔥 CRITICAL FIX: Add "euro", "eur", "dollarë", "dollar" as valid currency words
    const underPattern = /(?:nen|nën|poshte|poshtë|ner|nër|under)\s*(?:[\$€]?\s*)?(\d+)\s*(?:euro|eur|dollarë|dollar|\$|€)?/i;
    const underMatch = message.match(underPattern);
    if (underMatch) {
      console.log(`[MessageParser] 💰 Detected "under" pattern: ${underMatch[0]}`);
      return { max: parseInt(underMatch[1]) };
    }

    // Pattern for "mbi X", "siper X", "sipër X", "over X" → min: X
    // 🔥 CRITICAL FIX: Add "euro", "eur", "dollarë", "dollar" as valid currency words
    const overPattern = /(?:mbi|siper|sipër|over)\s*(?:[\$€]?\s*)?(\d+)\s*(?:euro|eur|dollarë|dollar|\$|€)?/i;
    const overMatch = message.match(overPattern);
    if (overMatch) {
      console.log(`[MessageParser] 💰 Detected "over" pattern: ${overMatch[0]}`);
      return { min: parseInt(overMatch[1]) };
    }

    // Pattern for "rreth X", "around X" → min: X-5, max: X+5
    // 🔥 CRITICAL FIX: Add "euro", "eur", "dollarë", "dollar" as valid currency words
    const aroundPattern = /(?:rreth|around)\s*(\d+)\s*(?:euro|eur|dollarë|dollar|\$|€)?/i;
    const aroundMatch = message.match(aroundPattern);
    if (aroundMatch) {
      const value = parseInt(aroundMatch[1]);
      console.log(`[MessageParser] 💰 Detected "around" pattern: ~${value}`);
      return { min: Math.max(0, value - 5), max: value + 5 };
    }

    return undefined;
  }

  private extractSize(message: string): string[] | undefined {
    const sizes: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Pattern for "madhesia X", "madhësia X", "madhsine X" (typo tolerance), "size X"
    // Support common typos and variations
    const sizePattern = /(?:madhesia|madhësia|madhsine|madhësine|size)\s*([a-z0-9]+)/gi;
    let match;
    while ((match = sizePattern.exec(message)) !== null) {
      sizes.push(match[1].toUpperCase());
    }

    // Pattern for "numri X", "number X"
    const numberPattern = /(?:numri|number)\s*(\d+)/gi;
    while ((match = numberPattern.exec(message)) !== null) {
      sizes.push(match[1]);
    }

    // CRITICAL: Detect standalone size codes (XS, S, M, L, XL, XXL, XXXL, or numeric sizes)
    // This handles cases like just "xs" or "madhsine xs" where the word might be misspelled
    const standaloneSizes = ['xs', 'xxs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    const words = lowerMessage.split(/\s+/);
    
    for (const word of words) {
      // Check if word is a standalone size code
      if (standaloneSizes.includes(word)) {
        const upperSize = word.toUpperCase();
        if (!sizes.includes(upperSize)) {
          sizes.push(upperSize);
          console.log(`[MessageParser] 📏 Found standalone size: ${upperSize}`);
        }
      }
      
      // Check for numeric sizes (27, 28, 29, etc. for jeans/pants)
      if (/^\d{2,3}$/.test(word)) {
        if (!sizes.includes(word)) {
          sizes.push(word);
          console.log(`[MessageParser] 📏 Found numeric size: ${word}`);
        }
      }
      
      // Check for jeans sizes like "27/30", "28/32"
      if (/^\d{2}\/\d{2}$/.test(word)) {
        if (!sizes.includes(word)) {
          sizes.push(word);
          console.log(`[MessageParser] 📏 Found jeans size: ${word}`);
        }
      }
    }

    return sizes.length > 0 ? sizes : undefined;
  }

  private extractMaterial(message: string): string | undefined {
    for (const material of MessageParser.MATERIAL_KEYWORDS) {
      if (message.includes(material)) {
        // Convert Albanian materials to English
        const materialMap: Record<string, string> = {
          'pambuk': 'cotton',
          'lëkurë': 'leather',
          'mëndafsh': 'silk',
          'lesh': 'wool',
          'poliester': 'polyester'
        };
        return materialMap[material] || material;
      }
    }
    return undefined;
  }

  private extractBrand(message: string, detectedColor?: string): string | undefined {
    // Albanian stop words that should NEVER be brands
    // 🔥 CRITICAL: Include genitive case forms to prevent "pantollave kenoi" being treated as brand
    const albanianStopWords = [
      'dua', 'kerkoj', 'kërkoj', 'më', 'për', 'per',
      'lira', 'lire', 'shtrenjte', 'shtrenjtë', 'mirë', 'mire', 'bukur',
      'vogel', 'vogël', 'madhe', 'madhë', 'shume', 'shumë', 'tjera', 'tjeter',
      'proekte', 'produkte', 'keni', 'jane', 'reja', 'peshqir', 'pantolla',
      // 🔥 Genitive case category forms (CRITICAL FIX)
      'pantollave', 'pantallonave', 'kemishave', 'peshqireve', 'peshqirit',
      'qantave', 'pantoflave', 'pantofleve', 'fustaneve', 'fustanit',
      'bluzave', 'xhaketave', 'maicave', 'atleteve', 'kepuceve',
      'xhinseve', 'kostumeve', 'fundeve', 'trikove', 'manteleve',
      'kenoi', 'brand', 'brende' // Also block typos and exploratory words
    ];
    
    // Known color words in Albanian (for disambiguation)
    const knownColorWords = [
      'kuq', 'kuqe', 'zeze', 'zez', 'zi', 'bardhe', 'bardha', 'barde',
      'blu', 'kaltër', 'kalterta', 'gjelbër', 'verdhë', 'verdha',
      'kafe', 'gri', 'rozë', 'vjollcë', 'portokalli',
      'red', 'black', 'white', 'blue', 'green', 'yellow', 'brown', 'gray', 'pink', 'purple', 'orange'
    ];
    
    // Known brand names to support (helps with lowercase detection)
    const knownBrands = [
      'boss', 'hugo', 'ozdilek', 'shefame', 'tom tailor', 'hugo boss',
      'nike', 'adidas', 'puma', 'zara', 'h&m', 'mango'
    ];
    
    // Explicit brand indicators
    const strongBrandIndicators = ['marka', 'brand'];
    const weakBrandIndicators = ['te', 'të', 'nga', 'me']; // from, with
    
    const lowerMessage = message.toLowerCase();
    const words = message.split(/\s+/);
    
    // If a color was already detected, log it for debugging
    if (detectedColor) {
      console.log(`[MessageParser] 🎨 Color already detected: ${detectedColor}, will skip color words in brand extraction`);
    }
    
    // FIRST: Check for known brand names (case-insensitive)
    for (const knownBrand of knownBrands) {
      if (lowerMessage.includes(knownBrand)) {
        // Make sure it's not part of a larger word
        const brandPattern = new RegExp(`\\b${knownBrand}\\b`, 'i');
        if (brandPattern.test(lowerMessage)) {
          console.log(`[MessageParser] 🏷️ Found known brand: ${knownBrand}`);
          return knownBrand.toUpperCase();
        }
      }
    }
    
    // SECOND: Check for explicit brand mentions with strong indicators
    // "marka BOSS" or "brand Tom Tailor" - Accept ANY case after these keywords
    for (let i = 0; i < words.length; i++) {
      const prevWord = words[i - 1]?.toLowerCase();
      const currentWord = words[i];
      
      if (prevWord && strongBrandIndicators.includes(prevWord)) {
        const brandCandidate = currentWord.toLowerCase();
        
        // DISAMBIGUATION: Even with strong indicators, skip if it's a color word
        if (knownColorWords.includes(brandCandidate)) {
          console.log(`[MessageParser] 🎨 Skipping "${currentWord}" after "marka" - it's a color word`);
          continue;
        }
        
        if (!albanianStopWords.includes(brandCandidate) && currentWord.length > 2) {
          // Check if next word is also part of brand (e.g., "Tom Tailor" or "tom tailor")
          if (i + 1 < words.length && words[i + 1].length > 1) {
            const nextWord = words[i + 1];
            const twoWordBrand = `${currentWord} ${nextWord}`.toLowerCase();
            if (!albanianStopWords.includes(nextWord.toLowerCase())) {
              return twoWordBrand.toUpperCase();
            }
          }
          return currentWord.toUpperCase();
        }
      }
    }
    
    // THIRD: Check for brands after weak indicators (te, nga) - Now accepts lowercase!
    // "te tom tailor" or "nga boss"
    // BUT: Skip if next word is a known color (ChatGPT's disambiguation rule)
    for (let i = 0; i < words.length; i++) {
      const prevWord = words[i - 1]?.toLowerCase();
      const currentWord = words[i];
      
      if (prevWord && weakBrandIndicators.includes(prevWord)) {
        const brandCandidate = currentWord.toLowerCase();
        
        // DISAMBIGUATION: If current word is a known color, skip it
        if (knownColorWords.includes(brandCandidate)) {
          console.log(`[MessageParser] 🎨 Skipping "${currentWord}" - it's a color, not a brand`);
          continue; // Skip to next word
        }
        
        // Check if it's not a stop word and length > 2
        if (
          !albanianStopWords.includes(brandCandidate) &&
          currentWord.length > 2
        ) {
          // Check if next word is also part of brand
          if (i + 1 < words.length && words[i + 1].length > 1) {
            const nextWord = words[i + 1];
            const nextLower = nextWord.toLowerCase();
            if (!albanianStopWords.includes(nextLower)) {
              const twoWordBrand = `${currentWord} ${nextWord}`;
              return twoWordBrand.toUpperCase();
            }
          }
          return currentWord.toUpperCase();
        }
      }
    }
    
    // FOURTH: Check for ALL CAPS brands (BOSS, OZDILEK, NIKE, etc.)
    for (const word of words) {
      if (
        word.length >= 3 &&
        word === word.toUpperCase() &&
        /^[A-Z]+$/.test(word) &&
        !albanianStopWords.includes(word.toLowerCase())
      ) {
        return word;
      }
    }
    
    return undefined;
  }
}

// 🧪 Sample test function for quick local testing
export function testMessageParser() {
  const parser = new MessageParser();
  
  const testCases = [
    "dua kemishe te zeze nen 20€",
    "pantallona gri mbi 30",
    "bluze cotton madhesia L",
    "pantofla rreth 25$",
    "atlete numri 42",
    "pullover wool size XL"
  ];

  console.log('🧪 MessageParser Test Results:');
  console.log('================================');
  
  testCases.forEach((testCase, index) => {
    const result = parser.parse(testCase);
    console.log(`\n${index + 1}. Input: "${testCase}"`);
    console.log(`   Output:`, JSON.stringify(result, null, 2));
  });
}
