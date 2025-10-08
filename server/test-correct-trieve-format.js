const axios = require('axios');

async function testCorrectTrieveFormat() {
  console.log('🔍 Testing correct Trieve API format based on documentation...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  // Test with the original working API key to see if that's the issue
  const OLD_API_KEY = 'tr-5TEgX6l6lo3n2L6jWi87yvrCrNAWLUbC';
  
  const testCases = [
    {
      name: "New API Key with chunk search",
      url: "https://api.trieve.ai/api/v1/chunk/search",
      payload: { query: "shirt", dataset_id: DATASET_ID, limit: 5 },
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "TR-Dataset": DATASET_ID,
        "TR-Organization": ORG_ID,
        "Content-Type": "application/json"
      }
    },
    {
      name: "Old API Key with chunk search", 
      url: "https://api.trieve.ai/api/v1/chunk/search",
      payload: { query: "shirt", dataset_id: DATASET_ID, limit: 5 },
      headers: {
        "Authorization": `Bearer ${OLD_API_KEY}`,
        "TR-Dataset": DATASET_ID,
        "TR-Organization": ORG_ID,
        "Content-Type": "application/json"
      }
    },
    {
      name: "Alternative endpoint format",
      url: "https://api.trieve.ai/api/chunk/search",
      payload: { query: "shirt", dataset_id: DATASET_ID, limit: 5 },
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "TR-Dataset": DATASET_ID,
        "TR-Organization": ORG_ID,
        "Content-Type": "application/json"
      }
    },
    {
      name: "Simple query endpoint",
      url: "https://api.trieve.ai/api/query",
      payload: { 
        query: "shirt", 
        dataset_ids: [DATASET_ID],
        limit: 5 
      },
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n🧪 ${test.name}:`);
    console.log(`URL: ${test.url}`);
    console.log(`Headers:`, Object.keys(test.headers));
    
    try {
      const response = await axios.post(test.url, test.payload, {
        headers: test.headers,
        timeout: 15000
      });
      
      console.log(`✅ SUCCESS! Status: ${response.status}`);
      console.log('Response keys:', Object.keys(response.data || {}));
      
      if (response.data && typeof response.data === 'object') {
        console.log('Sample response:', JSON.stringify(response.data, null, 2));
        
        // Check for different data structures
        if (response.data.chunks && Array.isArray(response.data.chunks)) {
          console.log(`🎯 Found ${response.data.chunks.length} chunks - this looks like product data!`);
          return test;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          console.log(`🎯 Found ${response.data.results.length} results - this looks like product data!`);
          return test;
        } else if (Array.isArray(response.data)) {
          console.log(`🎯 Found array with ${response.data.length} items - this looks like product data!`);
          return test;
        }
      }
      
    } catch (error) {
      const status = error.response?.status || error.message;
      console.log(`❌ Status: ${status}`);
      
      if (error.response?.status === 403) {
        console.log('   → Authentication issue with this API key');
      } else if (error.response?.status === 404) {
        console.log('   → Endpoint doesn\'t exist');
      } else if (error.response?.data) {
        console.log('   → Error:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  console.log('\n💡 CONCLUSION:');
  console.log('- If old API key works but new one doesn\'t, there\'s an issue with key permissions');
  console.log('- If neither works, the dataset might not be accessible');
  console.log('- Current system falls back gracefully to AI-generated products');
  
  return null;
}

testCorrectTrieveFormat().then(result => {
  if (result) {
    console.log('\n🎉 WORKING CONFIGURATION FOUND:');
    console.log('Use this configuration to update TrieveService.ts');
  }
}).catch(console.error);
