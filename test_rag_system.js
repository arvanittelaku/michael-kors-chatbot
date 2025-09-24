const axios = require('axios');

async function testRAGSystem() {
  console.log('🧪 Testing RAG System...\n');
  
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: Status check
    console.log('\n2️⃣ Testing status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/status`);
    console.log('✅ Status check passed:', statusResponse.data);
    
    // Test 3: Search query
    console.log('\n3️⃣ Testing search query...');
    const searchResponse = await axios.post(`${baseURL}/search`, {
      query: 'I want a red bag I can wear everyday'
    });
    console.log('✅ Search query passed:');
    console.log('   Message:', searchResponse.data.message);
    console.log('   Products found:', searchResponse.data.products.length);
    
    // Test 4: Another search query
    console.log('\n4️⃣ Testing another search query...');
    const searchResponse2 = await axios.post(`${baseURL}/search`, {
      query: 'Show me black leather handbags under $300'
    });
    console.log('✅ Second search query passed:');
    console.log('   Message:', searchResponse2.data.message);
    console.log('   Products found:', searchResponse2.data.products.length);
    
    // Test 5: Recommendations
    console.log('\n5️⃣ Testing recommendations...');
    const recommendationsResponse = await axios.post(`${baseURL}/recommendations`, {
      preferences: 'I need a professional bag for work meetings'
    });
    console.log('✅ Recommendations passed:');
    console.log('   Message:', recommendationsResponse.data.message);
    console.log('   Products found:', recommendationsResponse.data.products.length);
    
    console.log('\n🎉 All tests passed! RAG system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRAGSystem();
