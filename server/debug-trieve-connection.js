const axios = require('axios');

async function debugTrieveConnection() {
  console.log('🔍 Debugging Trieve connection with exact same config as server...');
  
  // Use exact same configuration as TrieveService.ts
  const BASE_URL = 'https://api.trieve.ai';
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  
  const searchQuery = 'shirt test'; // Simple test query
  const payload = {
    query: searchQuery,
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
  
  const queryUrl = `${BASE_URL}/api/chunk/search`;
  
  console.log('📤 Request Details:');
  console.log('URL:', queryUrl);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Headers:', Object.keys(headers));
  
  try {
    console.log('\n🚀 Sending request...');
    const response = await axios.post(queryUrl, payload, {
      headers: headers,
      timeout: 10000
    });
    
    console.log(`✅ SUCCESS! Status: ${response.status}`);
    console.log('Response structure:', Object.keys(response.data || {}));
    
    if (response.data && response.data.chunks) {
      console.log(`📦 Found ${response.data.chunks.length} chunks`);
      
      // Show first few chunks
      const sampleChunks = response.data.chunks.slice(0, 2);
      sampleChunks.forEach((item, i) => {
        const chunk = item.chunk;
        const meta = chunk.metadata;
        console.log(`\nChunk ${i + 1}:`);
        console.log(`  ID: ${chunk.id}`);
        console.log(`  Name: ${meta.name}`);
        console.log(`  Price: $${meta.price}`);
        console.log(`  Color: ${meta.color}`);
        console.log(`  Size: ${meta.size}`);
        console.log(`  Material: ${meta.material}`);
        console.log(`  Brand: ${meta.brand}`);
      });
      
      console.log('\n🎉 TRIEVE CONNECTION IS WORKING!');
      console.log('The server should be getting this real data.');
      return true;
    }
    
  } catch (error) {
    console.log(`\n❌ FAILED: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Show detailed error info
    if (error.response?.status === 403) {
      console.log('\n🔑 AUTHENTICATION ISSUE:');
      console.log('- API key might not have access to dataset');
      console.log('- Organization ID might be incorrect');
      console.log('- Dataset ID might not be accessible');
    } else if (error.response?.status === 404) {
      console.log('\n🌐 ENDPOINT ISSUE:');
      console.log('- Endpoint might be wrong');
      console.log('- API version might be outdated');
    }
    
    return false;
  }
}

debugTrieveConnection().then(success => {
  if (!success) {
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('1. Check if the dataset is active in Trieve dashboard');
    console.log('2. Verify API key has read permissions');
    console.log('3. Confirm organization access to dataset');
    console.log('4. The server falls back to AI-generated products when Trieve fails');
  }
}).catch(console.error);
