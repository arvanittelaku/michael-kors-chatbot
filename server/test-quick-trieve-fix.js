const axios = require('axios');

async function testQuickTrieveFix() {
  console.log('🔍 Quick test of Trieve connection...');
  
  const searchQuery = 'shirt';
  const DATASET_ID = 'd07948bc-576d-403c-9ca8-4b264b006aa1';
  const ORG_ID = '013878ea-2998-4fed-ac8e-1c4f10bcbd44';
  const API_KEY = 'tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU';
  
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
  
  try {
    console.log('Testing endpoint: https://api.trieve.ai/api/v1/chunk/search');
    const response = await axios.post('https://api.trieve.ai/api/v1/chunk/search', payload, { headers, timeout: 10000 });
    
    console.log(`✅ SUCCESS! Found ${response.data.chunks.length} products`);
    
    // Show sample products
    console.log('\nSample products:');
    response.data.chunks.slice(0, 2).forEach((item, i) => {
      const meta = item.chunk.metadata;
      console.log(`${i+1}. ${meta.name} - $${meta.price} (${meta.color}, ${meta.material})`);
    });
    
    return true;
    
  } catch (error) {
    console.log(`❌ FAILED: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

testQuickTrieveFix().then(success => {
  if (success) {
    console.log('\n🎉 Perfect! TrieveService.ts should now work with real data!');
    console.log('Now restart the backend server.');
  } else {
    console.log('\n❌ Still need to debug Trieve connection...');
  }
});
