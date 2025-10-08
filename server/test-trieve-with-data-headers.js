const axios = require('axios');

async function testWithDataHeaders() {
  console.log('🔍 Testing Trieve with TR-Dataset headers (original method)...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  // Try the original approach with TR-Dataset headers
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
  
  console.log('📋 Configuration:');
  console.log(`Payload:`, JSON.stringify(payload, null, 2));
  console.log(`Headers:`, JSON.stringify(headers, null, 2));
  console.log('');
  
  // Test both old and new approaches
  const endpoints = [
    'https://api.trieve.ai/api/v1/chunk/search',
    'https://api.trieve.ai/v1/chunk/search',
    'https://api.trieve.ai/api/v1/search',
    'https://api.trieve.ai/v1/datasets/search',
    'https://api.trieve.ai/v1/query'
  ];
  
  for (const url of endpoints) {
    console.log(`Testing: ${url}`);
    
    try {
      const response = await axios.post(url, payload, {
        headers: headers,
        timeout: 10000
      });
      
      console.log(`✅ SUCCESS with ${url}!`);
      console.log(`Status: ${response.status}`);
      if (response.data) {
        console.log(`Response keys: ${Object.keys(response.data || {})}`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
      }
      console.log('');
      return; // Stop on first success
      
    } catch (error) {
      const status = error.response?.status || error.message;
      console.log(`❌ ${url} → ${status}`);
      if (error.response?.data) {
        console.log(`   Error:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  // Last attempt: try with just Authorization header (minimal)
  console.log('\n🔧 Testing with minimal headers...');
  try {
    const minimalPayload = { query: 'peshqir', limit: 5 };
    const minimalHeaders = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post('https://api.trieve.ai/api/v1/search', minimalPayload, {
      headers: minimalHeaders,
      timeout: 10000
    });
    
    console.log('✅ Minimal headers worked!');
    console.log(`Status: ${response.status}`);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
:

  } catch (error) {
    console.log('❌ Minimal headers failed:', error.response?.status || error.message);
  }
}

testWithDataHeaders().catch(console.error);
