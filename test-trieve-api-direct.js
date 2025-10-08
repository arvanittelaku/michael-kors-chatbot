// Test Trieve API directly
const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function testTrieveAPI() {
  console.log('🧪 Testing Trieve API directly...');
  
  try {
    // Test 1: Simple category search
    console.log('\n1️⃣ Test: Category "kemishe"');
    const result1 = await TrieveService.getProducts({ category: 'kemishe' });
    console.log(`Result: ${result1.length} products`);
    if (result1.length > 0) {
      console.log('First product:', result1[0].name, result1[0].price, result1[0]._source);
    }
    
    // Test 2: Color only
    console.log('\n2️⃣ Test: Color "red"');
    const result2 = await TrieveService.getProducts({ color: 'red' });
    console.log(`Result: ${result2.length} products`);
    if (result2.length > 0) {
      console.log('First product:', result2[0].name, result2[0].color, result2[0]._source);
    }
    
    // Test 3: Price only
    console.log('\n3️⃣ Test: Price under $30');
    const result3 = await TrieveService.getProducts({ price: { max: 30 } });
    console.log(`Result: ${result3.length} products`);
    if (result3.length > 0) {
      console.log('First product:', result3[0].name, result3[0].price, result3[0]._source);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTrieveAPI();


