const axios = require('axios');

async function testEndpointVariations() {
  console.log('🔍 Testing different Trieve endpoint variations...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  const payload = { query: 'peshqir', limit: 5 };
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'OpenAI-Organization': ORG_ID,
    'Content-Type': 'application/json'
  };
  
  // Different endpoint variations to try
  const endpoints = [
    `/api/v1/datasets/${DATASET_ID}/query`,
    `/api/v1/dataset/${DATASET_ID}/query`,
    `/api/v1/datasets/${DATASET_ID}/search`,
    `/api/v1/chunk/search`,
    `/api/v1/query`,
    `/v1/datasets/${DATASET_ID}/query`,
    `/v1/chunks/search`,
    `/v1/search`
  ];
  
  for (const endpoint of endpoints) {
    const url = `https://api.trieve.ai${endpoint}`;
    console.log(`Testing: ${endpoint}`);
    
    try {
      const response = await axios.post(url, payload, {
        headers: headers,
        timeout: 10000
      });
      
      console.log(`✅ SUCCESS with ${endpoint}!`);
      console.log(`Status: ${response.status}`);
      if (response.data) {
        console.log(`Data type: ${typeof response.data}`);
        console.log(`Data keys: ${Object.keys(response.data || {})}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`Found ${response.data.length} items`);
          console.log(`First item:`, JSON.stringify(response.data[0], null, 2));
        }
      }
      console.log('');
      break; // Stop on first success
      
    } catch (error) {
      const status = error.response?.status || error.message;
      console.log(`❌ ${endpoint} → ${status}`);
      
      if (status === 200) {
        console.log(`✅ Found working endpoint: ${endpoint}`);
        if (error.response?.data) {
          console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
        }
        break;
      }
    }
  }
  
  console.log('\n🔧 If no endpoints worked:');
  console.log('- Check Trieve API documentation for exact endpoint format');
  console.log('- Verify the dataset ID is correct and accessible');
  console.log('- Try different API versions (v1, v2, etc.)');
}

testEndpointVariations().catch(console.error);
