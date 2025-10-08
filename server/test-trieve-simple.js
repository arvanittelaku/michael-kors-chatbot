const axios = require('axios');

async function testTrieveSimple() {
  console.log('🔍 Testing Trieve with original headers...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  // Original approach that worked before
  const payload = {
    query: 'peshqir',
    dataset_id: DATASET_ID,
    limit: 5,
    search_type: 'hybrid'
  };
  
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'TR-Dataset': DATASET_ID,
    'TR-Organization': ORG_ID,
    'Content-Type': 'application/json'
  };
  
  console.log('📋 Testing original endpoint...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Headers:', JSON.stringify(headers, null, 2));
  
  try {
    const response = await axios.post('https://api.trieve.ai/api/v1/chunk/search', payload, {
      headers: headers,
      timeout: 15000
    });
    
    console.log('✅ SUCCESS! Response received:');
    console.log(`Status: ${response.status}`);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
    return true;
    
  } catch (error) {
    console.log('❌ Original endpoint failed:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

testTrieveSimple().catch(console.error);
