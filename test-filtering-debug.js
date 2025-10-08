// Test filtering logic directly
const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function testFiltering() {
  console.log('🧪 Testing TrieveService filtering...');
  
  // Test 1: Category only
  console.log('\n1️⃣ Test: Category "kemishe" only');
  const result1 = await TrieveService.getProducts({ category: 'kemishe' });
  console.log(`Result: ${result1.length} products`);
  result1.forEach(p => console.log(`  - ${p.name} (${p.color})`));
  
  // Test 2: Category + Color
  console.log('\n2️⃣ Test: Category "kemishe" + Color "black"');
  const result2 = await TrieveService.getProducts({ category: 'kemishe', color: 'black' });
  console.log(`Result: ${result2.length} products`);
  result2.forEach(p => console.log(`  - ${p.name} (${p.color})`));
  
  // Test 3: No filters (should return all)
  console.log('\n3️⃣ Test: No filters');
  const result3 = await TrieveService.getProducts({});
  console.log(`Result: ${result3.length} products`);
}

testFiltering().catch(console.error);

