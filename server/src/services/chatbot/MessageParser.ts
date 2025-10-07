export interface ParsedFilters {
  category?: string;
  color?: string;
  price?: { min?: number; max?: number };
  size?: string[];
  material?: string;
}

export class MessageParser {
  private static readonly CATEGORY_KEYWORDS = {
    kemishe: ['kemishe', 'këmishë', 'kemish', 'shirt'],
    pantallona: ['pantallona', 'pantallonat', 'pants', 'trousers'],
    fustan: ['fustan', 'fustani', 'dress'],
    atlete: ['atlete', 'sneakers', 'shoes'],
    kepuce: ['kepuce', 'kepucet', 'shoes'],
    pullover: ['pullover', 'sweater'],
    pantofla: ['pantofla', 'pantofla dushi', 'slippers'],
    bluze: ['bluze', 'bluzë', 'blouse'],
    xhakete: ['xhakete', 'xhaketë', 'jacket'],
    kostum: ['kostum', 'suit'],
    fund: ['fund', 'skirt'],
    triko: ['triko', 'knitwear'],
    peshqir: ['peshqir', 'peshqiri', 'face towel', 'towel'],
    mantel: ['mantel', 'manteli', 'bath towel', 'bathroom towel'],
    xhinse: ['xhinse', 'xhinse', 'jeans', 'denim'],
    // Additional categories found in Trieve dataset
    kapel: ['kapel', 'kapelë', 'hat', 'hats'],
    bkostum: ['b.kostum', 'bkostum', 'baby suit', 'baby suits'],
    te_brendshme: ['te brendshme', 'të brendshme', 'underwear', 'lingerie'],
    qante: ['qante', 'qantë', 'bag', 'bags', 'handbag'],
    sako: ['sako', 'coat', 'coats', 'overcoat'],
    maica_te_mbrendshme: ['maica te mbrendshme', 'maicë të mbrendshme', 'underwear shirt', 'undershirt']
  };

  private static readonly COLOR_MAPPINGS = {
    'te zeze': 'black',
    'te zez': 'black',
    'e zezë': 'black',
    'zeze': 'black',
    'e zeza': 'black',
    'i zi': 'black',
    'i zezë': 'black',
    'black': 'black',
    'te bardhe': 'white',
    'e bardhë': 'white',
    'bardha': 'white',
    'barde': 'white',
    'i bardhë': 'white',
    'white': 'white',
    'kuqe': 'red',
    'kuq': 'red',
    'i kuq': 'red',
    'e kuqe': 'red',
    'red': 'red',
    'blu': 'blue',
    'blue': 'blue',
    'i blu': 'blue',
    'e blu': 'blue',
    'kaltër': 'blue',
    'e kaltër': 'blue',
    'i kaltër': 'blue',
    'kalt�r': 'blue',
    'e kalt�r': 'blue',
    'i kalt�r': 'blue',
    'jeshile': 'green',
    'e gjelbër': 'green',
    'gjelber': 'green',
    'i gjelbër': 'green',
    'green': 'green',
    'gri': 'gray',
    'e gri': 'gray',
    'i gri': 'gray',
    'gray': 'gray',
    'kafe': 'brown',
    'e kafe': 'brown',
    'i kafe': 'brown',
    'brown': 'brown',
    'verdhe': 'yellow',
    'te verdhe': 'yellow',
    'e verdhë': 'yellow',
    'e verdha': 'yellow',
    'i verdhë': 'yellow',
    'yellow': 'yellow',
    'roze': 'pink',
    'rozë': 'pink',
    'e rozë': 'pink',
    'i rozë': 'pink',
    'pink': 'pink'
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
