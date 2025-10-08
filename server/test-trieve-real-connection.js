const axios = require('axios');

async function testRealTrieveConnection() {
  console.log('🔍 Testing real Trieve dataset connection...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  // Test different endpoint formats
  const testEndpoints = [
    {
      url: `https://api.trieve.ai/v1/search`,
      payload: { query: "shirt", dataset_id: DATASET_ID, limit: 5 },
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }
    },
    {
      url: `https://api.trieve.ai/api/v1/search`,
      payload: { query: "shirt", dataset_id: DATASET_ID, limit: 5 },
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }
    },
    {
      url: `https://query.trieve.ai/api/v1/search`,
      payload: { query: "shirt", dataset_id: DATASET_ID, limit: 5 },
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }
    },
    {
      url: `https://api.trieve.ai/v1/datasets/${DATASET_ID}/queries`,
      payload: { query: "shirt", limit: 5 },
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" }
    },
    {
      url: `https://api.trieve.ai/v1/queries`,
      payload: { 
        datasetIds: [DATASET_ID],
        query: "shirt", 
        limit: 5 
      },
      headers: { 
        "Authorization": `Bearer ${API_KEY}`, 
        "Content-Type": "application/json"
      }
    },
    {
      url: `https://api.trieve.ai/v1/chunk/search`,
      payload: { 
        query: "shirt", 
        dataset_id: DATASET_ID, 
        limit: 5 
      },
      headers: { 
        "Authorization": `Bearer ${API_KEY}`,
        "TR-Dataset": DATASET_ID,
        "TR-Organization": ORG_ID,
        "Content-Type": "application/json"
      }
    }
  ];
  
  for (let i = 0; i < testEndpoints.length; i++) {
    const test = testEndpoints[i];
    console.log(`\n${i + 1}. Testing: ${test.url}`);
    console.log(`Payload:`, JSON.stringify(test.payload, null, 2));
    
    try {
      const response = await axios.post(test.url, test.payload, {
        headers: test.headers,
        timeout: 15000
      });
      
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      console.log('Response structure:', Object.keys(response.data || {}));
      
      if (response.data) {
        console.log('Sample data:', JSON.stringify(response.data, null, 2));
        
        // Check if this looks like real product data
        if (typeof response.data === 'object') {
          if (Array.isArray(response.data)) {
            console.log(`Found ${response.data.length} items in array`);
          } else if (response.data.results || response.data.data || response.data.chunks) {
            const dataKey = response.data.results ? 'results' : response.data.data ? 'data' : 'chunks';
            console.log(`Found ${response.data[dataKey]?.length || 0} items in ${dataKey}`);
          }
        }
        
        console.log('\n🎉 FOUND WORKING ENDPOINT!');
        console.log('✅ Update TrieveService to use this endpoint format');
        return test;
      }
      
    } catch (error) {
      console.log(`❌ ${test.url} → ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('   Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  console.log('\n🔧 If no endpoints worked:');
  console.log('- Your dataset might be inactive or need different authentication');
  console.log('- Check Trieve dashboard for correct API format');
  console.log('- Dataset might need to be made public or API key configured');
  
  return null;
}

testRealTrieveConnection().then(result => {
  if (result) {
    console.log('\n📋 WORKING CONFIGURATION:');
    console.log('URL:', result.url);
    console.log('Headers:', result.headers);
    console.log('Payload:', JSON.stringify(result.payload, null, 2));
  }
}).catch(console.error);
