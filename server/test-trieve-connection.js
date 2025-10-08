const axios = require('axios');

async function testTrieveConnection() {
  console.log('Testing Trieve API connection...');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  try {
    // Test basic connection
    console.log('1. Testing basic API connection...');
    const response = await axios.get('https://api.trieve.ai/api/v1/dataset', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'TR-Organization': ORG_ID
      }
    });
    console.log('✅ Basic connection works:', response.status);
    
    // Test search endpoint
    console.log('\n2. Testing search endpoint...');
    const searchResponse = await axios.post('https://api.trieve.ai/api/v1/chunk/search', {
      query: 'fashion',
      dataset_id: DATASET_ID,
      limit: 3
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'TR-Dataset': DATASET_ID,
        'TR-Organization': ORG_ID,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Search endpoint works:', searchResponse.status);
    console.log('📊 Results:', searchResponse.data);
    
    if (searchResponse.data && searchResponse.data.chunks) {
      console.log('\n🏆 Found products from dataset:');
      searchResponse.data.chunks.forEach((chunk, index) => {
        console.log(`${index + 1}. ${JSON.stringify(chunk, null, 2)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing Trieve:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n🔧 Suggested fixes for 403 error:');
      console.log('1. Verify DATASET_ID is correct');
      console.log('2. Verify ORG_ID is correct'); 
      console.log('3. Check API key permissions');
      console.log('4. Ensure dataset is publicly accessible or API key has dataset access');
    }
  }
}

testTrieveConnection().catch(console.error);
