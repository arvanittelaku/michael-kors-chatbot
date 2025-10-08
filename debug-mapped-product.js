// Debug mapped product categories
require('dotenv').config({ path: '../.env' });

const { TrieveService } = require('./server/dist/services/chatbot/TrieveService');

async function debugMappedProduct() {
  console.log('🔍 Debugging mapped product categories...\n');
  
  try {
    const axios = require('axios');
    const response = await axios.post('https://api.trieve.ai/api/chunk/search', {
      query: "shirt",
      dataset_id: 'd07948bc-576d-403c-9ca8-4b264b006aa1',
      limit: 1,
      search_type: "hybrid"
    }, {
      headers: {
        "Authorization": "Bearer tr-KGyOrhtz7ngWpdrvrFsd8Rh7i64VRhfU",
        "TR-Dataset": "d07948bc-576d-403c-9ca8-4b264b006aa1",
        "TR-Organization": "013878ea-2998-4fed-ac8e-1c4f10bcbd44",
        "Content-Type": "application/json"
      }
    });
    
    if (response.data.chunks && response.data.chunks.length > 0) {
      const firstChunk = response.data.chunks[0];
      const mappedProduct = TrieveService.mapChunkToProduct(firstChunk);
      
      console.log('🔍 Mapped product:');
      console.log('Name:', mappedProduct.name);
      console.log('Categories:', mappedProduct.categories);
      console.log('ID:', mappedProduct.id);
      
      // Test category matching
      console.log('\n🔍 Testing category matching:');
      console.log('Searching for "kemishe"');
      console.log('Product categories:', mappedProduct.categories);
      console.log('Contains "kemishe":', mappedProduct.categories.includes('kemishe'));
      console.log('Product name contains "kemishe":', mappedProduct.name.toLowerCase().includes('kemishe'));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugMappedProduct();



