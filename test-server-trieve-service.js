// Test if the server is actually calling TrieveService
require('dotenv').config({ path: '../.env' });

const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function testServerTrieveService() {
  console.log('🧪 Testing if server is calling TrieveService...\n');
  
  try {
    // Test the exact same call that the server should be making
    console.log('🔍 Testing with empty filters (like server does for "maicë")...');
    const result = await TrieveService.getProducts({});
    console.log(`Result: ${result.length} products`);
    
    if (result.length > 0) {
      console.log('First product:', {
        name: result[0].name,
        price: result[0].price,
        source: result[0]._source,
        id: result[0].id
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testServerTrieveService();





