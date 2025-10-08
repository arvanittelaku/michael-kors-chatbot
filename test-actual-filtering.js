const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');
const { normalizeColor } = require('./server/dist/services/chatbot/ColorNormalizer');

// Test the actual filtering logic with real data
function testActualFiltering() {
  console.log('Testing actual filtering logic...');
  
  // Simulate the actual products we're getting
  const testProducts = [
    { name: "KËMISHË", color: "BLACK", id: "1" },
    { name: "KËMISHË", color: "131", id: "2" },
    { name: "KËMISHË", color: "490", id: "3" },
    { name: "KËMISHË", color: "NAVY", id: "4" },
    { name: "KËMISHË", color: "DARK BLUE", id: "5" },
    { name: "KËMISHË", color: "LIGHT/PASTEL BLUE", id: "6" },
    { name: "KËMISHË", color: "813", id: "7" }
  ];
  
  const filters = { category: 'kemishe', color: 'kaltër' };
  
  console.log(`\nFiltering ${testProducts.length} products with filters:`, filters);
  
  const filtered = testProducts.filter(p => {
    console.log(`\n--- Testing product: ${p.name} (${p.color}) ---`);
    
    // Test category filter
    if (filters.category) {
      const productName = (p.name || '').toLowerCase();
      const catSynonyms = ['kemishe', 'këmishë']; // From CATEGORY_SYNONYMS
      const matches = catSynonyms.some(syn => {
        const synLower = syn.toLowerCase();
        const exactMatch = productName.includes(synLower);
        console.log(`Category check: "${synLower}" in "${productName}" = ${exactMatch}`);
        return exactMatch;
      });
      console.log(`Category filter result: ${matches}`);
      if (!matches) {
        console.log('❌ Category filter failed');
        return false;
      }
      console.log('✅ Category filter passed');
    }
    
    // Test color filter
    if (filters.color && p.color) {
      const filterColor = normalizeColor(filters.color);
      const productColor = normalizeColor(p.color);
      
      console.log(`Color normalization: "${filters.color}" → "${filterColor}", "${p.color}" → "${productColor}"`);
      
      if (!filterColor) {
        console.log('⚠️ Cannot normalize filter color, skipping color filter');
        return true;
      }
      
      if (!productColor) {
        console.log('❌ Cannot normalize product color, rejecting');
        return false;
      }
      
      if (filterColor !== productColor) {
        console.log(`❌ Color mismatch: "${filterColor}" !== "${productColor}"`);
        return false;
      }
      
      console.log(`✅ Color match: "${filterColor}" === "${productColor}"`);
    }
    
    console.log('✅ Product passed all filters');
    return true;
  });
  
  console.log(`\n=== RESULTS ===`);
  console.log(`Original products: ${testProducts.length}`);
  console.log(`Filtered products: ${filtered.length}`);
  console.log('Filtered products:', filtered.map(p => `${p.name} (${p.color})`));
}

testActualFiltering();
