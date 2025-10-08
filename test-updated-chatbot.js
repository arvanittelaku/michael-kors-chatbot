// Test the updated ChatbotService
const axios = require('axios');

async function testUpdatedChatbotService() {
  console.log('🧪 Testing updated ChatbotService...\n');
  
  try {
    const response = await axios.post('http://localhost:5000/chat', {
      userId: 'test_user',
      message: 'maicë'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Products count:', response.data.products.length);
    
    if (response.data.products.length > 0) {
      console.log('\n📦 First product:');
      const firstProduct = response.data.products[0];
      console.log('ID:', firstProduct.id);
      console.log('Name:', firstProduct.name);
      console.log('Price:', firstProduct.price);
      console.log('Source:', firstProduct._source);
      
      // Check if it's real data
      const isRealData = firstProduct.id && !['1', '2', '3', '4', '5'].includes(firstProduct.id);
      console.log('Is real data:', isRealData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUpdatedChatbotService();
