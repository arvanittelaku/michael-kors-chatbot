const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

// Test the actual getProducts method
async function testGetProducts() {
  console.log('Testing TrieveService.getProducts method...');
  
  const filters = { category: 'kemishe', color: 'kaltër' };
  
  console.log(`\nCalling getProducts with filters:`, filters);
  
  try {
    const products = await TrieveService.getProducts(filters);
    console.log(`\nGot ${products.length} products:`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.color})`);
    });
    
    // Check if we got the expected results
    const blueProducts = products.filter(p => 
      p.color === 'NAVY' || p.color === 'DARK BLUE' || p.color === 'LIGHT/PASTEL BLUE'
    );
    const nonBlueProducts = products.filter(p => 
      p.color === 'BLACK' || p.color === '131' || p.color === '490' || p.color === '813'
    );
    
    console.log(`\n=== ANALYSIS ===`);
    console.log(`Blue products: ${blueProducts.length}`);
    console.log(`Non-blue products: ${nonBlueProducts.length}`);
    
    if (nonBlueProducts.length > 0) {
      console.log(`❌ ISSUE: Found ${nonBlueProducts.length} non-blue products that should have been filtered out:`);
      nonBlueProducts.forEach(p => console.log(`  - ${p.name} (${p.color})`));
    } else {
      console.log(`✅ SUCCESS: All non-blue products were correctly filtered out`);
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

testGetProducts();
