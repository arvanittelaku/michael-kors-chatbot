const axios = require('axios');

async function testWithLogs() {
  try {
    console.log('🔍 Testing chatbot with detailed logging...');
    console.log('This should show server logs in the background...');
    
    const response = await axios.post('http://localhost:5000/chat', {
      userId: 'debug_test',
      message: 'kemishe'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Response received');
    console.log('Products count:', response.data.products.length);
    console.log('First product ID:', response.data.products[0]?.id);
    console.log('First product name:', response.data.products[0]?.name);
    
    // Check if products are real or AI-generated
    const isRealData = response.data.products.some(p => !p.id.startsWith('ai_generated'));
    console.log('Contains real data:', isRealData);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testWithLogs();

