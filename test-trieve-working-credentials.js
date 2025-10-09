// Test Trieve API with exact credentials from working test file
const axios = require('axios');

async function testTrieveWithWorkingCredentials() {
  console.log('🧪 Testing Trieve API with working credentials...\n');
  
  // Use the exact credentials from test-working-trieve.js
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  const payload = {
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
  
  console.log('🔍 Testing with payload:', JSON.stringify(payload, null, 2));
  console.log('🔍 Headers:', JSON.stringify(headers, null, 2));
  
  try {
    const response = await axios.post(
      'https://api.trieve.ai/api/chunk/search',
      payload,
      { headers: headers, timeout: 15000 }
    );
    
    console.log(`\n🎉 SUCCESS! Status: ${response.status}`);
    console.log('📊 Response structure:', Object.keys(response.data || {}));
    
    if (response.data && response.data.score_chunks) {
      console.log(`📦 Found ${response.data.score_chunks.length} chunks`);
      
      if (response.data.score_chunks.length > 0) {
        const firstChunk = response.data.score_chunks[0];
        console.log('🔍 First chunk structure:', Object.keys(firstChunk));
        console.log('🔍 Chunk data:', JSON.stringify(firstChunk, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Data:', error.response.data);
    }
  }
}

testTrieveWithWorkingCredentials();





