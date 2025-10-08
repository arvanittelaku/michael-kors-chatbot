const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Health check response:', healthResponse.data);
    
    console.log('\nTesting chatbot endpoint...');
    const chatResponse = await axios.post('http://localhost:5000/chat', {
      userId: 'test_simple',
      message: 'kemishe'
    });
    
    console.log('Chat response message:', chatResponse.data.message);
    console.log('Number of products:', chatResponse.data.products?.length || 0);
    
    if (chatResponse.data.products && chatResponse.data.products.length > 0) {
      console.log('First product color:', chatResponse.data.products[0].color);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testServer();
