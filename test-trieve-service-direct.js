// Test TrieveService directly
require('dotenv').config({ path: '../.env' });

const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function testTrieveServiceDirect() {
  console.log('🧪 Testing TrieveService directly...');
  console.log('Environment check:');
  console.log('- TRIEVE_API_KEY:', process.env.TRIEVE_API_KEY ? 'Configured' : 'NOT CONFIGURED');
  console.log('- TRIEVE_DATASET_ID:', process.env.TRIEVE_DATASET_ID ? 'Configured' : 'NOT CONFIGURED');
  console.log('- TRIEVE_ORGANIZATION_ID:', process.env.TRIEVE_ORGANIZATION_ID ? 'Configured' : 'NOT CONFIGURED');
  
  try {
    console.log('\n🔍 Testing category "kemishe"...');
    const result = await TrieveService.getProducts({ category: 'kemishe' });
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

testTrieveServiceDirect();