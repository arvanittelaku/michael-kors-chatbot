// Test TrieveService with maicë
require('dotenv').config({ path: '../.env' });

const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function testMaice() {
  console.log('🧪 Testing TrieveService with "maicë"...\n');
  
  try {
    const result = await TrieveService.getProducts({ category: 'maicë' });
    console.log(`Result: ${result.length} products`);
    
    if (result.length > 0) {
      console.log('First product:', {
        name: result[0].name,
        price: result[0].price,
        source: result[0]._source,
        id: result[0].id,
        categories: result[0].categories
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMaice();
