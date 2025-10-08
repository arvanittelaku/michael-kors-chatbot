export interface ParsedFilters {
  category?: string;
  color?: string;
  price?: { min?: number; max?: number };
  size?: string[];
  material?: string;
}

export class MessageParser {
  private static readonly CATEGORY_KEYWORDS = {
    kemishe: ['kemishe', 'këmishë', 'kemish', 'shirt', 'shirts'],
    pantallona: ['pantallona', 'pantallonat', 'pants', 'trousers', 'pantolla'],
    fustan: ['fustan', 'fustani', 'dress', 'dresses'],
    atlete: ['atlete', 'sneakers', 'shoes', 'athletic shoes'],
    kepuce: ['kepuce', 'kepucet', 'shoes', 'footwear'],
    pullover: ['pullover', 'sweater', 'sweaters'],
    pantofla: ['pantofla', 'pantofla dushi', 'slippers'],
    bluze: ['bluze', 'bluzë', 'blouse', 'blouses'],
    xhakete: ['xhakete', 'xhaketë', 'jacket', 'jackets'],
    kostum: ['kostum', 'suit', 'suits'],
    fund: ['fund', 'skirt', 'skirts'],
    triko: ['triko', 'knitwear'],
    peshqir: ['peshqir', 'peshqiri', 'face towel', 'towel', 'towels'],
    mantel: ['mantel', 'manteli', 'bath towel', 'bathroom towel'],
    xhinse: ['xhinse', 'xhinse', 'jeans', 'denim'],
    // Additional categories found in Trieve dataset
    kapel: ['kapel', 'kapelë', 'hat', 'hats'],
    bkostum: ['b.kostum', 'bkostum', 'baby suit', 'baby suits'],
    te_brendshme: ['te brendshme', 'të brendshme', 'underwear', 'lingerie'],
    qante: ['qante', 'qantë', 'qant', 'qanta', 'bag', 'bags', 'handbag'],
    sako: ['sako', 'coat', 'coats', 'overcoat'],
    maica_te_mbrendshme: ['maica te mbrendshme', 'maicë të mbrendshme', 'underwear shirt', 'undershirt', 'maice', 'maicë']
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
    'te kuqe': 'red',
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
    'yellow': 'yellow',
    'te verdhë': 'yellow',
    'i verdhë': 'yellow',
    
    // Brown variations
    'kafe': 'brown',
    'e kafe': 'brown',
    'brown': 'brown',
    'te kafe': 'brown',
    'i kafe': 'brown',
    
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

    // 1️⃣ Extract Category
    filters.category = this.extractCategory(lowerMessage);

    // 2️⃣ Extract Color
    filters.color = this.extractColor(lowerMessage);

    // 3️⃣ Extract Price
    filters.price = this.extractPrice(lowerMessage);

    // 4️⃣ Extract Size
    filters.size = this.extractSize(lowerMessage);

    // 5️⃣ Extract Material
    filters.material = this.extractMaterial(lowerMessage);

    return filters;
  }

  private extractCategory(message: string): string | undefined {
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
    // Pattern for "nen X", "poshte X", "under X" → max: X
    const underPattern = /(?:nen|poshte|under)\s*(\d+)(?:\$|€)?/i;
    const underMatch = message.match(underPattern);
    if (underMatch) {
      return { max: parseInt(underMatch[1]) };
    }

    // Pattern for "mbi X", "siper X", "over X" → min: X
    const overPattern = /(?:mbi|siper|over)\s*(\d+)(?:\$|€)?/i;
    const overMatch = message.match(overPattern);
    if (overMatch) {
      return { min: parseInt(overMatch[1]) };
    }

    // Pattern for "rreth X", "around X" → min: X-5, max: X+5
    const aroundPattern = /(?:rreth|around)\s*(\d+)(?:\$|€)?/i;
    const aroundMatch = message.match(aroundPattern);
    if (aroundMatch) {
      const value = parseInt(aroundMatch[1]);
      return { min: Math.max(0, value - 5), max: value + 5 };
    }

    return undefined;
  }

  private extractSize(message: string): string[] | undefined {
    const sizes: string[] = [];

    // Pattern for "madhesia X", "size X"
    const sizePattern = /(?:madhesia|size)\s*([A-Z0-9]+)/gi;
    let match;
    while ((match = sizePattern.exec(message)) !== null) {
      sizes.push(match[1].toUpperCase());
    }

    // Pattern for "numri X", "number X"
    const numberPattern = /(?:numri|number)\s*(\d+)/gi;
    while ((match = numberPattern.exec(message)) !== null) {
      sizes.push(match[1]);
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
