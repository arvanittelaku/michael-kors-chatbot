const axios = require('axios');

async function testTrieveConnection() {
  console.log('🔍 Testing Trieve API Connection...\n');
  
  const config = {
    apiKey: 'tr-HTv41SQt3FTCBEsIU6vT43X3xj8Qaolg',
    datasetId: 'da45df92-5f1e-45f3-94b0-e0c5a6562043',
    organizationId: '013878ea-2998-4fed-ac8e-1c4f10bcbd44',
    baseUrl: 'https://api.trieve.ai'
  };
  
  try {
    // Test 1: Check if we can connect to Trieve API
    console.log('1️⃣ Testing Trieve API connection...');
    const response = await axios.get(`${config.baseUrl}/api/chunk/dataset/${config.datasetId}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'TR-Organization': config.organizationId
      }
    });
    console.log('✅ Trieve API connection successful');
    console.log('   Dataset info:', response.data);
    
  } catch (error) {
    console.error('❌ Trieve API connection failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This might be an authentication issue. Please check:');
      console.log('   - API key is correct');
      console.log('   - Organization ID is correct');
      console.log('   - Dataset ID is correct');
    }
  }
}

// Run the test
testTrieveConnection();
