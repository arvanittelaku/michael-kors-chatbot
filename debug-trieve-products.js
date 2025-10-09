// Debug actual Trieve product structure
require('dotenv').config({ path: '../.env' });

const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function debugTrieveProducts() {
  console.log('🔍 Debugging actual Trieve product structure...\n');
  
  try {
    // Get raw products without filtering
    const axios = require('axios');
    const response = await axios.post('https://api.trieve.ai/api/chunk/search', {
      query: "shirt",
      dataset_id: 'd07948bc-576d-403c-9ca8-4b264b006aa1',
      limit: 3,
      search_type: "hybrid"
    }, {
      headers: {
        "Authorization": "Bearer tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU",
        "TR-Dataset": "d07948bc-576d-403c-9ca8-4b264b006aa1",
        "TR-Organization": "013878ea-2998-4fed-ac8e-1c4f10bcbd44",
        "Content-Type": "application/json"
      }
    });
    
    console.log('📦 Raw Trieve response structure:');
    console.log('Keys:', Object.keys(response.data));
    console.log('Chunks count:', response.data.chunks?.length || 0);
    
    if (response.data.chunks && response.data.chunks.length > 0) {
      console.log('\n🔍 First chunk structure:');
      const firstChunk = response.data.chunks[0];
      console.log('Chunk keys:', Object.keys(firstChunk));
      
      console.log('\n🔍 First chunk metadata:');
      const metadata = firstChunk.chunk?.metadata || firstChunk.metadata;
      if (metadata) {
        console.log('Metadata keys:', Object.keys(metadata));
        console.log('Sample metadata:', JSON.stringify(metadata, null, 2));
      }
      
      console.log('\n🔍 Mapped product:');
      const mappedProduct = TrieveService.mapChunkToProduct(firstChunk);
      console.log('Mapped product:', JSON.stringify(mappedProduct, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTrieveProducts();





