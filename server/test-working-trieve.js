const axios = require('axios');

async function testWorkingTrieve() {
  console.log('🔍 Testing corrected Trieve payload format...\n');
  
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  // Test with corrected payload that includes search_type
  const correctedPayload = {
    query: "shirt",
    dataset_id: DATASET_ID,
    limit: 5,
    search_type: "hybrid"
  };
  
  const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "TR-Dataset": DATASET_ID,
    "TR-Organization": ORG_ID,
    "Content-Type": "application/json"
  };
  
  console.log('🧪 Testing corrected payload:');
  console.log('Endpoint: https://api.trieve.ai/api/chunk/search');
  console.log('Payload:', JSON.stringify(correctedPayload, null, 2));
  console.log('Headers: Authorization, TR-Dataset, TR-Organization, Content-Type');
  
  try {
    const response = await axios.post(
      'https://api.trieve.ai/api/chunk/search',
      correctedPayload,
      { headers: headers, timeout: 15000 }
    );
    
    console.log(`\n🎉 SUCCESS! Status: ${response.status}`);
    console.log('Response structure:', Object.keys(response.data || {}));
    
    if (response.data) {
      console.log('\n📊 Response data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Check if we got real product data
      if (response.data.chunks && Array.isArray(response.data.chunks)) {
        console.log(`\n🎯 Found ${response.data.chunks.length} chunks!`);
        console.log('✅ This looks like real dataset data!');
        
        return {
          url: 'https://api.trieve.ai/api/chunk/search',
          payload: correctedPayload,
          headers: headers
        };
      } else if (response.data.results && Array.isArray(response.data.results)) {
        console.log(`\n🎯 Found ${response.data.results.length} results!`);
        console.log('✅ This looks like real dataset data!');
        
        return {
          url: 'https://api.trieve.ai/api/chunk/search',
          payload: correctedPayload,
          headers: headers
        };
      } else if (Array.isArray(response.data)) {
        console.log(`\n🎯 Found array with ${response.data.length} items!`);
        console.log('✅ This looks like real dataset data!');
        
        return {
          url: 'https://api.trieve.ai/api/chunk/search',
          payload: correctedPayload,
          headers: headers
        };
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  return null;
}

testWorkingTrieve().then(result => {
  if (result) {
    console.log('\n🎉 WORKING CONFIGURATION FOUND!');
    console.log('\nUpdate TrieveService.ts with:');
    console.log('1. Change endpoint to: https://api.trieve.ai/api/chunk/search');
    console.log('2. Keep payload with search_type: "hybrid"');
    console.log('3. Use this exact header format');
  }
}).catch(console.error);
