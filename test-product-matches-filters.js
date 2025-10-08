const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

// Test the actual productMatchesFilters method
function testProductMatchesFilters() {
  console.log('Testing TrieveService.productMatchesFilters method...');
  
  // Test products
  const testProducts = [
    { name: "KËMISHË", color: "BLACK", id: "1" },
    { name: "KËMISHË", color: "131", id: "2" },
    { name: "KËMISHË", color: "NAVY", id: "3" },
    { name: "KËMISHË", color: "DARK BLUE", id: "4" },
    { name: "KËMISHË", color: "LIGHT/PASTEL BLUE", id: "5" }
  ];
  
  const filters = { category: 'kemishe', color: 'kaltër' };
  
  console.log(`\nTesting ${testProducts.length} products with filters:`, filters);
  
  testProducts.forEach((product, index) => {
    console.log(`\n--- Product ${index + 1}: ${product.name} (${product.color}) ---`);
    
    try {
      const result = TrieveService.productMatchesFilters(product, filters);
      console.log(`Result: ${result ? 'PASS' : 'REJECT'}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  });
}

testProductMatchesFilters();
